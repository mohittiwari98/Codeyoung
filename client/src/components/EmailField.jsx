import { useEffect, useState } from 'react';
import { api, EMAIL_RE } from '../lib.js';
import { Icon, icons, Spinner } from './ui.jsx';

// Email input + OTP verification. Shows a green tick once verified and a red cross until then.
export default function EmailField({ value, onChange, onBlur, error, verified, onVerified }) {
  const email = value.trim();
  const norm = email.toLowerCase();
  const isVerified = !!verified.token && verified.email === norm;
  const validFormat = EMAIL_RE.test(email);

  const [sentTo, setSentTo] = useState('');   // address the current code was sent to
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(null);     // 'send' | 'verify' | null
  const [msg, setMsg] = useState(null);       // { kind: 'ok' | 'error', text }
  const [cooldown, setCooldown] = useState(0);
  const otpOpen = sentTo === norm && !isVerified;

  // Typing a different address throws away the code box and any message.
  useEffect(() => { setCode(''); setMsg(null); }, [norm]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    if (!validFormat || busy) return;
    setBusy('send'); setMsg(null);
    try {
      const r = await api('/email/otp', { method: 'POST', body: JSON.stringify({ email }) });
      setSentTo(norm); setCode(''); setCooldown(r.resendInSec || 30);
      setMsg({ kind: 'ok', text: `We sent a 6-digit code to ${email}. Check your inbox and spam folder.` });
    } catch (e) { setMsg({ kind: 'error', text: e.message }); }
    finally { setBusy(null); }
  }

  async function verifyCode() {
    if (code.length !== 6 || busy) return;
    setBusy('verify'); setMsg(null);
    try {
      const r = await api('/email/verify', { method: 'POST', body: JSON.stringify({ email, otp: code }) });
      onVerified(norm, r.token);
      setCode(''); setMsg(null);
    } catch (e) { setMsg({ kind: 'error', text: e.message }); }
    finally { setBusy(null); }
  }

  const border = error ? 'border-rose-400' : isVerified ? 'border-emerald-400' : 'border-ink-200 hover:border-ink-400 focus-visible:border-ink-900';
  const small = 'rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm font-semibold text-ink-800 transition hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold" htmlFor="parent-email">Email
        <div className="relative">
          <input id="parent-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={value}
            className={'mt-1.5 w-full rounded-xl border bg-white py-3 pl-3.5 pr-11 text-base transition placeholder:text-ink-400 ' + border}
            aria-invalid={!!error} aria-describedby={error ? 'err-email' : 'email-status'}
            onBlur={onBlur} onChange={(e) => onChange(e.target.value)} />
          {email && (
            <span id="email-status" role="img" aria-label={isVerified ? 'Email verified' : 'Email not verified'}
              className={'absolute right-3 top-[calc(50%+3px)] grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-white ' + (isVerified ? 'bg-emerald-500' : 'bg-rose-500')}>
              <Icon d={isVerified ? icons.check : icons.close} className="h-3.5 w-3.5" strokeWidth="3" />
            </span>
          )}
        </div>
      </label>
      {error && <p id="err-email" className="mt-1 text-sm text-rose-600">{error}</p>}

      {isVerified && <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Icon d={icons.check} className="h-4 w-4" strokeWidth="3" /> Email verified</p>}

      {!isVerified && email && !otpOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" className={small} disabled={!validFormat || !!busy} onClick={sendCode}>
            {busy === 'send' ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Sending…</span> : 'Send verification code'}
          </button>
          <span className="text-sm text-rose-600">Not verified</span>
        </div>
      )}

      {otpOpen && (
        <div className="mt-3 rounded-xl border border-ink-200 bg-white p-3.5">
          <label htmlFor="email-otp" className="text-sm font-semibold">Enter the 6-digit code</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input id="email-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verifyCode(); } }}
              className="w-36 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-center text-lg font-semibold tracking-[0.35em] tabular-nums hover:border-ink-400 focus-visible:border-ink-900" />
            <button type="button" className={small} disabled={code.length !== 6 || !!busy} onClick={verifyCode}>
              {busy === 'verify' ? <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Checking…</span> : 'Verify'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Didn't get it?{' '}
            <button type="button" disabled={cooldown > 0 || !!busy} onClick={sendCode}
              className="font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </p>
        </div>
      )}

      {msg && <p role={msg.kind === 'error' ? 'alert' : 'status'} className={'mt-2 text-sm ' + (msg.kind === 'error' ? 'text-rose-600' : 'text-ink-600')}>{msg.text}</p>}
    </div>
  );
}
