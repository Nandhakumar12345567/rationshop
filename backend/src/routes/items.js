const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/itemController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, ItemController.getItems);
router.get('/shop-stock/:shopId?', authenticateToken, ItemController.getShopStock);

module.exports = router;
