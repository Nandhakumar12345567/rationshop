const API_BASE_URL = 'http://localhost:5000/api';

let userToken = null;

export const setAuthToken = (token) => {
  userToken = token;
};

export const getAuthToken = () => userToken;

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status} Error`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (card_no, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ card_no, password }) }),
  sendOtp: (card_no) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ card_no }) }),
  verifyOtp: (card_no, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ card_no, otp }) }),
  getMe: () => request('/auth/me'),

  // Items & Stock
  getItems: () => request('/items'),
  getShopStock: (shopId = 'FPS-TN-0401') => request(`/items/shop-stock/${shopId}`),

  // Bookings
  getSlots: (date) => request(`/bookings/slots?date=${date || ''}`),
  createBooking: (items, slot_time) => request('/bookings/create', { method: 'POST', body: JSON.stringify({ items, slot_time }) }),
  getMyBookings: () => request('/bookings/my-bookings'),
  getBookingById: (id) => request(`/bookings/${id}`),

  // Payment
  createPaymentOrder: (booking_id) => request('/payments/create-order', { method: 'POST', body: JSON.stringify({ booking_id }) }),
  verifyPayment: (booking_id, razorpay_order_id, razorpay_payment_id) => request('/payments/verify', { method: 'POST', body: JSON.stringify({ booking_id, razorpay_order_id, razorpay_payment_id }) }),

  // Shopkeeper Issue & Biometric
  scanQR: (qr_token) => request('/issue/scan-qr', { method: 'POST', body: JSON.stringify({ qr_token }) }),
  verifyBiometric: (card_no, biometric_data, simulate_fail = false) => request('/issue/verify-biometric', { method: 'POST', body: JSON.stringify({ card_no, biometric_data, simulate_fail }) }),
  completeIssue: (booking_id, shop_id, fingerprint_verified) => request('/issue/complete', { method: 'POST', body: JSON.stringify({ booking_id, shop_id, fingerprint_verified }) }),

  // Admin
  getAdminAnalytics: () => request('/admin/analytics'),
  getRationCards: () => request('/admin/ration-cards'),
  updateStock: (new_stock) => request('/admin/update-stock', { method: 'POST', body: JSON.stringify({ new_stock }) }),
  getFraudAlerts: () => request('/admin/fraud-alerts')
};
