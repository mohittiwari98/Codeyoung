import { useState } from 'react';
import { Icon, icons, Logo } from './ui.jsx';

export default function DemoLinkSetup({ onContinue }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const link = value.trim();
    try {
      const url = new URL(link);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      setError('');
      onContinue(link);
    } catch {
      setError('Please enter a valid meeting/demo link starting with https://');
    }
  }

  return (
    <div className="min-h-screen bg-ink-50/40">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo />
          <span className="rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-brand-200">
            Demo setup
          </span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <section className="w-full max-w-xl rounded-3xl border border-ink-100 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(20,38,42,0.28)] sm:p-9">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-800">
            <Icon d={icons.video} className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">Before bookings start</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">Enter your demo class link</h1>
          <p className="mt-3 leading-relaxed text-ink-600">
            Add the meeting link that parents and mentors should receive after a trial class is booked.
            This can be a Google Meet, Zoom, Teams, or any HTTPS demo link.
          </p>

          <form onSubmit={submit} className="mt-7">
            <label htmlFor="demo-link" className="text-sm font-semibold text-ink-700">Demo / meeting link</label>
            <div className="relative mt-1.5">
              <Icon d={icons.video} className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                id="demo-link"
                type="url"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                placeholder="https://meet.google.com/abc-defg-hij"
                autoFocus
                required
                className="w-full rounded-xl border border-ink-200 bg-white py-3.5 pl-11 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
            <p className="mt-2 text-xs text-ink-500">The same link is used on the confirmation page and in both parent and mentor emails.</p>

            <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl btn-brand px-5 py-3.5 text-base">
              Continue to booking <Icon d={icons.right} className="h-4 w-4" />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
