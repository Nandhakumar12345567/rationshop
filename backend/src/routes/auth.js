const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', AuthController.login);
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/qr-login', AuthController.qrLogin);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.post('/update-family-size', authenticateToken, AuthController.updateFamilySize);

module.exports = router;
