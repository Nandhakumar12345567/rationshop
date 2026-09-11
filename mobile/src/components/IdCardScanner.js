import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import jsQR from 'jsqr';

export default function IdCardScanner({
  onScan,
  onError,
  selectedCardNo = 'TN-04-AAY-109283',
  onSelectCardNo,
  lang = 'en'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const boxSize = isMobile ? Math.min(width - 64, 280) : 300;

  const [loading, setLoading] = useState(false);
  const [activeCardNo, setActiveCardNo] = useState(selectedCardNo);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [uploadedImageUri, setUploadedImageUri] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Animated sweeping laser and shake
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Laser animation loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Corner breathing pulse
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        })
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // Audio error buzz for invalid scan
  const playErrorBuzz = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          osc.frequency.setValueAtTime(110, ctx.currentTime + 0.12);

          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.29);
        }
      } catch (e) {}
    }
  };

  // Trigger shake animation for rejection
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  // Web Audio camera snap feedback
  const playBeep = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.17);
        }
      } catch (e) {}
    }
  };

  // Trigger scan complete
  const triggerScanSuccess = (cardNo) => {
    const target = cardNo || activeCardNo || 'TN-04-AAY-109283';
    setScanSuccess(true);
    playBeep();

    setTimeout(() => {
      if (onScan) {
        onScan(target);
      }
    }, 450);
  };

  // Decode QR from uploaded image using jsqr
  const handleProcessImage = async (dataUri) => {
    setLoading(true);
    setIsInvalid(false);
    setScanError(null);
    setScanSuccess(false);
    setUploadedImageUri(dataUri);

    let decoded = null;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        decoded = await new Promise((resolve) => {
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
              resolve(code ? code.data : null);
            } catch (err) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = dataUri;
        });
      } catch (e) {
        console.error('[Decode error]', e);
      }
    }

    setLoading(false);

    // If a valid QR was decoded:
    if (decoded) {
      let cardNo = null;
      try {
        const parsed = JSON.parse(decoded);
        cardNo = parsed.card_no || parsed.cardNo || parsed.id;
      } catch {
        const match = decoded.match(/TN-[0-9A-Za-z-]+|SHOP-[0-9A-Za-z-]+|ADMIN-[0-9A-Za-z-]+/);
        cardNo = match ? match[0] : null;
      }

      if (cardNo) {
        setIsInvalid(false);
        setScanError(null);
        triggerScanSuccess(cardNo);
        return;
      }
    }

    // NON-QR OR INVALID IMAGE: DO NOT ENTER! MARK AS INVALID!
    setIsInvalid(true);
    const errText = lang === 'ta'
      ? 'தவறான படம்: இந்த படத்தில் ரேஷன் அட்டை QR குறியீடு எதுவும் இல்லை!'
      : 'INVALID QR CODE: No valid Ration Card QR code detected in this image!';
    setScanError(errText);
    playErrorBuzz();
    triggerShake();
    if (onError) {
      onError(errText);
    }
  };

  // File Picker Trigger
  const handleUploadClick = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => handleProcessImage(ev.target.result);
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    }
  };

  // Start Real Live Camera Stream
  const startCamera = async () => {
    if (cameraStream) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setCameraStream(stream);
        setCameraActive(true);
      } catch (err) {
        console.warn('[Camera access not granted or device busy]:', err);
        setCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setCameraActive(false);
  };

  // Auto-start camera immediately when scanner mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Attach active video stream to video DOM element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.log('Video playback error:', e));
    }
  }, [cameraStream, cameraActive]);

  // Continuous live QR scanning loop from camera feed
  useEffect(() => {
    if (!cameraActive || !cameraStream) return;

    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState >= 2) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const fn = typeof jsQR === 'function' ? jsQR : (jsQR && jsQR.default);
        const code = fn ? fn(imageData.data, imageData.width, imageData.height) : null;
        if (code && code.data) {
          clearInterval(scanIntervalRef.current);
          let cardNo = null;
          try {
            const parsed = JSON.parse(code.data);
            cardNo = parsed.card_no || parsed.cardNo || parsed.id;
          } catch {
            const match = code.data.match(/TN-[0-9A-Za-z-]+/);
            cardNo = match ? match[0] : code.data.trim();
          }
          triggerScanSuccess(cardNo || activeCardNo);
        }
      }
    }, 250);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraActive, cameraStream, activeCardNo]);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, boxSize - 20]
  });

  return (
    <View style={styles.container}>
      {/* Hidden file input */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => handleProcessImage(ev.target.result);
              reader.readAsDataURL(file);
            }
          }}
        />
      )}

      {/* Hidden canvas for video QR decoding */}
      {Platform.OS === 'web' && (
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      )}

      {/* ============================================================== */}
      {/* CAMERA VIEWPORT WITH GOOGLE LENS 4-COLOR CORNERS (Image 2)     */}
      {/* ============================================================== */}
      <View style={styles.viewportArea}>
        {/* Real camera live video feed (always mounted in DOM) */}
        {Platform.OS === 'web' && (
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
              opacity: cameraActive ? 1 : 0
            }}
            playsInline
            muted
            autoPlay
          />
        )}

        {/* Fallback surface when camera is starting or pending user click */}
        {!cameraActive && (
          <TouchableOpacity
            style={styles.cameraOffSurface}
            activeOpacity={0.85}
            onPress={startCamera}
          >
            {uploadedImageUri ? (
              <Image source={{ uri: uploadedImageUri }} style={styles.uploadedImage} resizeMode="cover" />
            ) : (
              <View style={styles.cameraPromptCenter}>
                <Text style={styles.cameraPromptIcon}>📷</Text>
                <Text style={styles.cameraPromptTitle}>Live Camera</Text>
                <Text style={styles.cameraPromptSubtitle}>Tap anywhere to activate webcam feed</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Square Reticle Box with 4 Corner Brackets (Google Lens / TN Blue or Red if Invalid) */}
        <Animated.View
          style={[
            styles.reticleBox,
            {
              width: boxSize,
              height: boxSize,
              transform: [{ scale: pulseAnim }, { translateX: shakeAnim }],
              zIndex: 10
            },
            isInvalid && styles.reticleBoxInvalid
          ]}
        >
          {/* Live Streaming Badge */}
          {cameraActive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE CAMERA</Text>
            </View>
          )}

          {/* Top-Left Corner */}
          <View style={[styles.cornerBracket, styles.bracketTopLeft, scanSuccess && styles.bracketSuccess, isInvalid && styles.bracketInvalid]} />

          {/* Top-Right Corner */}
          <View style={[styles.cornerBracket, styles.bracketTopRight, scanSuccess && styles.bracketSuccess, isInvalid && styles.bracketInvalid]} />

          {/* Bottom-Left Corner */}
          <View style={[styles.cornerBracket, styles.bracketBottomLeft, scanSuccess && styles.bracketSuccess, isInvalid && styles.bracketInvalid]} />

          {/* Bottom-Right Corner */}
          <View style={[styles.cornerBracket, styles.bracketBottomRight, scanSuccess && styles.bracketSuccess, isInvalid && styles.bracketInvalid]} />

          {/* Sweeping Laser Scanline */}
          {!isInvalid && (
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [{ translateY: laserTranslateY }],
                  backgroundColor: scanSuccess ? '#22C55E' : '#38BDF8'
                }
              ]}
            />
          )}

          {/* Central status / indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0B3D91" />
              <Text style={styles.loadingText}>Reading QR Code...</Text>
            </View>
          )}

          {scanSuccess && (
            <View style={styles.successOverlay}>
              <Text style={styles.successCheckIcon}>✓</Text>
              <Text style={styles.successText}>Verified!</Text>
            </View>
          )}

          {/* INVALID OVERLAY - Visible when non-QR or corrupt image is uploaded */}
          {isInvalid && (
            <View style={styles.invalidOverlay}>
              <View style={styles.invalidIconCircle}>
                <Text style={styles.invalidIcon}>✕</Text>
              </View>
              <Text style={styles.invalidTitle}>
                {lang === 'ta' ? 'தவறான QR குறியீடு' : 'INVALID QR CODE'}
              </Text>
              <Text style={styles.invalidDesc}>
                {lang === 'ta' 
                  ? 'இந்த படத்தில் ரேஷன் QR குறியீடு இல்லை. சரியான படத்தை பதிவேற்றவும்.' 
                  : 'No valid Ration QR detected in this image.'}
              </Text>
              <TouchableOpacity
                style={styles.retryUploadBtn}
                onPress={() => {
                  setIsInvalid(false);
                  setScanError(null);
                  setUploadedImageUri(null);
                  handleUploadClick();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.retryUploadBtnText}>
                  {lang === 'ta' ? '🔄 வேறு படத்தை தேர்வு செய்க' : '🔄 Try Another Image'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* "Upload from gallery" PILL BUTTON (Matching Image 2 exactly) */}
        <View style={styles.uploadButtonContainer}>
          <TouchableOpacity
            style={styles.uploadGalleryPill}
            onPress={handleUploadClick}
            disabled={loading}
            activeOpacity={0.8}
          >
            {/* Gallery Landscape Photo Icon */}
            <View style={styles.galleryIconBadge}>
              <Text style={styles.galleryIconGraphic}>🖼️</Text>
            </View>
            <Text style={styles.uploadGalleryText}>Upload from gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155'
  },

  /* Camera Viewport Area */
  viewportArea: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  liveVideo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cameraOffSurface: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  cameraPromptCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  cameraPromptIcon: {
    fontSize: 42,
    marginBottom: 8
  },
  cameraPromptTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4
  },
  cameraPromptSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500'
  },
  liveBadge: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 20
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  uploadedImage: {
    width: '100%',
    height: '100%'
  },

  /* Central Square Reticle */
  reticleBox: {
    position: 'relative',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },

  /* The 4 Corner Brackets - Tamil Nadu Govt Deep Navy Blue Theme */
  cornerBracket: {
    position: 'absolute',
    width: 44,
    height: 44,
    zIndex: 10
  },
  // Top-Left Corner
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderColor: '#0B3D91',
    borderTopLeftRadius: 28,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8
  },
  // Top-Right Corner
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderColor: '#0B3D91',
    borderTopRightRadius: 28,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8
  },
  // Bottom-Left Corner
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderColor: '#0B3D91',
    borderBottomLeftRadius: 28,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8
  },
  // Bottom-Right Corner
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderColor: '#0B3D91',
    borderBottomRightRadius: 28,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8
  },
  bracketSuccess: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E'
  },

  /* Sweeping Laser Scanline */
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#38BDF8',
    zIndex: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6
  },

  /* Loading & Success Overlays */
  loadingOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600'
  },
  successOverlay: {
    backgroundColor: 'rgba(52, 168, 83, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4
  },
  successCheckIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold'
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },

  /* "Upload from gallery" Button (Exact Image 2 Match) */
  uploadButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30
  },
  uploadGalleryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4
  },
  galleryIconBadge: {
    marginRight: 8
  },
  galleryIconGraphic: {
    fontSize: 15
  },
  uploadGalleryText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2
  },

  /* Invalid State Styles */
  reticleBoxInvalid: {
    borderWidth: 2.5,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)'
  },
  bracketInvalid: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444'
  },
  invalidOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    width: '88%',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: 6
  },
  invalidIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  invalidIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  invalidTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  invalidDesc: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15
  },
  retryUploadBtn: {
    marginTop: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16
  },
  retryUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  }
});
