import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './index.js';
import { initializeDatabase, insertResident, resetDatabase } from './db.js';

test('login returns resident data when credentials are valid', async () => {
  initializeDatabase();
  resetDatabase();
  insertResident('alice', 'Alice Sørensen', 'password123');

  const app = createApp();

  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'password123' });

  assert.equal(response.status, 200);
  assert.equal(response.body.displayName, 'Alice Sørensen');
});

test('overlap request is rejected', async () => {
  initializeDatabase();
  resetDatabase();
  insertResident('alice', 'Alice Sørensen', 'password123');

  const app = createApp();

  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'password123' });

  await request(app)
    .post('/api/bookings')
    .set('Cookie', login.headers['set-cookie'])
    .send({ date: '2030-01-15', startTime: '09:00', endTime: '10:00' });

  const response = await request(app)
    .post('/api/bookings')
    .set('Cookie', login.headers['set-cookie'])
    .send({ date: '2030-01-15', startTime: '09:30', endTime: '10:30' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'BOOKING_OVERLAP');
});

test('booking overlapping time as another resident is rejected', async () => {
  initializeDatabase();
  resetDatabase();
  insertResident('alice', 'Alice Sørensen', 'password123');
  insertResident('bruno', 'Bruno Hansen', 'password123');

  const app = createApp();

  const aliceLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'password123' });

  const brunoLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'bruno', password: 'password123' });

  const aliceBooking = await request(app)
    .post('/api/bookings')
    .set('Cookie', aliceLogin.headers['set-cookie'])
    .send({ date: '2030-01-16', startTime: '10:00', endTime: '12:00' });
  assert.equal(aliceBooking.status, 201);

  // Bruno tries to book the exact same time
  const exactOverlapResponse = await request(app)
    .post('/api/bookings')
    .set('Cookie', brunoLogin.headers['set-cookie'])
    .send({ date: '2030-01-16', startTime: '10:00', endTime: '12:00' });

  assert.equal(exactOverlapResponse.status, 400);
  assert.equal(exactOverlapResponse.body.error.code, 'BOOKING_OVERLAP');

  // Bruno tries to book an overlapping partial slot (11:00 to 13:00)
  const partialOverlapResponse = await request(app)
    .post('/api/bookings')
    .set('Cookie', brunoLogin.headers['set-cookie'])
    .send({ date: '2030-01-16', startTime: '11:00', endTime: '13:00' });

  assert.equal(partialOverlapResponse.status, 400);
  assert.equal(partialOverlapResponse.body.error.code, 'BOOKING_OVERLAP');

  // Bruno can book an adjacent, non-overlapping slot (12:00 to 14:00)
  const nonOverlapResponse = await request(app)
    .post('/api/bookings')
    .set('Cookie', brunoLogin.headers['set-cookie'])
    .send({ date: '2030-01-16', startTime: '12:00', endTime: '14:00' });

  assert.equal(nonOverlapResponse.status, 201);
});

test('quota validation prevents exceeding six hours', async () => {
  initializeDatabase();
  resetDatabase();
  insertResident('alice', 'Alice Sørensen', 'password123');

  const app = createApp();

  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'password123' });

  const response = await request(app)
    .post('/api/bookings')
    .set('Cookie', login.headers['set-cookie'])
    .send({ date: '2030-01-15', startTime: '09:00', endTime: '20:00' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'WEEKLY_QUOTA_EXCEEDED');

  const quota = await request(app)
    .get('/api/me/quota')
    .set('Cookie', login.headers['set-cookie']);

  assert.equal(quota.status, 200);
  assert.equal(quota.body.usedMinutes, 0);
});
