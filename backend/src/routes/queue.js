const express = require('express');
const router = express.Router();
const QueueController = require('../controllers/queueController');

router.get('/:shop_id?', QueueController.getQueueStatus);
router.post('/update-status', QueueController.updateQueueTokenStatus);

module.exports = router;
