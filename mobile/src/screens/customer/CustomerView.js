import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import RazorpayModal from '../../components/RazorpayModal';
import QRModal from '../../components/QRModal';

export default function CustomerView({ user, lang }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [shopStock, setShopStock] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  
  // Modals
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [activeQRBooking, setActiveQRBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, stockRes, slotsRes, bookingsRes] = await Promise.all([
        api.getItems(),
        api.getShopStock(),
        api.getSlots(),
        api.getMyBookings()
      ]);

      setItems(itemsRes.items || []);
      setShopStock(stockRes.shop?.stock || {});
      setSlots(slotsRes.slots || []);
      setActiveBookings(bookingsRes.bookings || []);

      // Initial default slot
      if (slotsRes.slots && slotsRes.slots.length > 0) {
        setSelectedSlot(slotsRes.slots[0].slot_time);
      }
    } catch (err) {
      console.error('[Customer Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (itemId, delta, maxEntitlement) => {
    const current = selectedQuantities[itemId] || 0;
    const next = Math.max(0, Math.min(maxEntitlement, current + delta));
    setSelectedQuantities({ ...selectedQuantities, [itemId]: next });
  };

  const calculateTotalBill = () => {
    let total = 0;
    items.forEach(it => {
      const qty = selectedQuantities[it.item_id] || 0;
      total += qty * it.price_per_unit;
    });
    return total;
  };

  const handleBookSlot = async () => {
    const bookedItems = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));

    if (bookedItems.length === 0) {
      alert('Please select at least 1 item to book');
      return;
    }

    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createBooking(bookedItems, selectedSlot);
      if (res.success) {
        const total = calculateTotalBill();
        if (total > 0) {
          setPaymentBooking(res.booking);
        } else {
          alert('Free Ration Booking Confirmed! QR Token generated.');
          loadData();
        }
      }
    } catch (err) {
      alert(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCompleted = async (paymentDetails) => {
    if (!paymentBooking) return;
    try {
      await api.verifyPayment(paymentBooking.booking_id, paymentDetails.razorpay_order_id, paymentDetails.razorpay_payment_id);
      alert('Payment Verified! QR Token generated.');
      setPaymentBooking(null);
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

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Entitlements & Live Shop Stock...</Text>
      </View>
    );
  }

  const categoryColor = user.category === 'Antyodaya' ? colors.gold : user.category === 'BPL' ? colors.primary : colors.accent;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Ration Card Summary Card */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.holderName}>{user.holder_name}</Text>
          <Text style={styles.cardNo}>Card No: {user.card_no}</Text>
          <Text style={styles.familyInfo}>Family Members: {user.family_size} | Shop: FPS #401 (T. Nagar)</Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{user.category}</Text>
        </View>
      </View>

      {/* Item Selection & Monthly Entitlements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Monthly Subsidised Ration Entitlements</Text>
        <Text style={styles.sectionSubtitle}>Quantities are automatically capped by your {user.category} entitlement rules.</Text>

        {items.map((item) => {
          const qty = selectedQuantities[item.item_id] || 0;
          const availableStock = shopStock[item.item_id] || 0;

          return (
            <View key={item.item_id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  Subsidised Rate: <Text style={styles.priceHighlight}>₹{item.price_per_unit}/{item.unit}</Text>
                </Text>
                <Text style={styles.itemLimit}>
                  Monthly Max Limit: {item.monthly_entitlement} {item.unit} | FPS Stock: {availableStock} {item.unit}
                </Text>
              </View>

              <View style={styles.qtyControl}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]} 
                  onPress={() => handleQtyChange(item.item_id, -1, item.monthly_entitlement)}
                  disabled={qty === 0}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyText}>{qty} {item.unit}</Text>

                <TouchableOpacity 
                  style={[styles.qtyBtn, qty >= item.monthly_entitlement && styles.qtyBtnDisabled]} 
                  onPress={() => handleQtyChange(item.item_id, 1, item.monthly_entitlement)}
                  disabled={qty >= item.monthly_entitlement}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Time Slot Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Select Pickup Time Slot</Text>
        <Text style={styles.sectionSubtitle}>Real-time occupancy slot manager (prevent overcrowding).</Text>

        <View style={styles.slotGrid}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot.slot_time}
              style={[
                styles.slotCard,
                selectedSlot === slot.slot_time && styles.slotCardSelected,
                slot.is_full && styles.slotCardFull
              ]}
              onPress={() => !slot.is_full && setSelectedSlot(slot.slot_time)}
              disabled={slot.is_full}
            >
              <Text style={styles.slotTime}>{slot.display_time}</Text>
              <Text style={styles.slotCapacity}>
                {slot.is_full ? '❌ FULL' : `Seats Left: ${slot.available_capacity}/${slot.max_capacity}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bill & Checkout Button */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.billLabel}>Total Subsidized Amount:</Text>
          <Text style={styles.totalAmount}>₹{calculateTotalBill().toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutBtn, submitting && styles.btnDisabled]} 
          onPress={handleBookSlot}
          disabled={submitting}
        >
          <Text style={styles.checkoutBtnText}>
            {submitting ? 'Creating Token...' : 'Book Slot & Generate QR →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Booking History & Tokens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎟️ My Active & Past QR Tokens</Text>
        {activeBookings.length === 0 ? (
          <Text style={styles.emptyText}>No previous bookings found.</Text>
        ) : (
          activeBookings.map((b) => (
            <TouchableOpacity key={b.booking_id} style={styles.historyCard} onPress={() => viewTokenDetails(b.booking_id)}>
              <View style={styles.historyTop}>
                <Text style={styles.historyId}>{b.booking_id}</Text>
                <View style={[styles.statusPill, b.status === 'ISSUED' ? styles.statusIssued : styles.statusBooked]}>
                  <Text style={styles.statusPillText}>{b.status}</Text>
                </View>
              </View>
              <Text style={styles.historySlot}>📅 {b.slot_time}</Text>
              <Text style={styles.historyTap}>Tap to view QR Token Code 🔍</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Modals */}
      <RazorpayModal
        visible={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={handlePaymentCompleted}
      />

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
    marginTop: 12,
    fontSize: 14
  },
  cardHeader: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  headerLeft: {
    flex: 1
  },
  holderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  cardNo: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 2
  },
  familyInfo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  categoryText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12
  },
  itemCard: {
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  priceHighlight: {
    color: colors.gold,
    fontWeight: 'bold'
  },
  itemLimit: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  qtyBtn: {
    backgroundColor: colors.primaryDark,
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qtyBtnDisabled: {
    backgroundColor: colors.border
  },
  qtyBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  qtyText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  slotCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  slotCardFull: {
    opacity: 0.4,
    backgroundColor: '#300'
  },
  slotTime: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 12
  },
  slotCapacity: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4
  },
  checkoutBar: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 24
  },
  billLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8
  },
  btnDisabled: {
    opacity: 0.6
  },
  checkoutBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13
  },
  historyCard: {
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyId: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  statusBooked: {
    backgroundColor: colors.gold
  },
  statusIssued: {
    backgroundColor: colors.success
  },
  statusPillText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold'
  },
  historySlot: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4
  },
  historyTap: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic'
  }
});
