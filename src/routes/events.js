const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvent,
  generateQR,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getEventStats,
  exportAttendance,
  getDashboardStats,
  exportMonthlyReport,
  getDefaulterList,
  exportDefaulterList
} = require('../controllers/eventController');
const { authenticate, isAdmin, optionalAuth } = require('../middleware/auth');

// Public/Optional Auth routes
router.get('/', optionalAuth, getAllEvents);
router.get('/dashboard/stats', optionalAuth, getDashboardStats);
router.get('/:eventId', optionalAuth, getEvent);

// Protected routes (require authentication)
router.post('/create', authenticate, createEvent);
router.put('/:eventId', authenticate, updateEvent);
router.get('/:eventId/qr', authenticate, generateQR);
router.get('/:eventId/stats', authenticate, getEventStats);

// Admin only routes
router.delete('/:eventId', authenticate, isAdmin, deleteEvent);
router.get('/:eventId/export', authenticate, isAdmin, exportAttendance);
router.get('/reports/monthly', authenticate, isAdmin, exportMonthlyReport);
router.get('/:eventId/defaulters', authenticate, isAdmin, getDefaulterList);
router.get('/:eventId/defaulters/export', authenticate, isAdmin, exportDefaulterList);

module.exports = router;
