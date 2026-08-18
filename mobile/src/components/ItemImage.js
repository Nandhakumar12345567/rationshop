import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const ITEM_ASSETS = {
  rice: require('../../assets/items/rice.png'),
  wheat: require('../../assets/items/wheat.png'),
  sugar: require('../../assets/items/sugar.png'),
  oil: require('../../assets/items/oil.png'),
  kerosene: require('../../assets/items/kerosene.png'),
  dal: require('../../assets/items/dal.png')
};

const COMMODITY_SVG_FALLBACKS = {
  rice: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FFFBEB" stroke="#F59E0B" stroke-width="3"/>
      <path d="M20,65 Q50,90 80,65 Q85,45 50,45 Q15,45 20,65 Z" fill="#D97706"/>
      <ellipse cx="40" cy="56" rx="5" ry="2" fill="#FFFFFF"/>
      <ellipse cx="50" cy="58" rx="5" ry="2" fill="#FFFFFF"/>
      <ellipse cx="60" cy="55" rx="5" ry="2" fill="#FFFFFF"/>
    </svg>
  `)}`,
  wheat: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FFF7ED" stroke="#EA580C" stroke-width="3"/>
      <path d="M25,40 L75,40 L70,85 L30,85 Z" fill="#D97706"/>
    </svg>
  `)}`,
  sugar: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#F0F9FF" stroke="#0284C7" stroke-width="3"/>
      <ellipse cx="50" cy="40" rx="35" ry="12" fill="#BAE6FD"/>
    </svg>
  `)}`,
  oil: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FEFCE8" stroke="#EAB308" stroke-width="3"/>
      <rect x="30" y="20" width="40" height="60" rx="4" fill="#EAB308"/>
    </svg>
  `)}`,
  kerosene: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#EFF6FF" stroke="#2563EB" stroke-width="3"/>
      <rect x="30" y="30" width="40" height="50" rx="4" fill="#3B82F6"/>
    </svg>
  `)}`,
  dal: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#FEF3C7" stroke="#D97706" stroke-width="3"/>
      <circle cx="50" cy="50" r="30" fill="#F59E0B"/>
    </svg>
  `)}`
};

export default function ItemImage({ itemId, size = 60 }) {
  const [loadError, setLoadError] = useState(false);
  let key = (itemId || '').toLowerCase();
  
  // Strip ITEM- prefix if present (e.g. ITEM-RICE -> rice, ITEM-SUGAR -> sugar)
  if (key.startsWith('item-')) {
    key = key.replace('item-', '');
  }

  const localAsset = ITEM_ASSETS[key] || ITEM_ASSETS.rice;
  const fallbackSvg = COMMODITY_SVG_FALLBACKS[key] || COMMODITY_SVG_FALLBACKS.rice;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 6 }]}>
      {!loadError ? (
        <Image
          source={localAsset}
          style={styles.image}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      ) : (
        <Image
          source={{ uri: fallbackSvg }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  image: {
    width: '100%',
    height: '100%'
  }
});
