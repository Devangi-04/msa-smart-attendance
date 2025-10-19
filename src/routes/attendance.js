const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceList,
  checkAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Protected routes (require authentication)
router.post('/mark', authenticate, markAttendance);
router.get('/check/:eventId', authenticate, checkAttendance);

// Admin/Public routes
router.get('/list/:eventId', getAttendanceList);

// Admin only routes
router.delete('/:attendanceId', authenticate, isAdmin, deleteAttendance);

module.exports = router;
