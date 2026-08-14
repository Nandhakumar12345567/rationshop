import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

export default function RazorpayModal({ visible, onClose, booking, onPaymentSuccess }) {
  const [upiId, setUpiId] = useState('user@okaxis');
  const [processing, setProcessing] = useState(false);

  if (!booking) return null;

  const totalAmount = booking.items ? booking.items.reduce((sum, item) => sum + (item.total_price || 0), 0) : 0;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess({
        razorpay_order_id: `order_rzp_${Date.now()}`,
        razorpay_payment_id: `pay_upi_${Date.now()}`,
        payment_method: 'UPI'
      });
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.badge}>Razorpay Sandbox</Text>
            <Text style={styles.title}>💳 Subsidized UPI Checkout</Text>
          </View>

          <Text style={styles.bookingRef}>Booking Ref: {booking.booking_id}</Text>

          <View style={styles.billBox}>
            <Text style={styles.billLabel}>Total Subsidized Amount Payable:</Text>
            <Text style={styles.billAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Virtual Payment Address (VPA / UPI ID):</Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. name@upi"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.upiAppsRow}>
            <Text style={styles.upiAppBadge}>GPay</Text>
            <Text style={styles.upiAppBadge}>PhonePe</Text>
            <Text style={styles.upiAppBadge}>Paytm</Text>
            <Text style={styles.upiAppBadge}>BHIM UPI</Text>
          </View>

          {processing ? (
            <View style={styles.processingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.processingText}>Processing UPI payment with Bank Gateway...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
              <Text style={styles.payBtnText}>Pay ₹{totalAmount.toFixed(2)} via UPI →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={processing}>
            <Text style={styles.closeText}>Cancel Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    backgroundColor: colors.gold,
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  bookingRef: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16
  },
  billBox: {
    backgroundColor: colors.bgDark,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  billAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.bgDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 14
  },
  upiAppsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  upiAppBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.textSecondary,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  processingBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12
  },
  processingText: {
    color: colors.primary,
    fontSize: 13
  },
  payBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  payBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 6
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 12
  }
});
