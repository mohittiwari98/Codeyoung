import { useEffect, useState } from 'react';
import { addDays, dayParts, monthYear, todayIn } from '../lib.js';
import { Icon, icons } from './ui.jsx';

const VISIBLE = 7;

export default function DateStrip({ date, setDate, tz }) {
  const today = todayIn(tz);
  const [start, setStart] = useState(date);

  // Keep the selected date inside the visible window, and never start before today.
  useEffect(() => {
    setStart((s) => {
      let n = s < today ? today : s;
      if (date < n || date >= addDays(n, VISIBLE)) n = date;
      return n < today ? today : n;
    });
  }, [date, today]);

  const days = Array.from({ length: VISIBLE }, (_, i) => addDays(start, i));
  const canPrev = start > today;
  const arrow = 'grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-ink-600 transition hover:border-ink-900 hover:text-ink-900 disabled:opacity-30 disabled:hover:border-ink-200';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink-700">{monthYear(date)}</h2>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="jump-date">Jump to a date</label>
          <input id="jump-date" type="date" value={date} min={today}
            onChange={(e) => e.target.value && setDate(e.target.value < today ? today : e.target.value)}
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-medium text-ink-600" />
          <button type="button" className={arrow} disabled={!canPrev} aria-label="Previous week"
            onClick={() => setStart(addDays(start, -VISIBLE) < today ? today : addDays(start, -VISIBLE))}>
            <Icon d={icons.left} className="h-4 w-4" />
          </button>
          <button type="button" className={arrow} aria-label="Next week" onClick={() => setStart(addDays(start, VISIBLE))}>
            <Icon d={icons.right} className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="group" aria-label="Choose a date">
        {days.map((d) => {
          const p = dayParts(d), on = d === date;
          return (
            <button key={d} type="button" onClick={() => setDate(d)} aria-pressed={on}
              className={'flex flex-col items-center rounded-xl border py-2 transition ' +
                (on ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white hover:border-ink-900')}>
              <span className={'text-[10px] font-semibold sm:text-xs ' + (on ? 'text-brand-200' : 'text-ink-500')}>
                {d === today ? 'Today' : p.weekday}
              </span>
              <span className="text-lg font-bold leading-tight sm:text-xl">{p.day}</span>
              <span className={'text-[10px] sm:text-xs ' + (on ? 'text-brand-200' : 'text-ink-500')}>{p.month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}