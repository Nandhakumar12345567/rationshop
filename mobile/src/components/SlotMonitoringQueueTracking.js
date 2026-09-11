import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

const TN_EMBLEM_ASSET = require('../../assets/tn_emblem.png');

// Helper to compute token timing across a 1-hour slot (20 tokens, 3 mins each)
export function calculateTokenTime(slotDisplayTime, tokenNumber) {
  if (!slotDisplayTime) return '09:00 AM';
  const startPart = slotDisplayTime.split('-')[0].trim();
  const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return startPart;
  
  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  const tokenIdx = Math.max(1, Math.min(20, parseInt(tokenNumber, 10) || 1));
  const addedMinutes = (tokenIdx - 1) * 3;
  
  let totalMinutes = hours * 60 + minutes + addedMinutes;
  let finalHours = Math.floor(totalMinutes / 60) % 24;
  let finalMinutes = totalMinutes % 60;
  
  const finalAmPm = finalHours >= 12 ? 'PM' : 'AM';
  const displayHours = finalHours % 12 === 0 ? 12 : finalHours % 12;
  const padMin = String(finalMinutes).padStart(2, '0');
  
  return `${String(displayHours).padStart(2, '0')}:${padMin} ${finalAmPm}`;
}

const SAMPLE_BENEFICIARIES = [
  { name: 'Ramesh Kumar', nameTa: 'ரமேஷ் குமார்' },
  { name: 'Lakshmi', nameTa: 'லட்சுமி' },
  { name: 'Selvi', nameTa: 'செல்வி' },
  { name: 'Murugan', nameTa: 'முருகன்' },
  { name: 'Priya Sundaram', nameTa: 'பிரியா சுந்தரம்' },
  { name: 'Karthik Subramanian', nameTa: 'கார்த்திக்' },
  { name: 'Anbarasan', nameTa: 'அன்பரசன்' },
  { name: 'Meenakshi', nameTa: 'மீனாட்சி' },
  { name: 'Vignesh', nameTa: 'விக்னேஷ்' },
  { name: 'Deepa', nameTa: 'தீபா' },
  { name: 'Saravanan', nameTa: 'சரவணன்' },
  { name: 'Kavitha', nameTa: 'கவிதா' },
  { name: 'Senthil Kumar', nameTa: 'செந்தில் குமார்' },
  { name: 'Radhika', nameTa: 'ராதிகா' },
  { name: 'Manikandan', nameTa: 'மணிகண்டன்' },
  { name: 'Gomathi', nameTa: 'கோமதி' },
  { name: 'Arumugam', nameTa: 'ஆறுமுகம்' },
  { name: 'Revathi', nameTa: 'ரேவதி' },
  { name: 'Dhanasekaran', nameTa: 'தனசேகரன்' },
  { name: 'Balamurugan', nameTa: 'பாலமுருகன்' }
];

export default function SlotMonitoringQueueTracking({ 
  user, 
  lang = 'en', 
  onToggleLang,
  activeBookings = [],
  selectedSlot,
  selectedSlotObj,
  selectedDate,
  slots = [],
  onSelectSlot
}) {
  const [internalLang, setInternalLang] = useState(lang);
  const [simulate20Tokens, setSimulate20Tokens] = useState(false);
  const currentLang = onToggleLang ? lang : internalLang;
  const isTamil = currentLang === 'ta';

  const handleLangChange = (selected) => {
    if (onToggleLang) {
      onToggleLang(selected);
    } else {
      setInternalLang(selected);
    }
  };

  // Resolve current active slot object
  const activeSlot = selectedSlotObj || (slots.find(s => s.slot_time === selectedSlot)) || slots[0] || {
    slot_time: '09:00 AM - 10:00 AM',
    display_time: '09:00 AM - 10:00 AM',
    booked_count: 0,
    max_capacity: 20,
    booked_tokens: [],
    booked_token_numbers: []
  };

  const slotDisplayTime = activeSlot.display_time || (activeSlot.slot_time ? activeSlot.slot_time.split(' ').slice(-4).join(' ') : '09:00 AM - 10:00 AM');

  // Format date display (e.g. "11 Sept 2026")
  const dateToFormat = selectedDate ? new Date(selectedDate) : new Date();
  const dateFormatted = !isNaN(dateToFormat.getTime()) 
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateToFormat)
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  // Determine booked queue for the selected slot
  let queue = [];

  if (simulate20Tokens) {
    // Generate all 20 tokens for testing full capacity in selected slot
    queue = Array.from({ length: 20 }, (_, idx) => {
      const tokenNum = idx + 1;
      const samplePerson = SAMPLE_BENEFICIARIES[idx % SAMPLE_BENEFICIARIES.length];
      const time = calculateTokenTime(slotDisplayTime, tokenNum);
      let status = 'Waiting';
      if (tokenNum <= 2) status = 'Serving';
      else if (tokenNum === 3) status = 'Next';

      // Mark user if token matches or user booked
      const isUser = tokenNum === 1 || (user && user.holder_name === samplePerson.name);

      return {
        token: `T${String(tokenNum).padStart(3, '0')}`,
        token_number: tokenNum,
        name: isUser ? (user?.holder_name || user?.name || samplePerson.name) : samplePerson.name,
        nameTa: isUser ? (user?.holder_name || user?.name || samplePerson.nameTa) : samplePerson.nameTa,
        time,
        status,
        isUser
      };
    });
  } else {
    // Read actual booked tokens from backend for this selected slot
    const rawBookedTokens = activeSlot.booked_tokens || [];

    queue = rawBookedTokens.map((item, idx) => {
      const tokenNum = item.token_number || (idx + 1);
      const isUser = (user && item.card_no === user.card_no) || item.is_user;
      return {
        token: item.token || `T${String(tokenNum).padStart(3, '0')}`,
        token_number: tokenNum,
        name: isUser ? (user?.holder_name || user?.name || item.name) : (item.name || 'Beneficiary'),
        nameTa: isUser ? (user?.holder_name || user?.name || item.nameTa) : (item.nameTa || item.name || 'பயனாளி'),
        time: item.time || calculateTokenTime(slotDisplayTime, tokenNum),
        status: item.status || (idx === 0 ? 'Serving' : idx === 1 ? 'Next' : 'Waiting'),
        isUser
      };
    });

    // Also merge any active booking for current user in this slot if not already listed
    if (activeBookings && activeBookings.length > 0) {
      activeBookings.forEach((b) => {
        const slotMatches = b.slot_time && (b.slot_time === activeSlot.slot_time || b.slot_time.includes(slotDisplayTime));
        if (slotMatches) {
          const userTokenNum = b.token_number || 1;
          const userTokenCode = `T${String(userTokenNum).padStart(3, '0')}`;
          if (!queue.some(q => q.token === userTokenCode || q.token_number === userTokenNum)) {
            queue.push({
              token: userTokenCode,
              token_number: userTokenNum,
              name: user?.holder_name || user?.name || 'Your Token',
              nameTa: user?.holder_name || user?.name || 'உங்கள் டோக்கன்',
              time: calculateTokenTime(slotDisplayTime, userTokenNum),
              status: b.status === 'ISSUED' ? 'Serving' : 'Waiting',
              isUser: true
            });
          }
        }
      });
    }

    // Sort strictly by token number
    queue.sort((a, b) => a.token_number - b.token_number);
  }

  // Calculate Metrics for the selected slot
  const totalSlots = activeSlot.max_capacity || 20;
  const bookedCount = simulate20Tokens ? 20 : (activeSlot.booked_count !== undefined ? activeSlot.booked_count : queue.length);
  const availableSlots = Math.max(0, totalSlots - bookedCount);
  const waitingCount = queue.filter(q => q.status === 'Waiting').length;

  return (
    <View style={styles.cardContainer}>
      {/* Top Header with TN Emblem, Titles and Language Pill */}
      <View style={styles.headerWrapper}>
        <View style={styles.waveAccentContainer} pointerEvents="none">
          <Svg width={140} height={70} viewBox="0 0 140 70" fill="none">
            <Path d="M10 0 C 40 40, 90 20, 140 35 L 140 0 Z" fill="rgba(245, 158, 11, 0.15)" />
            <Path d="M30 0 C 60 45, 100 25, 140 45 L 140 0 Z" fill="rgba(255, 255, 255, 0.4)" />
            <Path d="M50 0 C 80 50, 110 30, 140 55 L 140 0 Z" fill="rgba(16, 185, 129, 0.15)" />
          </Svg>
        </View>

        <View style={styles.headerTopRow}>
          <View style={styles.emblemTitleGroup}>
            <View style={styles.emblemBadge}>
              <Image source={TN_EMBLEM_ASSET} style={styles.emblemImage} resizeMode="contain" />
            </View>
            <View style={styles.govtTextCol}>
              <Text style={styles.govtTitle}>
                {isTamil ? 'தமிழ்நாடு அரசு' : 'Government of Tamil Nadu'}
              </Text>
              <Text style={styles.deptSubtitle}>
                {isTamil 
                  ? 'உணவு பொருள் வழங்கல் மற்றும் நுகர்வோர் பாதுகாப்புத் துறை'
                  : 'Department of Civil Supplies & Consumer Protection'}
              </Text>
            </View>
          </View>

          {/* Language Toggle Pill */}
          <View style={styles.langPill}>
            <TouchableOpacity 
              style={[styles.langSide, isTamil && styles.langSideActive]}
              onPress={() => handleLangChange('ta')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langText, isTamil && styles.langTextActive]}>தமிழ்</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langSide, !isTamil && styles.langSideActive]}
              onPress={() => handleLangChange('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langText, !isTamil && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Section Titles */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>
            {isTamil ? 'ஸ்மார்ட் ரேஷன்' : 'Smart Ration'}
          </Text>
          <Text style={styles.mainSubtitle}>
            {isTamil ? 'ஸ்லாட் கண்காணிப்பு மற்றும் வரிசை கண்காணிப்பு' : 'Slot Monitoring & Queue Tracking'}
          </Text>
        </View>
      </View>

      {/* Fair Price Shop Info Card */}
      <View style={styles.fpsCard}>
        <View style={styles.fpsLeftIconBox}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9L4.5 4H19.5L21 9V11C21 12.1 20.1 13 19 13C17.9 13 17 12.1 17 11C17 12.1 16.1 13 15 13C13.9 13 13 12.1 13 11C13 12.1 12.1 13 11 13C9.9 13 9 12.1 9 11C9 12.1 8.1 13 7 13C5.9 13 5 12.1 5 11V9H3Z"
              fill="#0F3D75"
            />
            <Path
              d="M5 13V20H19V13"
              stroke="#0F3D75"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect x="9" y="15" width="6" height="5" fill="#0F3D75" rx={1} />
          </Svg>
        </View>

        <View style={styles.fpsDetailsCol}>
          <Text style={styles.fpsHeading}>
            {isTamil ? 'நியாய விலைக்கடை' : 'Fair Price Shop'}
          </Text>
          <Text style={styles.fpsShopNo}>
            {isTamil ? 'ரேஷன் கடை எண் : 1023' : 'Ration Shop No : 1023'}
          </Text>
          <Text style={styles.fpsAddress}>
            {isTamil ? 'பேருந்து நிலையம் அருகில், தமிழ்நாடு' : 'Near Bus Stand, Tamil Nadu'}
          </Text>
        </View>

        <View style={styles.openBadge}>
          <View style={styles.openGreenDot} />
          <View style={styles.openBadgeTextCol}>
            <Text style={styles.openBadgeLine1}>{isTamil ? 'திறந்துள்ளது' : 'Open'}</Text>
            <Text style={styles.openBadgeLine2}>{isTamil ? 'இன்று' : 'Today'}</Text>
          </View>
        </View>
      </View>

      {/* Selected Time Slot Quick Tabs Bar */}
      {slots && slots.length > 0 && (
        <View style={styles.slotPillsContainer}>
          <Text style={styles.slotPillsHeader}>
            {isTamil ? 'நேர ஸ்லாட்டைத் தேர்வுசெய்க:' : 'Selected Slot for Queue:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotPillsRow}>
            {slots.map((s) => {
              const isSelected = s.slot_time === activeSlot.slot_time;
              const pillBookedCount = s.booked_count || (s.booked_tokens ? s.booked_tokens.length : 0);
              return (
                <TouchableOpacity
                  key={s.slot_time}
                  style={[
                    styles.slotPillItem,
                    isSelected && styles.slotPillItemSelected
                  ]}
                  onPress={() => onSelectSlot && onSelectSlot(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotPillText, isSelected && styles.slotPillTextSelected]}>
                    {s.display_time}
                  </Text>
                  <View style={[styles.slotPillBadge, isSelected && styles.slotPillBadgeSelected]}>
                    <Text style={[styles.slotPillBadgeText, isSelected && styles.slotPillBadgeTextSelected]}>
                      {pillBookedCount}/20
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4 Stats Metrics Strip (Dynamically linked to the Selected Slot) */}
      <View style={styles.statsStrip}>
        {/* Metric 1: Total Slots */}
        <View style={styles.statCol}>
          <View style={styles.statIconWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="9" cy="7" r="4" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.statLabel}>{isTamil ? 'மொத்த ஸ்லாட்' : 'Total Slots'}</Text>
          <Text style={styles.statValueNavy}>{totalSlots}</Text>
        </View>

        {/* Metric 2: Booked */}
        <View style={styles.statCol}>
          <View style={styles.statIconWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="4" width="18" height="18" rx="3" ry="3" stroke="#0F2942" strokeWidth={2.2} />
              <Line x1="16" y1="2" x2="16" y2="6" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" />
              <Line x1="8" y1="2" x2="8" y2="6" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" />
              <Line x1="3" y1="10" x2="21" y2="10" stroke="#0F2942" strokeWidth={1.8} />
              <Path d="M9 15l2 2 4-4" stroke="#0F2942" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.statLabel}>{isTamil ? 'முன்பதிவு' : 'Booked'}</Text>
          <Text style={styles.statValueNavy}>{bookedCount}</Text>
        </View>

        {/* Metric 3: Available */}
        <View style={styles.statCol}>
          <View style={styles.statIconWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke="#D97706" strokeWidth={2.2} />
              <Polyline points="12 7 12 12 15 15" stroke="#D97706" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={[styles.statLabel, { color: '#D97706' }]}>
            {isTamil ? 'கிடைப்பது' : 'Available'}
          </Text>
          <Text style={styles.statValueOrange}>{availableSlots}</Text>
        </View>

        {/* Metric 4: Waiting */}
        <View style={styles.statCol}>
          <View style={styles.statIconWrap}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"
                stroke="#DC2626"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={[styles.statLabel, { color: '#DC2626' }]}>
            {isTamil ? 'காத்திருப்பு' : 'Waiting'}
          </Text>
          <Text style={styles.statValueRed}>{waitingCount}</Text>
        </View>
      </View>

      {/* Today's Queue Section Header linked with Active Slot Time */}
      <View style={styles.queueHeaderRow}>
        <View style={styles.queueTitleGroup}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="#0F2942" />
            <Circle cx="9" cy="7" r="4" fill="#0F2942" />
            <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#0F2942" strokeWidth={2} strokeLinecap="round" />
            <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#0F2942" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.queueTitleText}>
            {isTamil ? 'வரிசை' : "Queue"} • {slotDisplayTime}
          </Text>
          <View style={styles.bookedCountBadge}>
            <Text style={styles.bookedCountBadgeText}>
              {bookedCount}/20 {isTamil ? 'பதிவு' : 'Booked'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Quick Simulation Test Button */}
          <TouchableOpacity
            style={[styles.testSimulationBtn, simulate20Tokens && styles.testSimulationBtnActive]}
            onPress={() => setSimulate20Tokens(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.testSimulationBtnText, simulate20Tokens && styles.testSimulationBtnTextActive]}>
              {simulate20Tokens ? '🔄 Real DB' : '⚡ Test 20 Tokens'}
            </Text>
          </TouchableOpacity>

          <View style={styles.queueDateGroup}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#64748B" strokeWidth={2} />
              <Line x1="16" y1="2" x2="16" y2="6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
              <Line x1="8" y1="2" x2="8" y2="6" stroke="#64748B" strokeWidth={2} strokeLinecap="round" />
              <Line x1="3" y1="10" x2="21" y2="10" stroke="#64748B" strokeWidth={2} />
            </Svg>
            <Text style={styles.queueDateText}>{dateFormatted}</Text>
          </View>
        </View>
      </View>

      {/* Queue List: ONLY SHOWS BOOKED TOKENS (Or Empty State if 0 Booked) */}
      <View style={styles.queueList}>
        {queue.length === 0 ? (
          <View style={styles.emptyQueueCard}>
            <View style={styles.emptyIconCircle}>
              <Text style={{ fontSize: 24 }}>📋</Text>
            </View>
            <Text style={styles.emptyQueueTitle}>
              {isTamil ? 'இந்த நேரத்திற்கு டோக்கன்கள் எதுவும் பதிவு செய்யப்படவில்லை' : `No Booked Tokens for ${slotDisplayTime}`}
            </Text>
            <Text style={styles.emptyQueueSubtitle}>
              {isTamil 
                ? 'அனைத்து 20 டோக்கன்களும் காலியாக உள்ளன. மேலே உள்ள ஸ்லாட்டில் உங்கள் டோக்கனைத் தேர்ந்தெடுக்கவும்.'
                : 'All 20 tokens are available in this slot. Only booked tokens appear in the queue list.'}
            </Text>
          </View>
        ) : (
          queue.map((item, index) => {
            let badgeBg = '#F59E0B'; // Waiting (amber)
            let statusText = isTamil ? 'காத்திருப்பு' : 'Waiting';

            if (item.status === 'Serving') {
              badgeBg = '#10B981'; // Green
              statusText = isTamil ? 'வழங்கப்படுகிறது' : 'Serving';
            } else if (item.status === 'Next') {
              badgeBg = '#3B82F6'; // Blue
              statusText = isTamil ? 'அடுத்து' : 'Next';
            } else if (item.status === 'Completed') {
              badgeBg = '#64748B';
              statusText = isTamil ? 'முடிந்தது' : 'Completed';
            }

            return (
              <View 
                key={index} 
                style={[
                  styles.queueCard,
                  item.isUser && styles.queueCardUser
                ]}
              >
                {/* Left: Token Number and Beneficiary Name */}
                <View style={styles.tokenCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.tokenNumber}>{item.token}</Text>
                    {item.isUser && (
                      <View style={styles.userStarBadge}>
                        <Text style={styles.userStarText}>YOU ⭐</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.beneficiaryName}>
                    {isTamil ? (item.nameTa || item.name) : item.name}
                  </Text>
                </View>

                {/* Center: Computed Timing for this token */}
                <View style={styles.timeCol}>
                  <Text style={styles.slotTimeText}>{item.time}</Text>
                </View>

                {/* Right: Status Badge (Serving / Next / Waiting) */}
                <View style={styles.statusBadgeCol}>
                  <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
                    <Text style={styles.statusPillText}>{statusText}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden'
  },
  headerWrapper: {
    position: 'relative',
    marginBottom: 16,
    paddingTop: 4
  },
  waveAccentContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 0
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1
  },
  emblemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  emblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  emblemImage: {
    width: '95%',
    height: '95%'
  },
  govtTextCol: {
    flex: 1,
    justifyContent: 'center'
  },
  govtTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2942',
    letterSpacing: 0.2
  },
  deptSubtitle: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
    marginTop: 1,
    lineHeight: 14
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  langSide: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF'
  },
  langSideActive: {
    backgroundColor: '#0F2942'
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  langTextActive: {
    color: '#FFFFFF'
  },
  titleSection: {
    marginTop: 14,
    zIndex: 1
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2942',
    letterSpacing: 0.3
  },
  mainSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },

  // Fair Price Shop Card
  fpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  fpsLeftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  fpsDetailsCol: {
    flex: 1
  },
  fpsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  fpsShopNo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2
  },
  fpsAddress: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  openGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A'
  },
  openBadgeTextCol: {
    alignItems: 'flex-start'
  },
  openBadgeLine1: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    lineHeight: 13
  },
  openBadgeLine2: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    lineHeight: 12
  },

  // Slot Pills Quick Bar
  slotPillsContainer: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  slotPillsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  slotPillsRow: {
    gap: 8,
    paddingRight: 8
  },
  slotPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6
  },
  slotPillItemSelected: {
    backgroundColor: '#0F2942',
    borderColor: '#0F2942'
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  slotPillTextSelected: {
    color: '#FFFFFF'
  },
  slotPillBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  slotPillBadgeSelected: {
    backgroundColor: '#FF9933'
  },
  slotPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  slotPillBadgeTextSelected: {
    color: '#FFFFFF'
  },

  // 4 Stats Metrics Strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F0F6FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statIconWrap: {
    marginBottom: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
    textAlign: 'center'
  },
  statValueNavy: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F2942'
  },
  statValueOrange: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706'
  },
  statValueRed: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626'
  },

  // Today's Queue Section Header
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
    gap: 8
  },
  queueTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  queueTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2942'
  },
  bookedCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  bookedCountBadgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800'
  },
  testSimulationBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  testSimulationBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669'
  },
  testSimulationBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309'
  },
  testSimulationBtnTextActive: {
    color: '#FFFFFF'
  },
  queueDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  queueDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },

  // Empty Queue State
  emptyQueueCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed'
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  emptyQueueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6
  },
  emptyQueueSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 360
  },

  // Queue List & Cards
  queueList: {
    gap: 8
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  queueCardUser: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    backgroundColor: '#EFF6FF'
  },
  tokenCol: {
    flex: 1.3
  },
  tokenNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F2942'
  },
  userStarBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  userStarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  beneficiaryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2
  },
  timeCol: {
    flex: 1,
    alignItems: 'center'
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569'
  },
  statusBadgeCol: {
    flex: 1,
    alignItems: 'flex-end'
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
