import React, { useState } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { getQRCodeSVGDataURI } from '../utils/qrGenerator';

export default function QRModal({ visible, onClose, booking }) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  if (!booking) return null;

  // Build required JSON payload: { card_no, token_id, items, slot_time, issued_at }
  const tokenPayload = {
    card_no: booking.card_no,
    token_id: booking.booking_id,
    items: booking.items,
    slot_time: booking.slot_time,
    issued_at: booking.created_at || new Date().toISOString()
  };

  const payloadString = JSON.stringify(tokenPayload);

  // Generate web & mobile safe SVG Data URI QR Code
  const qrImageUri = booking.qr_data_url || getQRCodeSVGDataURI(payloadString);

  const handleRetry = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Government Watermark Card Header */}
          <View style={styles.headerBar}>
            <Text style={styles.sealEmblem}>🏛️ GOVERNMENT OF TAMIL NADU</Text>
            <Text style={styles.title}>Digital Ration Token Pass</Text>
            <Text style={styles.subTitle}>Tamil Nadu Public Distribution System (PDS)</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Reference Number */}
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>OFFICIAL APPLICATION REFERENCE NO:</Text>
              <Text style={styles.refNo}>TN/RATION/2026/0000{booking.booking_id}</Text>
            </View>

            {/* QR Container with Watermark Border */}
            <View style={styles.qrWatermarkContainer}>
              <View style={styles.watermarkPattern}>
                <Text style={styles.watermarkText}>GOVT OF TN • PDS • GOVT OF TN • PDS</Text>
              </View>
              
              <View style={styles.qrBox}>
                {hasError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>QR Generation Error</Text>
                    <Text style={styles.errorMsg}>Failed to encode digital token payload. Please tap retry.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                      <Text style={styles.retryBtnText}>🔄 Retry Generating QR</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image 
                    key={retryCount}
                    source={{ uri: qrImageUri }} 
                    style={styles.qrImage}
                    resizeMode="contain"
                    onError={() => setHasError(true)}
                  />
                )}
              </View>

              <Text style={styles.scanInstruction}>
                Present this encrypted QR code to the Fair Price Shop (#401) staff for biometric fingerprint validation.
              </Text>
            </View>

            {/* Status Pill */}
            <View style={[styles.statusBadge, booking.status === 'ISSUED' ? styles.statusIssuedBg : styles.statusPendingBg]}>
              <Text style={[styles.statusText, booking.status === 'ISSUED' ? styles.statusIssuedText : styles.statusPendingText]}>
                {booking.status === 'ISSUED' ? '✅ RATION ISSUED & COMPLETED' : '⏳ ACTIVE APPOINTMENT TOKEN'}
              </Text>
            </View>

            {/* Token Breakdown Table */}
            <View style={styles.detailsBox}>
              <Text style={styles.tableHeader}>Token Breakdown & Quota Info:</Text>
              
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Ration Card No:</Text>
                <Text style={styles.rowVal}>{booking.card_no}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Appointed Slot:</Text>
                <Text style={styles.rowVal}>{booking.slot_time}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Payment Status:</Text>
                <Text style={[styles.rowVal, { color: '#138808', fontWeight: '800' }]}>{booking.payment_status}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Fair Price Shop:</Text>
                <Text style={styles.rowVal}>FPS #401 (GNC Road, T. Nagar)</Text>
              </View>

              <Text style={[styles.tableHeader, { marginTop: 10 }]}>Booked Entitlements:</Text>
              {booking.items && booking.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemBullet}>• {it.name}:</Text>
                  <Text style={styles.itemQty}>{it.quantity} {it.unit} (₹{(it.total_price || 0).toFixed(2)})</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.shareBtn} onPress={() => alert('Token receipt downloaded to device storage.')}>
              <Text style={styles.shareBtnText}>📥 Download / Share Official Token Receipt</Text>
            </TouchableOpacity>

            {/* Legal Small Print */}
            <Text style={styles.legalSmallPrint}>
              This is an official digitally generated token issued under the Tamil Nadu Public Distribution System (PDS) Control Order & NFSA Rules. Valid only for the designated cardholder at FPS #401.
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close Token Window</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933'
  },
  sealEmblem: {
    color: '#FF9933',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  subTitle: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2
  },
  body: {
    padding: 16
  },
  bodyContent: {
    alignItems: 'center'
  },
  refBox: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%'
  },
  refLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  refNo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3D91',
    marginTop: 1
  },
  qrWatermarkContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#0B3D91',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%'
  },
  watermarkPattern: {
    marginBottom: 8
  },
  watermarkText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 1
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
    minHeight: 220
  },
  qrImage: {
    width: 210,
    height: 210
  },
  errorBox: {
    alignItems: 'center',
    padding: 16
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  errorTitle: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4
  },
  errorMsg: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11
  },
  scanInstruction: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1
  },
  statusIssuedBg: {
    backgroundColor: '#DCFCE7',
    borderColor: '#138808'
  },
  statusPendingBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  statusText: {
    fontWeight: '800',
    fontSize: 11
  },
  statusIssuedText: {
    color: '#138808'
  },
  statusPendingText: {
    color: '#B45309'
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14
  },
  tableHeader: {
    color: '#0B3D91',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 11
  },
  rowVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  itemBullet: {
    color: '#475569',
    fontSize: 11
  },
  itemQty: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700'
  },
  shareBtn: {
    backgroundColor: '#0B3D91',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  legalSmallPrint: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 10
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1'
  },
  closeText: {
    color: '#061E47',
    fontWeight: '800',
    fontSize: 12
  }
});
