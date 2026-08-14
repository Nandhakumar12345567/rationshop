import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { translations } from '../i18n/strings';

export default function BiometricModal({ visible, onClose, cardNo, onVerified, lang = 'en' }) {
  const t = translations[lang];
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (simulateFail = false) => {
    setScanning(true);
    setResult(null);

    setTimeout(() => {
      setScanning(false);
      if (simulateFail) {
        setResult({
          success: false,
          score: 41.2,
          message: 'Fingerprint match score (41.2%) below required threshold (75.0%).'
        });
      } else {
        const score = parseFloat((95.0 + Math.random() * 4.5).toFixed(2));
        setResult({
          success: true,
          score,
          message: 'Biometric verification match successful! Identity authenticated.'
        });
      }
    }, 1500);
  };

  const handleConfirm = () => {
    if (result && result.success) {
      onVerified();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>👆 {t.biometricHeader}</Text>
          <Text style={styles.subtitle}>Card: {cardNo || 'TN-04-BPL-883921'}</Text>
          <Text style={styles.deviceInfo}>Device: Mantra MFS100 (Aadhaar RD Service Mock)</Text>

          {/* Scanner Visual Container */}
          <View style={[styles.scannerBox, result?.success && styles.successBox, result && !result.success && styles.failBox]}>
            {scanning ? (
              <View style={styles.scanningState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.scanningText}>Scanning Fingerprint Minutiae...</Text>
              </View>
            ) : result ? (
              <View style={styles.resultState}>
                <Text style={styles.resultIcon}>{result.success ? '✅' : '❌'}</Text>
                <Text style={styles.resultScore}>Match Score: {result.score}%</Text>
                <Text style={[styles.resultMsg, result.success ? styles.successText : styles.failText]}>
                  {result.message}
                </Text>
              </View>
            ) : (
              <View style={styles.idleState}>
                <Text style={styles.fingerIcon}>🖐️</Text>
                <Text style={styles.idleText}>{t.placeFingerMsg}</Text>
              </View>
            )}
          </View>

          {/* Simulation Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.scanBtn]} 
              onPress={() => handleScan(false)}
              disabled={scanning}
            >
              <Text style={styles.btnText}>Simulate Valid Match</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.failBtn]} 
              onPress={() => handleScan(true)}
              disabled={scanning}
            >
              <Text style={styles.btnText}>Simulate Mismatch</Text>
            </TouchableOpacity>
          </View>

          {result?.success && (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Proceed to Issue Items →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Close Modal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4
  },
  deviceInfo: {
    fontSize: 11,
    color: colors.gold,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16
  },
  scannerBox: {
    height: 160,
    backgroundColor: colors.bgDark,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 16,
    padding: 12
  },
  successBox: {
    borderColor: colors.success
  },
  failBox: {
    borderColor: colors.danger
  },
  idleState: {
    alignItems: 'center'
  },
  fingerIcon: {
    fontSize: 50,
    marginBottom: 8
  },
  idleText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  scanningState: {
    alignItems: 'center'
  },
  scanningText: {
    color: colors.primary,
    marginTop: 12,
    fontWeight: '600'
  },
  resultState: {
    alignItems: 'center'
  },
  resultIcon: {
    fontSize: 36
  },
  resultScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 4
  },
  resultMsg: {
    fontSize: 12,
    textAlign: 'center'
  },
  successText: {
    color: colors.success
  },
  failText: {
    color: colors.danger
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  scanBtn: {
    backgroundColor: colors.primaryDark
  },
  failBtn: {
    backgroundColor: '#7F1D1D'
  },
  btnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  confirmText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 12
  }
});
