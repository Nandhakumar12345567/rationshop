const db = require('../config/db');
const QRService = require('../services/qrService');
const BiometricService = require('../services/biometricService');

class IssueController {
  /**
   * Scan QR Code and Auto-Fetch Customer & Booking details
   */
  static async scanQR(req, res) {
    try {
      const { qr_token } = req.body;
      if (!qr_token) {
        return res.status(400).json({ success: false, error: 'QR token string required' });
      }

      // Verify token cryptographic signature
      const tokenResult = QRService.verifyToken(qr_token);
      if (!tokenResult.valid) {
        return res.status(400).json({ success: false, error: `Invalid or tampered QR token: ${tokenResult.error}` });
      }

      const { booking_id } = tokenResult.payload;

      // Query database for latest booking record status
      const bookingRes = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking record not found in system' });
      }

      const booking = bookingRes.rows[0];

      // Check if already issued or expired
      if (booking.status === 'ISSUED') {
        return res.status(400).json({
          success: false,
          error: 'Fraud alert: This ration token has ALREADY been issued and used!',
          booking_status: 'ISSUED'
        });
      }

      if (booking.status === 'EXPIRED') {
        return res.status(400).json({
          success: false,
          error: 'This token has expired. Customer must re-book a slot.',
          booking_status: 'EXPIRED'
        });
      }

      // Fetch customer details
      const cardRes = await db.query('SELECT card_no, holder_name, category, family_size, phone FROM ration_cards WHERE card_no = $1', [booking.card_no]);
      const customer = cardRes.rows[0];

      const items = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;

      return res.json({
        success: true,
        booking: {
          booking_id: booking.booking_id,
          card_no: booking.card_no,
          slot_time: booking.slot_time,
          payment_status: booking.payment_status,
          status: booking.status,
          created_at: booking.created_at,
          items
        },
        customer
      });
    } catch (error) {
      console.error('[Scan QR Error]', error);
      res.status(500).json({ success: false, error: 'Failed to process QR token scan' });
    }
  }

  /**
   * Pluggable Biometric Verification Step
   */
  static async verifyBiometric(req, res) {
    try {
      const { card_no, biometric_data, simulate_fail = false } = req.body;
      if (!card_no) {
        return res.status(400).json({ success: false, error: 'Ration card number required' });
      }

      const verificationResult = await BiometricService.verifyFingerprint(card_no, biometric_data, simulate_fail);
      return res.json({ success: verificationResult.success, result: verificationResult });
    } catch (error) {
      console.error('[Biometric Verification Error]', error);
      res.status(500).json({ success: false, error: 'Biometric verification processing failure' });
    }
  }

  /**
   * Complete Issue Flow: Lock token status to ISSUED, auto-deduct shop stock, write log
   */
  static async completeIssue(req, res) {
    try {
      const { booking_id, shop_id = 'FPS-TN-0401', fingerprint_verified = true } = req.body;

      if (!booking_id) {
        return res.status(400).json({ success: false, error: 'booking_id is required' });
      }

      if (!fingerprint_verified) {
        return res.status(400).json({ success: false, error: 'Fingerprint biometric verification MUST pass before issuing items' });
      }

      // Fetch booking
      const bookingRes = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      const booking = bookingRes.rows[0];

      if (booking.status === 'ISSUED') {
        return res.status(400).json({ success: false, error: 'Booking is already locked and issued!' });
      }

      // Fetch current shop stock
      const shopRes = await db.query('SELECT * FROM shops WHERE shop_id = $1', [shop_id]);
      if (shopRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Shop not found' });
      }

      const shop = shopRes.rows[0];
      const currentStock = typeof shop.stock === 'string' ? JSON.parse(shop.stock) : shop.stock;
      const bookedItems = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;

      // Auto-deduct stock
      const updatedStock = { ...currentStock };
      for (const item of bookedItems) {
        const available = updatedStock[item.item_id] || 0;
        updatedStock[item.item_id] = Math.max(0, available - item.quantity);
      }

      // Update shop stock in DB
      await db.query('UPDATE shops SET stock = $1 WHERE shop_id = $2', [JSON.stringify(updatedStock), shop_id]);

      // Lock booking status to ISSUED
      await db.query("UPDATE bookings SET status = 'ISSUED' WHERE booking_id = $1", [booking_id]);

      // Record in issued_logs table
      const log_id = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await db.query(
        `INSERT INTO issued_logs (log_id, booking_id, shop_id, verified_by_fingerprint, fingerprint_score)
         VALUES ($1, $2, $3, 1, 98.50)`,
        [log_id, booking_id, shop_id]
      );

      return res.json({
        success: true,
        message: 'Ration items issued successfully! Stock updated and token locked.',
        log: {
          log_id,
          booking_id,
          shop_id,
          issued_items: bookedItems,
          updated_shop_stock: updatedStock,
          issued_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[Complete Issue Error]', error);
      res.status(500).json({ success: false, error: 'Failed to issue ration items' });
    }
  }
}

module.exports = IssueController;
