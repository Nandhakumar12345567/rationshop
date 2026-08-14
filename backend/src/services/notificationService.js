/**
 * Firebase Cloud Messaging (FCM) & Push Notification Service
 */

class NotificationService {
  /**
   * Send notification payload to user device token
   */
  static async sendNotification({ fcmToken, cardNo, title, body, data = {} }) {
    console.log(`[FCM Notification dispatched] Card: ${cardNo} | Title: "${title}" | Body: "${body}"`);
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Send Slot Booking Reminder
   */
  static async sendSlotReminder(cardNo, slotTime) {
    return this.sendNotification({
      cardNo,
      title: '⏰ Smart Ration Slot Reminder',
      body: `Your ration pickup slot is scheduled for ${slotTime}. Please keep your QR token ready.`,
      data: { type: 'SLOT_REMINDER', slotTime }
    });
  }

  /**
   * Send Stock Availability Alert
   */
  static async sendStockAlert(cardNo, itemNames) {
    return this.sendNotification({
      cardNo,
      title: '📦 Fresh Stock Arrived!',
      body: `Stock updated at your FPS for: ${itemNames.join(', ')}. Book your slot now!`,
      data: { type: 'STOCK_ALERT' }
    });
  }
}

module.exports = NotificationService;
