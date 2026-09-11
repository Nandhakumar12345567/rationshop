import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // Native Mobile App (Android / iOS)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && !ip.includes('ngrok') && !ip.includes('expo') && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // Computer Local Wi-Fi IPv4 Fallback
  return 'http://192.168.6.111:5000/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API Client] Connected API Base URL:', API_BASE_URL);

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
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('Failed to fetch'))) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure backend is running and phone & PC are on the same Wi-Fi network.`);
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (card_no, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ card_no, password }) }),
  qrLogin: (qr_data, card_no) => request('/auth/qr-login', { method: 'POST', body: JSON.stringify({ qr_data, card_no }) }),
  sendOtp: (param) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(typeof param === 'string' ? (param.startsWith('TN-') || param.startsWith('SHOP-') || param.startsWith('ADMIN-') ? { card_no: param } : { phone: param }) : param) }),
  verifyOtp: (param, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(typeof param === 'string' ? (param.startsWith('TN-') || param.startsWith('SHOP-') || param.startsWith('ADMIN-') ? { card_no: param, otp } : { phone: param, otp }) : { ...param, otp }) }),
  getMe: () => request('/auth/me'),
  changePassword: (old_password, new_password) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),
  updateFamilySize: (family_size) => request('/auth/update-family-size', { method: 'POST', body: JSON.stringify({ family_size }) }),

  // Items & Stock
  getItems: (familySize) => request(familySize ? `/items?family_size=${familySize}` : '/items'),
  getShopStock: (shopId = 'FPS-TN-0401') => request(`/items/shop-stock/${shopId}`),

  // Bookings
  getSlots: (date) => request(`/bookings/slots?date=${date || ''}`),
  createBooking: (items, slot_time, token_number, family_size) => request('/bookings/create', { method: 'POST', body: JSON.stringify({ items, slot_time, token_number, family_size }) }),
  cancelBooking: (booking_id) => request('/bookings/cancel', { method: 'POST', body: JSON.stringify({ booking_id }) }),
  clearAllBookings: () => request('/bookings/clear-all', { method: 'POST' }),
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
  getFraudAlerts: () => request('/admin/fraud-alerts'),

  // Live Queue
  getQueueStatus: (shopId = 'shop_1', cardNo = '', userTokenNum = 12) => request(`/queue/${shopId}?card_no=${cardNo}&user_token=${userTokenNum}`)
};
