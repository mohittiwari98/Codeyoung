export const Icon = ({ d, className = 'h-5 w-5', ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true" {...p}>
    {[].concat(d).map((x, i) => <path key={i} d={x} />)}
  </svg>
);

export const icons = {
  clock: ['M12 6v6l4 2', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'],
  video: ['M15 10l5-3v10l-5-3', 'M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18'],
  check: 'M5 13l4 4L19 7',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  copy: ['M9 9h11v11H9z', 'M5 15V5h10'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
};

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={'animate-spin ' + className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = false, onBrand = false }) {
  const body = onBrand ? '#14262a' : '#ffc93c';
  const word = dark ? 'text-white' : 'text-ink-900';
  return (
    <div className="flex items-center gap-2" aria-label="Codeyoung">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path d="M5 2h9v17h12v11H5z" fill={body} />
        <rect x="16" y="9" width="9" height="9" fill="#f28c28" />
      </svg>
      <span className={'text-[22px] font-bold tracking-tight ' + word}>Codeyoung</span>
    </div>
  );
}

// Oversized echo of the logo mark, used as the one big graphic on the brand panel.
export function BlockMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M5 2h9v17h12v11H5z" fill="#ffd65c" />
      <rect x="16" y="9" width="9" height="9" fill="#f28c28" />
    </svg>
  );
}

export function Stepper({ step }) {
  const steps = ['Pick a time', 'Your details', 'Confirmed'];
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const n = i + 1, active = step === n, done = step > n;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={active ? 'step' : undefined}>
            <span className={'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ' +
              (done ? 'bg-ink-600 text-white' : active ? 'bg-brand-400 text-ink-900 ring-4 ring-brand-100' : 'bg-ink-100 text-ink-500')}>
              {done ? <Icon d={icons.check} className="h-4 w-4" /> : n}
            </span>
            <span className={'hidden text-sm font-semibold sm:block ' + (active ? 'text-ink-900' : 'text-ink-500')}>{label}</span>
            {i < steps.length - 1 && <span className={'h-0.5 flex-1 rounded ' + (done ? 'bg-brand-400' : 'bg-ink-100')} />}
          </li>
        );
      })}
    </ol>
  );
}