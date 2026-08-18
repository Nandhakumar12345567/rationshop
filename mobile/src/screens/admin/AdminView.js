import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { socketManager } from '../../api/socket';
import Footer from '../../components/Footer';

export default function AdminView({ lang }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [rationCards, setRationCards] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    loadAdminData();
    socketManager.connect('shop_1');

    const unsubConn = socketManager.onConnectionChange(setSocketConnected);

    const unsubAnalytics = socketManager.subscribeToAnalytics((freshAnalytics) => {
      console.log('[Admin Socket] Analytics update received:', freshAnalytics);
      if (freshAnalytics) {
        setAnalytics(freshAnalytics);
      }
    });

    const unsubIssue = socketManager.subscribeToIssueComplete(() => {
      console.log('[Admin Socket] Issue complete received, refreshing logs');
      api.getAdminAnalytics().then(res => setAnalytics(res.analytics || null));
      api.getFraudAlerts().then(res => setFraudAlerts(res.alerts || []));
    });

    return () => {
      unsubConn();
      unsubAnalytics();
      unsubIssue();
    };
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, cardsRes, fraudRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getRationCards(),
        api.getFraudAlerts()
      ]);

      setAnalytics(analyticsRes.analytics || null);
      setRationCards(cardsRes.cards || []);
      setFraudAlerts(fraudRes.alerts || []);
    } catch (err) {
      console.error('[Admin Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#0B3D91" />
        <Text style={styles.loadingText}>Fetching District Civil Supplies Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Official Government Admin Header */}
      <View style={styles.adminHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🏛️ District Civil Supplies & Consumer Protection</Text>
          <Text style={styles.headerSub}>State Administration Portal • Tamil Nadu PDS Control Room</Text>
        </View>
        <View style={[styles.liveTag, { backgroundColor: socketConnected ? '#166534' : '#854D0E' }]}>
          <Text style={styles.liveTagText}>{socketConnected ? '⚡ SOCKET REALTIME LIVE' : '🟡 RECONNECTING'}</Text>
        </View>
      </View>

      {/* Analytics KPI Stat Grid */}
      {analytics && (
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analytics.total_registered_beneficiaries}</Text>
            <Text style={styles.kpiLabel}>Active Ration Cards</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analytics.total_ration_issued}</Text>
            <Text style={styles.kpiLabel}>Rations Issued Today</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analytics.pending_pickups}</Text>
            <Text style={styles.kpiLabel}>Pending Bookings</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#0B3D91' }]}>₹{analytics.total_revenue_collected_inr}</Text>
            <Text style={styles.kpiLabel}>UPI Revenue Collected</Text>
          </View>
        </View>
      )}

      {/* Stock Replenishment Alerts Banner */}
      {analytics?.low_stock_alerts && analytics.low_stock_alerts.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerTitle}>⚠️ Stock Replenishment Threshold Alerts:</Text>
          {analytics.low_stock_alerts.map((al, idx) => (
            <Text key={idx} style={styles.alertText}>
              • FPS #401 ({al.itemId}): Current stock <Text style={{ fontWeight: '800' }}>{al.currentStock} units</Text> (Below minimum 500 threshold).
            </Text>
          ))}
        </View>
      )}

      {/* Fraud Audit Log Table */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🛡️ Biometric Fraud & Token Re-use Audit Trail</Text>
        {fraudAlerts.map((fa, idx) => (
          <View key={idx} style={styles.fraudCard}>
            <View style={styles.fraudRow}>
              <Text style={styles.fraudId}>App Ref: TN/RATION/2026/0000{fa.booking_id}</Text>
              <View style={styles.riskBadge}>
                <Text style={styles.fraudRisk}>{fa.risk_level}</Text>
              </View>
            </View>
            <Text style={styles.fraudNote}>{fa.audit_note}</Text>
            <Text style={styles.fraudCardNo}>Ration Card No: {fa.card_no}</Text>
          </View>
        ))}
      </View>

      {/* Registered Beneficiaries Data List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📋 Registered Ration Card Beneficiaries ({rationCards.length})</Text>
        {rationCards.map((card) => (
          <View key={card.card_no} style={styles.beneficiaryCard}>
            <View style={styles.benRow}>
              <Text style={styles.benName}>{card.holder_name}</Text>
              <View style={styles.catBadge}>
                <Text style={styles.benCat}>{card.category}</Text>
              </View>
            </View>
            <Text style={styles.benCardNo}>Card No: {card.card_no}</Text>
            <Text style={styles.benMeta}>Family Members: {card.family_size} | Phone: {card.phone}</Text>
          </View>
        ))}
      </View>

      {/* Footer Disclaimer */}
      <Footer />
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
  loadingBox: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#0B3D91',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600'
  },
  adminHeader: {
    backgroundColor: '#061E47',
    padding: 14,
    borderRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  headerSub: {
    fontSize: 10,
    color: '#FF9933',
    marginTop: 2
  },
  liveTag: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626'
  },
  liveTagText: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B3D91'
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600'
  },
  alertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  alertBannerTitle: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4
  },
  alertText: {
    color: '#0F172A',
    fontSize: 11,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3D91',
    marginBottom: 10
  },
  fraudCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8
  },
  fraudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  fraudId: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12
  },
  riskBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  fraudRisk: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800'
  },
  fraudNote: {
    color: '#475569',
    fontSize: 11,
    marginTop: 3
  },
  fraudCardNo: {
    color: '#0B3D91',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700'
  },
  beneficiaryCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8
  },
  benRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  benName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13
  },
  catBadge: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  benCat: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  benCardNo: {
    color: '#0B3D91',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  benMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2
  }
});
