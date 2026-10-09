import { useState } from 'react';
import { EMAIL_RE, longDate } from '../lib.js';
import { Icon, icons, Spinner } from './ui.jsx';
import EmailField from './EmailField.jsx';

export default function DetailsForm({ form, setForm, slot, date, tzAbbr, busy, onSubmit, onChange, verified, onVerified }) {
  const [touched, setTouched] = useState({});
  const errors = {
    name: form.name.trim() ? '' : "Please enter the parent's name",
    email: !form.email.trim() ? 'Please enter your email' : EMAIL_RE.test(form.email.trim()) ? '' : 'That email address looks incomplete',
    childName: form.childName.trim() ? '' : "Please enter the child's name",
    childAge: !form.childAge ? 'Please enter the child age' : Number(form.childAge) >= 1 && Number(form.childAge) <= 18 ? '' : 'Child age must be between 1 and 18',
  };
  const show = (k) => touched[k] && errors[k];
  const isVerified = !!verified.token && verified.email === form.email.trim().toLowerCase();

  const field = (k) =>
    'mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-base transition placeholder:text-ink-400 ' +
    (show(k) ? 'border-rose-400' : 'border-ink-200 hover:border-ink-400 focus-visible:border-ink-900');

  function submit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, childName: true, childAge: true });
    if (errors.name || errors.email || errors.childName || errors.childAge) return;
    if (!isVerified) return; // the button is disabled too; the server also refuses unverified bookings
    onSubmit();
  }

  return (
    <form onSubmit={submit} noValidate className="animate-fade-up rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-100">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-brand-300"><Icon d={icons.clock} /></div>
          <div>
            <p className="text-sm font-bold">{slot.label} <span className="font-medium text-ink-500">{tzAbbr}</span></p>
            <p className="text-xs text-ink-500">{longDate(date)} · 30 min</p>
          </div>
        </div>
        <button type="button" onClick={onChange} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">Change</button>
      </div>

      <label className="mt-4 block text-sm font-semibold" htmlFor="parent-name">Parent's name
        <input id="parent-name" className={field('name')} autoComplete="name" placeholder="e.g. Priya Mehta" value={form.name}
          aria-invalid={!!show('name')} aria-describedby={show('name') ? 'err-name' : undefined}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      {show('name') && <p id="err-name" className="mt-1 text-sm text-rose-600">{errors.name}</p>}

      <EmailField value={form.email} error={show('email')} verified={verified} onVerified={onVerified}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))} onChange={(v) => setForm({ ...form, email: v })} />

      <label className="mt-4 block text-sm font-semibold" htmlFor="child-name">Child's name
        <input id="child-name" className={field('childName')} autoComplete="off" placeholder="e.g. Aarav Mehta" value={form.childName}
          aria-invalid={!!show('childName')} aria-describedby={show('childName') ? 'err-child-name' : undefined}
          onBlur={() => setTouched((t) => ({ ...t, childName: true }))} onChange={(e) => setForm({ ...form, childName: e.target.value })} />
      </label>
      {show('childName') && <p id="err-child-name" className="mt-1 text-sm text-rose-600">{errors.childName}</p>}

      <label className="mt-4 block text-sm font-semibold" htmlFor="child-age">Child's age
        <input id="child-age" type="number" min="1" max="18" inputMode="numeric" className={field('childAge')} placeholder="e.g. 10" value={form.childAge}
          aria-invalid={!!show('childAge')} aria-describedby={show('childAge') ? 'err-child-age' : undefined}
          onBlur={() => setTouched((t) => ({ ...t, childAge: true }))} onChange={(e) => setForm({ ...form, childAge: e.target.value })} />
      </label>
      {show('childAge') && <p id="err-child-age" className="mt-1 text-sm text-rose-600">{errors.childAge}</p>}
      
      {!isVerified && <p className="mt-5 text-center text-sm text-rose-600">Verify your email to confirm the booking.</p>}
      <button disabled={busy || !isVerified}
        className={(isVerified ? "mt-5" : "mt-2") + " flex w-full items-center justify-center gap-2 rounded-xl btn-brand px-5 py-3.5 text-base"}>
        {busy ? <><Spinner /> Booking your class…</> : <>Confirm {slot.label} <Icon d={icons.right} className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
