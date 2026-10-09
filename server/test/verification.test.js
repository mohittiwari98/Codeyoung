import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { createBookingService } from '../src/bookingService.js';
import { createEmailVerifier, MAX_ATTEMPTS, RESEND_COOLDOWN_MS, OTP_TTL_MS, VERIFIED_TTL_MS } from '../src/emailVerification.js';
import { Booking, EmailVerification, MentorDay } from '../src/models.js';
import { ensureMentors } from '../src/seed.js';

let clock = Date.parse('2026-10-01T00:00:00Z');
const startUtc = '2026-10-10T03:30:00.000Z';
const inbox = [];
const verifier = createEmailVerifier({ now: () => clock, sendMail: async (m) => { inbox.push(m); return true; } });
const service = createBookingService({ now: () => clock });
let mongod, server, url;
const lastCode = () => /(\d{6}) is your/.exec(inbox.at(-1).subject)[1];
const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const booking = (extra = {}) => ({ name: 'P', email: 'p@x.com', childName: 'C', childAge: 9, tz: 'Asia/Kolkata', startUtc, ...extra });
async function verifyEmail(email = 'p@x.com') {
  await post('/api/email/otp', { email });
  const r = await post('/api/email/verify', { email, otp: lastCode() });
  return (await r.json()).token;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Booking.init(), MentorDay.init(), EmailVerification.init()]);
  server = createApp(service, { verifier }).listen(0);
  await new Promise((r) => server.once('listening', r));
  url = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(async () => {
  clock = Date.parse('2026-10-01T00:00:00Z'); inbox.length = 0;
  await Promise.all([Booking.deleteMany({}), MentorDay.deleteMany({}), EmailVerification.deleteMany({})]);
  await ensureMentors();
});
after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

test('booking is refused until the email is verified', async () => {
  let r = await post('/api/bookings', booking());
  assert.equal(r.status, 403);
  assert.equal((await r.json()).code, 'EMAIL_NOT_VERIFIED');
  r = await post('/api/bookings', booking({ verificationToken: 'made-up' }));
  assert.equal(r.status, 403);
  assert.equal(await Booking.countDocuments(), 0);
});

test('happy path: code emailed, verified, booking succeeds, proof is single-use', async () => {
  const token = await verifyEmail();
  assert.match(inbox[0].subject, /verification code/);
  const r = await post('/api/bookings', booking({ verificationToken: token, email: 'P@X.com' })); // case-insensitive
  assert.equal(r.status, 201);
  const again = await post('/api/bookings', booking({ verificationToken: token, startUtc: '2026-10-10T04:00:00.000Z' }));
  assert.equal(again.status, 403);
});

test('a token for one email cannot book for another', async () => {
  const token = await verifyEmail('a@x.com');
  const r = await post('/api/bookings', booking({ email: 'b@x.com', verificationToken: token }));
  assert.equal(r.status, 403);
});

test('wrong code is rejected and locks after too many attempts, even the right code', async () => {
  await post('/api/email/otp', { email: 'p@x.com' });
  const right = lastCode(), wrong = right === '000000' ? '111111' : '000000';
  for (let i = 0; i < MAX_ATTEMPTS; i++) assert.equal((await post('/api/email/verify', { email: 'p@x.com', otp: wrong })).status, 400);
  const r = await post('/api/email/verify', { email: 'p@x.com', otp: right });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).code, 'OTP_LOCKED');
});

test('code expires, works only once, and resends respect the cooldown', async () => {
  await post('/api/email/otp', { email: 'p@x.com' });
  const code = lastCode();
  assert.equal((await post('/api/email/otp', { email: 'p@x.com' })).status, 429); // too soon
  clock += RESEND_COOLDOWN_MS + 1;
  assert.equal((await post('/api/email/otp', { email: 'p@x.com' })).status, 200);
  assert.equal((await post('/api/email/verify', { email: 'p@x.com', otp: code })).status, 400); // old code replaced
  const fresh = lastCode();
  clock += OTP_TTL_MS + 1;
  assert.equal((await (await post('/api/email/verify', { email: 'p@x.com', otp: fresh })).json()).code, 'OTP_EXPIRED');
});

test('verification itself expires after 30 minutes', async () => {
  const token = await verifyEmail();
  clock += VERIFIED_TTL_MS + 1;
  const r = await post('/api/bookings', booking({ verificationToken: token }));
  assert.equal(r.status, 403);
});

test('failed delivery is reported instead of pretending the code was sent', async () => {
  const bad = createEmailVerifier({ now: () => clock, sendMail: async () => false });
  await assert.rejects(bad.sendOtp('p@x.com'), { code: 'EMAIL_SEND_FAILED' });
});

test('malformed input gets a clean 400', async () => {
  assert.equal((await post('/api/email/otp', { email: 'nope' })).status, 400);
  assert.equal((await post('/api/email/verify', { email: 'p@x.com', otp: '12ab' })).status, 400);
});
