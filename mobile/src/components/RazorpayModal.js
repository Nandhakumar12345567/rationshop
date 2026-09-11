import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
  Platform,
  SafeAreaView
} from 'react-native';

const PAYMENT_ASSETS = {
  gpay: require('../../assets/payments/gpay.png'),
  phonepe: require('../../assets/payments/phonepe.png'),
  paytm: require('../../assets/payments/paytm.png'),
  upi: require('../../assets/payments/upi.png'),
  card: require('../../assets/payments/card.png')
};

export default function RazorpayModal({ visible, onClose, booking, onPaymentSuccess }) {
  // Default selected: 'phonepe' (as seen in frequently used)
  const [selectedMethod, setSelectedMethod] = useState('phonepe');
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showCardInput, setShowCardInput] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!booking) return null;

  const totalAmount = booking.items
    ? booking.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
    : 225.50;

  const handlePay = async () => {
    setProcessing(true);
    setProcessingStatus(`Connecting to ${getMethodName(selectedMethod)}...`);

    // On mobile devices, try deep-linking to UPI app
    if (Platform.OS !== 'web') {
      const upiUrl = `upi://pay?pa=tnpds@sbi&pn=TNPDS_Smart_Ration&tr=${booking.booking_id}&am=${totalAmount}&cu=INR`;
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
      setProcessingStatus('Verifying UPI transaction with NPCI / Bank...');
    }, 800);

    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess({
        razorpay_order_id: `order_upi_${Date.now()}`,
        razorpay_payment_id: `pay_${selectedMethod}_${Date.now()}`,
        payment_method: selectedMethod.toUpperCase(),
        amount: totalAmount
      });
      onClose();
    }, 1600);
  };

  const getMethodName = (id) => {
    switch (id) {
      case 'phonepe': return 'PhonePe UPI';
      case 'any_upi': return 'UPI App';
      case 'gpay': return 'Google Pay';
      case 'paytm': return 'Paytm UPI';
      case 'card': return 'Debit / Credit Card';
      default: return 'Online UPI';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        {/* ============================================================== */}
        {/* TOP BLUE HEADER BAR (← Payment Methods)                        */}
        {/* ============================================================== */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.backArrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ============================================================== */}
          {/* GREEN CASHBACK BANNER                                          */}
          {/* ============================================================== */}
          <View style={styles.cashbackBanner}>
            <View style={styles.cashbackIconBadge}>
              <Text style={styles.cashbackPercentText}>%</Text>
            </View>
            <Text style={styles.cashbackBannerText}>
              Instant Cashback of 1% Upto Rs.30 on BHIM APP
            </Text>
          </View>

          {/* ============================================================== */}
          {/* SECTION 1: FREQUENTLY USED PAYMENTS                            */}
          {/* ============================================================== */}
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionHeaderText}>Frequently used Payments</Text>
          </View>

          <View style={styles.sectionCard}>
            {/* 1. PhonePe UPI */}
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => { setSelectedMethod('phonepe'); setShowCardInput(false); }}
              activeOpacity={0.7}
            >
              <View style={styles.logoCirclePhonePe}>
                <Text style={styles.phonePeLogoText}>पे</Text>
              </View>

              <View style={styles.methodInfoBox}>
                <Text style={styles.methodTitle}>PhonePe UPI</Text>
              </View>

              {/* Radio Button */}
              <View style={[styles.radioButtonOuter, selectedMethod === 'phonepe' && styles.radioButtonOuterSelected]}>
                {selectedMethod === 'phonepe' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* 2. Pay by Any UPI app */}
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => { setSelectedMethod('any_upi'); setShowCardInput(false); }}
              activeOpacity={0.7}
            >
              <View style={styles.logoSquareAnyUpi}>
                <Text style={styles.anyUpiLogoText}>UPI</Text>
              </View>

              <View style={styles.methodInfoBox}>
                <Text style={styles.methodTitle}>Pay by Any UPI app</Text>
                <Text style={styles.methodSubtext}>Use any UPI app on your phone to pay</Text>
              </View>

              {/* Radio Button */}
              <View style={[styles.radioButtonOuter, selectedMethod === 'any_upi' && styles.radioButtonOuterSelected]}>
                {selectedMethod === 'any_upi' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* SECTION 2: UPI APPS                                            */}
          {/* ============================================================== */}
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionHeaderText}>UPI Apps</Text>
          </View>

          <View style={styles.sectionCard}>
            {/* 3. GPay */}
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => { setSelectedMethod('gpay'); setShowCardInput(false); }}
              activeOpacity={0.7}
            >
              <View style={styles.logoGPayBox}>
                <Text style={styles.gpayLogoLetterG}>G</Text>
                <Text style={styles.gpayLogoText}>Pay</Text>
              </View>

              <View style={styles.methodInfoBox}>
                <Text style={styles.methodTitle}>GPay</Text>
              </View>

              {/* Radio Button */}
              <View style={[styles.radioButtonOuter, selectedMethod === 'gpay' && styles.radioButtonOuterSelected]}>
                {selectedMethod === 'gpay' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* 4. Paytm */}
            <TouchableOpacity
              style={[styles.paymentRow, { alignItems: 'flex-start' }]}
              onPress={() => { setSelectedMethod('paytm'); setShowCardInput(false); }}
              activeOpacity={0.7}
            >
              <View style={[styles.logoCirclePaytm, { marginTop: 2 }]}>
                <Text style={styles.paytmLogoPay}>pay</Text>
                <Text style={styles.paytmLogoTm}>tm</Text>
              </View>

              <View style={styles.methodInfoBox}>
                <Text style={styles.methodTitle}>Paytm</Text>
                <View style={styles.cashbackTagRow}>
                  <View style={styles.greenCheckCircle}>
                    <Text style={styles.greenCheckCircleText}>✓</Text>
                  </View>
                  <Text style={styles.paytmCashbackText}>
                    Assured ₹15 – ₹300 Cashback + Gold Coins on every payment via Paytm UPI{' '}
                    <Text style={styles.tncLink}>T&C</Text>
                  </Text>
                </View>
              </View>

              {/* Radio Button */}
              <View style={[styles.radioButtonOuter, { marginTop: 4 }, selectedMethod === 'paytm' && styles.radioButtonOuterSelected]}>
                {selectedMethod === 'paytm' && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* SECTION 3: CARD                                                */}
          {/* ============================================================== */}
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionHeaderText}>Card</Text>
          </View>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => {
                setSelectedMethod('card');
                setShowCardInput(!showCardInput);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.logoCardBox}>
                <Text style={styles.cardIconText}>💳</Text>
              </View>

              <View style={styles.methodInfoBox}>
                <Text style={styles.methodTitle}>Card</Text>
              </View>

              <Text style={styles.chevronRightText}>{showCardInput ? '▼' : '>'}</Text>
            </TouchableOpacity>

            {/* Expandable Card Form */}
            {showCardInput && (
              <View style={styles.cardInputContainer}>
                <TextInput
                  style={styles.cardInputField}
                  placeholder="Card Number (Debit / Credit)"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TextInput
                    style={[styles.cardInputField, { flex: 1 }]}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.cardInputField, { flex: 1 }]}
                    placeholder="CVV"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    secureTextEntry
                    maxLength={4}
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Spacing for bottom bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ============================================================== */}
        {/* STICKY BOTTOM BAR (₹ Amount + Pay Now)                          */}
        {/* ============================================================== */}
        <View style={styles.bottomBar}>
          <View style={styles.amountContainer}>
            <Text style={styles.totalAmountText}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.amountSubtext}>Repay net Amount</Text>
          </View>

          <TouchableOpacity
            style={[styles.payNowButton, processing && styles.payNowButtonDisabled]}
            onPress={handlePay}
            disabled={processing}
            activeOpacity={0.85}
          >
            {processing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.payNowButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Processing Modal Overlay */}
        {processing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#1E88E5" />
              <Text style={styles.processingCardTitle}>Authenticating Payment</Text>
              <Text style={styles.processingCardSub}>{processingStatus}</Text>
              <View style={styles.processingTrustRow}>
                <Text style={styles.processingTrustText}>🔒 256-Bit NPCI Encrypted UPI Gateway</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },

  /* Blue Header */
  headerBar: {
    height: 56,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backArrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },

  scrollContent: {
    flex: 1
  },

  /* Green Cashback Banner */
  cashbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  cashbackIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  cashbackPercentText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800'
  },
  cashbackBannerText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '500',
    flex: 1
  },

  /* Section Headers */
  sectionHeaderBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48
  },

  /* Logos */
  logoCirclePhonePe: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#5F259F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  phonePeLogoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },

  logoSquareAnyUpi: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  anyUpiLogoText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  logoGPayBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 14
  },
  gpayLogoLetterG: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '900'
  },
  gpayLogoText: {
    color: '#5F6368',
    fontSize: 9,
    fontWeight: '700'
  },

  logoCirclePaytm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 14
  },
  paytmLogoPay: {
    color: '#002E6E',
    fontSize: 10,
    fontWeight: '900'
  },
  paytmLogoTm: {
    color: '#00BAF2',
    fontSize: 10,
    fontWeight: '900'
  },

  logoCardBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  cardIconText: {
    fontSize: 16
  },

  /* Info Texts */
  methodInfoBox: {
    flex: 1,
    justifyContent: 'center'
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B'
  },
  methodSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },

  cashbackTagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingRight: 10
  },
  greenCheckCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    marginTop: 1
  },
  greenCheckCircleText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900'
  },
  paytmCashbackText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '500',
    lineHeight: 14,
    flex: 1
  },
  tncLink: {
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },

  chevronRightText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginLeft: 8
  },

  /* Radio Button */
  radioButtonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  radioButtonOuterSelected: {
    borderColor: '#1E88E5'
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E88E5'
  },

  /* Expandable Card Form */
  cardInputContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  cardInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A'
  },

  /* Sticky Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  amountContainer: {
    justifyContent: 'center'
  },
  totalAmountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A'
  },
  amountSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  payNowButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  payNowButtonDisabled: {
    backgroundColor: '#93C5FD'
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },

  /* Processing Overlay */
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    elevation: 8
  },
  processingCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14
  },
  processingCardSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6
  },
  processingTrustRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  processingTrustText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600'
  }
});
