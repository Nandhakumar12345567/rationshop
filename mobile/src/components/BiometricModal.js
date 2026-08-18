import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { translations } from '../i18n/strings';

export default function BiometricModal({ visible, onClose, cardNo, onVerified, lang = 'en' }) {
  const t = translations[lang] || translations.en;
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
          message: 'Fingerprint minutiae match score (41.2%) below UIDAI threshold (75.0%). Verification Failed.'
        });
      } else {
        const score = parseFloat((95.0 + Math.random() * 4.5).toFixed(2));
        setResult({
          success: true,
          score,
          message: 'Fingerprint match score (98.4%) passed UIDAI RD Service check. Beneficiary identity verified.'
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
          {/* Official Aadhaar RD Service Header */}
          <View style={styles.headerBar}>
            <Text style={styles.sealEmblem}>🛡️ AADHAAR BIOMETRIC RD SERVICE</Text>
            <Text style={styles.title}>{t.biometricHeader || 'Biometric Fingerprint Match'}</Text>
            <Text style={styles.deviceInfo}>Mantra MFS100 Optical Fingerprint Scanner (STQC Certified)</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.cardRefBox}>
              <Text style={styles.cardRefText}>Beneficiary Ration Card: <Text style={styles.cardRefBold}>{cardNo || 'TN-04-BPL-883921'}</Text></Text>
            </View>

            {/* Scanner Visual Box */}
            <View style={[styles.scannerBox, result?.success && styles.successBox, result && !result.success && styles.failBox]}>
              {scanning ? (
                <View style={styles.scanningState}>
                  <ActivityIndicator size="large" color="#0B3D91" />
                  <Text style={styles.scanningText}>Extracting Fingerprint Minutiae & Verifying PID Data...</Text>
                </View>
              ) : result ? (
                <View style={styles.resultState}>
                  <Text style={styles.resultIcon}>{result.success ? '✅' : '❌'}</Text>
                  <Text style={[styles.resultScore, result.success ? styles.successScore : styles.failScore]}>
                    Match Score: {result.score}%
                  </Text>
                  <Text style={[styles.resultMsg, result.success ? styles.successText : styles.failText]}>
                    {result.message}
                  </Text>
                </View>
              ) : (
                <View style={styles.idleState}>
                  <Text style={styles.fingerIcon}>👆</Text>
                  <Text style={styles.idleText}>{t.placeFingerMsg}</Text>
                  <Text style={styles.idleSubText}>Place thumb firmly on the Mantra MFS100 optical glass sensor</Text>
                </View>
              )}
            </View>

            {/* Simulation Controls */}
            <View style={styles.btnRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.scanBtn]} 
                onPress={() => handleScan(false)}
                disabled={scanning}
              >
                <Text style={styles.btnText}>Simulate Match (98.4%)</Text>
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
                <Text style={styles.confirmText}>CONFIRM AUTHENTICATION & ISSUE ITEMS →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel Fingerprint Check</Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 420,
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
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  deviceInfo: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2
  },
  body: {
    padding: 16
  },
  cardRefBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    alignItems: 'center'
  },
  cardRefText: {
    fontSize: 11,
    color: '#64748B'
  },
  cardRefBold: {
    color: '#0B3D91',
    fontWeight: '800'
  },
  scannerBox: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginBottom: 14,
    padding: 12
  },
  successBox: {
    borderColor: '#138808',
    backgroundColor: '#F0FDF4'
  },
  failBox: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2'
  },
  idleState: {
    alignItems: 'center'
  },
  fingerIcon: {
    fontSize: 48,
    marginBottom: 4
  },
  idleText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700'
  },
  idleSubText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center'
  },
  scanningState: {
    alignItems: 'center'
  },
  scanningText: {
    color: '#0B3D91',
    marginTop: 10,
    fontWeight: '700',
    fontSize: 12
  },
  resultState: {
    alignItems: 'center'
  },
  resultIcon: {
    fontSize: 32
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2
  },
  successScore: {
    color: '#138808'
  },
  failScore: {
    color: '#DC2626'
  },
  resultMsg: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600'
  },
  successText: {
    color: '#138808'
  },
  failText: {
    color: '#DC2626'
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  scanBtn: {
    backgroundColor: '#0B3D91'
  },
  failBtn: {
    backgroundColor: '#991B1B'
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11
  },
  confirmBtn: {
    backgroundColor: '#138808',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6
  },
  cancelText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600'
  }
});
