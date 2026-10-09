import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { BookingError } from './bookingService.js';
import { EmailVerification } from './models.js';
import { send } from './emails.js';

export const OTP_TTL_MS = 10 * 60 * 1000;      // a code is valid for 10 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000;   // minimum gap between codes for one address
export const MAX_ATTEMPTS = 5;                 // wrong guesses allowed per code
export const VERIFIED_TTL_MS = 30 * 60 * 1000; // a verified email can be used to book for 30 minutes

export const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const sha = (s) => createHash('sha256').update(s).digest('hex');
const same = (a, b) => { const x = Buffer.from(a || ''), y = Buffer.from(b || ''); return x.length === y.length && timingSafeEqual(x, y); };

export function otpEmail(to, code) {
  return {
    to,
    subject: `${code} is your Codeyoung verification code`,
    text: `Your Codeyoung verification code is ${code}.\n\nIt expires in 10 minutes. If you did not ask for it, you can ignore this email.\n`,
  };
}

export function createEmailVerifier({ now = () => Date.now(), sendMail = send } = {}) {
  const secret = process.env.OTP_SECRET || 'codeyoung-dev-otp-secret';
  const hashOtp = (email, salt, code) => createHmac('sha256', secret).update(`${salt}:${email}:${code}`).digest('hex');

  async function sendOtp(rawEmail) {
    const email = normalizeEmail(rawEmail), t = now();
    const prev = await EmailVerification.findOne({ email }, 'lastSentAt').lean();
    if (prev?.lastSentAt && t - prev.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (t - prev.lastSentAt.getTime())) / 1000);
      throw new BookingError('OTP_COOLDOWN', `Please wait ${wait} seconds before asking for another code.`, 429);
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const salt = randomBytes(8).toString('hex');
    await EmailVerification.updateOne({ email }, {
      $set: {
        otpHash: hashOtp(email, salt, code), salt, otpExpiresAt: new Date(t + OTP_TTL_MS), attempts: 0,
        lastSentAt: new Date(t), purgeAt: new Date(t + 60 * 60 * 1000),
      },
      $unset: { tokenHash: '', verifiedAt: '' }, // a fresh code invalidates any earlier verification
    }, { upsert: true });
    const ok = await sendMail(otpEmail(rawEmail.trim(), code));
    if (ok === false) throw new BookingError('EMAIL_SEND_FAILED', "We couldn't send the code. Please check the address and try again.", 502);
    return { expiresInSec: OTP_TTL_MS / 1000, resendInSec: RESEND_COOLDOWN_MS / 1000 };
  }

  async function verifyOtp(rawEmail, rawCode) {
    const email = normalizeEmail(rawEmail), t = now();
    const doc = await EmailVerification.findOne({ email }).lean();
    if (!doc?.otpHash) throw new BookingError('OTP_NOT_FOUND', 'Please request a verification code first.', 400);
    if (doc.otpExpiresAt.getTime() < t) throw new BookingError('OTP_EXPIRED', 'That code has expired. Please request a new one.', 400);
    // Count the attempt atomically *before* comparing, so parallel guesses can't exceed the limit.
    const cur = await EmailVerification.findOneAndUpdate(
      { email, otpHash: doc.otpHash, attempts: { $lt: MAX_ATTEMPTS } }, { $inc: { attempts: 1 } }, { new: true }).lean();
    if (!cur) throw new BookingError('OTP_LOCKED', 'Too many wrong attempts. Please request a new code.', 429);
    if (!same(cur.otpHash, hashOtp(email, cur.salt, String(rawCode).trim()))) {
      const left = MAX_ATTEMPTS - cur.attempts;
      throw new BookingError('OTP_INVALID', left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong attempts. Please request a new code.', 400);
    }
    const token = randomBytes(24).toString('hex');
    const res = await EmailVerification.updateOne({ email, otpHash: cur.otpHash }, {
      $set: { tokenHash: sha(token), verifiedAt: new Date(t), purgeAt: new Date(t + 60 * 60 * 1000) },
      $unset: { otpHash: '', salt: '', otpExpiresAt: '' }, // a code works only once
    });
    if (!res.modifiedCount) throw new BookingError('OTP_INVALID', 'That code was already used. Please request a new one.', 400);
    return { token, validForSec: VERIFIED_TTL_MS / 1000 };
  }

  // Booking gate: the caller must present the proof token returned by verifyOtp for this same email.
  async function assertVerified(rawEmail, token) {
    const fail = () => new BookingError('EMAIL_NOT_VERIFIED', 'Please verify your email before booking.', 403);
    if (!token) throw fail();
    const doc = await EmailVerification.findOne({ email: normalizeEmail(rawEmail) }, 'tokenHash verifiedAt').lean();
    if (!doc?.tokenHash || !doc.verifiedAt || !same(doc.tokenHash, sha(String(token)))) throw fail();
    if (now() - doc.verifiedAt.getTime() > VERIFIED_TTL_MS)
      throw new BookingError('EMAIL_NOT_VERIFIED', 'Your email verification expired. Please verify again.', 403);
  }

  // One verification pays for one booking.
  const consume = (rawEmail) =>
    EmailVerification.updateOne({ email: normalizeEmail(rawEmail) }, { $unset: { tokenHash: '', verifiedAt: '' } });

  return { sendOtp, verifyOtp, assertVerified, consume };
}
