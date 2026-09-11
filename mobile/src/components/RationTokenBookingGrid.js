import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

export default function RationTokenBookingGrid({
  selectedSlotObj,
  selectedTokenNumber = 1,
  onSelectToken,
  onBack,
  lang = 'en'
}) {
  const isTamil = lang === 'ta';

  // Booked token numbers: strictly use actual slot bookings from backend (empty array if no bookings)
  const bookedNumbers = selectedSlotObj?.booked_token_numbers || [];

  // Calculate estimated time for selected token
  const getEstimatedTime = () => {
    let startHour = 9;
    let startMin = 30; // Matches Image 2 default: 09:30 AM
    let isPM = false;

    if (selectedSlotObj?.slot_time) {
      const match = selectedSlotObj.slot_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        startHour = parseInt(match[1], 10);
        startMin = parseInt(match[2], 10);
        isPM = match[3].toUpperCase() === 'PM';
      }
    }

    const totalMinutes = (startHour % 12) * 60 + startMin + (selectedTokenNumber - 1) * 3;
    let calcHour = Math.floor(totalMinutes / 60);
    const calcMin = totalMinutes % 60;
    if (calcHour === 0) calcHour = 12;

    const formattedHour = String(calcHour).padStart(2, '0');
    const formattedMin = String(calcMin).padStart(2, '0');
    const ampm = isPM ? 'PM' : 'AM';

    return `${formattedHour}:${formattedMin} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar matching Image 2 */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Storefront Icon */}
        <View style={styles.headerIconWrap}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9L4.5 4H19.5L21 9V11C21 12.1 20.1 13 19 13C17.9 13 17 12.1 17 11C17 12.1 16.1 13 15 13C13.9 13 13 12.1 13 11C13 12.1 12.1 13 11 13C9.9 13 9 12.1 9 11C9 12.1 8.1 13 7 13C5.9 13 5 12.1 5 11V9H3Z"
              fill="#FFFFFF"
            />
            <Path
              d="M5 13V20H19V13"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect x="9" y="15" width="6" height="5" fill="#FFFFFF" rx={1} />
          </Svg>
        </View>

        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>
            {isTamil ? 'ரேஷன் கடை' : 'Ration Shop'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isTamil ? 'டோக்கன் முன்பதிவு' : 'Token Booking'}
          </Text>
        </View>
      </View>

      {/* 2. Main White Card Container */}
      <View style={styles.cardBody}>
        {/* Section Heading */}
        <Text style={styles.titleText}>
          {isTamil ? 'உங்கள் டோக்கன் எண்ணைத் தேர்ந்தெடுக்கவும்' : 'Select Your Token Number'}
        </Text>
        <Text style={styles.subtitleText}>
          {isTamil 
            ? '1 முதல் 20 வரை டோக்கனைத் தேர்ந்தெடுத்து உங்கள் ஸ்லாட்டை முன்பதிவு செய்யவும்' 
            : 'Choose a token from 1 to 20 and book your slot'}
        </Text>

        {/* 3. 4x5 Grid (Tokens 01 to 20) */}
        <View style={styles.tokensGrid}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
            const isBooked = bookedNumbers.includes(num);
            const isSelected = selectedTokenNumber === num;
            const twoDigit = String(num).padStart(2, '0');

            if (isBooked) {
              return (
                <View key={num} style={[styles.tileBox, styles.tileBooked]}>
                  {/* Red User Icon */}
                  <View style={styles.userIconWrap}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="#DC2626" />
                      <Circle cx="12" cy="7" r="4" fill="#DC2626" />
                    </Svg>
                  </View>
                  <Text style={styles.numBooked}>{twoDigit}</Text>
                  <Text style={styles.labelBooked}>
                    {isTamil ? 'பதிவு' : 'Booked'}
                  </Text>
                </View>
              );
            }

            if (isSelected) {
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.tileBox, styles.tileSelected]}
                  activeOpacity={0.9}
                  onPress={() => onSelectToken && onSelectToken(num)}
                >
                  <Text style={styles.numSelected}>{twoDigit}</Text>
                  <Text style={styles.labelSelected}>
                    {isTamil ? 'கிடைப்பது' : 'Available'}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={num}
                style={[styles.tileBox, styles.tileAvailable]}
                activeOpacity={0.8}
                onPress={() => onSelectToken && onSelectToken(num)}
              >
                <Text style={styles.numAvailable}>{twoDigit}</Text>
                <Text style={styles.labelAvailable}>
                  {isTamil ? 'கிடைப்பது' : 'Available'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Bottom Summary Bar (Selected Token No. | Estimated Time) */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryLeftCol}>
            {/* Slanted Green Ticket SVG Icon */}
            <View style={styles.ticketIconBox}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"
                  stroke="#0E5A3A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#ECFDF5"
                />
                <Line x1="12" y1="6" x2="12" y2="18" stroke="#0E5A3A" strokeWidth={1.5} strokeDasharray="2 2" />
              </Svg>
            </View>

            <View style={styles.summaryTextGroup}>
              <Text style={styles.summarySubLabel}>
                {isTamil ? 'தேர்ந்தெடுக்கப்பட்ட டோக்கன் எண்.' : 'Selected Token No.'}
              </Text>
              <Text style={styles.summaryTokenVal}>
                {String(selectedTokenNumber).padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Divider Line */}
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRightCol}>
            <Text style={styles.summarySubLabel}>
              {isTamil ? 'மதிப்பிடப்பட்ட நேரம்' : 'Estimated Time'}
            </Text>
            <View style={styles.timeRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke="#0F172A" strokeWidth={2} />
                <Polyline points="12 7 12 12 15 15" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.summaryTimeVal}>{getEstimatedTime()}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16
  },

  /* 1. Header Bar */
  headerBar: {
    backgroundColor: '#0E5A3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  backBtn: {
    padding: 6,
    marginRight: 6
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  headerIconWrap: {
    marginRight: 10
  },
  headerTextCol: {
    flex: 1
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  headerSubtitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1
  },

  /* 2. Main Card Body */
  cardBody: {
    backgroundColor: '#FFFFFF',
    padding: 16
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18
  },

  /* 3. 4x5 Tokens Grid */
  tokensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16
  },
  tileBox: {
    width: '22.8%',
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },

  /* Selected State: Dark Forest Green */
  tileSelected: {
    backgroundColor: '#0E5A3A',
    shadowColor: '#0E5A3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  numSelected: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  labelSelected: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2
  },

  /* Available State: Soft Mint Green */
  tileAvailable: {
    backgroundColor: '#ECFDF5'
  },
  numAvailable: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A'
  },
  labelAvailable: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 2
  },

  /* Booked State: Soft Pink / Red with User Icon */
  tileBooked: {
    backgroundColor: '#FFF1F2',
    opacity: 0.95
  },
  userIconWrap: {
    marginBottom: 1
  },
  numBooked: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626'
  },
  labelBooked: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 1
  },

  /* 4. Bottom Summary Bar */
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5'
  },
  summaryLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  ticketIconBox: {
    marginRight: 10
  },
  summaryTextGroup: {
    justifyContent: 'center'
  },
  summarySubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2
  },
  summaryTokenVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E5A3A',
    lineHeight: 24
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12
  },
  summaryRightCol: {
    flex: 1,
    justifyContent: 'center'
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  summaryTimeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  }
});
