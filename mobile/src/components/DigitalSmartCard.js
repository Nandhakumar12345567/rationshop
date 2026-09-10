import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import CardholderAvatar from './CardholderAvatar';
import { getQRCodeSVGDataURI } from '../utils/qrGenerator';
import { getFamilyMembersForCount } from '../utils/familyMembers';

const TN_EMBLEM_ASSET = require('../../assets/tn_emblem.png');
const NATIONAL_EMBLEM_ASSET = require('../../assets/logo/national_emblem.png');

export default function DigitalSmartCard({ user, lang = 'en', profileImage, onImageSelected, socketConnected = true }) {
  const [showBack, setShowBack] = useState(false);
  const [copied, setCopied] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 680;

  if (!user) return null;

  // Family Members Data based on user card and family_size
  const familyMembers = getFamilyMembersForCount(user, user.family_size || 4);

  // Specific Card Details configuration
  const cardConfig = {
    categoryTextEn: user.category === 'Antyodaya' ? 'AAY (Antyodaya Anna Yojana)' : user.category === 'APL' ? 'NPHH (Non-Priority / Sugar)' : 'PHH (Priority / Rice Card)',
    categoryTextTa: user.category === 'Antyodaya' ? 'AAY - அந்தியோதயா அன்னா யோஜனா' : user.category === 'APL' ? 'NPHH - சர்க்கரை குடும்ப அட்டை' : 'PHH - முன்னுரிமை அரிசி அட்டை',
    cardTypeShort: user.category === 'Antyodaya' ? 'AAY' : user.category === 'APL' ? 'NPHH' : 'PHH',
    cardBadgeBg: user.category === 'Antyodaya' ? '#FF9933' : user.category === 'APL' ? '#2563EB' : '#15803D',
    cardThemeBorder: user.category === 'Antyodaya' ? '#F59E0B' : user.category === 'APL' ? '#3B82F6' : '#16A34A',
    cardGradStart: user.category === 'Antyodaya' ? '#FFFDF5' : user.category === 'APL' ? '#F8FAFC' : '#F4FDF6',
    fatherName: user.card_no === 'TN-04-AAY-109283' ? 'Sundaram / சுந்தரம்' : user.card_no === 'TN-04-APL-549102' ? 'Subramanian / சுப்பிரமணியன்' : 'Kumar / குமார்',
    dob: user.card_no === 'TN-04-AAY-109283' ? '22/04/1979' : user.card_no === 'TN-04-APL-549102' ? '10/11/1989' : '15/06/1982',
    gender: user.card_no === 'TN-04-AAY-109283' ? 'Female / பெண்' : 'Male / ஆண்',
    address: user.card_no === 'TN-04-AAY-109283' 
      ? 'No. 28, Bharathiyar Street, Mylapore, Chennai - 600004' 
      : user.card_no === 'TN-04-APL-549102' 
      ? 'No. 5B, Anna Salai, Guindy, Chennai - 600032' 
      : 'No. 14, Kamarajar Salai, T. Nagar, Chennai - 600017',
    addressTa: user.card_no === 'TN-04-AAY-109283'
      ? 'எண் 28, பாரதியார் தெரு, மயிலாப்பூர், சென்னை - 600004'
      : user.card_no === 'TN-04-APL-549102'
      ? 'எண் 5B, அண்ணா சாலை, கிண்டி, சென்னை - 600032'
      : 'எண் 14, காமராஜர் சாலை, தி. நகர், சென்னை - 600017',
    fpsCode: '02YD0401',
    fpsName: 'FPS #401 (T. Nagar)',
    fpsNameTa: 'நியாய விலைக் கடை #401 (தி. நகர்)',
    cylinders: user.card_no === 'TN-04-APL-549102' ? '2 Cylinders (BPCL)' : '1 Cylinder (IOCL)',
    cylindersTa: user.card_no === 'TN-04-APL-549102' ? '2 சிலிண்டர்கள் (BPCL)' : '1 சிலிண்டர் (IOCL)',
  };

  // Generate real QR code SVG Data URI for digital card
  const qrPayload = JSON.stringify({
    card_no: user.card_no,
    holder: user.holder_name,
    category: user.category,
    family_size: user.family_size,
    fps: cardConfig.fpsCode,
    verified: true,
    issued: '2018-11-15'
  });
  const cardQrUri = getQRCodeSVGDataURI(qrPayload);

  const handleCopyCardNo = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.card_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      alert('Digital e-Card is ready to print / download.');
    }
  };

  return (
    <View style={styles.outerWrapper}>
      {/* Top Controls Bar */}
      <View style={styles.topControlRow}>
        <View style={styles.viewTabs}>
          <TouchableOpacity 
            style={[styles.viewTab, !showBack && styles.viewTabActive]} 
            onPress={() => setShowBack(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewTabText, !showBack && styles.viewTabTextActive]}>
              🪪 {lang === 'ta' ? 'முன்புறம் (Front View)' : 'Front View'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.viewTab, showBack && styles.viewTabActive]} 
            onPress={() => setShowBack(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewTabText, showBack && styles.viewTabTextActive]}>
              👥 {lang === 'ta' ? 'உறுப்பினர்கள் (Back View)' : 'Family Members (Back View)'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionPill} onPress={() => setShowBack(prev => !prev)} activeOpacity={0.7}>
            <Text style={styles.actionPillText}>🔄 {lang === 'ta' ? 'திருப்பு (Flip)' : 'Flip Card'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPillPrimary} onPress={handlePrint} activeOpacity={0.7}>
            <Text style={styles.actionPillPrimaryText}>🖨️ {lang === 'ta' ? 'பதிவிறக்கு (Download)' : 'Download e-Card'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* THE DIGITAL SMART RATION CARD CONTAINER */}
      <View style={[styles.cardContainer, { borderColor: cardConfig.cardThemeBorder, backgroundColor: cardConfig.cardGradStart }]}>
        
        {/* Subtle Watermark Layer */}
        <View style={styles.watermarkLayer} pointerEvents="none">
          <Image source={TN_EMBLEM_ASSET} style={styles.watermarkEmblem} resizeMode="contain" />
          <Text style={styles.watermarkTextPattern}>TNPDS • SMART RATION CARD • தமிழ்நாடு அரசு • மின்னணு குடும்ப அட்டை</Text>
        </View>

        {!showBack ? (
          /* ============================================================== */
          /*                       CARD FRONT VIEW                          */
          /* ============================================================== */
          <View style={styles.cardFrontContent}>
            {/* Header Band */}
            <View style={styles.cardHeaderBand}>
              <View style={styles.emblemWrapper}>
                <Image source={TN_EMBLEM_ASSET} style={styles.headerEmblem} resizeMode="contain" />
              </View>

              <View style={styles.headerTitles}>
                <Text style={styles.tnGovTextEn}>GOVERNMENT OF TAMIL NADU</Text>
                <Text style={styles.tnGovTextTa}>தமிழ்நாடு அரசு</Text>
                <Text style={styles.deptText}>Department of Civil Supplies & Consumer Protection</Text>
                <Text style={styles.cardBannerText}>மின்னணு குடும்ப அட்டை • SMART RATION CARD</Text>
              </View>

              <View style={styles.emblemWrapper}>
                <Image source={NATIONAL_EMBLEM_ASSET} style={styles.headerEmblemNational} resizeMode="contain" />
              </View>
            </View>

            {/* Sub-Header Security & Category Strip */}
            <View style={styles.subHeaderStrip}>
              {/* Golden EMV Smart Card Chip Graphic */}
              <View style={styles.chipContainer}>
                <View style={styles.emvChip}>
                  <View style={styles.chipInnerGrid}>
                    <View style={styles.chipPadTopLeft} />
                    <View style={styles.chipPadTopRight} />
                    <View style={styles.chipPadCenter} />
                    <View style={styles.chipPadBottomLeft} />
                    <View style={styles.chipPadBottomRight} />
                  </View>
                </View>
                <Text style={styles.contactlessIcon}>🛜</Text>
              </View>

              {/* Card Category Badge Ribbon */}
              <View style={[styles.categoryRibbon, { backgroundColor: cardConfig.cardBadgeBg }]}>
                <Text style={styles.categoryRibbonText}>
                  {lang === 'ta' ? cardConfig.categoryTextTa : cardConfig.categoryTextEn}
                </Text>
              </View>

              {/* Holographic Security Stamp */}
              <View style={styles.holoBadge}>
                <Text style={styles.holoBadgeText}>✨ TNPDS SECURE</Text>
              </View>
            </View>

            {/* Main Details Body */}
            <View style={[styles.cardMainBody, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
              {/* Left: Cardholder Photo Frame */}
              <View style={[styles.photoColumn, isMobile && { width: '100%', marginBottom: 8 }]}>
                <View style={styles.photoBorderFrame}>
                  <CardholderAvatar 
                    profileImage={profileImage} 
                    onImageSelected={onImageSelected} 
                    size={isMobile ? 80 : 96} 
                    editable={true} 
                  />
                  <View style={styles.photoVerifiedStamp}>
                    <Text style={styles.photoVerifiedStampText}>✓ VERIFIED</Text>
                  </View>
                </View>
                <Text style={styles.photoCaption}>{lang === 'ta' ? 'குடும்பத் தலைவர்' : 'Head of Family'}</Text>
                <Text style={styles.photoSubCaption}>Tap photo to update</Text>
              </View>

              {/* Center: Card Details Grid */}
              <View style={[styles.detailsColumn, isMobile && { width: '100%' }]}>
                {/* Large Embossed Card Number */}
                <View style={styles.cardNoContainer}>
                  <Text style={styles.cardNoLabel}>{lang === 'ta' ? 'குடும்ப அட்டை எண் / Card No:' : 'Ration Card Number:'}</Text>
                  <TouchableOpacity onPress={handleCopyCardNo} activeOpacity={0.7} style={styles.cardNoTouch}>
                    <Text style={styles.cardNoValue}>{user.card_no}</Text>
                    <Text style={styles.copyIconBadge}>{copied ? '✓ Copied' : '📋 Copy'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Field Details */}
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>குடும்பத் தலைவர் / Name:</Text>
                    <Text style={styles.fieldValueBold}>{user.holder_name}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>தந்தை/கணவர் / Father's Name:</Text>
                    <Text style={styles.fieldValue}>{cardConfig.fatherName}</Text>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>பிறந்த தேதி / D.O.B:</Text>
                    <Text style={styles.fieldValue}>{cardConfig.dob} ({cardConfig.gender})</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>நியாய விலைக் கடை / FPS Code:</Text>
                    <Text style={styles.fieldValueHighlight}>{cardConfig.fpsCode} - {cardConfig.fpsName}</Text>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridColFull}>
                    <Text style={styles.fieldLabel}>முகவரி / Registered Address:</Text>
                    <Text style={styles.fieldValueAddress}>{lang === 'ta' ? cardConfig.addressTa : cardConfig.address}</Text>
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>உறுப்பினர்கள் / Family Size:</Text>
                    <Text style={styles.fieldValueBold}>👨‍👩‍👧‍👦 {user.family_size} Members ({lang === 'ta' ? 'ஆதார் சரிபார்க்கப்பட்டது' : 'Aadhaar Seeded ✓'})</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>எரிவாயு / LPG Cylinders:</Text>
                    <Text style={styles.fieldValue}>{lang === 'ta' ? cardConfig.cylindersTa : cardConfig.cylinders}</Text>
                  </View>
                </View>
              </View>

              {/* Right: Embedded QR Code */}
              <View style={[styles.qrColumn, isMobile && { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 8 }]}>
                <View style={styles.qrFrame}>
                  {cardQrUri ? (
                    <Image source={{ uri: cardQrUri }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.qrFallback}><Text style={{ fontSize: 10 }}>[QR Code]</Text></View>
                  )}
                  <Text style={styles.qrLabel}>TNPDS AUTH QR</Text>
                </View>
                <View style={styles.sealBadge}>
                  <Text style={styles.sealBadgeText}>🔒 ISO 27001</Text>
                  <Text style={styles.sealBadgeText}>GOVT OF TN</Text>
                </View>
              </View>
            </View>


          </View>
        ) : (
          /* ============================================================== */
          /*                        CARD BACK VIEW                          */
          /* ============================================================== */
          <View style={styles.cardBackContent}>
            {/* Back Header */}
            <View style={styles.backHeaderBand}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={TN_EMBLEM_ASSET} style={{ width: 28, height: 28 }} resizeMode="contain" />
                <View>
                  <Text style={styles.backHeaderTitle}>குடும்ப உறுப்பினர்கள் விவரம் / REGISTERED FAMILY MEMBERS</Text>
                  <Text style={styles.backHeaderSub}>Department of Civil Supplies & Consumer Protection, Tamil Nadu</Text>
                </View>
              </View>
              <View style={styles.aadhaarSeededBadge}>
                <Text style={styles.aadhaarSeededText}>✓ 100% Aadhaar Seeded</Text>
              </View>
            </View>

            {/* Family Members Table */}
            <View style={styles.memberTable}>
              <View style={styles.tableHead}>
                <Text style={[styles.thCell, { width: 35 }]}>#</Text>
                <Text style={[styles.thCell, { flex: 2.2 }]}>பெயர் / Member Name</Text>
                <Text style={[styles.thCell, { flex: 1.8 }]}>உறவு முறை / Relation</Text>
                <Text style={[styles.thCell, { width: 55 }]}>வயது / Age</Text>
                <Text style={[styles.thCell, { width: 70 }]}>பாலினம் / Sex</Text>
                <Text style={[styles.thCell, { flex: 1.5, textAlign: 'center' }]}>ஆதார் நிலை / Aadhaar</Text>
              </View>

              {familyMembers.map((m, idx) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tdCell, { width: 35, fontWeight: '700' }]}>{m.sl}</Text>
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.tdNameBold}>{m.name}</Text>
                    <Text style={styles.tdNameTa}>{m.nameTa}</Text>
                  </View>
                  <Text style={[styles.tdCell, { flex: 1.8, color: '#334155' }]}>{m.relation}</Text>
                  <Text style={[styles.tdCell, { width: 55, fontWeight: '600' }]}>{m.age} yrs</Text>
                  <Text style={[styles.tdCell, { width: 70, color: '#475569' }]}>{m.gender}</Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View style={styles.linkedChip}>
                      <Text style={styles.linkedChipText}>✓ {m.aadhaar}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Shop & Citizen Support Contact */}
            <View style={[styles.backFooterRow, isMobile && { flexDirection: 'column' }]}>
              <View style={styles.backSupportBox}>
                <Text style={styles.backSupportTitle}>🏢 நியாய விலைக் கடை விவரம் (Fair Price Shop):</Text>
                <Text style={styles.backSupportText}>FPS #401 - GN Chetty Road, T. Nagar, Chennai - 600017</Text>
                <Text style={styles.backSupportText}>நேரம்: 08:30 AM - 12:30 PM & 04:00 PM - 08:00 PM (செவ்வாய் விடுமுறை)</Text>
              </View>

              <View style={styles.backHelplineBox}>
                <Text style={styles.backHelplineTitle}>📞 கட்டணமில்லா உதவி எண் (Toll-Free Helpline):</Text>
                <Text style={styles.backHelplineNumber}>1967 / 1800-425-5901</Text>
                <Text style={styles.backPortalUrl}>இணைய முகவரி: www.tnpds.gov.in</Text>
              </View>

              <View style={styles.authSignBox}>
                <Text style={styles.authSignLabel}>Commissioner</Text>
                <Text style={styles.authSignDept}>Civil Supplies & Consumer Protection</Text>
                <Text style={styles.authSignCity}>Government of Tamil Nadu</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginBottom: 16
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3
  },
  viewTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  viewTabActive: {
    backgroundColor: '#0B3D91',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  viewTabTextActive: {
    color: '#FFFFFF'
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A'
  },
  actionPillPrimary: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  actionPillPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },

  // CARD CONTAINER
  cardContainer: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0B3D91',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8
  },
  watermarkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.05,
    overflow: 'hidden'
  },
  watermarkEmblem: {
    width: 280,
    height: 280
  },
  watermarkTextPattern: {
    position: 'absolute',
    bottom: 12,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2
  },

  // CARD FRONT STYLES
  cardFrontContent: {
    padding: 12
  },
  cardHeaderBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#061E47',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FF9933'
  },
  emblemWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 2
  },
  headerEmblem: {
    width: 40,
    height: 40
  },
  headerEmblemNational: {
    width: 36,
    height: 36
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  tnGovTextEn: {
    color: '#FF9933',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  tnGovTextTa: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  deptText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1
  },
  cardBannerText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2
  },

  // SUB-HEADER STRIP
  subHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  emvChip: {
    width: 36,
    height: 28,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B45309',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chipInnerGrid: {
    width: '100%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: '#78350F',
    borderRadius: 2,
    position: 'relative'
  },
  chipPadTopLeft: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#78350F'
  },
  chipPadTopRight: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderLeftWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#78350F'
  },
  chipPadCenter: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    bottom: 8,
    borderWidth: 0.5,
    borderColor: '#78350F'
  },
  chipPadBottomLeft: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRightWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: '#78350F'
  },
  chipPadBottomRight: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderLeftWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: '#78350F'
  },
  contactlessIcon: {
    fontSize: 16
  },
  categoryRibbon: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  categoryRibbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  holoBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#94A3B8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  holoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569'
  },

  // MAIN BODY
  cardMainBody: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 12
  },
  photoColumn: {
    alignItems: 'center',
    width: 104
  },
  photoBorderFrame: {
    borderWidth: 2,
    borderColor: '#0B3D91',
    borderRadius: 8,
    padding: 2,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  photoVerifiedStamp: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  photoVerifiedStampText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900'
  },
  photoCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center'
  },
  photoSubCaption: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center'
  },

  // DETAILS COLUMN
  detailsColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  cardNoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  cardNoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },
  cardNoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardNoValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B3D91',
    letterSpacing: 1
  },
  copyIconBadge: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700'
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 8
  },
  gridCol: {
    flex: 1
  },
  gridColFull: {
    flex: 1
  },
  fieldLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600'
  },
  fieldValueBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  fieldValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B'
  },
  fieldValueHighlight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B3D91'
  },
  fieldValueAddress: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 13
  },

  // QR COLUMN
  qrColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  qrImage: {
    width: 68,
    height: 68
  },
  qrFallback: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qrLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2
  },
  sealBadge: {
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#94A3B8',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignItems: 'center'
  },
  sealBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#64748B'
  },

  // FOOTER BAND
  cardFooterBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    paddingHorizontal: 4
  },
  socketLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  socketLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  socketLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D'
  },
  barcodeVisual: {
    fontSize: 11,
    color: '#334155',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined
  },
  validityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },

  // ==================== CARD BACK STYLES ====================
  cardBackContent: {
    padding: 12
  },
  backHeaderBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#061E47',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  backHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  backHeaderSub: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '500'
  },
  aadhaarSeededBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  aadhaarSeededText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },

  // TABLE
  memberTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    marginBottom: 8
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#0B3D91',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center'
  },
  thCell: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0'
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC'
  },
  tdCell: {
    fontSize: 10,
    color: '#0F172A'
  },
  tdNameBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  tdNameTa: {
    fontSize: 9,
    color: '#64748B'
  },
  linkedChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#86EFAC'
  },
  linkedChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D'
  },

  // BACK FOOTER
  backFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
    gap: 8
  },
  backSupportBox: {
    flex: 1.4
  },
  backSupportTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  backSupportText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 11
  },
  backHelplineBox: {
    flex: 1.1
  },
  backHelplineTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  backHelplineNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B3D91'
  },
  backPortalUrl: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2
  },
  authSignBox: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    paddingLeft: 6
  },
  authSignLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B3D91'
  },
  authSignDept: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'center'
  },
  authSignCity: {
    fontSize: 7,
    fontWeight: '700',
    color: '#15803D',
    textAlign: 'center'
  }
});
