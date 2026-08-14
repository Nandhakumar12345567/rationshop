import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

export default function QRModal({ visible, onClose, booking }) {
  if (!booking) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🎟️ Digital Ration Token</Text>
          <Text style={styles.bookingId}>Token ID: {booking.booking_id}</Text>

          {/* QR Image */}
          <View style={styles.qrBox}>
            {booking.qr_data_url ? (
              <Image source={{ uri: booking.qr_data_url }} style={styles.qrImage} />
            ) : (
              <View style={styles.qrFallback}>
                <Text style={styles.qrFallbackText}>[QR Token String]</Text>
                <Text style={styles.tokenSnippet} numberOfLines={2}>
                  {booking.qr_token}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              Status: {booking.status === 'ISSUED' ? '✅ ISSUED & COMPLETED' : '⏳ PENDING PICKUP'}
            </Text>
          </View>

          <ScrollView style={styles.detailsBox}>
            <Text style={styles.detailTitle}>Booking Breakdown:</Text>
            <Text style={styles.detailRow}>📅 Booked Slot: {booking.slot_time}</Text>
            <Text style={styles.detailRow}>💳 Payment Status: {booking.payment_status}</Text>
            <Text style={styles.detailRow}>👤 Card No: {booking.card_no}</Text>

            <Text style={[styles.detailTitle, { marginTop: 10 }]}>Booked Items:</Text>
            {booking.items && booking.items.map((it, idx) => (
              <Text key={idx} style={styles.itemRow}>
                • {it.name}: {it.quantity} {it.unit} (₹{(it.total_price || 0).toFixed(2)})
              </Text>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close Token</Text>
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
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary
  },
  bookingId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12
  },
  qrBox: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrImage: {
    width: 200,
    height: 200
  },
  qrFallback: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  qrFallbackText: {
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 6
  },
  tokenSnippet: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center'
  },
  statusBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  statusText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12
  },
  detailsBox: {
    width: '100%',
    maxHeight: 140,
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16
  },
  detailTitle: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  detailRow: {
    color: colors.textPrimary,
    fontSize: 12,
    marginBottom: 2
  },
  itemRow: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4
  },
  closeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8
  },
  closeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13
  }
});
