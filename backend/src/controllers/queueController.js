const db = require('../config/db');
const socketService = require('../services/socketService');

class QueueController {
  static async getQueueStatus(req, res) {
    try {
      const shopId = req.params.shop_id || 'shop_1';
      const cardNo = req.query.card_no;
      const requestedToken = parseInt(req.query.user_token, 10);

      // Query bookings for today
      const result = await db.query(
        "SELECT booking_id, card_no, slot_time, status, token_number, created_at FROM bookings WHERE status != 'CANCELLED' ORDER BY created_at ASC"
      );

      const bookings = result.rows || [];

      // Determine actual database counts
      const issuedTokens = bookings.filter(b => b.status === 'ISSUED');
      const waitingTokens = bookings.filter(b => b.status === 'BOOKED');
      const servingTokens = bookings.filter(b => b.status === 'SERVING');

      // Default or simulated serving token (e.g. 6 if available, or based on DB)
      let servingTokenNumber = 6;
      if (issuedTokens.length > 0) {
        servingTokenNumber = Math.min(20, issuedTokens.length + 1);
      }

      // Determine user token number
      let userTokenNumber = requestedToken || 12; // Default to #12 for demo scenario if not set
      if (cardNo) {
        const userBooking = bookings.find(b => b.card_no === cardNo && b.status === 'BOOKED');
        if (userBooking && userBooking.token_number) {
          userTokenNumber = userBooking.token_number;
        }
      }

      // Completed items count (e.g., tokens 1 to 5)
      const completedTokensCount = Math.max(0, servingTokenNumber - 1);
      
      // Tokens ahead calculation (e.g., if serving #6 and user is #12 -> 6 tokens ahead)
      const tokensAhead = Math.max(0, userTokenNumber - servingTokenNumber);

      // Time analysis: Avg 3.5 minutes per token processing at counter
      const avgMinutesPerToken = 3.5;
      const estimatedWaitMinutes = Math.round(tokensAhead * avgMinutesPerToken);

      const now = new Date();
      const expectedTurnDate = new Date(now.getTime() + estimatedWaitMinutes * 60 * 1000);
      const expectedTurnTimeStr = expectedTurnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Build 20 Token Grid Breakdown
      const tokensGrid = [];
      for (let i = 1; i <= 20; i++) {
        let tokenStatus = 'UPCOMING';
        let label = `Token #${i}`;

        if (i < servingTokenNumber) {
          tokenStatus = 'RECEIVED';
          label = `Token #${i} - Items Received ✅`;
        } else if (i === servingTokenNumber) {
          tokenStatus = 'RUNNING';
          label = `Token #${i} - Running / Serving ⚡`;
        } else if (i === userTokenNumber) {
          tokenStatus = 'YOUR_TOKEN';
          label = `Token #${i} - YOUR TOKEN ⭐`;
        } else if (i > servingTokenNumber && i < userTokenNumber) {
          tokenStatus = 'WAITING';
          label = `Token #${i} - Waiting in Line ⏳`;
        } else {
          tokenStatus = 'UPCOMING';
          label = `Token #${i} - Scheduled Slot`;
        }

        const estWaitFromNow = Math.max(0, (i - servingTokenNumber) * avgMinutesPerToken);
        const estTimeForToken = new Date(now.getTime() + estWaitFromNow * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        tokensGrid.push({
          token_number: i,
          status: tokenStatus,
          label,
          est_time: estTimeForToken,
          is_user: i === userTokenNumber,
          is_serving: i === servingTokenNumber,
          is_completed: i < servingTokenNumber
        });
      }

      // Current hour slot display
      const currentHour = now.getHours();
      let currentSlotStr = '10:00 AM - 11:00 AM';
      if (currentHour < 10) currentSlotStr = '09:00 AM - 10:00 AM';
      else if (currentHour === 10) currentSlotStr = '10:00 AM - 11:00 AM';
      else if (currentHour === 11) currentSlotStr = '11:00 AM - 12:00 PM';
      else if (currentHour >= 12 && currentHour < 15) currentSlotStr = '02:00 PM - 03:00 PM';
      else if (currentHour === 15) currentSlotStr = '03:00 PM - 04:00 PM';
      else currentSlotStr = '04:00 PM - 05:00 PM';

      const queueData = {
        success: true,
        shop_id: shopId,
        current_slot: currentSlotStr,
        serving_token_number: servingTokenNumber,
        user_token_number: userTokenNumber,
        completed_range: `1 to ${completedTokensCount}`,
        tokens_issued_count: completedTokensCount,
        tokens_ahead: tokensAhead,
        avg_minutes_per_token: avgMinutesPerToken,
        estimated_wait_minutes: estimatedWaitMinutes,
        expected_turn_time: expectedTurnTimeStr,
        tokens_grid: tokensGrid
      };

      return res.json(queueData);
    } catch (error) {
      console.error('[Queue Status Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch queue status' });
    }
  }

  static async updateQueueTokenStatus(req, res) {
    try {
      const { booking_id, status } = req.body;
      if (!booking_id || !status) {
        return res.status(400).json({ success: false, error: 'booking_id and status required' });
      }

      await db.query('UPDATE bookings SET status = $1 WHERE booking_id = $2', [status, booking_id]);

      // Trigger socket update to all connected clients
      const freshQueue = await QueueController.getRawQueueData();
      socketService.emitQueueUpdate('shop_1', freshQueue);

      return res.json({ success: true, message: 'Queue updated successfully' });
    } catch (error) {
      console.error('[Queue Update Error]', error);
      res.status(500).json({ success: false, error: 'Failed to update queue token status' });
    }
  }

  static async getRawQueueData() {
    const result = await db.query(
      "SELECT booking_id, card_no, slot_time, status, created_at FROM bookings WHERE status != 'CANCELLED' ORDER BY created_at ASC"
    );
    const bookings = result.rows || [];
    const issuedTokens = bookings.filter(b => b.status === 'ISSUED');
    const waitingTokens = bookings.filter(b => b.status === 'BOOKED');
    const servingTokens = bookings.filter(b => b.status === 'SERVING');

    return {
      shop_id: 'shop_1',
      serving_token_number: issuedTokens.length + servingTokens.length + (waitingTokens.length > 0 ? 1 : 0),
      total_capacity_per_slot: 20,
      tokens_issued_count: issuedTokens.length,
      tokens_remaining_count: waitingTokens.length
    };
  }
}

module.exports = QueueController;

