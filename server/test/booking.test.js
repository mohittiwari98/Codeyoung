import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createBookingService } from '../src/bookingService.js';
import { Booking, MentorDay } from '../src/models.js';
import { ensureMentors } from '../src/seed.js';

const NOW = Date.parse('2026-10-01T00:00:00Z');
const first = Date.parse('2026-10-10T03:30:00Z'); // 09:00 IST
const svc = createBookingService({ now: () => NOW });
let n = 0;
const req = (startMs) => ({ name: 'P', email: `p${++n}@x.com`, childName: `Kid${n}`, childAge: 9, tz: 'America/New_York', startMs });
const slot = (i) => first + i * 30 * 60000;
let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Booking.init(), MentorDay.init()]);
});
beforeEach(async () => {
  await Promise.all([Booking.deleteMany({}), MentorDay.deleteMany({})]);
  await ensureMentors();
});
after(async () => { await mongoose.disconnect(); await mongod.stop(); });

test('21st booking of a day fails; no mentor gets a 3rd class', async () => {
  for (let i = 0; i < 20; i++) await svc.book(req(slot(i)));
  await assert.rejects(svc.book(req(slot(20))), { code: 'NO_MENTOR_AVAILABLE', status: 409 });
  const per = await Booking.aggregate([{ $group: { _id: '$mentorId', n: { $sum: 1 } } }]);
  assert.equal(per.length, 10);
  assert.ok(per.every((p) => p.n === 2));
});

test('concurrent: 11 parents, same slot => exactly 10 succeed', async () => {
  const r = await Promise.allSettled(Array.from({ length: 11 }, () => svc.book(req(first))));
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 10);
  assert.equal(r.find((x) => x.status === 'rejected').reason.code, 'NO_MENTOR_AVAILABLE');
});

test('concurrent: 30 requests across one IST day => exactly 20 succeed, max 2 per mentor', async () => {
  const r = await Promise.allSettled(Array.from({ length: 30 }, (_, i) => svc.book(req(slot(i % 24)))));
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 20);
  const per = await Booking.aggregate([{ $group: { _id: '$mentorId', n: { $sum: 1 } } }]);
  assert.ok(per.every((p) => p.n <= 2));
});

test('past and out-of-hours slots are rejected; listed slots shrink as they fill', async () => {
  await assert.rejects(svc.book(req(NOW)), { code: 'SLOT_IN_PAST' });
  await assert.rejects(svc.book(req(Date.parse('2026-10-10T20:00:00Z'))), { code: 'NO_MENTOR_AVAILABLE' });
  assert.equal((await svc.listSlots('2026-10-10', 'Asia/Kolkata')).length, 24);
  for (let i = 0; i < 10; i++) await svc.book(req(first));
  assert.equal((await svc.listSlots('2026-10-10', 'Asia/Kolkata')).length, 23);
});

test('same parent+child cannot book the same slot twice (sequential, case/space-insensitive)', async () => {
  const a = { name: 'P', email: 'Dup@x.com', childName: 'Asha  Rao', childAge: 9, tz: 'Asia/Kolkata', startMs: first };
  await svc.book(a);
  await assert.rejects(svc.book({ ...a, email: ' dup@x.com ', childName: 'asha rao' }), { code: 'DUPLICATE_BOOKING', status: 409 });
  assert.equal(await Booking.countDocuments({}), 1);
});

test('same child submitted 5x at once => exactly one booking, seats released', async () => {
  const a = { name: 'P', email: 'race@x.com', childName: 'Kid', childAge: 9, tz: 'Asia/Kolkata', startMs: first };
  const r = await Promise.allSettled(Array.from({ length: 5 }, () => svc.book(a)));
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
  assert.ok(r.filter((x) => x.status === 'rejected').every((x) => x.reason.code === 'DUPLICATE_BOOKING'));
  const total = (await MentorDay.aggregate([{ $group: { _id: null, n: { $sum: '$count' } } }]))[0].n;
  assert.equal(total, 1);
});