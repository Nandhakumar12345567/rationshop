import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';

const DEFAULT_PROFILE_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="58" fill="#CBD5E1"/>
    <!-- Generic Avatar Silhouette -->
    <circle cx="60" cy="45" r="22" fill="#64748B"/>
    <path d="M25,105 Q60,70 95,105 Z" fill="#64748B"/>
    <!-- Verified Badge -->
    <circle cx="92" cy="92" r="14" fill="#0B3D91"/>
    <text x="92" y="97" font-family="Arial" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓</text>
  </svg>
`)}`;

export default function CardholderAvatar({ profileImage, onImageSelected, size = 64, editable = true }) {
  const handlePickImage = async () => {
    if (!editable) return;
    try {
      const ImagePicker = require('expo-image-picker');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult && permissionResult.granted === false) {
        alert('Permission to access camera roll / gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (onImageSelected) {
          onImageSelected(selectedUri);
        }
      }
    } catch (error) {
      console.log('[ImagePicker Error]', error);
    }
  };

  const imageSource = profileImage ? { uri: profileImage } : { uri: DEFAULT_PROFILE_URI };

  return (
    <TouchableOpacity 
      activeOpacity={editable ? 0.7 : 1}
      onPress={handlePickImage}
      style={[styles.avatarBox, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      {editable && (
        <View style={styles.cameraIconBadge}>
          <Text style={styles.cameraIconText}>📷</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarBox: {
    borderWidth: 2,
    borderColor: '#0B3D91',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9933',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF'
  },
  cameraIconText: {
    fontSize: 10
  }
});
