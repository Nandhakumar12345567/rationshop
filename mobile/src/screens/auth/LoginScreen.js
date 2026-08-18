import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { translations } from '../../i18n/strings';
import { api, setAuthToken } from '../../api/client';
import Footer from '../../components/Footer';
import GovEmblem from '../../components/GovEmblem';
import AppLogo from '../../components/AppLogo';

export default function LoginScreen({ lang, onLoginSuccess }) {
  const t = translations[lang] || translations.en;
  const [cardNo, setCardNo] = useState('TN-04-BPL-883921');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('123456');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  const handleLogin = async () => {
    if (!cardNo || !password) {
      alert('Please fill in Ration Card Number and Password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(cardNo, password);
      if (res.success) {
        setAuthToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!cardNo) {
      alert('Please enter your Ration Card Number first');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cardNo);
      if (res.success) {
        setOtpSentMsg(res.message);
        setOtpModalOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.verifyOtp(cardNo, otpInput);
      if (res.success) {
        setAuthToken(res.token);
        setOtpModalOpen(false);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      alert(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (card, pass) => {
    setCardNo(card);
    setPassword(pass);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Official Government Top Banner */}
      <View style={styles.topHeader}>
        <GovEmblem size={44} showTitle={false} />
        <View style={styles.topHeaderTitleBox}>
          <Text style={styles.stateHeading}>GOVERNMENT OF TAMIL NADU</Text>
          <Text style={styles.deptHeading}>Civil Supplies & Consumer Protection Department</Text>
          <Text style={styles.portalSub}>Public Distribution System (PDS) Beneficiary Portal</Text>
        </View>
      </View>

      {/* Main Login Card */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderBar}>
          <AppLogo size={32} dark={false} />
          <Text style={styles.cardHeaderTitle}>Sign In to Ration Portal</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.instructionText}>
            Enter your 12-digit Ration Card Number and Password to access subsidised entitlement booking & digital tokens.
          </Text>

          {/* Ration Card Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🪪 {t.cardNoLabel} *</Text>
            <TextInput
              style={styles.input}
              value={cardNo}
              onChangeText={setCardNo}
              placeholder={t.cardNoPlaceholder}
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🔒 {t.passwordLabel} *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t.passwordPlaceholder}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN TO PORTAL →</Text>
            )}
          </TouchableOpacity>

          {/* OTP Fallback */}
          <TouchableOpacity style={styles.otpBtn} onPress={handleSendOtp} disabled={loading}>
            <Text style={styles.otpBtnText}>📱 {t.otpFallbackBtn}</Text>
          </TouchableOpacity>

          {/* Quick Demo Accounts */}
          <View style={styles.presetSection}>
            <Text style={styles.presetTitle}>Official Beneficiary Test Accounts:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity style={[styles.presetBadge, styles.bplBadge]} onPress={() => setPreset('TN-04-BPL-883921', 'password123')}>
                <Text style={styles.presetBadgeText}>BPL (PHH) Card</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.presetBadge, styles.aayBadge]} onPress={() => setPreset('TN-04-AAY-109283', 'password123')}>
                <Text style={styles.presetBadgeText}>Antyodaya (AAY)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.presetBadge, styles.staffBadge]} onPress={() => setPreset('SHOP-STAFF-001', 'password123')}>
                <Text style={styles.presetBadgeText}>FPS Shopkeeper</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Disclaimer */}
      <Footer />

      {/* OTP Fallback Modal */}
      <Modal visible={otpModalOpen} transparent animationType="fade" onRequestClose={() => setOtpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📲 {t.enterOtpHeader}</Text>
            </View>
            
            <Text style={styles.modalMsg}>{otpSentMsg || 'Enter 6-digit OTP code sent to registered mobile number'}</Text>
            <Text style={styles.debugHint}>[Official Test Mock OTP: 123456]</Text>

            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp} disabled={loading}>
              <Text style={styles.verifyBtnText}>{t.verifyOtpBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setOtpModalOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9'
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20
  },
  topHeader: {
    width: '100%',
    backgroundColor: '#061E47',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933'
  },
  topHeaderTitleBox: {
    flex: 1
  },
  stateHeading: {
    color: '#FF9933',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  deptHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2
  },
  portalSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2
  },
  cardContainer: {
    width: '92%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeaderBar: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  cardBody: {
    padding: 20
  },
  instructionText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 18
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600'
  },
  loginBtn: {
    backgroundColor: '#0B3D91',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#061E47'
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5
  },
  otpBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  otpBtnText: {
    color: '#0B3D91',
    fontSize: 13,
    fontWeight: '700'
  },
  presetSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  presetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  bplBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0B3D91'
  },
  aayBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF9933'
  },
  staffBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#138808'
  },
  presetBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  modalHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF9933',
    paddingBottom: 6,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B3D91'
  },
  modalMsg: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4
  },
  debugHint: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
    marginBottom: 14
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    width: 180,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0B3D91',
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16
  },
  verifyBtn: {
    backgroundColor: '#FF9933',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  verifyBtnText: {
    color: '#061E47',
    fontWeight: '800',
    fontSize: 14
  },
  closeBtn: {
    paddingVertical: 8
  },
  closeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600'
  }
});
