import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { translations } from '../i18n/strings';
import GovEmblem from './GovEmblem';
import CardholderAvatar from './CardholderAvatar';

export default function Header({ lang, setLang, currentRole, setRole, user, onLogout, profileImage, onImageSelected }) {
  const t = translations[lang] || translations.en;

  return (
    <View style={styles.container}>
      {/* Official Government Top Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandingGroup}>
          <GovEmblem size={38} showTitle={false} />
          <View style={styles.brandDivider} />
          <View style={{ justifyContent: 'center' }}>
            <View style={styles.govTitleRow}>
              <Text style={styles.govTitle}>GOVERNMENT OF TAMIL NADU</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>OFFICIAL PORTAL</Text>
              </View>
            </View>
            <Text style={styles.subTitle}>Department of Civil Supplies & Consumer Protection • Smart PDS</Text>
          </View>
        </View>

        <View style={styles.topRightControls}>
          {user && currentRole === 'CUSTOMER' && (
            <CardholderAvatar 
              profileImage={profileImage} 
              onImageSelected={onImageSelected} 
              size={34} 
              editable={true} 
            />
          )}

          <TouchableOpacity 
            style={styles.langBtn}
            onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
            accessibilityLabel="Toggle Language"
            activeOpacity={0.8}
          >
            <Text style={styles.langText}>{lang === 'en' ? 'தமிழ்' : 'English'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Sleek Navigation Bar */}
      <View style={styles.roleBar}>
        <Text style={styles.roleLabel}>{t.switchRole}:</Text>
        
        <View style={styles.roleButtons}>
          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'CUSTOMER' && styles.activeRoleTab]}
            onPress={() => setRole('CUSTOMER')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleTabText, currentRole === 'CUSTOMER' && styles.activeRoleText]}>
              👤 {t.customerRole}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'SHOPKEEPER' && styles.activeRoleTab]}
            onPress={() => setRole('SHOPKEEPER')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleTabText, currentRole === 'SHOPKEEPER' && styles.activeRoleText]}>
              🏪 {t.shopkeeperRole}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleTab, currentRole === 'ADMIN' && styles.activeRoleTab]}
            onPress={() => setRole('ADMIN')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleTabText, currentRole === 'ADMIN' && styles.activeRoleText]}>
              📊 {t.adminRole}
            </Text>
          </TouchableOpacity>
        </View>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Exit Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  brandingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  brandDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 12
  },
  govTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  govTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255, 153, 51, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF9933'
  },
  verifiedBadgeText: {
    color: '#FF9933',
    fontSize: 8,
    fontWeight: '800'
  },
  subTitle: {
    fontSize: 10,
    color: '#93C5FD',
    fontWeight: '600',
    marginTop: 2
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9933'
  },
  langText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  roleLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 4
  },
  roleTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent'
  },
  activeRoleTab: {
    backgroundColor: '#FF9933'
  },
  roleTabText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700'
  },
  activeRoleText: {
    color: '#061E47',
    fontWeight: '900'
  },
  logoutBtn: {
    marginLeft: 'auto',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  }
});
