const express = require('express');
const { getUsersList, exportUsers } = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin only routes - require authentication
router.get('/', authenticate, isAdmin, getUsersList);
router.get('/export', authenticate, isAdmin, exportUsers);

// Legacy route for backward compatibility
router.get('/list', getUsersList);

module.exports = router;
