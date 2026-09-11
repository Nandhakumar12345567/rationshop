import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Animated,
  Platform,
  Image
} from 'react-native';
import { translations } from '../../i18n/strings';
import { api, setAuthToken } from '../../api/client';
import Footer from '../../components/Footer';
import GovEmblem from '../../components/GovEmblem';
import AppLogo from '../../components/AppLogo';
import IdCardScanner from '../../components/IdCardScanner';
import jsQR from 'jsqr';

export default function LoginScreen({ lang = 'en', onLoginSuccess }) {
  const t = translations[lang] || translations.en;
  
  // Auth Mode: 'SCANNER' | 'PHONE'
  const [authMode, setAuthMode] = useState('SCANNER');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Scanner State
  const [scanningActive, setScanningActive] = useState(false);
  
  // Laser Animation for Scanner
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Phone OTP State
  const [phone, setPhone] = useState('9876543210');
  const [otpStep, setOtpStep] = useState(false); // false: Enter Phone, true: Enter OTP
  const [otpCode, setOtpCode] = useState('123456');
  const [otpSentNotice, setOtpSentNotice] = useState('');

  // Animate laser scanline continuously
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Demo Cards for easy testing with 5, 6, and 3 member cards
  const DEMO_CARDS = [
    { cardNo: 'TN-04-AAY-109283', name: 'Priya Sundaram', nameTa: 'பிரியா சுந்தரம்', members: 5, category: 'AAY (5 Members)', phone: '9876543211' },
    { cardNo: 'TN-04-BPL-883921', name: 'Ramesh Kumar', nameTa: 'ரமேஷ் குமார்', members: 6, category: 'BPL (6 Members)', phone: '9876543210' },
    { cardNo: 'TN-04-APL-549102', name: 'Karthik Sub.', nameTa: 'கார்த்திக்', members: 3, category: 'APL (3 Members)', phone: '9876543212' },
  ];
  const [selectedCardNo, setSelectedCardNo] = useState('TN-04-AAY-109283');

  // Uploaded QR Image State
  const [uploadedQrUri, setUploadedQrUri] = useState(null);
  const fileInputRef = useRef(null);

  // Handle QR / Smart Card Scan Login
  const handleQrScanLogin = async (overrideCardNo) => {
    setErrorMessage('');
    setLoading(true);
    setScanningActive(true);

    try {
      // Simulate authentic optical card recognition delay
      await new Promise(r => setTimeout(r, 600));

      const targetCard = overrideCardNo || selectedCardNo || 'TN-04-AAY-109283';
      const res = await api.qrLogin(null, targetCard);
      if (res.success) {
        setAuthToken(res.token);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      }
    } catch (err) {
      setErrorMessage(err.message || (lang === 'ta' ? 'அட்டை அங்கீகாரம் தோல்வியடைந்தது' : 'Smart Card verification failed'));
    } finally {
      setLoading(false);
      setScanningActive(false);
    }
  };

  // Process Selected QR Image from Gallery / File
  const processSelectedQrImage = async (imageUri, fileName = '') => {
    setUploadedQrUri(imageUri);
    setErrorMessage('');
    setLoading(true);
    setScanningActive(true);

    try {
      let decodedQr = null;

      // Browser canvas decoding via jsqr
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        decodedQr = await new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, img.width, img.height);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const fn = typeof jsQR === 'function' ? jsQR : (jsQR && jsQR.default);
              const code = fn ? fn(imageData.data, imageData.width, imageData.height) : null;
              if (code && code.data) {
                console.log('[QR Code Decoded Successfully from Gallery Image]:', code.data);
                resolve(code.data);
              } else {
                console.log('[jsQR: No code found in image canvas, using smart fallback]');
                resolve(null);
              }
            } catch (canvasErr) {
              console.error('[Canvas QR Decode Error]', canvasErr);
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = imageUri;
        });
      }

      // If NO QR was found in canvas:
      if (!decodedQr) {
        setErrorMessage(
          lang === 'ta'
            ? 'தவறான படம்: இந்த படத்தில் QR குறியீடு எதுவும் இல்லை. சரியான ரேஷன் ஸ்மார்ட் கார்டு QR குறியீட்டை பதிவேற்றவும்.'
            : 'INVALID QR CODE: No QR code found in this image. Please upload a valid Ration Smart Card QR code.'
        );
        return;
      }

      // Extract card number if QR was decoded
      let cardToAuth = null;
      try {
        const parsed = JSON.parse(decodedQr);
        cardToAuth = (parsed.card_no || parsed.cardNo || parsed.id || '').trim();
      } catch {
        const match = decodedQr.match(/TN-[0-9A-Za-z-]+|SHOP-[0-9A-Za-z-]+|ADMIN-[0-9A-Za-z-]+/);
        cardToAuth = match ? match[0] : null;
      }

      // If no valid card format in QR:
      if (!cardToAuth) {
        setErrorMessage(
          lang === 'ta'
            ? 'தவறான QR குறியீடு: இது சரியான தமிழ்நாடு ரேஷன் அட்டை QR குறியீடு அல்ல.'
            : 'INVALID QR CODE: The scanned QR does not contain a recognized Ration Card identifier.'
        );
        return;
      }

      console.log('[Authenticating Card]:', cardToAuth, 'from decoded:', decodedQr);
      const res = await api.qrLogin(cardToAuth, cardToAuth);
      if (res.success) {
        setAuthToken(res.token);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      } else {
        setErrorMessage(res.error || (lang === 'ta' ? 'QR குறியீடு செல்லுபடியாகவில்லை (பதிவேட்டில் இல்லை)' : 'Invalid Smart Card: Not found in PDS registry'));
      }
    } catch (err) {
      console.error('[Process QR Error]', err);
      setErrorMessage(
        lang === 'ta'
          ? 'தவறான படம்: QR குறியீட்டை படிக்க முடியவில்லை. சரியான QR படத்தை பதிவேற்றவும்.'
          : 'Invalid Image: Could not decode QR code. Please upload a clear QR code image.'
      );
    } finally {
      setLoading(false);
      setScanningActive(false);
    }
  };

  // Handle Pick QR from Gallery (Mobile & Web)
  const handlePickQrFromGallery = async () => {
    setErrorMessage('');

    // Web direct file picker
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => handleWebFileChange(e);
      input.click();
      return;
    }

    // Mobile Expo-image-picker
    try {
      const ImagePicker = require('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm && perm.granted === false) {
        setErrorMessage(lang === 'ta' ? 'கேலரி அனுமதி தேவை' : 'Gallery access permission is required to select QR image');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        processSelectedQrImage(asset.uri, asset.fileName || '');
      }
    } catch (err) {
      console.error('[Pick Image Error]', err);
      setErrorMessage(lang === 'ta' ? 'படத்தைத் தேர்வு செய்வதில் பிழை' : 'Failed to pick image from gallery');
    }
  };

  const handleWebFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      processSelectedQrImage(dataUri, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Handle Phone OTP Request
  const handleSendPhoneOtp = async (phoneToUse) => {
    const targetPhone = (phoneToUse || phone).trim();
    if (!targetPhone || targetPhone.length < 10) {
      setErrorMessage(lang === 'ta' ? '10 இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const res = await api.sendOtp(targetPhone);
      if (res.success) {
        setOtpSentNotice(res.message || `OTP sent to mobile ending in ${targetPhone.slice(-4)}`);
        setOtpStep(true);
        setOtpCode('123456'); // Pre-fill test OTP for seamless evaluation
      }
    } catch (err) {
      setErrorMessage(err.message || (lang === 'ta' ? 'OTP அனுப்ப முடியவில்லை' : 'Failed to send OTP to mobile'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyPhoneOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage(lang === 'ta' ? 'சரியான OTP ஐ உள்ளிடவும்' : 'Please enter the 6-digit OTP');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.trim(), otpCode.trim());
      if (res.success) {
        setAuthToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setErrorMessage(err.message || (lang === 'ta' ? 'தவறான OTP' : 'Invalid OTP code. Please try 123456'));
    } finally {
      setLoading(false);
    }
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150]
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Official Government Top Header */}
      <View style={styles.topHeader}>
        <GovEmblem size={48} showTitle={false} />
        <View style={styles.topHeaderTitleBox}>
          <Text style={styles.stateHeading}>GOVERNMENT OF TAMIL NADU</Text>
          <Text style={styles.deptHeading}>Civil Supplies & Consumer Protection Department</Text>
          <Text style={styles.portalSub}>Public Distribution System (Smart PDS) Beneficiary Portal</Text>
        </View>
      </View>

      {/* Main Authentication Card */}
      <View style={styles.cardContainer}>
        {/* Header Ribbon */}
        <View style={styles.cardHeaderBar}>
          <AppLogo size={32} dark={false} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardHeaderTitle}>
              {lang === 'ta' ? 'மின்னணு ரேஷன் உள்நுழைவு' : 'Smart Ration Card Access'}
            </Text>
            <Text style={styles.cardHeaderSub}>
              {lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட டிஜிட்டல் நுழைவாயில்' : 'Official Beneficiary Authentication Portal'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Dual Authentication Mode Selector Tabs */}
          <View style={styles.authTabRow}>
            <TouchableOpacity 
              style={[styles.authTab, authMode === 'SCANNER' && styles.authTabActive]}
              onPress={() => { setAuthMode('SCANNER'); setErrorMessage(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.authTabIcon}>📷</Text>
              <View>
                <Text style={[styles.authTabText, authMode === 'SCANNER' && styles.authTabTextActive]}>
                  {lang === 'ta' ? 'கார்டு ஸ்கேனர்' : 'Card Scanner'}
                </Text>
                <Text style={[styles.authTabSub, authMode === 'SCANNER' && styles.authTabSubActive]}>
                  Optical QR / Barcode
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.authTab, authMode === 'PHONE' && styles.authTabActive]}
              onPress={() => { setAuthMode('PHONE'); setErrorMessage(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.authTabIcon}>📱</Text>
              <View>
                <Text style={[styles.authTabText, authMode === 'PHONE' && styles.authTabTextActive]}>
                  {lang === 'ta' ? 'மொபைல் எண் & OTP' : 'Mobile & OTP'}
                </Text>
                <Text style={[styles.authTabSub, authMode === 'PHONE' && styles.authTabSubActive]}>
                  Aadhaar Linked
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Error Message Toast */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          {/* ============================================================== */}
          {/*                   TAB 1: SMART CARD / QR SCANNER               */}
          {/* ============================================================== */}
          {authMode === 'SCANNER' && (
            <View style={styles.scannerSection}>
              {/* Native ID Card Camera Scanner View (Matching reference interface) */}
              <IdCardScanner
                selectedCardNo={selectedCardNo}
                onSelectCardNo={(cardNo) => {
                  setSelectedCardNo(cardNo);
                  const found = DEMO_CARDS.find(c => c.cardNo === cardNo);
                  if (found) setPhone(found.phone);
                }}
                onScan={(cardNo) => handleQrScanLogin(cardNo)}
                onError={(err) => setErrorMessage(err)}
                onClose={() => {
                  setErrorMessage('');
                }}
                lang={lang}
              />

              {/* Hidden File Input for Web Browser */}
              {Platform.OS === 'web' && (
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleWebFileChange} 
                />
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/*                 TAB 2: MOBILE PHONE & OTP LOGIN                */}
          {/* ============================================================== */}
          {authMode === 'PHONE' && (
            <View style={styles.phoneSection}>
              {!otpStep ? (
                /* Step 1: Enter Mobile Number */
                <View>
                  <Text style={styles.stepTitle}>
                    {lang === 'ta' ? '1. பதிவு செய்யப்பட்ட மொபைல் எண்ணை உள்ளிடவும்' : '1. Enter Registered Mobile Number'}
                  </Text>
                  <Text style={styles.stepSubtitle}>
                    {lang === 'ta' 
                      ? 'உங்கள் ரேஷன் அட்டை அல்லது ஆதாருடன் இணைக்கப்பட்ட 10 இலக்க மொபைல் எண்' 
                      : 'The 10-digit mobile number linked to your Ration Card or Aadhaar profile'}
                  </Text>

                  {/* Phone Input with +91 Country Badge */}
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.flagIcon}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput 
                      style={styles.phoneInput}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  {/* Send OTP Button */}
                  <TouchableOpacity 
                    style={styles.primaryAuthBtn} 
                    onPress={() => handleSendPhoneOtp(phone)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryAuthBtnText}>
                        {lang === 'ta' ? 'ஓடிபி பெறுக (GET OTP) →' : 'GET OTP ON MOBILE →'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Step 2: Enter & Verify OTP */
                <View>
                  <View style={styles.otpNoticeBanner}>
                    <Text style={styles.otpNoticeText}>
                      ✅ {otpSentNotice || `OTP sent to +91 ${phone}`}
                    </Text>
                    <Text style={styles.otpNoticeSub}>
                      {lang === 'ta' ? 'டெமோ OTP குறியீடு: 123456' : 'Demo Instant Access OTP: 123456'}
                    </Text>
                  </View>

                  <Text style={styles.stepTitle}>
                    {lang === 'ta' ? '2. ஆறு இலக்க OTP ஐ உள்ளிடவும்' : '2. Enter 6-Digit OTP Code'}
                  </Text>

                  {/* OTP Input Field */}
                  <View style={styles.otpInputRow}>
                    <TextInput 
                      style={styles.otpInput}
                      placeholder="• • • • • •"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      autoFocus
                    />
                  </View>

                  {/* Verify OTP Button */}
                  <TouchableOpacity 
                    style={styles.primaryAuthBtn} 
                    onPress={handleVerifyPhoneOtp}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryAuthBtnText}>
                        {lang === 'ta' ? 'OTP சரிபார்த்து உள்நுழைக →' : 'VERIFY OTP & SIGN IN →'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Back to change phone */}
                  <TouchableOpacity 
                    style={styles.backLinkBtn} 
                    onPress={() => setOtpStep(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backLinkText}>
                      ← {lang === 'ta' ? 'வேறு மொபைல் எண்ணை மாற்றுக' : 'Change Mobile Number'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Footer Support Information */}
      <Footer lang={lang} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center'
  },

  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    maxWidth: 580,
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  topHeaderTitleBox: {
    flex: 1
  },
  stateHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0B3D91',
    letterSpacing: 0.8
  },
  deptHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1
  },
  portalSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1
  },

  // CARD CONTAINER
  cardContainer: {
    maxWidth: 580,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0B3D91',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20
  },
  cardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#061E47',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933'
  },
  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cardHeaderSub: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  cardBody: {
    padding: 20
  },

  // AUTH MODE SELECTOR TABS
  authTabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    gap: 6,
    marginBottom: 18
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent'
  },
  authTabActive: {
    backgroundColor: '#0B3D91',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  authTabIcon: {
    fontSize: 20
  },
  authTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569'
  },
  authTabTextActive: {
    color: '#FFFFFF'
  },
  authTabSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B'
  },
  authTabSubActive: {
    color: '#93C5FD'
  },

  // ERROR TOAST
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700'
  },

  // ==================== SCANNER SECTION ====================
  scannerSection: {
    alignItems: 'center',
    width: '100%'
  },
  demoCardSelectRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    width: '100%'
  },
  demoCardSelectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3D91'
  },
  demoCardSelectHint: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D'
  },
  demoCardPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap'
  },
  demoCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8'
  },
  demoCardPillActive: {
    backgroundColor: '#0B3D91',
    borderColor: '#0B3D91'
  },
  demoCardPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  demoCardPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  demoCardCheck: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '900'
  },
  viewfinderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  viewfinderBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#061E47',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155'
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#0B3D91',
    borderWidth: 3
  },
  bracketTL: {
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  bracketTR: {
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0
  },
  bracketBL: {
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0
  },
  bracketBR: {
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  laserBeam: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    height: 2.5,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5
  },
  viewfinderContent: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  qrIconGraphic: {
    fontSize: 38,
    marginBottom: 8
  },
  viewfinderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  viewfinderNote: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 30, 71, 0.92)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  scanningOverlayText: {
    color: '#FF9933',
    fontSize: 13,
    fontWeight: '900'
  },
  scanActionButton: {
    width: '100%',
    backgroundColor: '#FF9933',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9933',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  scanActionButtonText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    width: '100%'
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1'
  },
  orDividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5
  },
  galleryUploadButton: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  galleryUploadIcon: {
    fontSize: 26
  },
  galleryUploadButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D'
  },
  galleryUploadSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
    marginTop: 1
  },
  galleryUploadArrow: {
    fontSize: 20
  },
  uploadedPreviewBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  uploadedQrImage: {
    width: 140,
    height: 140,
    borderRadius: 8
  },
  uploadedSuccessBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  uploadedSuccessText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800'
  },
  // ==================== PHONE SECTION ====================
  phoneSection: {
    width: '100%'
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 15
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8
  },
  flagIcon: {
    fontSize: 16
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0B3D91',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1
  },

  // PRIMARY BUTTON
  primaryAuthBtn: {
    backgroundColor: '#FF9933',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9933',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3
  },
  primaryAuthBtnText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  // OTP STEP
  otpNoticeBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14
  },
  otpNoticeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D'
  },
  otpNoticeSub: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '700',
    marginTop: 2
  },
  otpInputRow: {
    marginBottom: 16
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0B3D91',
    borderRadius: 8,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0B3D91',
    letterSpacing: 8
  },
  backLinkBtn: {
    alignItems: 'center',
    marginTop: 14,
    padding: 6
  },
  backLinkText: {
    color: '#0B3D91',
    fontSize: 11,
    fontWeight: '700'
  }
});
