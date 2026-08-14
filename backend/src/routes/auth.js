const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', AuthController.login);
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.get('/me', authenticateToken, AuthController.getMe);

module.exports = router;
