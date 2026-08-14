const request = require('supertest');
const app = require('../src/app');
const initDb = require('../src/db/initDb');

let authToken = '';

beforeAll(async () => {
  await initDb();

  // Login as BPL test user
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      card_no: 'TN-04-BPL-883921',
      password: 'password123'
    });

  authToken = res.body.token;
});

describe('Booking & Slot Entitlement API Tests', () => {
  it('should fetch available slots for a given date', async () => {
    const res = await request(app)
      .get('/api/bookings/slots?date=2026-08-15')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('should reject booking if requested quantity exceeds card category entitlement limit', async () => {
    const res = await request(app)
      .post('/api/bookings/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slot_time: '2026-08-15 09:00 AM - 10:00 AM',
        items: [
          { item_id: 'ITEM-SUGAR', quantity: 15 } // BPL limit for sugar is 2kg
        ]
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('exceeds monthly limit');
  });

  it('should successfully create a valid slot booking within entitlement limits', async () => {
    const res = await request(app)
      .post('/api/bookings/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slot_time: '2026-08-15 10:00 AM - 11:00 AM',
        items: [
          { item_id: 'ITEM-RICE', quantity: 10 },
          { item_id: 'ITEM-SUGAR', quantity: 1 }
        ]
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking).toHaveProperty('booking_id');
    expect(res.body.booking).toHaveProperty('qr_token');
  });
});
