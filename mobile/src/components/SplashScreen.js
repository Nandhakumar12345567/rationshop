import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';
import AppLogo from './AppLogo';
import { colors } from '../theme/colors';

const TN_EMBLEM_ASSET = require('../../assets/tn_emblem.png');

const HERO_NATIONAL_EMBLEM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" fill="none">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE047"/>
        <stop offset="35%" stop-color="#EAB308"/>
        <stop offset="70%" stop-color="#CA8A04"/>
        <stop offset="100%" stop-color="#854D0E"/>
      </linearGradient>
      <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FEF08A"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#F59E0B" flood-opacity="0.4"/>
      </filter>
    </defs>

    <g filter="url(#goldGlow)">
      <!-- Outer Decorative Gold Crest Ring Base -->
      <circle cx="150" cy="120" r="115" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>

      <!-- Center Lion Head & Crown Mane -->
      <path d="M150,22 C125,22 108,42 108,68 C108,94 125,114 150,114 C175,114 192,94 192,68 C192,42 175,22 150,22 Z" fill="url(#goldGrad)" stroke="#78350F" stroke-width="2.5"/>
      <path d="M128,37 C135,28 150,26 150,26 C150,26 165,28 172,37 C180,48 182,62 172,72 C160,82 150,88 150,88 C150,88 140,82 128,72 C118,62 120,48 128,37 Z" fill="url(#goldHighlight)"/>
      <circle cx="138" cy="52" r="4" fill="#451A03"/>
      <circle cx="162" cy="52" r="4" fill="#451A03"/>
      <path d="M142,66 Q150,74 158,66" stroke="#451A03" stroke-width="3" stroke-linecap="round" fill="none"/>

      <!-- Left Lion Profile Head -->
      <path d="M110,42 C85,42 65,62 65,88 C65,110 82,128 105,133 L120,108 C115,93 112,73 110,42 Z" fill="url(#goldGrad)" stroke="#78350F" stroke-width="2"/>
      <circle cx="88" cy="74" r="3.5" fill="#451A03"/>

      <!-- Right Lion Profile Head -->
      <path d="M190,42 C215,42 235,62 235,88 C235,110 218,128 195,133 L180,108 C185,93 188,73 190,42 Z" fill="url(#goldGrad)" stroke="#78350F" stroke-width="2"/>
      <circle cx="212" cy="74" r="3.5" fill="#451A03"/>

      <!-- 4 Lion Front Paws & Columns -->
      <rect x="108" y="114" width="18" height="68" rx="6" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1.5"/>
      <rect x="141" y="114" width="18" height="68" rx="6" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1.5"/>
      <rect x="174" y="114" width="18" height="68" rx="6" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1.5"/>

      <!-- Abacus Base Circular Platform -->
      <rect x="75" y="182" width="150" height="34" rx="8" fill="url(#goldGrad)" stroke="#78350F" stroke-width="2.5"/>

      <!-- Ashoka Chakra 24-Spoke Wheel in Center -->
      <circle cx="150" cy="199" r="14" fill="#FFFFFF" stroke="#061E47" stroke-width="2"/>
      <circle cx="150" cy="199" r="3" fill="#061E47"/>
      <line x1="136" y1="199" x2="164" y2="199" stroke="#061E47" stroke-width="1.5"/>
      <line x1="150" y1="185" x2="150" y2="213" stroke="#061E47" stroke-width="1.5"/>
      <line x1="140.1" y1="189.1" x2="159.9" y2="208.9" stroke="#061E47" stroke-width="1.5"/>
      <line x1="140.1" y1="208.9" x2="159.9" y2="189.1" stroke="#061E47" stroke-width="1.5"/>

      <!-- Left & Right Relief Sculptures (Galloping Horse & Bull) -->
      <circle cx="100" cy="199" r="8" fill="#78350F"/>
      <circle cx="200" cy="199" r="8" fill="#78350F"/>

      <!-- Bell Lotus Base Pedestal Bar -->
      <rect x="60" y="216" width="180" height="14" rx="5" fill="#854D0E" stroke="#451A03" stroke-width="2"/>

      <!-- Devanagari Motto "सत्यमेव जयते" -->
      <text x="150" y="260" font-family="'Times New Roman', Noto Sans Devnagari, serif" font-size="22" font-weight="bold" fill="url(#goldHighlight)" text-anchor="middle" letter-spacing="1.5">सत्यमेव जयते</text>

      <!-- English Subtitle "Government of India" -->
      <text x="150" y="286" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" fill="url(#goldHighlight)" text-anchor="middle" letter-spacing="2">Government of India</text>
    </g>
  </svg>
`)}`;

export default function SplashScreen({ onFinish }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Decorative Gradient Radial & Tricolor Top Accent */}
      <View style={styles.tricolorHeaderBar}>
        <View style={[styles.triStrip, { backgroundColor: '#FF9933' }]} />
        <View style={[styles.triStrip, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.triStrip, { backgroundColor: '#138808' }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Official Tamil Nadu Government Seal Circle Badge */}
        <View style={styles.emblemWrapper}>
          <View style={styles.emblemRing}>
            <Image 
              source={TN_EMBLEM_ASSET} 
              style={styles.emblemImg} 
              resizeMode="cover" 
            />
          </View>
          <View style={styles.officialSealBadge}>
            <Text style={styles.officialSealText}>✓ OFFICIAL GOVT SEAL</Text>
          </View>
        </View>

        {/* Official Department Titles */}
        <View style={styles.headerBlock}>
          <Text style={styles.govtHeader}>GOVERNMENT OF TAMIL NADU</Text>
          <Text style={styles.deptHeader}>Department of Civil Supplies & Consumer Protection</Text>
        </View>


        {/* App Portal Branding Card */}
        <View style={styles.appCard}>
          <AppLogo size={46} dark={false} />
          <Text style={styles.appDescText}>Smart Public Distribution System (Smart PDS) Beneficiary Portal</Text>
        </View>

        {/* Loading Progress Telemetry */}
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#FF9933" />
          <Text style={styles.loaderText}>Initializing Secure PDS Server Connection...</Text>
          <Text style={styles.loaderSub}>SSL 256-bit Encrypted Government Session Active 🔒</Text>
        </View>


      </Animated.View>

      {/* Bottom Tricolor Accent Line */}
      <View style={styles.tricolorFooterBar}>
        <View style={[styles.triStrip, { backgroundColor: '#FF9933' }]} />
        <View style={[styles.triStrip, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.triStrip, { backgroundColor: '#138808' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061E47',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  tricolorHeaderBar: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden'
  },
  tricolorFooterBar: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden'
  },
  triStrip: {
    flex: 1,
    height: '100%'
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 440,
    marginVertical: 'auto'
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  emblemRing: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#FF9933',
    overflow: 'hidden',
    shadowColor: '#FF9933',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12
  },
  emblemImg: {
    width: '102%',
    height: '102%'
  },
  officialSealBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#061E47',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4
  },
  officialSealText: {
    color: '#FF9933',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 16
  },
  govtHeader: {
    color: '#FF9933',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4
  },
  deptHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },

  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 153, 51, 0.3)',
    marginBottom: 16
  },
  appDescText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center'
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '700',
    textAlign: 'center'
  },
  loaderSub: {
    color: '#86EFAC',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
    textAlign: 'center'
  },
  mottoBadge: {
    backgroundColor: 'rgba(255, 153, 51, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9933',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mottoText: {
    color: '#FF9933',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center'
  }
});

