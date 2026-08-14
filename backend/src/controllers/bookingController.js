const db = require('../config/db');
const QRService = require('../services/qrService');
const NotificationService = require('../services/notificationService');

const MAX_SLOT_CAPACITY = 10; // Maximum customers per time slot

class BookingController {
  /**
   * Get Available Slots for a given date with current capacity counts
   */
  static async getAvailableSlots(req, res) {
    try {
      const dateStr = req.query.date || new Date().toISOString().split('T')[0];
      
      const timeSlots = [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
      ];

      // Query database for existing bookings for these slots on given date
      const result = await db.query(
        "SELECT slot_time, COUNT(*) as count FROM bookings WHERE slot_time LIKE $1 AND status != 'CANCELLED' GROUP BY slot_time",
        [`${dateStr}%`]
      );

      const bookingCounts = {};
      result.rows.forEach(row => {
        bookingCounts[row.slot_time] = parseInt(row.count, 10);
      });

      const slots = timeSlots.map(slot => {
        const fullSlotName = `${dateStr} ${slot}`;
        const bookedCount = bookingCounts[fullSlotName] || 0;
        return {
          slot_time: fullSlotName,
          display_time: slot,
          booked_count: bookedCount,
          max_capacity: MAX_SLOT_CAPACITY,
          available_capacity: Math.max(0, MAX_SLOT_CAPACITY - bookedCount),
          is_full: bookedCount >= MAX_SLOT_CAPACITY
        };
      });

      return res.json({ success: true, date: dateStr, slots });
    } catch (error) {
      console.error('[Slot Availability Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch slots' });
    }
  }

  /**
   * Create Booking & Validate Entitlements + Capacity
   */
  static async createBooking(req, res) {
    try {
      const { card_no, category } = req.user;
      const { items, slot_time } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Selected items array cannot be empty' });
      }

      if (!slot_time) {
        return res.status(400).json({ success: false, error: 'Slot time is required' });
      }

      // 1. Capacity Check
      const capacityCheck = await db.query(
        "SELECT COUNT(*) as count FROM bookings WHERE slot_time = $1 AND status != 'CANCELLED'",
        [slot_time]
      );
      const currentBooked = parseInt(capacityCheck.rows[0]?.count || 0, 10);

      if (currentBooked >= MAX_SLOT_CAPACITY) {
        return res.status(400).json({
          success: false,
          error: `Selected slot (${slot_time}) is fully booked. Please select another time slot.`
        });
      }

      // 2. Entitlement Rule Check
      const itemsResult = await db.query('SELECT * FROM items');
      const itemsMap = new Map();
      itemsResult.rows.forEach(it => itemsMap.set(it.item_id, it));

      let totalPrice = 0;
      const validatedItems = [];

      for (const reqItem of items) {
        const itemDef = itemsMap.get(reqItem.item_id);
        if (!itemDef) {
          return res.status(400).json({ success: false, error: `Invalid item ID: ${reqItem.item_id}` });
        }

        const categoryLimits = typeof itemDef.category_limit_rules === 'string'
          ? JSON.parse(itemDef.category_limit_rules)
          : itemDef.category_limit_rules;

        const maxAllowed = categoryLimits[category] !== undefined ? categoryLimits[category] : 0;

        if (reqItem.quantity > maxAllowed) {
          return res.status(400).json({
            success: false,
            error: `Requested quantity for ${itemDef.name} (${reqItem.quantity} ${itemDef.unit}) exceeds monthly limit for ${category} card (${maxAllowed} ${itemDef.unit}).`
          });
        }

        const itemTotal = reqItem.quantity * parseFloat(itemDef.price_per_unit);
        totalPrice += itemTotal;

        validatedItems.push({
          item_id: itemDef.item_id,
          name: itemDef.name,
          unit: itemDef.unit,
          quantity: reqItem.quantity,
          price_per_unit: parseFloat(itemDef.price_per_unit),
          total_price: itemTotal
        });
      }

      const booking_id = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const bookingObj = {
        booking_id,
        card_no,
        items: JSON.stringify(validatedItems),
        slot_time,
        payment_status: totalPrice === 0 ? 'PAID' : 'PENDING',
        status: 'BOOKED'
      };

      // Generate QR payload
      const qr_token = QRService.generateTokenPayload(bookingObj);

      await db.query(
        `INSERT INTO bookings (booking_id, card_no, items, slot_time, payment_status, qr_token, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          booking_id,
          card_no,
          JSON.stringify(validatedItems),
          slot_time,
          bookingObj.payment_status,
          qr_token,
          'BOOKED'
        ]
      );

      // Trigger push notification reminder
      NotificationService.sendSlotReminder(card_no, slot_time);

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully!',
        booking: {
          booking_id,
          card_no,
          items: validatedItems,
          total_amount: totalPrice,
          slot_time,
          payment_status: bookingObj.payment_status,
          qr_token,
          status: 'BOOKED'
        }
      });
    } catch (error) {
      console.error('[Create Booking Error]', error);
      res.status(500).json({ success: false, error: 'Failed to create booking' });
    }
  }

  /**
   * Get User Bookings & History
   */
  static async getUserBookings(req, res) {
    try {
      const { card_no } = req.user;
      const result = await db.query(
        'SELECT * FROM bookings WHERE card_no = $1 ORDER BY created_at DESC',
        [card_no]
      );

      const bookings = result.rows.map(b => ({
        ...b,
        items: typeof b.items === 'string' ? JSON.parse(b.items) : b.items
      }));

      return res.json({ success: true, bookings });
    } catch (error) {
      console.error('[Get Bookings Error]', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve bookings' });
    }
  }

  /**
   * Get Single Booking details + QR Data URL
   */
  static async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      const booking = result.rows[0];
      const parsedItems = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;
      
      const qrDataUrl = await QRService.generateQRCodeDataURL(booking.qr_token);

      return res.json({
        success: true,
        booking: {
          ...booking,
          items: parsedItems,
          qr_data_url: qrDataUrl
        }
      });
    } catch (error) {
      console.error('[Get Booking Details Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch booking details' });
    }
  }
}

module.exports = BookingController;
