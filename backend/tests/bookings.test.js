const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validSlot } = require('../controllers/bookingController');

test('appointment validation uses published time choices, future dates and a 90-day horizon', () => {
  const now = Date.parse('2026-10-06T00:00:00Z');
  assert.equal(validSlot('2026-10-07T02:30:00.000Z', now), true); // 08:00 Sri Lanka
  assert.equal(validSlot('2026-10-07T03:00:00.000Z', now), false);
  assert.equal(validSlot('2026-10-05T02:30:00.000Z', now), false);
  assert.equal(validSlot('2027-10-07T02:30:00.000Z', now), false);
  assert.equal(validSlot('2026-02-30T02:30:00.000Z', now), false);
  assert.equal(validSlot(null, now), false);
});

test('booking lifecycle, ownership, retries and concurrent slot reservations against isolated MongoDB', { skip: process.env.RUN_BOOKING_INTEGRATION !== '1', timeout: 90000 }, async () => {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
  const mongoose = require('mongoose');
  const dbName = 'fixmate_booking_test_' + require('crypto').randomBytes(8).toString('hex');
  let server;
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 10000 });
    const User = require('../models/User'), Booking = require('../models/Booking');
    await Promise.all([User.init(), Booking.init()]);
    const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const first = new Date(day + 'T08:00:00+05:30').toISOString();
    const second = new Date(day + 'T10:30:00+05:30').toISOString();
    const third = new Date(day + 'T12:00:00+05:30').toISOString();
    const make = (name, role, phone) => User.create({ name, email: name.toLowerCase() + '@example.test', phone, password: 'Test-only-password', role, isVerified: true, isApprovedByAdmin: true, providerDetails: role === 'provider' ? { approvalStatus: 'approved', category: 'Electrical Repair', price: 4500 } : undefined });
    const [provider, a, b] = await Promise.all([make('Provider', 'provider', '0700000001'), make('Alice', 'customer', '0700000002'), make('Bob', 'customer', '0700000003')]);
    const jwt = require('jsonwebtoken');
    const tokens = new Map([provider, a, b].map(u => [String(u._id), jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '5m' })]));
    const express = require('express'), app = express(); app.use(express.json()); app.use('/api/bookings', require('../routes/bookingRoutes'));
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/bookings`;
    const call = async (user, path = '', method = 'GET', data) => { const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: 'Bearer ' + tokens.get(String(user._id)) } : {}) }, body: data ? JSON.stringify(data) : undefined }); return { status: res.status, body: await res.json() }; };
    assert.equal((await call(null)).status, 401);
    assert.equal((await call(a, '/slots', 'POST', { startsAt: first })).status, 403);
    for (const startsAt of [first, second, third]) assert.equal((await call(provider, '/slots', 'POST', { startsAt })).status, 200);
    const availability = await call(a, '/availability/' + provider._id);
    assert.equal(availability.body.slots.length, 3);
    assert.ok(availability.body.slots.every(s => s.available));
    const payload = { providerId: String(provider._id), startsAt: first, problem: 'Repair outlet', location: 'Test Street', notes: 'Test notes', requestId: 'first' };
    assert.equal((await call(a, '', 'POST', { ...payload, problem: ' ' })).status, 400);
    assert.equal((await call(provider, '', 'POST', payload)).status, 403);
    // ObjectId casing must not create two different reservation keys.
    const race = await Promise.all([call(a, '', 'POST', payload), call(b, '', 'POST', { ...payload, providerId: payload.providerId.toUpperCase(), requestId: 'second' })]);
    assert.deepEqual(race.map(r => r.status).sort(), [201, 409]);
    const winnerIndex = race.findIndex(r => r.status === 201), owner = winnerIndex === 0 ? a : b, other = winnerIndex === 0 ? b : a;
    const created = race[winnerIndex].body.booking;
    const retry = await call(owner, '', 'POST', { ...payload, requestId: winnerIndex === 0 ? 'first' : 'second' });
    assert.equal(retry.body.booking.id, created.id);
    assert.equal(await Booking.countDocuments(), 1);
    assert.equal(created.price, 4500); assert.equal(created.status, 'pending');
    assert.equal((await call(other, '/' + created.id, 'PATCH', { action: 'cancel' })).status, 404);
    assert.equal((await call(owner, '/' + created.id, 'PATCH', { action: 'confirm' })).status, 409);
    assert.equal((await call(provider, '/' + created.id, 'PATCH', { action: 'confirm' })).body.booking.status, 'confirmed');
    const occupied = await call(other, '', 'POST', { ...payload, startsAt: second, requestId: 'occupied' });
    assert.equal(occupied.status, 201);
    assert.equal((await call(owner, '/' + created.id, 'PATCH', { action: 'reschedule', startsAt: second })).status, 409);
    assert.equal((await Booking.findById(created.id)).startsAt.toISOString(), first);
    const moved = await call(owner, '/' + created.id, 'PATCH', { action: 'reschedule', startsAt: third, problem: 'Updated description', location: 'New address', notes: 'New notes' });
    assert.equal(moved.body.booking.status, 'pending'); assert.equal(moved.body.booking.location, 'New address');
    assert.equal((await call(owner)).body.bookings.length, 1);
    assert.equal((await call(provider)).body.bookings.length, 2);
    assert.equal((await call(other, '/' + occupied.body.booking.id, 'PATCH', { action: 'cancel' })).body.booking.status, 'cancelled');
    const availableAfterCancel = (await call(a, '/availability/' + provider._id)).body.slots;
    assert.equal(availableAfterCancel.find(s => s.startsAt === second).available, true);
    await call(provider, '/' + created.id, 'PATCH', { action: 'confirm' });
    assert.equal((await call(provider, '/' + created.id, 'PATCH', { action: 'start' })).body.booking.status, 'ongoing');
    assert.equal((await call(provider, '/' + created.id, 'PATCH', { action: 'complete' })).body.booking.status, 'completed');
    assert.equal((await call(owner, '/' + created.id, 'PATCH', { action: 'cancel' })).status, 409);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && /^fixmate_booking_test_[a-f0-9]{16}$/.test(dbName)) await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});
