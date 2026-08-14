const request = require('supertest');
const app = require('../src/app');
const initDb = require('../src/db/initDb');

let authToken = '';
let testBookingId = '';

beforeAll(async () => {
  await initDb();

  // Login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ card_no: 'TN-04-BPL-883921', password: 'password123' });
  authToken = loginRes.body.token;

  // Create test booking
  const bookingRes = await request(app)
    .post('/api/bookings/create')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      slot_time: '2026-08-15 02:00 PM - 03:00 PM',
      items: [{ item_id: 'ITEM-SUGAR', quantity: 2 }]
    });

  testBookingId = bookingRes.body.booking.booking_id;
});

describe('Razorpay UPI Payment Flow Tests', () => {
  it('should create a Razorpay test order ID', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ booking_id: testBookingId });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.id).toMatch(/^order_rzp_/);
  });

  it('should verify payment and update booking payment status to PAID', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        booking_id: testBookingId,
        razorpay_order_id: 'order_rzp_test_123',
        razorpay_payment_id: 'pay_rzp_test_456',
        payment_method: 'UPI'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction).toHaveProperty('txn_id');
  });
});
