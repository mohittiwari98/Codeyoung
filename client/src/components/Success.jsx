import { useState } from 'react';
import { downloadIcs, googleCalUrl, initials } from '../lib.js';
import { Icon, icons } from './ui.jsx';

const COLORS = ['#ffc93c', '#f28c28', '#3f6165', '#10b981', '#ffe48a'];
function Confetti() {
  const bits = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, delay: `${(i % 7) * 0.12}s`, color: COLORS[i % COLORS.length], w: 6 + (i % 3) * 3,
  }));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} className="animate-fall absolute top-0 block rounded-sm"
          style={{ left: b.left, width: b.w, height: b.w * 1.6, background: b.color, animationDelay: b.delay }} />
      ))}
    </div>
  );
}

const secondary = 'flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-brand-50';

export default function Success({ done, email, onAgain }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(done.link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  return (
    <div className="relative animate-fade-up overflow-hidden text-center" role="status">
      <Confetti />
      <div className="animate-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white ring-8 ring-emerald-100">
        <Icon d={icons.check} className="h-8 w-8" strokeWidth="3" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Your class is booked</h1>
      <p className="mt-1 text-ink-500">We've emailed the class link to you and your mentor.</p>
      {done.childName && <p className="mt-2 text-sm text-ink-600">For <b>{done.childName}</b>{done.childAge ? ` · age ${done.childAge}` : ""}</p>}

      <div className="relative mt-6 overflow-hidden rounded-2xl bg-ink-800 text-left text-white shadow-xl shadow-ink-300/40">
        <div className="p-5">
          <p className="text-xs font-semibold text-brand-200">Your time</p>
          <p className="mt-1 text-xl font-bold leading-snug sm:text-2xl">{done.parentTime}</p>
        </div>
        <div className="relative border-t border-dashed border-white/25">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white" aria-hidden="true" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-3 p-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-400 font-bold text-ink-900">{initials(done.mentorName)}</div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{done.mentorName}</p>
            <p className="text-sm text-brand-100">Your mentor. It is {done.mentorTime} for them.</p>
          </div>
        </div>
      </div>

      <a href={done.link} target="_blank" rel="noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 btn-brand px-5 py-3.5 text-base">
        <Icon d={icons.video} /> Join demo class
      </a>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <a className={secondary} href={googleCalUrl(done)} target="_blank" rel="noreferrer"><Icon d={icons.calendar} className="h-4 w-4" /> Google Calendar</a>
        <button type="button" className={secondary} onClick={() => downloadIcs(done)}><Icon d={icons.calendar} className="h-4 w-4" /> Download .ics</button>
        <button type="button" className={secondary} onClick={copy}>
          <Icon d={copied ? icons.check : icons.copy} className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink-500">
        <Icon d={icons.mail} className="h-4 w-4" /> Confirmation sent to <b className="break-all text-ink-700">{email}</b>
      </p>
      <button type="button" onClick={onAgain} className="mt-4 rounded-lg px-3 py-2 font-semibold text-brand-700 hover:bg-brand-50">
        Book another class
      </button>
    </div>
  );
}