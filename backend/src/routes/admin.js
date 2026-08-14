const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/analytics', authenticateToken, AdminController.getAnalytics);
router.get('/ration-cards', authenticateToken, AdminController.getRationCards);
router.post('/update-stock', authenticateToken, AdminController.updateShopStock);
router.get('/fraud-alerts', authenticateToken, AdminController.getFraudAlerts);

module.exports = router;
