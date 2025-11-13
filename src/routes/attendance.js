const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceList,
  checkAttendance,
  updateLecturesMissed,
  updateReportingTime,
  deleteAttendance,
  addAttendee,
  removeAttendee
} = require('../controllers/attendanceController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Protected routes (require authentication)
router.post('/mark', authenticate, markAttendance);
router.get('/check/:eventId', authenticate, checkAttendance);

// Admin/Public routes
router.get('/list/:eventId', getAttendanceList);

// Admin only routes
router.patch('/:attendanceId/lectures', authenticate, isAdmin, updateLecturesMissed);
router.patch('/:attendanceId/reporting-time', authenticate, isAdmin, updateReportingTime);
router.delete('/:attendanceId', authenticate, isAdmin, deleteAttendance);
router.post('/events/:eventId/add-attendee', authenticate, isAdmin, addAttendee);
router.delete('/events/:eventId/users/:userId', authenticate, isAdmin, removeAttendee);

module.exports = router;
