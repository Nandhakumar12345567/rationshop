import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const TN_EMBLEM_ASSET = require('../../assets/tn_emblem.png');

export default function GovEmblem({ size = 40, showTitle = false }) {
  return (
    <View style={styles.container}>
      <View style={[styles.emblemCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image 
          source={TN_EMBLEM_ASSET} 
          style={styles.image} 
          resizeMode="cover" 
          accessibilityLabel="Official Government of Tamil Nadu Emblem"
        />
      </View>

      {showTitle && (
        <View style={styles.textContainer}>
          <Text style={styles.stateTitle}>GOVERNMENT OF TAMIL NADU</Text>
          <Text style={styles.deptTitle}>Civil Supplies & Consumer Protection Department</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  emblemCircle: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF9933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  image: {
    width: '102%',
    height: '102%'
  },
  textContainer: {
    justifyContent: 'center'
  },
  stateTitle: {
    color: '#FF9933',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  deptTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  }
});


