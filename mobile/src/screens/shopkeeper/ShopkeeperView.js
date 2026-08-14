import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import BiometricModal from '../../components/BiometricModal';

export default function ShopkeeperView({ lang }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedBooking, setScannedBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState('');

  const handleScanOrSubmitToken = async (sampleTokenStr) => {
    const tokenToUse = sampleTokenStr || tokenInput.trim();
    if (!tokenToUse) {
      alert('Please enter or scan a valid QR token payload');
      return;
    }

    setLoading(true);
    setScannedBooking(null);
    setCustomer(null);
    setBiometricVerified(false);
    setIssueSuccessMsg('');

    try {
      const res = await api.scanQR(tokenToUse);
      if (res.success) {
        setScannedBooking(res.booking);
        setCustomer(res.customer);
      }
    } catch (err) {
      alert(err.message || 'Invalid or used QR token');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteIssue = async () => {
    if (!scannedBooking) return;
    if (!biometricVerified) {
      alert('Fingerprint biometric verification is REQUIRED before issuing items!');
      return;
    }

    setIssuing(true);
    try {
      const res = await api.completeIssue(scannedBooking.booking_id, 'FPS-TN-0401', true);
      if (res.success) {
        setIssueSuccessMsg(`Ration items successfully issued to ${customer.holder_name}! Stock auto-deducted.`);
        setScannedBooking(null);
        setCustomer(null);
        setBiometricVerified(false);
        setTokenInput('');
      }
    } catch (err) {
      alert('Issue failure: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Terminal Header */}
      <View style={styles.terminalHeader}>
        <Text style={styles.terminalTitle}>🏪 Fair Price Shop Terminal (#401)</Text>
        <Text style={styles.terminalSubtitle}>Staff: Velu (Shop Manager) | GNC Road, T. Nagar</Text>
      </View>

      {/* QR Scanner Simulator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 Scan Customer QR Token Code</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Scan camera or paste token payload string..."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={() => handleScanOrSubmitToken()}>
            <Text style={styles.scanBtnText}>Verify QR 🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Quick Test Button */}
        <TouchableOpacity 
          style={styles.demoTokenBtn}
          onPress={async () => {
            // Auto fetch latest booking token to simulate camera scan instantly
            try {
              const res = await api.getMyBookings();
              if (res.bookings && res.bookings.length > 0) {
                const latest = res.bookings[0];
                setTokenInput(latest.qr_token);
                handleScanOrSubmitToken(latest.qr_token);
              } else {
                alert('No sample bookings exist. Please create a booking in Customer View first!');
              }
            } catch (e) {
              alert('Error fetching sample booking token');
            }
          }}
        >
          <Text style={styles.demoTokenText}>⚡ Quick Test: Auto-Fill Latest Booking QR Token</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Decrypting QR Token & Fetching Beneficiary Profile...</Text>
        </View>
      )}

      {issueSuccessMsg !== '' && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>🎉 Issue Completed!</Text>
          <Text style={styles.successBody}>{issueSuccessMsg}</Text>
        </View>
      )}

      {/* Customer & Booking Details Preview */}
      {scannedBooking && customer && (
        <View style={styles.verificationCard}>
          <Text style={styles.verifiedHeader}>👤 Beneficiary Details Decoded</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Holder Name:</Text>
            <Text style={styles.infoValue}>{customer.holder_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Card Number:</Text>
            <Text style={styles.infoValue}>{customer.card_no}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Card Category:</Text>
            <Text style={[styles.infoValue, { color: colors.gold, fontWeight: 'bold' }]}>{customer.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booked Slot:</Text>
            <Text style={styles.infoValue}>{scannedBooking.slot_time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status:</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>{scannedBooking.payment_status}</Text>
          </View>

          <Text style={styles.itemsTitle}>Package Items to Issue:</Text>
          {scannedBooking.items.map((it, idx) => (
            <View key={idx} style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>
                📦 {it.name}: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{it.quantity} {it.unit}</Text>
              </Text>
            </View>
          ))}

          {/* Biometric Verification Step */}
          <View style={styles.biometricStep}>
            <Text style={styles.biometricStepTitle}>Step 2: Biometric Fingerprint Check</Text>
            
            {biometricVerified ? (
              <View style={styles.bioPassedPill}>
                <Text style={styles.bioPassedText}>✅ Fingerprint Match Score: 98.4% (VERIFIED)</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.triggerBioBtn}
                onPress={() => setBiometricModalOpen(true)}
              >
                <Text style={styles.triggerBioText}>👆 Start Fingerprint Scan Verification</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Issue Button */}
          <TouchableOpacity 
            style={[
              styles.issueBtn,
              (!biometricVerified || issuing) && styles.btnDisabled
            ]}
            onPress={handleCompleteIssue}
            disabled={!biometricVerified || issuing}
          >
            <Text style={styles.issueBtnText}>
              {issuing ? 'Deducting Stock & Locking Token...' : '✅ Complete Issue & Update Stock'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Biometric Scanner Modal */}
      <BiometricModal
        visible={biometricModalOpen}
        cardNo={customer?.card_no}
        onClose={() => setBiometricModalOpen(false)}
        onVerified={() => setBiometricVerified(true)}
        lang={lang}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    padding: 16
  },
  terminalHeader: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  terminalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  terminalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  section: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 13
  },
  scanBtn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8
  },
  scanBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13
  },
  demoTokenBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold
  },
  demoTokenText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: 'bold'
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    color: colors.primary,
    marginTop: 10,
    fontSize: 13
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  successTitle: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16
  },
  successBody: {
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 4
  },
  verificationCard: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary
  },
  verifiedHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13
  },
  infoValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.gold,
    marginTop: 14,
    marginBottom: 8
  },
  itemBadge: {
    backgroundColor: colors.bgDark,
    padding: 8,
    borderRadius: 6,
    marginBottom: 6
  },
  itemBadgeText: {
    color: colors.textPrimary,
    fontSize: 13
  },
  biometricStep: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  biometricStepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10
  },
  triggerBioBtn: {
    backgroundColor: colors.goldDark,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  triggerBioText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13
  },
  bioPassedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center'
  },
  bioPassedText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13
  },
  issueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  btnDisabled: {
    opacity: 0.5
  },
  issueBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15
  }
});
