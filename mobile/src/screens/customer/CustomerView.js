import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { getCategoryBadgeStyle } from '../../theme/theme';
import { api } from '../../api/client';
import { socketManager } from '../../api/socket';
import RazorpayModal from '../../components/RazorpayModal';
import QRModal from '../../components/QRModal';
import Footer from '../../components/Footer';
import ItemImage from '../../components/ItemImage';
import CardholderAvatar from '../../components/CardholderAvatar';

export default function CustomerView({ user, lang, profileImage, onImageSelected }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [shopStock, setShopStock] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  
  // Date, Slot & Custom Token Number State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTokenNumber, setSelectedTokenNumber] = useState(1);
  const [isTodayFull, setIsTodayFull] = useState(false);
  const [activeBookings, setActiveBookings] = useState([]);
  
  // Live Queue Monitor State
  const [queueStatus, setQueueStatus] = useState(null);
  const [demoServingToken, setDemoServingToken] = useState(6);
  const [demoUserToken, setDemoUserToken] = useState(12);

  // Modals
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [activeQRBooking, setActiveQRBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Socket Realtime Connection State
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    loadData();
    socketManager.connect('shop_1');

    const unsubConn = socketManager.onConnectionChange(setSocketConnected);

    const unsubQueue = socketManager.subscribeToQueue((freshQueue) => {
      console.log('[Socket Live] Queue update received:', freshQueue);
      if (freshQueue) {
        setQueueStatus(prev => ({ ...prev, ...freshQueue }));
      }
    });

    const unsubSlots = socketManager.subscribeToSlots((slotPayload) => {
      console.log('[Socket Live] Slot update received:', slotPayload);
      loadSlotsForDate(selectedDate);
    });

    const unsubStock = socketManager.subscribeToStock((stockPayload) => {
      if (stockPayload && stockPayload.stock) {
        setShopStock(stockPayload.stock);
      }
    });

    const unsubIssue = socketManager.subscribeToIssueComplete(() => {
      api.getMyBookings().then(res => setActiveBookings(res.bookings || []));
      fetchQueue();
    });

    const queueInterval = setInterval(fetchQueue, 15000);
    return () => {
      clearInterval(queueInterval);
      unsubConn();
      unsubQueue();
      unsubSlots();
      unsubStock();
      unsubIssue();
    };
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, stockRes, bookingsRes] = await Promise.all([
        api.getItems(),
        api.getShopStock(),
        api.getMyBookings()
      ]);

      setItems(itemsRes.items || []);
      setShopStock(stockRes.shop?.stock || {});
      setActiveBookings(bookingsRes.bookings || []);

      const initialQtys = {};
      (itemsRes.items || []).forEach(it => {
        initialQtys[it.item_id] = it.monthly_entitlement || 0;
      });
      setSelectedQuantities(initialQtys);

      const todayStr = new Date().toISOString().split('T')[0];
      await loadSlotsForDate(todayStr);
      await fetchQueue();
    } catch (err) {
      console.error('[Customer Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlotsForDate = async (dateStr) => {
    try {
      const slotsRes = await api.getSlots(dateStr);
      const fetchedSlots = slotsRes.slots || [];
      setSlots(fetchedSlots);
      setSelectedDate(dateStr);

      const todayStr = new Date().toISOString().split('T')[0];
      const allFull = fetchedSlots.length > 0 && fetchedSlots.every(s => s.is_full);

      if (dateStr === todayStr && allFull) {
        setIsTodayFull(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const tomorrowSlotsRes = await api.getSlots(tomorrowStr);
        setSlots(tomorrowSlotsRes.slots || []);
        setSelectedDate(tomorrowStr);
        if (tomorrowSlotsRes.slots && tomorrowSlotsRes.slots.length > 0) {
          const firstAvail = tomorrowSlotsRes.slots.find(s => !s.is_full);
          if (firstAvail) {
            setSelectedSlot(firstAvail.slot_time);
            pickFirstAvailableToken(firstAvail);
          }
        }
      } else {
        setIsTodayFull(false);
        if (fetchedSlots.length > 0) {
          const firstAvail = fetchedSlots.find(s => !s.is_full);
          if (firstAvail) {
            setSelectedSlot(firstAvail.slot_time);
            pickFirstAvailableToken(firstAvail);
          }
        }
      }
    } catch (err) {
      console.error('[Load Slots Error]', err);
    }
  };

  const pickFirstAvailableToken = (slotObj) => {
    const bookedNums = slotObj.booked_token_numbers || [];
    for (let i = 1; i <= 20; i++) {
      if (!bookedNums.includes(i)) {
        setSelectedTokenNumber(i);
        break;
      }
    }
  };

  const handleSlotSelect = (slotObj) => {
    if (slotObj.is_full) return;
    setSelectedSlot(slotObj.slot_time);
    pickFirstAvailableToken(slotObj);
  };

  const fetchQueue = async (targetUserToken = demoUserToken) => {
    try {
      const qRes = await api.getQueueStatus('shop_1', user.card_no, targetUserToken);
      if (qRes.success) {
        setQueueStatus(qRes);
      }
    } catch (err) {
      console.error('[Fetch Queue Error]', err);
    }
  };


  const calculateTotalBill = () => {
    let total = 0;
    items.forEach(it => {
      const qty = selectedQuantities[it.item_id] || 0;
      total += qty * (it.price_per_unit || 0);
    });
    return total;
  };

  const handleBookSlot = async () => {
    const bookedItems = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));

    if (bookedItems.length === 0) {
      alert('Please select at least 1 entitlement item to book');
      return;
    }

    if (!selectedSlot) {
      alert('Please select an available appointment time slot');
      return;
    }

    if (!selectedTokenNumber) {
      alert('Please select your individual token number from the grid');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createBooking(bookedItems, selectedSlot, selectedTokenNumber);
      if (res.success) {
        const total = calculateTotalBill();
        if (total > 0) {
          setPaymentBooking(res.booking);
        } else {
          // Auto open QR modal for free bookings
          viewTokenDetails(res.booking.booking_id);
          loadData();
        }
      }
    } catch (err) {
      alert('Failed to process booking: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = typeof window !== 'undefined' && window.confirm 
      ? window.confirm(`Are you sure you want to cancel Token #${bookingId}? Your slot will be released for others in real-time.`)
      : true;

    if (!confirmCancel) return;

    setSubmitting(true);
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        alert(res.message || 'Token cancelled successfully!');
        await loadData();
      } else {
        alert(res.error || 'Failed to cancel token');
      }
    } catch (err) {
      alert(err.message || 'Error cancelling token');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCompleted = async (paymentDetails) => {
    if (!paymentBooking) return;
    try {
      await api.verifyPayment(paymentBooking.booking_id, paymentDetails.razorpay_order_id, paymentDetails.razorpay_payment_id);
      const targetBookingId = paymentBooking.booking_id;
      setPaymentBooking(null);
      
      // Auto open QR Token Pass Modal immediately after successful payment
      await viewTokenDetails(targetBookingId);
      loadData();
    } catch (err) {
      alert('Payment verification failed: ' + err.message);
    }
  };

  const viewTokenDetails = async (bookingId) => {
    try {
      const res = await api.getBookingById(bookingId);
      if (res.success) {
        setActiveQRBooking(res.booking);
      }
    } catch (err) {
      alert('Failed to load QR details');
    }
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dates.push({ isoStr, label });
    }
    return dates;
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#0B3D91" />
        <Text style={styles.loadingText}>Fetching Entitlements & Live Shop Stock Inventory...</Text>
      </View>
    );
  }

  const categoryBadge = getCategoryBadgeStyle(user.category);
  const dateOptions = getDateOptions();
  const selectedSlotObj = slots.find(s => s.slot_time === selectedSlot);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Formal Government Ration Card Summary Header */}
      <View style={styles.cardHeader}>
        <View style={styles.photoBox}>
          <CardholderAvatar profileImage={profileImage} onImageSelected={onImageSelected} size={60} editable={true} />
          <Text style={styles.photoLabel}>Tap photo to change</Text>
        </View>

        <View style={styles.headerDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.holderName}>{user.holder_name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryBadge.bg }]}>
              <Text style={[styles.categoryText, { color: categoryBadge.text }]}>{categoryBadge.label}</Text>
            </View>
          </View>

          <Text style={styles.cardNo}>Ration Card No: <Text style={styles.cardNoHighlight}>{user.card_no}</Text></Text>
          <Text style={styles.metaRow}>Family Members: <Text style={styles.boldMeta}>{user.family_size} Members</Text> | FPS Shop: <Text style={styles.boldMeta}>FPS #401 (T. Nagar)</Text></Text>
          <Text style={styles.schemeTag}>Scheme: Tamil Nadu Smart PDS Card (NFSA 2013 Compliance)</Text>
        </View>
      </View>

      {/* Real-time Socket Live Sync Status Indicator Banner */}
      <View style={[styles.socketBanner, { backgroundColor: socketConnected ? '#F0FDF4' : '#FEFCE8', borderColor: socketConnected ? '#86EFAC' : '#FDE047' }]}>
        <View style={[styles.socketDot, { backgroundColor: socketConnected ? '#22C55E' : '#EAB308' }]} />
        <Text style={[styles.socketText, { color: socketConnected ? '#15803D' : '#A16207' }]}>
          {socketConnected ? '⚡ Real-Time Socket.io Connected • Live Sync Active' : '🟡 Connecting Real-Time Socket.io Server...'}
        </Text>
      </View>

      {/* Registered Family Members Detailed Breakdown Box */}
      <View style={styles.familyMembersCard}>
        <View style={styles.familyHeaderRow}>
          <Text style={styles.familyTitle}>👨‍👩‍👧‍👦 Registered Family Members ({user.card_no === 'TN-04-AAY-109283' ? 5 : user.card_no === 'TN-04-APL-549102' ? 3 : 4})</Text>
          <View style={styles.nfsaBadge}>
            <Text style={styles.nfsaBadgeText}>✓ Aadhaar Linked</Text>
          </View>
        </View>

        <View style={styles.familyGrid}>
          {(user.card_no === 'TN-04-AAY-109283' ? [
            { name: 'Priya Sundaram', relation: 'Head of Family', age: 45, gender: 'Female', icon: '👤' },
            { name: 'Sundaram V', relation: 'Husband', age: 48, gender: 'Male', icon: '👨' },
            { name: 'Kaviya Sundaram', relation: 'Daughter', age: 19, gender: 'Female', icon: '👧' },
            { name: 'Arjun Sundaram', relation: 'Son', age: 14, gender: 'Male', icon: '👦' },
            { name: 'Lakshmi Ammal', relation: 'Mother-in-law', age: 72, gender: 'Female', icon: '👵' }
          ] : user.card_no === 'TN-04-APL-549102' ? [
            { name: 'Karthik Subramanian', relation: 'Head of Family', age: 35, gender: 'Male', icon: '👤' },
            { name: 'Divya Subramanian', relation: 'Wife', age: 32, gender: 'Female', icon: '👩' },
            { name: 'Aarav Karthik', relation: 'Son', age: 6, gender: 'Male', icon: '👦' }
          ] : [
            { name: 'Ramesh Kumar', relation: 'Head of Family', age: 42, gender: 'Male', icon: '👤' },
            { name: 'Sunita Kumar', relation: 'Wife', age: 38, gender: 'Female', icon: '👩' },
            { name: 'Rahul Kumar', relation: 'Son', age: 16, gender: 'Male', icon: '👦' },
            { name: 'Ananya Kumar', relation: 'Daughter', age: 12, gender: 'Female', icon: '👧' }
          ]).map((member, idx) => (
            <View key={idx} style={styles.memberPill}>
              <Text style={styles.memberIcon}>{member.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberMeta}>{member.relation} • {member.age} yrs ({member.gender})</Text>
              </View>
              <Text style={styles.aadhaarCheck}>✅ Linked</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Live Queue Monitor Widget */}
      <View style={styles.queueWidget}>
        <View style={styles.queueWidgetHeader}>
          <Text style={styles.queueWidgetTitle}>⚡ LIVE FPS QUEUE MONITOR (FPS #401)</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveIndicatorText}>LIVE UPDATES</Text>
          </View>
        </View>

        <View style={styles.queueWidgetBody}>
          <View style={styles.queueStatBox}>
            <Text style={styles.queueStatLabel}>Now Serving Slot:</Text>
            <Text style={styles.queueStatVal}>{queueStatus?.current_slot || '10:00 AM - 11:00 AM'}</Text>
          </View>

          <View style={styles.queueStatBox}>
            <Text style={styles.queueStatLabel}>Active Serving Token:</Text>
            <Text style={styles.queueStatHighlight}>Token #{queueStatus?.serving_token_number || 1} of 20</Text>
          </View>

          <View style={styles.queueStatBox}>
            <Text style={styles.queueStatLabel}>Tokens Ahead of You:</Text>
            <Text style={styles.queueStatValBold}>
              {queueStatus?.tokens_ahead !== undefined ? `${queueStatus.tokens_ahead} token(s)` : '0 token(s)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Section Divider */}
      <View style={styles.sectionDividerBar}>
        <Text style={styles.sectionDividerText}>COMMODITY ENTITLEMENTS & STOCK INVENTORY</Text>
      </View>

      {/* Item Selection & Monthly Entitlements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Monthly Subsidised Entitlements</Text>
        <Text style={styles.sectionSubtitle}>
          Quantities are strictly auto-capped by your <Text style={{ fontWeight: '700', color: '#0B3D91' }}>{user.category}</Text> card allocation rules.
        </Text>

        {items.map((item) => {
          const qty = selectedQuantities[item.item_id] || 0;
          const availableStock = shopStock[item.item_id] || 500;
          const stockRatio = Math.min(100, Math.max(0, (availableStock / 1000) * 100));

          return (
            <View key={item.item_id} style={styles.itemCard}>
              <View style={styles.itemIconContainer}>
                <ItemImage itemId={item.item_id} size={60} />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  Subsidised Rate: <Text style={styles.priceHighlight}>₹{item.price_per_unit}/{item.unit}</Text>
                </Text>

                <View style={styles.stockProgressContainer}>
                  <View style={styles.stockProgressLabelRow}>
                    <Text style={styles.stockProgressText}>FPS Shop Inventory:</Text>
                    <Text style={styles.stockQtyText}>{availableStock} {item.unit} available</Text>
                  </View>
                  <View style={styles.stockBarTrack}>
                    <View style={[styles.stockBarFill, { width: `${stockRatio}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.qtyFixedBox}>
                <Text style={styles.qtyFixedLabel}>Allocated Quota</Text>
                <Text style={styles.qtyFixedVal}>{item.monthly_entitlement} {item.unit}</Text>
                <Text style={styles.qtyFixedStatus}>✓ Capped</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Appointment Slot Booking Picker & Token Selector */}
      <View style={styles.sectionDividerBar}>
        <Text style={styles.sectionDividerText}>FAIR PRICE SHOP APPOINTMENT BOOKING</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Select Pickup Appointment Slot</Text>
        <Text style={styles.sectionSubtitle}>Maximum capacity cap: 20 tokens per slot per hour.</Text>

        {/* Date Selector Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelectorScroll}>
          {dateOptions.map(opt => {
            const isSelected = selectedDate === opt.isoStr;
            return (
              <TouchableOpacity
                key={opt.isoStr}
                style={[styles.dateTab, isSelected && styles.dateTabSelected]}
                onPress={() => loadSlotsForDate(opt.isoStr)}
              >
                <Text style={[styles.dateTabText, isSelected && styles.dateTabTextSelected]}>{opt.label}</Text>
                <Text style={[styles.dateTabSub, isSelected && styles.dateTabSubSelected]}>{opt.isoStr}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Banner if Today is Fully Booked */}
        {isTodayFull && (
          <View style={styles.todayFullBanner}>
            <Text style={styles.fullBannerIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullBannerTitle}>All slots for today are fully booked (20/20 each).</Text>
              <Text style={styles.fullBannerDesc}>Automatically displaying tomorrow's available slots below.</Text>
            </View>
          </View>
        )}

        {/* Slot Grid */}
        <View style={styles.slotGrid}>
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.slot_time;
            return (
              <TouchableOpacity
                key={slot.slot_time}
                style={[
                  styles.slotCard,
                  isSelected && styles.slotCardSelected,
                  slot.is_full && styles.slotCardFull
                ]}
                onPress={() => handleSlotSelect(slot)}
                disabled={slot.is_full}
              >
                <View style={styles.slotHeaderRow}>
                  <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>{slot.display_time}</Text>
                  {isSelected && <Text style={styles.selectedBadgeCheck}>✓ Slot Selected</Text>}
                </View>

                <View style={styles.slotCapacityRow}>
                  <Text style={[styles.slotCapacity, isSelected && styles.slotCapacitySelected]}>
                    Booked: {slot.booked_count} / 20
                  </Text>
                  {slot.is_full ? (
                    <View style={styles.fullBadge}><Text style={styles.fullBadgeText}>FULL (20/20)</Text></View>
                  ) : (
                    <View style={styles.bookBadge}><Text style={styles.bookBadgeText}>SELECT SLOT</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Interactive Self-Token Picker Grid (#1 to #20) */}
        {selectedSlotObj && (
          <View style={styles.tokenPickerBox}>
            <View style={styles.tokenPickerHeader}>
              <Text style={styles.tokenPickerTitle}>🎟️ Choose Your Individual Token Number (1 to 20):</Text>
              <Text style={styles.tokenPickerSub}>Tap any available green token number to reserve your exact position in queue.</Text>
            </View>

            <View style={styles.tokenGrid}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const isBooked = (selectedSlotObj.booked_token_numbers || []).includes(num);
                const isSelected = selectedTokenNumber === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.tokenPill,
                      isSelected && styles.tokenPillSelected,
                      isBooked && styles.tokenPillBooked
                    ]}
                    disabled={isBooked}
                    onPress={() => setSelectedTokenNumber(num)}
                  >
                    <Text style={[
                      styles.tokenPillNum,
                      isSelected && styles.tokenPillTextSelected,
                      isBooked && styles.tokenPillTextBooked
                    ]}>
                      #{num}
                    </Text>
                    <Text style={[
                      styles.tokenPillStatus,
                      isSelected && styles.tokenPillTextSelected,
                      isBooked && styles.tokenPillTextBooked
                    ]}>
                      {isBooked ? 'TAKEN' : isSelected ? 'YOURS' : 'AVAIL'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.tokenLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DCFCE7', borderColor: '#166534' }]} />
                <Text style={styles.legendText}>Available</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#0B3D91' }]} />
                <Text style={styles.legendText}>Your Selection</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FEE2E2', borderColor: '#991B1B' }]} />
                <Text style={styles.legendText}>Booked by others</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Government Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.billLabel}>Selected Token: <Text style={{ fontWeight: '800', color: '#0B3D91' }}>#{selectedTokenNumber}</Text></Text>
          <Text style={styles.totalAmount}>Payable: ₹{calculateTotalBill().toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutBtn, submitting && styles.btnDisabled]} 
          onPress={handleBookSlot}
          disabled={submitting}
        >
          <Text style={styles.checkoutBtnText}>
            {submitting ? 'Processing Token...' : `RESERVE TOKEN #${selectedTokenNumber} →`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Digital Tokens & Booking History */}
      <View style={styles.sectionDividerBar}>
        <Text style={styles.sectionDividerText}>DIGITAL TOKENS & CANCELLATION MANAGEMENT</Text>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.sectionTitle}>🎟️ My Digital Ration Tokens</Text>
          <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#991B1B' }}>🚫 Token Cancellation Available</Text>
          </View>
        </View>

        {activeBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active digital tokens found for this Ration Card.</Text>
          </View>
        ) : (
          activeBookings.map((b, idx) => (
            <View key={b.booking_id} style={[styles.historyCard, b.status === 'CANCELLED' && { opacity: 0.6, borderColor: '#FCA5A5' }]}>
              <TouchableOpacity onPress={() => viewTokenDetails(b.booking_id)} activeOpacity={0.8}>
                <View style={styles.historyTop}>
                  <View>
                    <Text style={styles.historyRefNo}>App No: TN/RATION/2026/0000{1000 + idx}</Text>
                    <Text style={styles.historyId}>Token #{b.token_number || (idx + 1)} • ID: {b.booking_id}</Text>
                  </View>
                  <View style={[
                    styles.statusPill, 
                    b.status === 'ISSUED' ? styles.statusIssued : b.status === 'CANCELLED' ? { backgroundColor: '#FEE2E2', borderColor: '#EF4444' } : styles.statusBooked
                  ]}>
                    <Text style={[
                      styles.statusPillText, 
                      b.status === 'ISSUED' ? styles.statusIssuedText : b.status === 'CANCELLED' ? { color: '#991B1B' } : styles.statusBookedText
                    ]}>
                      {b.status === 'ISSUED' ? '✅ ISSUED' : b.status === 'CANCELLED' ? '🚫 CANCELLED' : '⏳ ACTIVE TOKEN'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historySlot}>📅 Booked Slot: {b.slot_time}</Text>
                <Text style={styles.historyTap}>Tap to open Official QR Token Pass & Verification Receipt →</Text>
              </TouchableOpacity>

              {/* Action Button: Token Cancellation */}
              {b.status !== 'ISSUED' && b.status !== 'CANCELLED' && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={() => handleCancelBooking(b.booking_id)}
                    disabled={submitting}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>🚫 Cancel Token & Release Slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
      {/* Detailed Live Queue Tracker & Time Analysis Engine */}
      <View style={styles.sectionDividerBar}>
        <Text style={styles.sectionDividerText}>REAL-TIME QUEUE MONITOR & TIME ANALYSIS ENGINE</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.queueTrackerHeader}>
          <Text style={styles.sectionTitle}>⚡ Live POS Telemetry & Token Progress</Text>
          <View style={styles.livePulseTag}>
            <View style={styles.pulseDotGreen} />
            <Text style={styles.livePulseText}>LIVE 3s SYNC</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>
          Fair Price Shop #401 (T. Nagar) Counter Telemetry | Processing Velocity: ~3.5 Mins / Beneficiary
        </Text>

        {/* Turn Status Alert Banner */}
        {((queueStatus?.tokens_ahead !== undefined ? queueStatus.tokens_ahead : Math.max(0, demoUserToken - demoServingToken))) === 0 ? (
          <View style={[styles.turnBanner, styles.turnBannerNow]}>
            <Text style={styles.turnBannerIcon}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.turnBannerTitleNow}>IT IS YOUR TURN NOW!</Text>
              <Text style={styles.turnBannerDescNow}>Please proceed to Counter #1 at FPS #401 T. Nagar with your QR Token Pass.</Text>
            </View>
          </View>
        ) : ((queueStatus?.tokens_ahead !== undefined ? queueStatus.tokens_ahead : Math.max(0, demoUserToken - demoServingToken))) <= 2 ? (
          <View style={[styles.turnBanner, styles.turnBannerSoon]}>
            <Text style={styles.turnBannerIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.turnBannerTitleSoon}>YOUR TURN IS UPCOMING SOON!</Text>
              <Text style={styles.turnBannerDescSoon}>Only {(queueStatus?.tokens_ahead !== undefined ? queueStatus.tokens_ahead : Math.max(0, demoUserToken - demoServingToken))} token(s) ahead. Please keep your QR Pass ready.</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.turnBanner, styles.turnBannerQueued]}>
            <Text style={styles.turnBannerIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.turnBannerTitleQueued}>TOKEN QUEUED IN LINE ({queueStatus?.tokens_ahead !== undefined ? queueStatus.tokens_ahead : Math.max(0, demoUserToken - demoServingToken)} TOKENS AHEAD)</Text>
              <Text style={styles.turnBannerDescQueued}>
                Completed: Tokens 1-{demoServingToken - 1} | Serving: Token #{demoServingToken} | Your Token: #{demoUserToken}
              </Text>
            </View>
          </View>
        )}

        {/* 4 KPI Metrics Cards */}
        <View style={styles.trackerKpiGrid}>
          <View style={[styles.trackerKpiCard, { borderColor: '#166534', backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.trackerKpiValGreen}>Tokens 1 to {demoServingToken - 1}</Text>
            <Text style={styles.trackerKpiLabel}>Received Items ✅</Text>
          </View>

          <View style={[styles.trackerKpiCard, { borderColor: '#EA580C', backgroundColor: '#FFF7ED' }]}>
            <Text style={styles.trackerKpiValGold}>Token #{demoServingToken}</Text>
            <Text style={styles.trackerKpiLabel}>Currently Serving ⚡</Text>
          </View>

          <View style={[styles.trackerKpiCard, { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.trackerKpiValBlue}>Token #{demoUserToken}</Text>
            <Text style={styles.trackerKpiLabel}>Your Token ⭐ ({Math.max(0, demoUserToken - demoServingToken)} ahead)</Text>
          </View>

          <View style={[styles.trackerKpiCard, { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' }]}>
            <Text style={styles.trackerKpiValPurple}>
              ~{Math.max(0, demoUserToken - demoServingToken) * 3.5} Mins
            </Text>
            <Text style={styles.trackerKpiLabel}>Est. Wait Time ⏱️</Text>
          </View>
        </View>

        {/* Interactive Scenario Presets Toolbar */}
        <View style={styles.scenarioBar}>
          <View style={styles.scenarioBarHeader}>
            <Text style={styles.scenarioTitle}>🎮 Live Scenario Simulation Controls:</Text>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => {
                setDemoServingToken(6);
                setDemoUserToken(12);
                fetchQueue(12);
              }}
            >
              <Text style={styles.resetBtnText}>🔄 Reset Example (Serving #6 | Your Token #12)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scenarioPickerRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.pickerSubLabel}>Now Serving Token #:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.smallPill, demoServingToken === num && styles.smallPillActiveServing]}
                    onPress={() => {
                      setDemoServingToken(num);
                    }}
                  >
                    <Text style={[styles.smallPillText, demoServingToken === num && styles.smallPillTextActive]}>
                      #{num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.pickerSubLabel}>Your Token #:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.smallPill, demoUserToken === num && styles.smallPillActiveUser]}
                    onPress={() => {
                      setDemoUserToken(num);
                      fetchQueue(num);
                    }}
                  >
                    <Text style={[styles.smallPillText, demoUserToken === num && styles.smallPillTextActive]}>
                      #{num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>


        {/* Interactive 20 Token Grid Visualization (1 to 20) */}
        <View style={styles.gridContainer}>
          <Text style={styles.gridContainerTitle}>📋 Daily 20-Token Live Status Grid (1 to 20)</Text>

          <View style={styles.tokensVisualGrid}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
              const isCompleted = num < demoServingToken;
              const isServing = num === demoServingToken;
              const isUser = num === demoUserToken;
              const isWaiting = num > demoServingToken && num < demoUserToken;

              let bg = '#F8FAFC';
              let borderColor = '#CBD5E1';
              let badgeBg = '#E2E8F0';
              let badgeText = '#475569';
              let statusLabel = 'Upcoming';
              let icon = '';

              if (isCompleted) {
                bg = '#DCFCE7';
                borderColor = '#166534';
                badgeBg = '#166534';
                badgeText = '#FFFFFF';
                statusLabel = 'Received';
                icon = '✅';
              } else if (isServing) {
                bg = '#FFEDD5';
                borderColor = '#EA580C';
                badgeBg = '#EA580C';
                badgeText = '#FFFFFF';
                statusLabel = 'Serving';
                icon = '⚡';
              } else if (isUser) {
                bg = '#DBEAFE';
                borderColor = '#1E3A8A';
                badgeBg = '#1E3A8A';
                badgeText = '#FFFFFF';
                statusLabel = 'YOURS';
                icon = '⭐';
              } else if (isWaiting) {
                bg = '#FEF9C3';
                borderColor = '#CA8A04';
                badgeBg = '#CA8A04';
                badgeText = '#FFFFFF';
                statusLabel = 'Waiting';
                icon = '⏳';
              }

              return (
                <View 
                  key={num} 
                  style={[
                    styles.tokenBox,
                    { backgroundColor: bg, borderColor },
                    isUser && styles.tokenBoxUserGlow
                  ]}
                >
                  <Text style={styles.tokenBoxNum}>#{num}</Text>
                  <View style={[styles.tokenBoxBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.tokenBoxBadgeText, { color: badgeText }]}>
                      {icon} {statusLabel}
                    </Text>
                  </View>
                  <Text style={styles.tokenBoxSub}>
                    {isCompleted ? 'Done' : isServing ? 'Now' : isUser ? 'Your Turn' : `+${(num - demoServingToken) * 3.5}m`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Color Legend */}
          <View style={styles.gridLegendRow}>
            <View style={styles.legendPill}>
              <View style={[styles.legendColorDot, { backgroundColor: '#166534' }]} />
              <Text style={styles.legendPillText}>1 - {demoServingToken - 1}: Received Items</Text>
            </View>

            <View style={styles.legendPill}>
              <View style={[styles.legendColorDot, { backgroundColor: '#EA580C' }]} />
              <Text style={styles.legendPillText}>#{demoServingToken}: Serving Now</Text>
            </View>

            <View style={styles.legendPill}>
              <View style={[styles.legendColorDot, { backgroundColor: '#CA8A04' }]} />
              <Text style={styles.legendPillText}>Waiting in Line</Text>
            </View>

            <View style={styles.legendPill}>
              <View style={[styles.legendColorDot, { backgroundColor: '#1E3A8A' }]} />
              <Text style={styles.legendPillText}>#{demoUserToken}: Your Token</Text>
            </View>
          </View>
        </View>

        {/* Daily Counter Progress Bar */}
        <View style={styles.progressTrackerContainer}>
          <View style={styles.progressTrackerLabelRow}>
            <Text style={styles.progressTrackerTitle}>Fair Price Shop Counter Progress:</Text>
            <Text style={styles.progressTrackerPercent}>
              {demoServingToken - 1} / 20 Tokens Served ({Math.round(((demoServingToken - 1) / 20) * 100)}%)
            </Text>
          </View>
          <View style={styles.progressTrackBar}>
            <View style={[styles.progressFillBar, { width: `${Math.min(100, (((demoServingToken - 1) / 20) * 100))}%` }]} />
          </View>
        </View>
      </View>

      <Footer />


      {/* Razorpay Gateway Modal */}
      <RazorpayModal
        visible={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={handlePaymentCompleted}
      />

      {/* Official QR Token Modal */}
      <QRModal
        visible={!!activeQRBooking}
        booking={activeQRBooking}
        onClose={() => setActiveQRBooking(null)}
      />
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
  cardHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10
  },
  familyMembersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  familyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3D91'
  },
  nfsaBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  nfsaBadgeText: {
    color: '#166534',
    fontSize: 9,
    fontWeight: '800'
  },
  familyGrid: {
    gap: 6
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  memberIcon: {
    fontSize: 18,
    marginRight: 10
  },
  queueTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  livePulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  pulseDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#166534',
    marginRight: 4
  },
  livePulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534'
  },
  turnBanner: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1
  },
  turnBannerNow: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534'
  },
  turnBannerSoon: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706'
  },
  turnBannerQueued: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  turnBannerIcon: {
    fontSize: 22,
    marginRight: 10
  },
  turnBannerTitleNow: {
    fontSize: 13,
    fontWeight: '900',
    color: '#166534'
  },
  turnBannerDescNow: {
    fontSize: 10,
    color: '#14532D',
    marginTop: 1
  },
  turnBannerTitleSoon: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309'
  },
  turnBannerDescSoon: {
    fontSize: 10,
    color: '#78350F',
    marginTop: 1
  },
  turnBannerTitleQueued: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E40AF'
  },
  turnBannerDescQueued: {
    fontSize: 10,
    color: '#1E3A8A',
    marginTop: 1
  },
  trackerKpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 4
  },
  trackerKpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  trackerKpiValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#166534'
  },
  trackerKpiValGold: {
    fontSize: 15,
    fontWeight: '900',
    color: '#D97706'
  },
  trackerKpiValBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2563EB'
  },
  trackerKpiValPurple: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7C3AED'
  },
  trackerKpiLabel: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center'
  },
  progressTrackerContainer: {
    marginTop: 2
  },
  progressTrackerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  progressTrackerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  progressTrackerPercent: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B3D91'
  },
  progressTrackBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFillBar: {
    height: '100%',
    backgroundColor: '#166534',
    borderRadius: 3
  },
  memberName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  memberMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  aadhaarCheck: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534'
  },
  photoBox: {
    alignItems: 'center',
    marginRight: 12
  },
  photoLabel: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 4
  },
  headerDetails: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  holderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800'
  },
  cardNo: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2
  },
  cardNoHighlight: {
    fontWeight: '800',
    color: '#0B3D91'
  },
  metaRow: {
    fontSize: 10,
    color: '#64748B'
  },
  boldMeta: {
    fontWeight: '700',
    color: '#1E293B'
  },
  schemeTag: {
    fontSize: 9,
    color: '#138808',
    fontWeight: '700',
    marginTop: 3
  },
  queueWidget: {
    backgroundColor: '#061E47',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FF9933'
  },
  queueWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    paddingBottom: 6
  },
  queueWidgetTitle: {
    color: '#FF9933',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 5
  },
  liveIndicatorText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800'
  },
  queueWidgetBody: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  queueStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 3
  },
  queueStatLabel: {
    color: '#CBD5E1',
    fontSize: 9,
    marginBottom: 2
  },
  queueStatVal: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  queueStatHighlight: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '800'
  },
  queueStatValBold: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800'
  },
  sectionDividerBar: {
    backgroundColor: '#0B3D91',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10
  },
  sectionDividerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itemIconContainer: {
    marginRight: 10
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  itemMeta: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1
  },
  priceHighlight: {
    color: '#138808',
    fontWeight: '700'
  },
  stockProgressContainer: {
    marginTop: 6
  },
  stockProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  stockProgressText: {
    fontSize: 9,
    color: '#64748B'
  },
  stockQtyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0B3D91'
  },
  stockBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  stockBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2
  },
  qtyFixedBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  qtyFixedLabel: {
    fontSize: 8,
    color: '#1E40AF',
    fontWeight: '700'
  },
  qtyFixedVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    marginVertical: 1
  },
  qtyFixedStatus: {
    fontSize: 9,
    color: '#166534',
    fontWeight: '800'
  },
  dateSelectorScroll: {
    marginBottom: 12
  },
  dateTab: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  dateTabSelected: {
    backgroundColor: '#0B3D91',
    borderColor: '#0B3D91'
  },
  dateTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  dateTabTextSelected: {
    color: '#FFFFFF'
  },
  dateTabSub: {
    fontSize: 9,
    color: '#64748B'
  },
  dateTabSubSelected: {
    color: '#93C5FD'
  },
  todayFullBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  fullBannerIcon: {
    fontSize: 18,
    marginRight: 10
  },
  fullBannerTitle: {
    color: '#991B1B',
    fontWeight: '800',
    fontSize: 11
  },
  fullBannerDesc: {
    color: '#B91C1C',
    fontSize: 10
  },
  slotGrid: {
    gap: 8,
    marginBottom: 14
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  slotCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2
  },
  slotCardFull: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  slotTimeSelected: {
    color: '#1E40AF',
    fontWeight: '800'
  },
  selectedBadgeCheck: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11
  },
  slotCapacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  slotCapacity: {
    fontSize: 11,
    color: '#64748B'
  },
  slotCapacitySelected: {
    color: '#1E40AF',
    fontWeight: '700'
  },
  fullBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  fullBadgeText: {
    color: '#991B1B',
    fontSize: 9,
    fontWeight: '800'
  },
  bookBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  bookBadgeText: {
    color: '#166534',
    fontSize: 9,
    fontWeight: '800'
  },
  tokenPickerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0B3D91',
    marginTop: 6
  },
  tokenPickerHeader: {
    marginBottom: 10
  },
  tokenPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3D91'
  },
  tokenPickerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start'
  },
  tokenPill: {
    width: '18%',
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center'
  },
  tokenPillSelected: {
    backgroundColor: '#0B3D91',
    borderColor: '#FF9933',
    borderWidth: 2
  },
  tokenPillBooked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#991B1B',
    opacity: 0.6
  },
  tokenPillNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534'
  },
  tokenPillStatus: {
    fontSize: 7,
    fontWeight: '700',
    color: '#166534',
    marginTop: 1
  },
  tokenPillTextSelected: {
    color: '#FFFFFF'
  },
  tokenPillTextBooked: {
    color: '#991B1B'
  },
  tokenLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
    borderWidth: 1
  },
  legendText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600'
  },
  checkoutBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B3D91',
    marginBottom: 14
  },
  billLabel: {
    fontSize: 10,
    color: '#64748B'
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#138808'
  },
  checkoutBtn: {
    backgroundColor: '#0B3D91',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  btnDisabled: {
    backgroundColor: '#94A3B8'
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748B',
    fontSize: 11
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  historyRefNo: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B3D91'
  },
  historyId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusIssued: {
    backgroundColor: '#DCFCE7'
  },
  statusBooked: {
    backgroundColor: '#FEF3C7'
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800'
  },
  statusIssuedText: {
    color: '#166534'
  },
  statusBookedText: {
    color: '#B45309'
  },
  historySlot: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4
  },
  historyTap: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700'
  },
  scenarioBar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  scenarioBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  scenarioTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A'
  },
  resetBtn: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  scenarioPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  pickerSubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569'
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  smallPillActiveServing: {
    backgroundColor: '#EA580C',
    borderColor: '#C2410C'
  },
  smallPillActiveUser: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E40AF'
  },
  smallPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#334155'
  },
  smallPillTextActive: {
    color: '#FFFFFF'
  },
  timeAnalysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  timeAnalysisTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3D91',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4
  },
  analysisTimeline: {
    gap: 8
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 8
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A'
  },
  timelineDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1
  },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  gridContainerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3D91',
    marginBottom: 8
  },
  tokensVisualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  tokenBox: {
    width: '23%',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1
  },
  tokenBoxUserGlow: {
    borderWidth: 2,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  tokenBoxNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A'
  },
  tokenBoxBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 2
  },
  tokenBoxBadgeText: {
    fontSize: 8,
    fontWeight: '800'
  },
  tokenBoxSub: {
    fontSize: 8,
    color: '#475569',
    fontWeight: '600'
  },
  gridLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  legendPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569'
  },
  socketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  socketText: {
    fontSize: 12,
    fontWeight: '700'
  }
});

