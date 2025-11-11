const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getMyAttendance,
  getAllUsers,
  generateTempPassword,
  adminResetPassword
} = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
  ],
  register
);

router.post(
  '/login',
  [
    body('mesId').trim().notEmpty().withMessage('MES ID is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.get('/my-attendance', authenticate, getMyAttendance);

// Admin only routes
router.get('/users', authenticate, isAdmin, getAllUsers);
router.post('/users/:userId/generate-temp-password', authenticate, isAdmin, generateTempPassword);
router.post('/users/:userId/reset-password', authenticate, isAdmin, adminResetPassword);

module.exports = router;
