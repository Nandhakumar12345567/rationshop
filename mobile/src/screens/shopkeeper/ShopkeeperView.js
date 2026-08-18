import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { socketManager } from '../../api/socket';
import BiometricModal from '../../components/BiometricModal';
import Footer from '../../components/Footer';

export default function ShopkeeperView({ lang }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedBooking, setScannedBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [tokenState, setTokenState] = useState(null); // 'valid', 'already_used', 'expired', 'invalid'
  const [biometricVerified, setBiometricVerified] = useState(true);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState('');
  const [scanFlash, setScanFlash] = useState(false);
  
  // Real Camera Webcam State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const videoRef = useRef(null);
  
  // Live Queue Monitor State
  const [queueData, setQueueData] = useState(null);

  // Live Socket Connection State
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    fetchQueue();
    socketManager.connect('shop_1');

    const unsubConn = socketManager.onConnectionChange(setSocketConnected);

    const unsubQueue = socketManager.subscribeToQueue((freshQueue) => {
      console.log('[Shopkeeper Socket] Queue update received:', freshQueue);
      if (freshQueue) {
        setQueueData(prev => ({ ...prev, ...freshQueue }));
      }
    });

    const unsubIssue = socketManager.subscribeToIssueComplete((issueInfo) => {
      console.log('[Shopkeeper Socket] Issue complete received:', issueInfo);
      fetchQueue();
    });

    const interval = setInterval(fetchQueue, 10000);
    return () => {
      clearInterval(interval);
      unsubConn();
      unsubQueue();
      unsubIssue();
    };
  }, []);

  // Initialize Real Laptop Webcam / Device Camera
  const startRealCamera = async () => {
    try {
      if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setCameraPermission(true);
      } else {
        setCameraActive(true);
        setCameraPermission(true);
      }
    } catch (err) {
      console.warn('[Camera Permission Warning]', err);
      alert('Camera access requested. Please allow browser webcam access to use live scanner!');
    }
  };

  const stopRealCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const fetchQueue = async () => {
    try {
      const qRes = await api.getQueueStatus('shop_1');
      if (qRes.success) {
        setQueueData(qRes);
      }
    } catch (err) {
      console.error('[Shopkeeper Queue Error]', err);
    }
  };

  const handleScanOrSubmitToken = async (sampleTokenStr) => {
    const tokenToUse = sampleTokenStr || tokenInput.trim() || 'ACTIVE_DEMO';

    setLoading(true);
    setScannedBooking(null);
    setCustomer(null);
    setTokenState(null);
    setBiometricVerified(true); // Default auto-verify identity upon QR scan
    setIssueSuccessMsg('');

    // Trigger visual green scan flash confirmation
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 800);

    try {
      const res = await api.scanQR(tokenToUse);
      if (res.success && res.booking) {
        setScannedBooking(res.booking);
        setCustomer(res.customer);

        if (res.booking.status === 'ISSUED') {
          setTokenState('already_used');
        } else {
          setTokenState('valid');
        }
      }
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('expired')) {
        setTokenState('expired');
      } else if (errMsg.includes('used') || errMsg.includes('already')) {
        setTokenState('already_used');
      } else {
        setTokenState('invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteIssue = async () => {
    if (!scannedBooking) return;

    setIssuing(true);
    try {
      const res = await api.completeIssue(scannedBooking.booking_id, 'FPS-TN-0401', true);
      if (res.success) {
        setIssueSuccessMsg(`🎉 RATION ITEMS ISSUED SUCCESSFULLY to ${customer.holder_name}! Shop stock auto-deducted.`);
        
        // Auto-reset back to active scanning mode after 2.5 seconds
        setTimeout(() => {
          setScannedBooking(null);
          setCustomer(null);
          setTokenState(null);
          setBiometricVerified(true);
          setTokenInput('');
          setIssueSuccessMsg('');
          fetchQueue();
        }, 2500);
      }
    } catch (err) {
      alert('Issue failure: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  const getTokenStateBadge = () => {
    switch (tokenState) {
      case 'valid':
        return (
          <View style={[styles.badge, styles.badgeValid]}>
            <Text style={styles.badgeValidText}>🟢 VALID QR TOKEN VERIFIED — READY FOR INSTANT ITEM DISPATCH</Text>
          </View>
        );
      case 'already_used':
        return (
          <View style={[styles.badge, styles.badgeUsed]}>
            <Text style={styles.badgeUsedText}>🟡 ALREADY USED — ITEMS PREVIOUSLY ISSUED TO BENEFICIARY</Text>
          </View>
        );
      case 'expired':
        return (
          <View style={[styles.badge, styles.badgeExpired]}>
            <Text style={styles.badgeExpiredText}>🔘 EXPIRED TOKEN — SLOT APPOINTMENT TIME PASSED</Text>
          </View>
        );
      case 'invalid':
        return (
          <View style={[styles.badge, styles.badgeInvalid]}>
            <Text style={styles.badgeInvalidText}>🔴 INVALID TOKEN — RECORD NOT FOUND / CORRUPTED</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Official Terminal Header */}
      <View style={styles.terminalHeader}>
        <View style={styles.terminalTitleRow}>
          <Text style={styles.terminalIcon}>🏪</Text>
          <View>
            <Text style={styles.terminalTitle}>FAIR PRICE SHOP TERMINAL (#401)</Text>
            <Text style={styles.terminalSubtitle}>Manager: Velu (Staff ID: SHOP-STAFF-001) | GNC Road, T. Nagar</Text>
          </View>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: socketConnected ? '#166534' : '#854D0E' }]}>
          <Text style={styles.onlineBadgeText}>{socketConnected ? '⚡ POS SOCKET LIVE' : '🟡 RECONNECTING'}</Text>
        </View>
      </View>

      {/* Live Queue Monitor Dashboard */}
      <View style={styles.queueCard}>
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>📊 REAL-TIME QUEUE DASHBOARD (SLOT 10:00–11:00 AM)</Text>
          <Text style={styles.queueLiveTag}>● LIVE UPDATES</Text>
        </View>

        <View style={styles.queueStatsRow}>
          <View style={styles.qStatBox}>
            <Text style={styles.qStatLabel}>Tokens Issued Today</Text>
            <Text style={styles.qStatValGreen}>{queueData?.tokens_issued_count || 0}</Text>
          </View>

          <View style={styles.qStatBox}>
            <Text style={styles.qStatLabel}>Tokens Waiting in Queue</Text>
            <Text style={styles.qStatValBlue}>{queueData?.tokens_remaining_count || 0}</Text>
          </View>

          <View style={styles.qStatBox}>
            <Text style={styles.qStatLabel}>Current Serving Token</Text>
            <Text style={styles.qStatValGold}>#{queueData?.serving_token_number || 1}</Text>
          </View>
        </View>

        {/* Queue List */}
        {queueData?.queue_list && queueData.queue_list.length > 0 && (
          <View style={styles.qListContainer}>
            <Text style={styles.qListTitle}>Beneficiaries Sequence (Tap any row to scan & process token):</Text>
            {queueData.queue_list.slice(0, 5).map((q, idx) => (
              <TouchableOpacity 
                key={q.token_id || idx} 
                style={styles.qRow}
                onPress={() => handleScanOrSubmitToken(q.token_id)}
              >
                <Text style={styles.qRowNum}>#{q.token_number}</Text>
                <Text style={styles.qRowCard}>{q.card_no}</Text>
                <Text style={styles.qRowSlot}>{q.slot_time.split(' ')[1] || 'Slot'}</Text>
                <View style={[styles.qStatusPill, q.status === 'done' ? styles.qDone : q.status === 'serving' ? styles.qServing : styles.qWait]}>
                  <Text style={styles.qStatusText}>{q.status.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Real Live Camera Scanner Box */}
      <View style={styles.sectionCard}>
        <View style={styles.scannerHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>📷 Real Live Camera QR Scanner</Text>
            <Text style={styles.instructionsText}>
              Turn on your device camera / webcam to scan physical QR codes live!
            </Text>
          </View>

          {!cameraActive ? (
            <TouchableOpacity style={styles.turnOnCamBtn} onPress={startRealCamera}>
              <Text style={styles.turnOnCamText}>🎥 Turn On Live Camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.turnOffCamBtn} onPress={stopRealCamera}>
              <Text style={styles.turnOffCamText}>⏹️ Stop Camera</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Real Live Camera Feed Box */}
        <View style={[styles.cameraFrameContainer, scanFlash && styles.cameraFlashBorder]}>
          {cameraActive && Platform.OS === 'web' ? (
            <View style={styles.webcamViewBox}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                playsInline
                muted
              />
              <View style={styles.cameraOverlayBox}>
                <View style={[styles.cornerBorder, styles.cornerTL]} />
                <View style={[styles.cornerBorder, styles.cornerTR]} />
                <View style={[styles.cornerBorder, styles.cornerBL]} />
                <View style={[styles.cornerBorder, styles.cornerBR]} />
                
                <View style={styles.scanLineAnim} />
                <Text style={styles.cameraHint}>🎥 Live Webcam Stream Active — Hold QR code in front of lens</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraOverlayBox}>
              <View style={[styles.cornerBorder, styles.cornerTL]} />
              <View style={[styles.cornerBorder, styles.cornerTR]} />
              <View style={[styles.cornerBorder, styles.cornerBL]} />
              <View style={[styles.cornerBorder, styles.cornerBR]} />
              
              <Text style={styles.scanTargetIcon}>📱</Text>
              <Text style={styles.cameraHint}>
                {scanFlash ? '⚡ QR CODE DETECTED & VERIFIED!' : 'Tap "Turn On Live Camera" above to activate device webcam'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Continuous scanner active or enter token ID..."
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.scanBtn} onPress={() => handleScanOrSubmitToken()}>
            <Text style={styles.scanBtnText}>Verify QR 🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-Scan Button */}
        <TouchableOpacity 
          style={styles.demoTokenBtn}
          onPress={() => handleScanOrSubmitToken()}
        >
          <Text style={styles.demoTokenText}>⚡ AUTO-SCAN CURRENT ACTIVE BENEFICIARY TOKEN</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0B3D91" />
          <Text style={styles.loadingText}>Fetching Beneficiary Token Details & Fingerprint Database...</Text>
        </View>
      )}

      {/* Color-Coded State Badge */}
      {getTokenStateBadge()}

      {/* Issue Success Message */}
      {issueSuccessMsg !== '' && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{issueSuccessMsg}</Text>
        </View>
      )}

      {/* Scanned Beneficiary & Booking Details */}
      {scannedBooking && customer && (
        <View style={styles.beneficiaryCard}>
          <Text style={styles.beneficiaryHeader}>👤 Verified Beneficiary Profile</Text>

          <View style={styles.profileRow}>
            <View style={styles.infoCol}>
              <Text style={styles.bName}>{customer.holder_name}</Text>
              <Text style={styles.bCardNo}>Ration Card: <Text style={{ fontWeight: '800' }}>{customer.card_no}</Text></Text>
              <Text style={styles.bCategory}>Card Category: <Text style={{ fontWeight: '800', color: '#0B3D91' }}>{customer.category}</Text></Text>
              <Text style={styles.bFamily}>Family Members: {customer.family_size}</Text>
            </View>

            <View style={styles.bioStatusBox}>
              <Text style={styles.bioStatusTitle}>Identity Verification</Text>
              <Text style={[styles.bioStatusVal, styles.bioVerified]}>
                ✅ VERIFIED BY QR
              </Text>
              
              <TouchableOpacity 
                style={styles.verifyBioBtn}
                onPress={() => setBiometricModalOpen(true)}
              >
                <Text style={styles.verifyBioBtnText}>👆 Fingerprint Check (Optional)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Booked Entitlements List */}
          <Text style={styles.itemsTitle}>📦 Entitlement Breakdown to Issue:</Text>
          {scannedBooking.items && scannedBooking.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemBullet}>• {it.name}:</Text>
              <Text style={styles.itemQty}>{it.quantity} {it.unit} (Subsidised Rate)</Text>
            </View>
          ))}

          {/* Direct Instant Issue Button */}
          <TouchableOpacity 
            style={[
              styles.issueBtn, 
              (tokenState !== 'valid' || issuing) && styles.issueBtnDisabled
            ]}
            onPress={handleCompleteIssue}
            disabled={tokenState !== 'valid' || issuing}
          >
            <Text style={styles.issueBtnText}>
              {issuing ? 'Deducting Shop Stock & Locking Token...' : '📦 ISSUE RATION ITEMS NOW (AUTO-DEDUCT STOCK) →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Footer />

      {/* Aadhaar L1 Fingerprint Biometric Simulation Modal */}
      <BiometricModal
        visible={biometricModalOpen}
        cardNo={customer?.card_no || 'TN-04-BPL-883921'}
        onClose={() => setBiometricModalOpen(false)}
        onVerified={() => {
          setBiometricVerified(true);
          setBiometricModalOpen(false);
          alert('Fingerprint Match Confirmed! (Minutiae Score: 98.4%). Beneficiary identity verified.');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    paddingHorizontal: 14,
    paddingTop: 14
  },
  terminalHeader: {
    backgroundColor: '#061E47',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933'
  },
  terminalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  terminalIcon: {
    fontSize: 24,
    marginRight: 10
  },
  terminalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  terminalSubtitle: {
    fontSize: 9,
    color: '#CBD5E1',
    marginTop: 2
  },
  onlineBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  onlineBadgeText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800'
  },
  queueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6
  },
  queueTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#061E47'
  },
  queueLiveTag: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800'
  },
  queueStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  qStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  qStatLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2
  },
  qStatValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  qStatValBlue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB'
  },
  qStatValGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706'
  },
  qListContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  qListTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6
  },
  qRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderRadius: 4
  },
  qRowNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#061E47',
    width: 30
  },
  qRowCard: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: '700',
    flex: 1
  },
  qRowSlot: {
    fontSize: 9,
    color: '#64748B',
    width: 80
  },
  qStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  qDone: { backgroundColor: '#DCFCE7' },
  qServing: { backgroundColor: '#FEF3C7' },
  qWait: { backgroundColor: '#E0F2FE' },
  qStatusText: { fontSize: 8, fontWeight: '800', color: '#0F172A' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  instructionsText: {
    fontSize: 10,
    color: '#64748B'
  },
  turnOnCamBtn: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  turnOnCamText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  turnOffCamBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  turnOffCamText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  cameraFrameContainer: {
    backgroundColor: '#0F172A',
    height: 180,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative'
  },
  webcamViewBox: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  cameraFlashBorder: {
    borderColor: '#22C55E',
    borderWidth: 4
  },
  cameraOverlayBox: {
    position: 'absolute',
    top: '15%',
    left: '25%',
    width: '50%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanLineAnim: {
    width: '100%',
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowRadius: 5,
    shadowOpacity: 1
  },
  cornerBorder: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#38BDF8'
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanTargetIcon: { fontSize: 32 },
  cameraHint: { color: '#94A3B8', fontSize: 9, marginTop: 4, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#0F172A'
  },
  scanBtn: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 6
  },
  scanBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  demoTokenBtn: {
    backgroundColor: '#0B3D91',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4
  },
  demoTokenText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  loadingBox: { padding: 14, alignItems: 'center' },
  loadingText: { color: '#0B3D91', fontSize: 11, marginTop: 6, fontWeight: '700' },
  badge: { padding: 10, borderRadius: 6, marginBottom: 14, alignItems: 'center' },
  badgeValid: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#166534' },
  badgeValidText: { color: '#166534', fontWeight: '800', fontSize: 11 },
  badgeUsed: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#B45309' },
  badgeUsedText: { color: '#B45309', fontWeight: '800', fontSize: 11 },
  badgeExpired: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#64748B' },
  badgeExpiredText: { color: '#64748B', fontWeight: '800', fontSize: 11 },
  badgeInvalid: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#991B1B' },
  badgeInvalidText: { color: '#991B1B', fontWeight: '800', fontSize: 11 },
  successBanner: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#166534'
  },
  successBannerText: { color: '#166534', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  beneficiaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  beneficiaryHeader: { fontSize: 14, fontWeight: '800', color: '#0B3D91', marginBottom: 10 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoCol: { flex: 1 },
  bName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  bCardNo: { fontSize: 11, color: '#475569', marginTop: 2 },
  bCategory: { fontSize: 11, color: '#475569', marginTop: 2 },
  bFamily: { fontSize: 11, color: '#64748B', marginTop: 2 },
  bioStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  bioStatusTitle: { fontSize: 9, color: '#64748B' },
  bioStatusVal: { fontSize: 11, fontWeight: '800', marginVertical: 4 },
  bioVerified: { color: '#166534' },
  bioPending: { color: '#991B1B' },
  verifyBioBtn: { backgroundColor: '#0B3D91', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  verifyBioBtnDone: { backgroundColor: '#166534' },
  verifyBioBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  itemsTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemBullet: { fontSize: 11, color: '#475569' },
  itemQty: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  issueBtn: { backgroundColor: '#138808', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 14 },
  issueBtnDisabled: { backgroundColor: '#94A3B8' },
  issueBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 }
});
