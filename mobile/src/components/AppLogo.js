// TODO: Replace with officially approved government emblem/logo before production deployment
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const APP_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M50,5 L88,20 L88,55 C88,75 50,95 50,95 C50,95 12,75 12,55 L12,20 Z" fill="#0B3D91" stroke="#FF9933" stroke-width="4"/>
    <path d="M50,28 C50,28 65,42 65,58 C65,66 58,74 50,74 C42,74 35,66 35,58 C35,42 50,28 50,28 Z" fill="#FF9933"/>
    <ellipse cx="50" cy="46" rx="4" ry="8" fill="#FFFFFF"/>
    <ellipse cx="44" cy="56" rx="3" ry="6" fill="#FFFFFF" transform="rotate(-20 44 56)"/>
    <ellipse cx="56" cy="56" rx="3" ry="6" fill="#FFFFFF" transform="rotate(20 56 56)"/>
  </svg>
`)}`;



export default function AppLogo({ size = 36, dark = false, isHeader = false }) {
  // TODO: Replace with officially approved government emblem/logo before production deployment
  let assetLogo = null;
  try {
    assetLogo = isHeader
      ? require('../../assets/logo/app-logo-header.png')
      : require('../../assets/logo/app-logo.png');
  } catch (e) {
    assetLogo = null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.logoShield, { width: size, height: size }]}>
        <Image source={{ uri: APP_LOGO_SVG }} style={styles.image} resizeMode="contain" />
        {assetLogo && <Image source={assetLogo} style={styles.hiddenImage} accessibilityLabel="Logo Placeholder" />}
      </View>
      <View style={styles.titleBox}>
        <Text style={[styles.appTitle, dark && styles.darkText]}>Smart Ration</Text>
        <Text style={[styles.appSubtitle, dark && styles.darkSubtitle]}>PDS Digital Portal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoShield: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  hiddenImage: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0
  },
  titleBox: {
    justifyContent: 'center'
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  darkText: {
    color: '#0B3D91'
  },
  appSubtitle: {
    color: '#FF9933',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  darkSubtitle: {
    color: '#E65100'
  }
});
