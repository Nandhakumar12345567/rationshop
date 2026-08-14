const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/create-order', authenticateToken, PaymentController.createOrder);
router.post('/verify', authenticateToken, PaymentController.verifyPayment);
router.post('/webhook', PaymentController.handleWebhook);

module.exports = router;
