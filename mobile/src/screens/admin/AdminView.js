import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

export default function AdminView({ lang }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [rationCards, setRationCards] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  useEffect(() => {
    loadAdminData();
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching District Civil Supplies Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.adminHeader}>
        <Text style={styles.headerTitle}>🏛️ District Civil Supplies & Consumer Protection</Text>
        <Text style={styles.headerSub}>Admin Portal • Tamil Nadu Public Distribution System (PDS)</Text>
      </View>

      {/* Analytics KPI Stat Grid */}
      {analytics && (
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analytics.total_registered_beneficiaries}</Text>
            <Text style={styles.kpiLabel}>Active Cards</Text>
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
            <Text style={[styles.kpiValue, { color: colors.gold }]}>₹{analytics.total_revenue_collected_inr}</Text>
            <Text style={styles.kpiLabel}>UPI Revenue Collected</Text>
          </View>
        </View>
      )}

      {/* Low Stock Alerts */}
      {analytics?.low_stock_alerts && analytics.low_stock_alerts.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerTitle}>⚠️ Stock Replenishment Alerts:</Text>
          {analytics.low_stock_alerts.map((al, idx) => (
            <Text key={idx} style={styles.alertText}>
              • {al.itemId}: Current stock {al.currentStock} units (Below 500 threshold).
            </Text>
          ))}
        </View>
      )}

      {/* Fraud Audit Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Biometric Fraud & Token Re-use Audit Trail</Text>
        {fraudAlerts.map((fa, idx) => (
          <View key={idx} style={styles.fraudCard}>
            <View style={styles.fraudRow}>
              <Text style={styles.fraudId}>Booking: {fa.booking_id}</Text>
              <Text style={styles.fraudRisk}>{fa.risk_level}</Text>
            </View>
            <Text style={styles.fraudNote}>{fa.audit_note}</Text>
            <Text style={styles.fraudCardNo}>Card: {fa.card_no}</Text>
          </View>
        ))}
      </View>

      {/* Ration Beneficiaries List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Registered Ration Card Beneficiaries ({rationCards.length})</Text>
        {rationCards.map((card) => (
          <View key={card.card_no} style={styles.beneficiaryCard}>
            <View style={styles.benRow}>
              <Text style={styles.benName}>{card.holder_name}</Text>
              <Text style={styles.benCat}>{card.category}</Text>
            </View>
            <Text style={styles.benCardNo}>Card No: {card.card_no}</Text>
            <Text style={styles.benMeta}>Family Size: {card.family_size} | Phone: {card.phone}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    padding: 16
  },
  loadingBox: {
    flex: 1,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: colors.primary,
    marginTop: 12
  },
  adminHeader: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center'
  },
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20
  },
  alertBannerTitle: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4
  },
  alertText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginTop: 2
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12
  },
  fraudCard: {
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  fraudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  fraudId: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13
  },
  fraudRisk: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold'
  },
  fraudNote: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4
  },
  fraudCardNo: {
    color: colors.gold,
    fontSize: 11,
    marginTop: 2
  },
  beneficiaryCard: {
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  benRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  benName: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14
  },
  benCat: {
    backgroundColor: colors.primaryDark,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  benCardNo: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 2
  },
  benMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4
  }
});
