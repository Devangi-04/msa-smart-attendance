const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      email, password, name, department, phone,
      rollNo, stream, year, division, msaTeam,
      gender, dateOfBirth, admissionNumber, mesId
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check for duplicate roll number
    if (rollNo) {
      const existingRollNo = await prisma.user.findUnique({
        where: { rollNo }
      });
      if (existingRollNo) {
        return res.status(400).json({
          success: false,
          message: 'Roll number already registered'
        });
      }
    }

    // Check for duplicate admission number
    if (admissionNumber) {
      const existingAdmission = await prisma.user.findUnique({
        where: { admissionNumber }
      });
      if (existingAdmission) {
        return res.status(400).json({
          success: false,
          message: 'Admission number already registered'
        });
      }
    }

    // Check for duplicate MES ID
    if (mesId) {
      const existingMesId = await prisma.user.findUnique({
        where: { mesId }
      });
      if (existingMesId) {
        return res.status(400).json({
          success: false,
          message: 'MES ID already registered'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        phone,
        role: 'USER',
        // MSA specific fields
        rollNo,
        stream,
        year,
        division,
        msaTeam,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        admissionNumber,
        mesId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        rollNo: true,
        stream: true,
        year: true,
        division: true,
        createdAt: true
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { mesId, password } = req.body;

    // Find user by MES ID
    const user = await prisma.user.findUnique({
      where: { mesId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid MES ID or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid MES ID or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            attendance: true,
            createdEvents: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, department, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        department,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// Get user's attendance history
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true
          }
        }
      },
      orderBy: {
        markedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving attendance history'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getMyAttendance
};
