const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const issueRoutes = require('./routes/issue');
const adminRoutes = require('./routes/admin');
const queueRoutes = require('./routes/queue');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/issue', issueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes);

// Root Route - Welcome Info
app.get('/', (req, res) => {
  res.json({
    message: '🌾 Smart Ration Digital Booking REST API Server',
    status: 'online',
    health_check: '/api/health',
    endpoints: {
      auth: '/api/auth/login',
      items: '/api/items',
      bookings: '/api/bookings/slots',
      payments: '/api/payments/create-order',
      issue: '/api/issue/scan-qr',
      admin: '/api/admin/analytics'
    }
  });
});

// Health Check / System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Smart Ration Digital Booking REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Global Error Middleware
app.use((err, req, res, next) => {
  console.error('[Global Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message });
});

module.exports = app;
