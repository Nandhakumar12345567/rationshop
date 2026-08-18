const crypto = require('crypto');
const db = require('../config/db');

class PaymentController {
  /**
   * Create Razorpay Order (Sandbox / Test Mode)
   */
  static async createOrder(req, res) {
    try {
      const { booking_id } = req.body;
      if (!booking_id) {
        return res.status(400).json({ success: false, error: 'booking_id is required' });
      }

      const bookingRes = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      const booking = bookingRes.rows[0];
      const items = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;
      
      const totalAmount = items.reduce((acc, curr) => acc + (curr.total_price || 0), 0);

      // Create Razorpay Order payload format
      const razorpayOrderId = `order_rzp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

      return res.json({
        success: true,
        order: {
          id: razorpayOrderId,
          entity: 'order',
          amount: Math.round(totalAmount * 100), // Amount in paise
          currency: 'INR',
          receipt: booking_id,
          status: 'created',
          attempts: 0,
          created_at: Math.floor(Date.now() / 1000)
        },
        display_amount: totalAmount
      });
    } catch (error) {
      console.error('[Create Payment Order Error]', error);
      res.status(500).json({ success: false, error: 'Failed to create payment order' });
    }
  }

  /**
   * Verify Razorpay Payment Signature / Mock UPI payment success
   */
  static async verifyPayment(req, res) {
    try {
      const { booking_id, razorpay_order_id, razorpay_payment_id, payment_method = 'UPI' } = req.body;

      if (!booking_id || !razorpay_order_id) {
        return res.status(400).json({ success: false, error: 'Missing required payment parameters' });
      }

      const bookingRes = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking record not found' });
      }

      const booking = bookingRes.rows[0];
      const items = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;
      const totalAmount = items.reduce((acc, curr) => acc + (curr.total_price || 0), 0);

      const txn_id = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentId = razorpay_payment_id || `pay_rzp_${Date.now()}`;

      // Insert transaction record
      await db.query(
        `INSERT INTO transactions (txn_id, booking_id, amount, payment_method, razorpay_order_id, razorpay_payment_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txn_id, booking_id, totalAmount, payment_method, razorpay_order_id, paymentId, 'SUCCESS']
      );

      // Update booking status to PAID
      await db.query("UPDATE bookings SET payment_status = 'PAID' WHERE booking_id = $1", [booking_id]);

      return res.json({
        success: true,
        message: 'Payment verified and status updated to PAID!',
        transaction: {
          txn_id,
          booking_id,
          amount: totalAmount,
          payment_method,
          razorpay_payment_id: paymentId,
          status: 'SUCCESS'
        }
      });
    } catch (error) {
      console.error('[Verify Payment Error]', error);
      res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
  }

  /**
   * Get User Transactions History
   */
  static async getUserTransactions(req, res) {
    try {
      const { card_no } = req.user;
      const result = await db.query(
        `SELECT t.*, b.slot_time, b.card_no 
         FROM transactions t 
         JOIN bookings b ON t.booking_id = b.booking_id 
         WHERE b.card_no = $1 
         ORDER BY t.created_at DESC`,
        [card_no]
      );

      return res.json({ success: true, transactions: result.rows || [] });
    } catch (error) {
      console.error('[Get Transactions Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transactions history' });
    }
  }

  /**
   * Webhook Listener for Razorpay Events
   */
  static async handleWebhook(req, res) {
    try {
      console.log('[Razorpay Webhook Event Received]', req.body?.event);
      return res.json({ status: 'ok', received: true });
    } catch (error) {
      res.status(500).json({ error: 'Webhook processing error' });
    }
  }
}

module.exports = PaymentController;
