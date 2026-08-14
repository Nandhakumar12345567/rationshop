import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { translations } from '../../i18n/strings';
import { api, setAuthToken } from '../../api/client';

export default function LoginScreen({ lang, onLoginSuccess }) {
  const t = translations[lang];
  const [cardNo, setCardNo] = useState('TN-04-BPL-883921');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('123456');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  const handleLogin = async () => {
    if (!cardNo || !password) {
      alert('Please fill in card number and password');
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>🌾 {t.loginHeader}</Text>
        <Text style={styles.subTitle}>Tamil Nadu Public Distribution System (PDS)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.cardNoLabel}</Text>
          <TextInput
            style={styles.input}
            value={cardNo}
            onChangeText={setCardNo}
            placeholder={t.cardNoPlaceholder}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.passwordLabel}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t.passwordPlaceholder}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.loginBtnText}>{t.loginBtn} →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.otpBtn} onPress={handleSendOtp} disabled={loading}>
          <Text style={styles.otpBtnText}>📱 {t.otpFallbackBtn}</Text>
        </TouchableOpacity>

        {/* Demo Quick Presets */}
        <View style={styles.presetSection}>
          <Text style={styles.presetTitle}>Quick Demo Accounts:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetBadge} onPress={() => setPreset('TN-04-BPL-883921', 'password123')}>
              <Text style={styles.presetBadgeText}>BPL Beneficiary</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.presetBadge} onPress={() => setPreset('TN-04-AAY-109283', 'password123')}>
              <Text style={styles.presetBadgeText}>Antyodaya (AAY)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.presetBadge} onPress={() => setPreset('SHOP-STAFF-001', 'password123')}>
              <Text style={styles.presetBadgeText}>Shopkeeper Staff</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* OTP Fallback Modal */}
      <Modal visible={otpModalOpen} transparent animationType="fade" onRequestClose={() => setOtpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📲 {t.enterOtpHeader}</Text>
            <Text style={styles.modalMsg}>{otpSentMsg || 'Enter 6-digit OTP code sent to your phone'}</Text>
            <Text style={styles.debugHint}>(Test Mock OTP: 123456)</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10
  },
  loginBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15
  },
  otpBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  otpBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  presetSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  presetTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  presetBadge: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  presetBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  modalMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8
  },
  debugHint: {
    fontSize: 11,
    color: colors.gold,
    marginBottom: 12
  },
  otpInput: {
    backgroundColor: colors.bgDark,
    width: 180,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  verifyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  },
  closeBtn: {
    paddingVertical: 6
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 12
  }
});
