const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issueController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/scan-qr', authenticateToken, IssueController.scanQR);
router.post('/verify-biometric', authenticateToken, IssueController.verifyBiometric);
router.post('/complete', authenticateToken, IssueController.completeIssue);

module.exports = router;
