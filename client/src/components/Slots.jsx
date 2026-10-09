import { groupSlots } from '../lib.js';
import { Icon, icons } from './ui.jsx';

export function SlotsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading times">
      {[4, 8].map((n, g) => (
        <div key={g}>
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-ink-100" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: n }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-ink-100" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyDay({ nextDate, onJump, label }) {
  return (
    <div className="animate-fade-up rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-6 text-center">
      <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm">
        <Icon d={icons.calendar} />
      </div>
      <p className="font-bold">No mentors are free on this day</p>
      {nextDate ? (
        <>
          <p className="mt-1 text-sm text-ink-500">The next day with open times is {label}.</p>
          <button type="button" onClick={onJump}
            className="mt-4 btn-brand px-5 py-2.5 text-sm">
            Jump to {label}
          </button>
        </>
      ) : <p className="mt-1 text-sm text-ink-500">Please try another date.</p>}
    </div>
  );
}

export default function Slots({ slots, tz, selected, onSelect }) {
  const groups = groupSlots(slots, tz);
  return (
    <div className="animate-fade-up space-y-5">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-sm font-bold text-ink-700">{g.label}</h3>
            <span className="text-xs text-ink-500">{g.hint}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {g.slots.map((s) => {
              const on = selected?.startUtc === s.startUtc;
              return (
                <button key={s.startUtc} type="button" onClick={() => onSelect(s)} aria-pressed={on}
                  className={'rounded-xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition ' +
                    (on ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white hover:border-ink-900')}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}