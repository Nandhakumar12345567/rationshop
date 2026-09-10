const db = require('../config/db');
const QRService = require('../services/qrService');
const NotificationService = require('../services/notificationService');
const socketService = require('../services/socketService');
const { calculateItemEntitlement } = require('../services/entitlementService');

const MAX_SLOT_CAPACITY = 20; // Maximum customers per time slot (20 tokens cap per hour)

class BookingController {
  /**
   * Get Available Slots for a given date with current capacity counts and booked token numbers
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
        "SELECT slot_time, qr_token FROM bookings WHERE slot_time LIKE $1 AND status != 'CANCELLED'",
        [`${dateStr}%`]
      );

      const slotBookings = {};
      result.rows.forEach(row => {
        if (!slotBookings[row.slot_time]) {
          slotBookings[row.slot_time] = [];
        }
        // Try to parse token_number from qr_token JSON if available
        let tokenNum = null;
        try {
          const payload = JSON.parse(row.qr_token || '{}');
          tokenNum = payload.token_number;
        } catch (e) {}
        
        slotBookings[row.slot_time].push(tokenNum);
      });

      const slots = timeSlots.map(slot => {
        const fullSlotName = `${dateStr} ${slot}`;
        const existingList = slotBookings[fullSlotName] || [];
        const bookedCount = existingList.length;

        // Map which specific token numbers from 1 to 20 are booked
        const bookedTokenNumbers = existingList
          .map((num, idx) => num || (idx + 1))
          .filter(Boolean);

        return {
          slot_time: fullSlotName,
          display_time: slot,
          booked_count: bookedCount,
          max_capacity: MAX_SLOT_CAPACITY,
          available_capacity: Math.max(0, MAX_SLOT_CAPACITY - bookedCount),
          is_full: bookedCount >= MAX_SLOT_CAPACITY,
          booked_token_numbers: bookedTokenNumbers
        };
      });

      return res.json({ success: true, date: dateStr, slots });
    } catch (error) {
      console.error('[Slot Availability Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch slots' });
    }
  }

  /**
   * Create Booking & Validate Entitlements + Capacity + Custom Selected Token Number (1 to 20)
   */
  static async createBooking(req, res) {
    try {
      const { card_no, category } = req.user;
      const { items, slot_time, token_number } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Selected items array cannot be empty' });
      }

      if (!slot_time) {
        return res.status(400).json({ success: false, error: 'Slot time is required' });
      }

      // 1. Capacity & Token Number Selection Check
      const existingBookings = await db.query(
        "SELECT qr_token FROM bookings WHERE slot_time = $1 AND status != 'CANCELLED'",
        [slot_time]
      );
      const currentBookedCount = existingBookings.rows.length;

      if (currentBookedCount >= MAX_SLOT_CAPACITY) {
        return res.status(400).json({
          success: false,
          error: `Selected slot (${slot_time}) is fully booked (20/20). Please select another slot.`
        });
      }

      // Determine taken token numbers
      const takenTokenNumbers = existingBookings.rows.map((row, idx) => {
        try {
          const payload = JSON.parse(row.qr_token || '{}');
          return payload.token_number || (idx + 1);
        } catch (e) {
          return idx + 1;
        }
      });

      let chosenTokenNum = parseInt(token_number, 10);
      if (chosenTokenNum && (chosenTokenNum < 1 || chosenTokenNum > MAX_SLOT_CAPACITY)) {
        return res.status(400).json({ success: false, error: 'Token number must be between 1 and 20' });
      }

      if (chosenTokenNum && takenTokenNumbers.includes(chosenTokenNum)) {
        return res.status(400).json({
          success: false,
          error: `Token #${chosenTokenNum} is already selected by another beneficiary. Please choose another token number.`
        });
      }

      // Auto-assign first available token number if not manually specified
      if (!chosenTokenNum) {
        for (let i = 1; i <= MAX_SLOT_CAPACITY; i++) {
          if (!takenTokenNumbers.includes(i)) {
            chosenTokenNum = i;
            break;
          }
        }
      }

      // 2. Entitlement Rule Check (Scaled dynamically by Family Members)
      let familySize = req.body.family_size ? parseInt(req.body.family_size, 10) : req.user.family_size;
      if (!familySize && card_no) {
        const cardRes = await db.query('SELECT family_size FROM ration_cards WHERE card_no = $1', [card_no]);
        if (cardRes.rows.length > 0) {
          familySize = cardRes.rows[0].family_size;
        }
      }
      familySize = Math.max(1, parseInt(familySize, 10) || 1);

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

        const entitlement = calculateItemEntitlement(itemDef.item_id, category, familySize);
        const maxAllowed = entitlement.quota;

        if (reqItem.quantity > maxAllowed) {
          return res.status(400).json({
            success: false,
            error: `Requested quantity for ${itemDef.name} (${reqItem.quantity} ${itemDef.unit}) exceeds family quota (${entitlement.formulaText} = ${maxAllowed} ${itemDef.unit}).`
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
        token_number: chosenTokenNum,
        payment_status: totalPrice === 0 ? 'PAID' : 'PENDING',
        status: 'BOOKED'
      };

      // Generate QR payload embedding token_number
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

      // Trigger real-time socket updates
      try {
        socketService.emitSlotUpdate({ slot_time, booked_token_number: chosenTokenNum });
        const QueueController = require('./queueController');
        const freshQueue = await QueueController.getRawQueueData();
        socketService.emitQueueUpdate('shop_1', freshQueue);
      } catch (sockErr) {
        console.error('[Booking Socket Emit Error]', sockErr);
      }

      return res.status(201).json({
        success: true,
        message: `Booking created successfully! Selected Token #${chosenTokenNum}`,
        booking: {
          booking_id,
          card_no,
          items: validatedItems,
          total_amount: totalPrice,
          slot_time,
          token_number: chosenTokenNum,
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

  /**
   * Cancel Booking & Release Time Slot in Real-Time
   */
  static async cancelBooking(req, res) {
    try {
      const { booking_id } = req.body;
      const { card_no } = req.user;

      if (!booking_id) {
        return res.status(400).json({ success: false, error: 'booking_id is required' });
      }

      const result = await db.query('SELECT * FROM bookings WHERE booking_id = $1 AND card_no = $2', [booking_id, card_no]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found for this card' });
      }

      const booking = result.rows[0];
      if (booking.status === 'ISSUED') {
        return res.status(400).json({ success: false, error: 'Cannot cancel a token that has already been issued' });
      }

      if (booking.status === 'CANCELLED') {
        return res.status(400).json({ success: false, error: 'Token is already cancelled' });
      }

      await db.query("UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = $1", [booking_id]);

      try {
        socketService.emitSlotUpdate({ slot_time: booking.slot_time, cancelled_booking_id: booking_id });
        const QueueController = require('./queueController');
        const freshQueue = await QueueController.getRawQueueData();
        socketService.emitQueueUpdate('shop_1', freshQueue);
      } catch (sockErr) {
        console.error('[Cancel Socket Emit Error]', sockErr);
      }

      return res.json({
        success: true,
        message: `Token #${booking_id} successfully cancelled! Slot released.`
      });
    } catch (error) {
      console.error('[Cancel Booking Error]', error);
      res.status(500).json({ success: false, error: 'Failed to cancel booking' });
    }
  }
}

module.exports = BookingController;
