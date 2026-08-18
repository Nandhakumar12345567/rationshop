const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_ration_jwt_secret_key_2026';

class QRService {
  /**
   * Generate signed JWT payload for booking token
   */
  static generateTokenPayload(booking) {
    const payload = {
      booking_id: booking.booking_id,
      card_no: booking.card_no,
      slot_time: booking.slot_time,
      issued_at: new Date().toISOString()
    };

    // Signed token valid for 7 days (or until booked slot expiry)
    const tokenStr = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return tokenStr;
  }

  /**
   * Generate Base64 Data URL for rendering QR Code on screen or print
   */
  static async generateQRCodeDataURL(tokenStr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(tokenStr, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2
      });
      return qrDataUrl;
    } catch (err) {
      console.warn('[QR Generation Warning - Retrying with compact string]', err.message);
      try {
        // Fallback to compact QR string
        return await QRCode.toDataURL(String(tokenStr).slice(0, 120), { errorCorrectionLevel: 'L', width: 300 });
      } catch (err2) {
        console.error('[QR Generation Fallback Error]', err2);
        return null;
      }
    }
  }

  /**
   * Decode and verify token string from scanned QR
   */
  static verifyToken(tokenStr) {
    try {
      const decoded = jwt.verify(tokenStr, JWT_SECRET);
      return { valid: true, payload: decoded };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}

module.exports = QRService;
