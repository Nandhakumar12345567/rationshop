import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { translations } from '../i18n/strings';

export default function Header({ lang, setLang, currentRole, setRole, user, onLogout }) {
  const t = translations[lang];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>🌾 {t.appTitle}</Text>
          <Text style={styles.subTitle}>{t.tagline}</Text>
        </View>

        <TouchableOpacity 
          style={styles.langBtn}
          onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
        >
          <Text style={styles.langText}>{lang === 'en' ? 'தமிழ்' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      {/* Role Picker Bar */}
      <View style={styles.roleBar}>
        <Text style={styles.roleLabel}>{t.switchRole}:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'CUSTOMER' && styles.activeRoleTab]}
            onPress={() => setRole('CUSTOMER')}
          >
            <Text style={[styles.roleTabText, currentRole === 'CUSTOMER' && styles.activeRoleText]}>
              👤 {t.customerRole}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'SHOPKEEPER' && styles.activeRoleTab]}
            onPress={() => setRole('SHOPKEEPER')}
          >
            <Text style={[styles.roleTabText, currentRole === 'SHOPKEEPER' && styles.activeRoleText]}>
              🏪 {t.shopkeeperRole}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'ADMIN' && styles.activeRoleTab]}
            onPress={() => setRole('ADMIN')}
          >
            <Text style={[styles.roleTabText, currentRole === 'ADMIN' && styles.activeRoleText]}>
              📊 {t.adminRole}
            </Text>
          </TouchableOpacity>
        </View>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary
  },
  subTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  langBtn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary
  },
  langText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.bgDark,
    padding: 8,
    borderRadius: 8
  },
  roleLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 6
  },
  roleTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  activeRoleTab: {
    backgroundColor: colors.primary
  },
  roleTabText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  activeRoleText: {
    color: '#000000',
    fontWeight: '700'
  },
  logoutBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  logoutText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold'
  }
});
