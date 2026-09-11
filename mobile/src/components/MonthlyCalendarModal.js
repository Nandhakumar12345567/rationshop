import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform
} from 'react-native';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_TA = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
];

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_TA = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'சனி'];

export default function MonthlyCalendarModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  lang = 'en'
}) {
  // Parse initial date or default to today
  const getInitialDate = () => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return new Date();
  };

  const [currentMonthDate, setCurrentMonthDate] = useState(getInitialDate);
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (visible) {
      const init = getInitialDate();
      setCurrentMonthDate(init);
      setTempSelectedDate(selectedDate || new Date().toISOString().split('T')[0]);
    }
  }, [visible, selectedDate]);

  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = lang === 'ta' ? MONTH_NAMES_TA : MONTH_NAMES_EN;
  const dayNames = lang === 'ta' ? DAY_NAMES_TA : DAY_NAMES_EN;

  // Previous month navigation
  const handlePrevMonth = () => {
    // Prevent navigating into the past before current month
    const prevDate = new Date(year, month - 1, 1);
    const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prevDate < firstOfCurrentMonth) return;
    setCurrentMonthDate(prevDate);
  };

  // Next month navigation (allow up to 6 months ahead)
  const handleNextMonth = () => {
    const nextDate = new Date(year, month + 1, 1);
    const maxFuture = new Date(today.getFullYear(), today.getMonth() + 6, 1);
    if (nextDate > maxFuture) return;
    setCurrentMonthDate(nextDate);
  };

  // Jump to today's month
  const handleJumpToToday = () => {
    setCurrentMonthDate(new Date());
    setTempSelectedDate(todayIso);
  };

  // Generate calendar cells (leading blanks + days of month)
  const generateCalendarDays = () => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    // Leading empty / padding days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        isoStr: null,
        isPast: true
      });
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const padM = String(month + 1).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      const isoStr = `${year}-${padM}-${padD}`;

      // Check if day is in past
      const dayDate = new Date(year, month, day, 23, 59, 59);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      cells.push({
        dayNumber: day,
        isCurrentMonth: true,
        isoStr,
        isPast,
        isToday: isoStr === todayIso,
        isSelected: isoStr === tempSelectedDate
      });
    }

    // Trailing empty days to complete the week grid (multiples of 7)
    const totalCells = cells.length;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        dayNumber: i,
        isCurrentMonth: false,
        isoStr: null,
        isPast: true
      });
    }

    return cells;
  };

  const calendarCells = generateCalendarDays();

  // Check if prev button should be disabled
  const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const isPrevDisabled = new Date(year, month, 1) <= firstOfCurrentMonth;

  // Format the selected date for human display
  const formatHumanDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  const handleCellClick = (cell) => {
    if (!cell.isCurrentMonth || cell.isPast || !cell.isoStr) return;
    setTempSelectedDate(cell.isoStr);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onSelectDate(tempSelectedDate);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.calendarIconBubble}>
                    <Text style={styles.calendarIcon}>🗓️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>
                      {lang === 'ta' ? 'முன்பதிவு தேதி தேர்வு' : 'Pickup Appointment Calendar'}
                    </Text>
                    <Text style={styles.headerSub}>
                      {lang === 'ta' ? 'மாத நாள்காட்டியில் ஒரு தேதியைத் தேர்ந்தெடுக்கவும்' : 'Select a date to view available time slots'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month Navigator */}
              <View style={styles.monthNavigator}>
                <TouchableOpacity
                  style={[styles.navBtn, isPrevDisabled && styles.navBtnDisabled]}
                  onPress={handlePrevMonth}
                  disabled={isPrevDisabled}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.navBtnText, isPrevDisabled && styles.navBtnTextDisabled]}>‹</Text>
                </TouchableOpacity>

                <View style={styles.monthDisplay}>
                  <Text style={styles.monthYearText}>
                    {monthNames[month]} {year}
                  </Text>
                  {year === today.getFullYear() && month === today.getMonth() && (
                    <View style={styles.currentMonthBadge}>
                      <Text style={styles.currentMonthBadgeText}>
                        {lang === 'ta' ? 'நடப்பு மாதம்' : 'Current Month'}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.6}
                >
                  <Text style={styles.navBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.dayOfWeekRow}>
                {dayNames.map((dName, idx) => (
                  <View key={idx} style={styles.dayOfWeekCell}>
                    <Text
                      style={[
                        styles.dayOfWeekText,
                        (idx === 0 || idx === 6) && styles.weekendText
                      ]}
                    >
                      {dName}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day Cells Grid */}
              <View style={styles.gridContainer}>
                {calendarCells.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <View key={idx} style={styles.dayCellContainer}>
                        <View style={[styles.dayCell, styles.dayCellOtherMonth]}>
                          <Text style={styles.dayTextOtherMonth}>{cell.dayNumber}</Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={idx} style={styles.dayCellContainer}>
                      <TouchableOpacity
                        style={[
                          styles.dayCell,
                          cell.isToday && styles.dayCellToday,
                          cell.isSelected && styles.dayCellSelected,
                          cell.isPast && styles.dayCellPast
                        ]}
                        disabled={cell.isPast}
                        onPress={() => handleCellClick(cell)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            cell.isToday && styles.dayTextToday,
                            cell.isSelected && styles.dayTextSelected,
                            cell.isPast && styles.dayTextPast
                          ]}
                        >
                          {cell.dayNumber}
                        </Text>
                        {cell.isToday && !cell.isSelected && (
                          <View style={styles.todayDot} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Quick Jump & Info Row */}
              <View style={styles.quickJumpRow}>
                <TouchableOpacity
                  style={styles.todayQuickBtn}
                  onPress={handleJumpToToday}
                  activeOpacity={0.7}
                >
                  <Text style={styles.todayQuickText}>
                    ⚡ {lang === 'ta' ? 'இன்றைய தேதி' : 'Today'} ({today.getDate()} {monthNames[today.getMonth()].slice(0, 3)})
                  </Text>
                </TouchableOpacity>

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#0B3D91' }]} />
                    <Text style={styles.legendLabel}>{lang === 'ta' ? 'தேர்வு' : 'Selected'}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.legendLabel}>{lang === 'ta' ? 'கிடைக்கும்' : 'Available'}</Text>
                  </View>
                </View>
              </View>

              {/* Selected Date Preview & Action Buttons */}
              <View style={styles.footerSection}>
                <View style={styles.selectedPreviewBox}>
                  <Text style={styles.selectedPreviewLabel}>
                    {lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட தேதி:' : 'Selected Appointment Date:'}
                  </Text>
                  <Text style={styles.selectedPreviewValue}>
                    📅 {formatHumanDate(tempSelectedDate)}
                  </Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>
                      {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>
                      ✓ {lang === 'ta' ? 'தேதியை உறுதிசெய்' : 'Confirm & View Slots'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  header: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  calendarIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  calendarIcon: {
    fontSize: 20
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3D91'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569'
  },

  /* Month Navigator */
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF'
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.4
  },
  navBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B3D91',
    lineHeight: 24
  },
  navBtnTextDisabled: {
    color: '#94A3B8'
  },
  monthDisplay: {
    alignItems: 'center'
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B'
  },
  currentMonthBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  currentMonthBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400E'
  },

  /* Day of Week Row */
  dayOfWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  weekendText: {
    color: '#EF4444'
  },

  /* Day Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  dayCellContainer: {
    width: '14.28%', // 7 days in a row
    aspectRatio: 1.1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayCell: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  dayCellOtherMonth: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    opacity: 0.25
  },
  dayCellToday: {
    borderColor: '#0B3D91',
    borderWidth: 1.5,
    backgroundColor: '#EFF6FF'
  },
  dayCellSelected: {
    backgroundColor: '#0B3D91',
    borderColor: '#0B3D91',
    shadowColor: '#0B3D91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4
  },
  dayCellPast: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.35
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  dayTextOtherMonth: {
    fontSize: 12,
    color: '#94A3B8'
  },
  dayTextToday: {
    color: '#0B3D91',
    fontWeight: '800'
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  dayTextPast: {
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0B3D91'
  },

  /* Quick Jump Row */
  quickJumpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC'
  },
  todayQuickBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  todayQuickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3D91'
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },

  /* Footer & Action Buttons */
  footerSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10
  },
  selectedPreviewBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectedPreviewLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600'
  },
  selectedPreviewValue: {
    fontSize: 12,
    color: '#0B3D91',
    fontWeight: '800'
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0B3D91',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    shadowColor: '#0B3D91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
