import test from 'node:test';
import assert from 'node:assert/strict';
import { dayRangeMs, fmt } from '../src/tz.js';

test('DST: UK and US switch on different dates, India never', () => {
  const [a, b] = dayRangeMs('2026-10-25', 'Europe/London');
  assert.equal((b - a) / 3600000, 25);
  assert.equal(fmt(Date.parse('2026-10-28T14:00:00Z'), 'Europe/London'), 'Wed, 28 Oct 2026, 2:00 PM GMT');
  assert.equal(fmt(Date.parse('2026-10-28T14:00:00Z'), 'America/New_York'), 'Wed, 28 Oct 2026, 10:00 AM EDT');
  assert.equal(fmt(Date.parse('2026-11-02T14:00:00Z'), 'America/New_York'), 'Mon, 2 Nov 2026, 9:00 AM EST');
  assert.equal(fmt(Date.parse('2026-11-02T14:00:00Z'), 'Asia/Kolkata'), 'Mon, 2 Nov 2026, 7:30 PM IST');
});
