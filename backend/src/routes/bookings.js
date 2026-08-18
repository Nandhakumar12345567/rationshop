const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/slots', authenticateToken, BookingController.getAvailableSlots);
router.post('/create', authenticateToken, BookingController.createBooking);
router.post('/cancel', authenticateToken, BookingController.cancelBooking);
router.get('/my-bookings', authenticateToken, BookingController.getUserBookings);
router.get('/:id', authenticateToken, BookingController.getBookingById);

module.exports = router;
