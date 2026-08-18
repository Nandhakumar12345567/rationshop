import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Footer() {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.topDivider} />
      <Text style={styles.initiativeText}>
        🏛️ An initiative by Department of Civil Supplies & Consumer Protection
      </Text>
      <Text style={styles.stateText}>
        Government of Tamil Nadu • National Food Security Act (NFSA) Services
      </Text>
      
      <View style={styles.helplineBox}>
        <Text style={styles.helplineLabel}>📞 Toll-Free PDS Helpline:</Text>
        <Text style={styles.helplineNumbers}>1967  |  1800-425-5901</Text>
      </View>

      <Text style={styles.disclaimerText}>
        For assistance or grievance redressal, contact your local Fair Price Shop (FPS) inspector or visit your nearest Taluk Supply Office (TSO).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#EDF2F7',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    alignItems: 'center',
    marginTop: 24,
    width: '100%'
  },
  topDivider: {
    width: 40,
    height: 3,
    backgroundColor: '#FF9933',
    borderRadius: 2,
    marginBottom: 10
  },
  initiativeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3D91',
    textAlign: 'center'
  },
  stateText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    textAlign: 'center'
  },
  helplineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 10,
    marginBottom: 8
  },
  helplineLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  helplineNumbers: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3D91'
  },
  disclaimerText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 380
  }
});
