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
      <View style={[styles.cardContainer, { borderColor: '#064E3B', backgroundColor: '#FFFFFF' }]}>
        
        {/* Subtle Watermark Layer */}
        <View style={styles.watermarkLayer} pointerEvents="none">
          <Image source={TN_EMBLEM_ASSET} style={styles.watermarkEmblem} resizeMode="contain" />
          <Text style={styles.watermarkTextPattern}>TNPDS • SMART RATION CARD • தமிழ்நாடு அரசு • மின்னணு குடும்ப அட்டை</Text>
        </View>

        {!showBack ? (
          /* ============================================================== */
          /*             NEW GREEN MODEL (EXACT IMAGE 2 MATCH)              */
          /* ============================================================== */
          <View style={styles.cardFrontContentGreen}>
            {/* Top Emerald Green Header Band */}
            <View style={styles.cardHeaderBandGreen}>
              <View style={styles.emblemWrapperGreen}>
                <Image source={TN_EMBLEM_ASSET} style={styles.headerEmblemGreen} resizeMode="contain" />
              </View>

              <View style={styles.headerTitlesGreen}>
                <Text style={styles.tnGovTextEnGreen}>GOVERNMENT OF TAMIL NADU</Text>
                <Text style={styles.tnGovTextTaGreen}>தமிழ்நாடு அரசு</Text>
                <Text style={styles.deptTextGreen}>Department of Civil Supplies & Consumer Protection</Text>
                <Text style={styles.cardBannerTextGreen}>மின்னணு அட்டை - SMART RATION CARD</Text>
              </View>
            </View>

            {/* Category Badge Ribbon Centered Below Header */}
            <View style={styles.categoryPillRowGreen}>
              <View style={styles.categoryPillGreen}>
                <Text style={styles.categoryPillTextGreen}>
                  {cardConfig.categoryTextEn}
                </Text>
              </View>
            </View>

            {/* Main Details Body */}
            <View style={[styles.cardMainBodyGreen, isMobile && styles.cardMainBodyGreenMobile]}>
              {/* Left Column: Avatar & Head of Family */}
              <View style={[styles.photoColumnGreen, isMobile && styles.photoColumnGreenMobile]}>
                <View style={styles.photoBorderFrameGreen}>
                  <CardholderAvatar 
                    profileImage={profileImage} 
                    onImageSelected={onImageSelected} 
                    size={isMobile ? 74 : 84} 
                    editable={true} 
                  />
                  <View style={styles.photoVerifiedStampGreen}>
                    <Text style={styles.photoVerifiedStampTextGreen}>✓ Verified</Text>
                  </View>
                </View>
                <Text style={styles.photoCaptionGreen}>Head of Family</Text>
                <Text style={styles.photoSubCaptionGreen}>குடும்பத் தலைவர்</Text>
              </View>

              {/* Right Column: 2-Column Details Grid */}
              <View style={[styles.detailsColumnGreen, isMobile && styles.detailsColumnGreenMobile]}>
                <View style={[styles.detailsTwoColGrid, isMobile && styles.detailsTwoColGridMobile]}>
                  {/* Left Column Fields */}
                  <View style={[styles.subColLeft, isMobile && { width: '100%' }]}>
                    {/* Ration Card Number */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>🪪</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Ration Card Number</Text>
                        <Text style={styles.fieldCardNoValue}>{user.card_no}</Text>
                      </View>
                    </View>

                    {/* Name */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>👤</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Name</Text>
                        <Text style={styles.fieldValueBoldGreen}>{user.holder_name}</Text>
                      </View>
                    </View>

                    {/* Gender / வயது / Age */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>🧍</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Gender / வயது / Age</Text>
                        <Text style={styles.fieldValueBoldGreen}>
                          {user.card_no === 'TN-04-AAY-109283' ? 'Female / பெண் / 42 Years' : `${cardConfig.gender} / ${cardConfig.dob}`}
                        </Text>
                      </View>
                    </View>

                    {/* Address */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>📍</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Address</Text>
                        <Text style={styles.fieldValueAddressGreen}>
                          {lang === 'ta' ? cardConfig.addressTa : cardConfig.address}
                        </Text>
                      </View>
                    </View>

                    {/* 5 Members (Aadhaar Seeded ✓) */}
                    <View style={[styles.fieldRowItem, { marginBottom: 0 }]}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>👥</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldMembersTextGreen}>
                          {user.family_size || 5} Members (Aadhaar Seeded ✓)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right Column Fields */}
                  <View style={[styles.subColRight, isMobile && { width: '100%', marginTop: 8 }]}>
                    {/* Father's Name */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>👤</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Father's Name</Text>
                        <Text style={styles.fieldValueBoldGreen}>
                          {user.card_no === 'TN-04-AAY-109283' ? 'Sundaram' : cardConfig.fatherName.split('/')[0].trim()}
                        </Text>
                      </View>
                    </View>

                    {/* FPS Code */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>🏪</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>FPS Code</Text>
                        <Text style={styles.fieldValueBoldGreen}>
                          {cardConfig.fpsCode === '02YD0401' ? '02V00401 - FPS 401 (T. Nagar)' : `${cardConfig.fpsCode} - ${cardConfig.fpsName}`}
                        </Text>
                      </View>
                    </View>

                    {/* Family Type */}
                    <View style={styles.fieldRowItem}>
                      <View style={styles.greenIconSquare}>
                        <Text style={styles.greenIconGlyph}>👥</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabelGreen}>Family Type</Text>
                        <Text style={styles.fieldValueBoldGreen}>
                          {user.card_no === 'TN-04-AAY-109283' ? '1 Cylinder (RC-1)' : cardConfig.cylinders}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Dark Green Stripe */}
            <View style={styles.cardBottomStripeGreen} />
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
    backgroundColor: '#064E3B',
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
    backgroundColor: '#064E3B',
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#064E3B',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  watermarkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.04,
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

  /* NEW GREEN MODEL STYLES (EXACT MATCH TO IMAGE 2) */
  cardFrontContentGreen: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  cardHeaderBandGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative'
  },
  emblemWrapperGreen: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  },
  headerEmblemGreen: {
    width: 42,
    height: 42
  },
  headerTitlesGreen: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10
  },
  tnGovTextEnGreen: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center'
  },
  tnGovTextTaGreen: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1
  },
  deptTextGreen: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2
  },
  cardBannerTextGreen: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 2
  },
  categoryPillRowGreen: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4
  },
  categoryPillGreen: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2
  },
  categoryPillTextGreen: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  cardMainBodyGreen: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: '#FFFFFF'
  },
  cardMainBodyGreenMobile: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  photoColumnGreen: {
    alignItems: 'center',
    width: 100
  },
  photoColumnGreenMobile: {
    width: '100%',
    marginBottom: 10
  },
  photoBorderFrameGreen: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 3,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  photoVerifiedStampGreen: {
    marginTop: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoVerifiedStampTextGreen: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  photoCaptionGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    textAlign: 'center'
  },
  photoSubCaptionGreen: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center'
  },
  detailsColumnGreen: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 14,
    justifyContent: 'center'
  },
  detailsColumnGreenMobile: {
    width: '100%',
    borderLeftWidth: 0,
    paddingLeft: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12
  },
  detailsTwoColGrid: {
    flexDirection: 'row',
    gap: 16
  },
  detailsTwoColGridMobile: {
    flexDirection: 'column',
    gap: 8
  },
  subColLeft: {
    flex: 1.15
  },
  subColRight: {
    flex: 0.85
  },
  fieldRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  greenIconSquare: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1
  },
  greenIconGlyph: {
    fontSize: 12
  },
  fieldLabelGreen: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 1
  },
  fieldCardNoValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  fieldValueBoldGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  fieldValueAddressGreen: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 14
  },
  fieldMembersTextGreen: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A'
  },
  cardBottomStripeGreen: {
    height: 6,
    backgroundColor: '#064E3B',
    width: '100%',
    marginTop: 8
  },

  // ==================== CARD BACK STYLES ====================
  cardBackContent: {
    padding: 12
  },
  backHeaderBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064E3B',
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
    color: '#D1FAE5',
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
    backgroundColor: '#064E3B',
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
