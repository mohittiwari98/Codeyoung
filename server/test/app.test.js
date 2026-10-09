import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

// No database or email needed: a stub service is enough to test the HTTP layer.
const stub = { listSlots: async () => [], book: async () => { throw new Error('not reached'); } };
const serve = (limits) => new Promise((res) => {
  const server = createApp(stub, { limits }).listen(0, () => res({ server, url: `http://127.0.0.1:${server.address().port}` }));
});

test('slots endpoint is rate limited with a clear 429 body', async () => {
  const { server, url } = await serve({ read: { windowMs: 60_000, limit: 2 } });
  try {
    const get = () => fetch(`${url}/api/slots?date=2026-10-12&tz=Asia/Kolkata`);
    assert.equal((await get()).status, 200);
    assert.equal((await get()).status, 200);
    const blocked = await get();
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).code, 'RATE_LIMITED');
  } finally { server.close(); }
});

test('booking endpoint is rate limited, even for invalid requests', async () => {
  const { server, url } = await serve({ write: { windowMs: 60_000, limit: 2 } });
  try {
    const post = () => fetch(`${url}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal((await post()).status, 400);
    assert.equal((await post()).status, 400);
    assert.equal((await post()).status, 429);
  } finally { server.close(); }
});
