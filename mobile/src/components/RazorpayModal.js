import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Linking, Platform } from 'react-native';

const PAYMENT_ASSETS = {
  gpay: require('../../assets/payments/gpay.png'),
  phonepe: require('../../assets/payments/phonepe.png'),
  paytm: require('../../assets/payments/paytm.png'),
  upi: require('../../assets/payments/upi.png'),
  netbanking: require('../../assets/payments/netbanking.png'),
  card: require('../../assets/payments/card.png')
};

const PAYMENT_METHODS = [
  { id: 'gpay', name: 'Google Pay', type: 'UPI' },
  { id: 'phonepe', name: 'PhonePe', type: 'UPI' },
  { id: 'paytm', name: 'Paytm UPI', type: 'UPI' },
  { id: 'upi', name: 'BHIM UPI', type: 'UPI' },
  { id: 'netbanking', name: 'Net Banking', type: 'BANK' },
  { id: 'card', name: 'Debit/Credit Card', type: 'CARD' }
];

const FALLBACK_SVGS = {
  gpay: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" rx="8" fill="#FFFFFF"/><g transform="translate(32,10) scale(0.42)"><path fill="#4285F4" d="M38,62 C22,46 22,20 38,4 L54,-12 C70,-28 96,-28 112,-12 C128,4 128,30 112,46 L96,62 C80,78 54,78 38,62 Z" transform="rotate(-30 65 30)"/><path fill="#34A853" d="M68,12 C84,-4 110,-4 126,12 L142,28 C158,44 158,70 142,86 L126,102 C110,118 84,118 68,102 Z" transform="rotate(30 100 45)"/><path fill="#FBBC04" d="M38,48 C54,32 80,32 96,48 L112,64 C128,80 128,106 112,122 L96,138 C80,154 54,154 38,138 Z" transform="rotate(-30 75 80)"/><path fill="#EA4335" d="M88,38 C104,22 130,22 146,38 L162,54 C178,70 178,96 162,112 L146,128 C130,144 104,144 88,128 Z" transform="rotate(30 120 70)"/></g></svg>')}`,

  phonepe: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80"><rect width="160" height="80" rx="8" fill="#FFFFFF"/><g transform="translate(10, 10)"><circle cx="30" cy="30" r="26" fill="#5F259F"/><path fill="#FFFFFF" d="M 22 18 L 30 26 H 36 V 21 H 22 V 18 H 40 V 30 C 40 35 35 38 30 38 H 27 V 46 H 21 V 28 H 27 C 31 28 34 27 34 24 H 22 Z"/><text x="68" y="38" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#5F259F">PhonePe</text></g></svg>')}`,

  paytm: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100" rx="12" fill="#FFFFFF"/><g transform="translate(10, 10)"><text x="70" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle"><tspan fill="#002E6E">pay</tspan><tspan fill="#00BAF2">tm</tspan></text><rect x="25" y="38" width="30" height="4" rx="2" fill="#002E6E"/><text x="70" y="44" font-size="14" text-anchor="middle" fill="#EF4444">❤️</text><rect x="85" y="38" width="30" height="4" rx="2" fill="#00BAF2"/><text x="70" y="72" font-family="Arial, sans-serif" font-size="22" font-style="italic" font-weight="900" fill="#475569" text-anchor="middle">UPI</text></g></svg>')}`,

  upi: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" rx="6" fill="#FF9933"/><text x="40" y="25" font-family="Arial" font-size="11" font-weight="bold" fill="#061E47" text-anchor="middle">BHIM UPI</text></svg>')}`,
  netbanking: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" rx="6" fill="#0F172A"/><text x="40" y="25" font-family="Arial" font-size="10" font-weight="bold" fill="#38BDF8" text-anchor="middle">NET BANK</text></svg>')}`,
  card: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" rx="6" fill="#1E3A8A"/><text x="40" y="25" font-family="Arial" font-size="10" font-weight="bold" fill="#F59E0B" text-anchor="middle">CARD</text></svg>')}`
};

export default function RazorpayModal({ visible, onClose, booking, onPaymentSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('gpay');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8891 0012 9942');
  const [processing, setProcessing] = useState(false);
  const [imgErrorMap, setImgErrorMap] = useState({});

  if (!booking) return null;

  const totalAmount = booking.items ? booking.items.reduce((sum, item) => sum + (item.total_price || 0), 0) : 0;

  const handlePay = async () => {
    setProcessing(true);

    // Try to deep link into real Google Pay / UPI App on mobile devices
    if (Platform.OS !== 'web' && currentMethodObj?.type === 'UPI') {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId || 'tnpds@okaxis')}&pn=TNPDS_Ration_Shop&tr=${booking.booking_id}&am=${totalAmount}&cu=INR`;
      try {
        const supported = await Linking.canOpenURL(upiUrl);
        if (supported) {
          await Linking.openURL(upiUrl);
        }
      } catch (e) {
        console.warn('[UPI DeepLink Warning]', e);
      }
    }

    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess({
        razorpay_order_id: `order_rzp_${Date.now()}`,
        razorpay_payment_id: `pay_${selectedMethod}_${Date.now()}`,
        payment_method: selectedMethod.toUpperCase()
      });
      onClose();
    }, 1200);
  };

  const handleImageError = (id) => {
    setImgErrorMap(prev => ({ ...prev, [id]: true }));
  };

  const currentMethodObj = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Government Payment Header */}
          <View style={styles.headerBar}>
            <View style={styles.trustBadgeTop}>
              <Text style={styles.trustBadgeTopText}>🏛️ TAMIL NADU GOVT PDS PAYMENT PORTAL</Text>
            </View>
            <Text style={styles.title}>Subsidised PDS Online Gateway</Text>
            <Text style={styles.subTitle}>Razorpay Sandbox • Multi-Channel Digital Payments</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 10 }}>
            <Text style={styles.bookingRef}>Application Ref No: TN/RATION/2026/0000{booking.booking_id}</Text>

            {/* Bill Summary Card */}
            <View style={styles.billBox}>
              <View style={styles.billRow}>
                <Text style={styles.billItemLabel}>Subsidised Ration Items Total:</Text>
                <Text style={styles.billItemVal}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.billRow}>
                <Text style={styles.billItemLabel}>Government Gateway Fee:</Text>
                <Text style={styles.feeWaiver}>₹0.00 (Waived)</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable Amount:</Text>
                <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Online Transaction Logos Grid */}
            <View style={styles.upiAppsContainer}>
              <Text style={styles.supportedLabel}>Select Online Payment Method Logo:</Text>
              
              <View style={styles.upiLogosGrid}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = selectedMethod === pm.id;
                  const hasErr = imgErrorMap[pm.id];
                  const localAsset = PAYMENT_ASSETS[pm.id];
                  const fallbackSvg = FALLBACK_SVGS[pm.id];

                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[styles.paymentTile, isSelected && styles.paymentTileSelected]}
                      onPress={() => setSelectedMethod(pm.id)}
                    >
                      {!hasErr && localAsset ? (
                        <Image
                          source={localAsset}
                          style={styles.logoImage}
                          resizeMode="contain"
                          onError={() => handleImageError(pm.id)}
                        />
                      ) : (
                        <Image
                          source={{ uri: fallbackSvg }}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={[styles.tileName, isSelected && styles.tileNameSelected]}>{pm.name}</Text>
                      {isSelected && <View style={styles.selectedCheckBadge}><Text style={styles.checkText}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dynamic Form Input Based on Selected Method */}
            {currentMethodObj?.type === 'UPI' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter Virtual Payment Address (VPA / UPI ID):</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g. name@upi or mobile@okicici"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ) : currentMethodObj?.type === 'CARD' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Card Number (Debit / Credit):</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="4532 XXXX XXXX 9942"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Net Banking Bank:</Text>
                <View style={styles.bankSelectBox}>
                  <Text style={styles.bankSelectText}>🏦 State Bank of India (SBI) - NetBanking</Text>
                </View>
              </View>
            )}

            {/* Security Trust Badge */}
            <View style={styles.trustBadgePayNear}>
              <Text style={styles.trustBadgePayText}>🔒 Secure Payment • 256-bit Encrypted Government Gateway</Text>
            </View>

            {processing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="small" color="#0B3D91" />
                <Text style={styles.processingText}>Authenticating with Bank Gateway & Issuing Receipt...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                <Text style={styles.payBtnText}>PAY ₹{totalAmount.toFixed(2)} VIA {currentMethodObj?.name.toUpperCase()} →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={processing}>
              <Text style={styles.closeText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.75)',
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
    shadowOpacity: 0.1,
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
  trustBadgeTop: {
    backgroundColor: 'rgba(255, 153, 51, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9933',
    marginBottom: 6
  },
  trustBadgeTopText: {
    color: '#FF9933',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  subTitle: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2
  },
  body: {
    padding: 16
  },
  bookingRef: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10
  },
  billBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  billItemLabel: {
    fontSize: 11,
    color: '#475569'
  },
  billItemVal: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700'
  },
  feeWaiver: {
    fontSize: 11,
    color: '#138808',
    fontWeight: '700'
  },
  billDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 6
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B3D91'
  },
  upiAppsContainer: {
    marginBottom: 12
  },
  supportedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  upiLogosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  paymentTile: {
    width: '31%',
    height: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 4
  },
  paymentTileSelected: {
    borderColor: '#0B3D91',
    backgroundColor: '#EFF6FF',
    borderWidth: 2.5
  },
  logoImage: {
    width: '100%',
    height: 32
  },
  tileName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2
  },
  tileNameSelected: {
    color: '#0B3D91',
    fontWeight: '800'
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#0B3D91',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  inputGroup: {
    marginBottom: 10
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600'
  },
  bankSelectBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10
  },
  bankSelectText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700'
  },
  trustBadgePayNear: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    marginBottom: 10
  },
  trustBadgePayText: {
    color: '#138808',
    fontSize: 10,
    fontWeight: '700'
  },
  processingBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12
  },
  processingText: {
    color: '#0B3D91',
    fontSize: 12,
    fontWeight: '600'
  },
  payBtn: {
    backgroundColor: '#FF9933',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E65100'
  },
  payBtnText: {
    color: '#061E47',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 4
  },
  closeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600'
  }
});
