const QRCode = require('qrcode');
const { validateLocation } = require('../utils/locationUtils');
const { getCurrentIST } = require('../utils/timeUtils');
const prisma = require('../config/database');

const markAttendance = async (req, res) => {
  try {
    const { eventId, qrToken, location } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to mark attendance'
      });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: {
        id: parseInt(eventId)
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check event status
    if (event.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This event has been cancelled'
      });
    }

    if (event.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'This event has already been completed'
      });
    }

    // Validate location
    const isLocationValid = validateLocation(
      location,
      { latitude: event.latitude, longitude: event.longitude },
      event.radius
    );
    
    if (!isLocationValid) {
      return res.status(400).json({
        success: false,
        message: `You are not within the allowed radius (${event.radius}m) of the event location`
      });
    }
    
    // Check for existing attendance
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        eventId: parseInt(eventId),
        userId: userId
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this event',
        markedAt: existingAttendance.markedAt
      });
    }

    // Check capacity
    if (event.capacity) {
      const currentAttendance = await prisma.attendance.count({
        where: { eventId: parseInt(eventId) }
      });

      if (currentAttendance >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Event has reached maximum capacity'
        });
      }
    }

    // Get device and IP info from request
    const device = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate lectures missed (0-5 only)
    let lecturesMissed = parseInt(req.body.lecturesMissed) || 0;
    if (lecturesMissed < 0 || lecturesMissed > 5) {
      lecturesMissed = 0; // Default to 0 if invalid
    }

    // Mark attendance
    const attendance = await prisma.attendance.create({
      data: {
        eventId: parseInt(eventId),
        userId: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        reportingTime: getCurrentIST(), // Current time in IST when marking attendance
        lecturesMissed: lecturesMissed, // Validated 0-5 range
        device: device.substring(0, 255), // Limit length
        ipAddress: ipAddress
      },
      include: {
        event: {
          select: {
            name: true,
            date: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            rollNo: true,
            year: true,
            division: true,
            department: true,
            msaTeam: true,
            phone: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this event'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
};

const getAttendanceList = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, department, limit, offset } = req.query;
    
    const where = {
      eventId: parseInt(eventId)
    };

    // Add filters
    if (search || department) {
      where.user = {};
      if (search) {
        where.user.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (department) {
        where.user.department = department;
      }
    }

    const attendanceList = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true,
            year: true,
            division: true,
            department: true,
            msaTeam: true,
            phone: true
          }
        }
      },
      orderBy: {
        markedAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    });

    const total = await prisma.attendance.count({ where });
    
    res.json({
      success: true,
      data: attendanceList,
      total,
      count: attendanceList.length
    });
  } catch (error) {
    console.error('Error getting attendance list:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving attendance list'
    });
  }
};

// Check if user has marked attendance for an event
const checkAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        eventId: parseInt(eventId),
        userId: userId
      },
      include: {
        event: {
          select: {
            name: true,
            date: true
          }
        }
      }
    });

    res.json({
      success: true,
      marked: !!attendance,
      data: attendance
    });
  } catch (error) {
    console.error('Error checking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking attendance status'
    });
  }
};

// Update lectures missed (admin only)
const updateLecturesMissed = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { lecturesMissed } = req.body;

    // Validate lectures missed (0-5 only)
    const validatedLectures = parseInt(lecturesMissed);
    if (isNaN(validatedLectures) || validatedLectures < 0 || validatedLectures > 5) {
      return res.status(400).json({
        success: false,
        message: 'Lectures missed must be between 0 and 5'
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: { lecturesMissed: validatedLectures },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            rollNo: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Lectures missed updated successfully',
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Error updating lectures missed:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lectures missed'
    });
  }
};

// Update reporting time (admin only) - Fix for time reset issues
const updateReportingTime = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { reportingTime } = req.body;

    if (!reportingTime) {
      return res.status(400).json({
        success: false,
        message: 'Reporting time is required'
      });
    }

    // Validate and convert the provided time
    const newReportingTime = new Date(reportingTime);
    if (isNaN(newReportingTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reporting time format'
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: { reportingTime: newReportingTime },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            rollNo: true
          }
        },
        event: {
          select: {
            name: true,
            date: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Reporting time updated successfully',
      data: updatedAttendance
    });
  } catch (error) {
    console.error('Error updating reporting time:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reporting time'
    });
  }
};

// Delete attendance record (admin only)
const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    await prisma.attendance.delete({
      where: { id: parseInt(attendanceId) }
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record'
    });
  }
};

// Admin: Add attendee to event manually
const addAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, latitude, longitude, lecturesMissed, reportingTime } = req.body;

    console.log('Add attendee request:', {
      eventId,
      userId,
      lecturesMissed,
      reportingTime,
      requestBody: req.body
    });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true
      }
    });

    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found for adding:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRollNo: user.rollNo
    });

    // Check if attendance already exists
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        eventId: parseInt(eventId),
        userId: parseInt(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNo: true
          }
        }
      }
    });

    if (existingAttendance) {
      console.log('Existing attendance found:', {
        attendanceId: existingAttendance.id,
        userId: existingAttendance.userId,
        userName: existingAttendance.user.name,
        userEmail: existingAttendance.user.email,
        userRollNo: existingAttendance.user.rollNo
      });
      
      const markedAt = new Date(existingAttendance.markedAt || existingAttendance.reportingTime).toLocaleString();
      return res.status(400).json({
        success: false,
        message: `${existingAttendance.user.name} is already marked as present for this event`,
        details: {
          userId: existingAttendance.user.id,
          userName: existingAttendance.user.name,
          userEmail: existingAttendance.user.email,
          userRollNo: existingAttendance.user.rollNo,
          markedAt: markedAt,
          lecturesMissed: existingAttendance.lecturesMissed || 0
        }
      });
    }

    // Validate lectures missed (0-5 only)
    let validatedLectures = parseInt(lecturesMissed) || 0;
    if (validatedLectures < 0 || validatedLectures > 5) {
      validatedLectures = 0;
    }

    // Use provided coordinates or event location as fallback
    const attendanceLatitude = latitude ? parseFloat(latitude) : event.latitude;
    const attendanceLongitude = longitude ? parseFloat(longitude) : event.longitude;

    // Use provided reporting time or current IST time
    const attendanceReportingTime = reportingTime ? new Date(reportingTime) : getCurrentIST();

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        eventId: parseInt(eventId),
        userId: parseInt(userId),
        latitude: attendanceLatitude,
        longitude: attendanceLongitude,
        reportingTime: attendanceReportingTime,
        lecturesMissed: validatedLectures,
        device: 'Admin Added',
        ipAddress: req.ip || 'Admin'
      },
      include: {
        event: {
          select: {
            name: true,
            date: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            rollNo: true,
            year: true,
            division: true,
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Attendee added successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding attendee to event'
    });
  }
};

// Admin: Remove attendee from event
const removeAttendee = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    // Check if attendance record exists
    const attendance = await prisma.attendance.findFirst({
      where: {
        eventId: parseInt(eventId),
        userId: parseInt(userId)
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        event: {
          select: {
            name: true
          }
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Delete the attendance record
    await prisma.attendance.delete({
      where: { id: attendance.id }
    });

    res.json({
      success: true,
      message: `Removed ${attendance.user.name} from ${attendance.event.name}`,
      data: {
        userName: attendance.user.name,
        userEmail: attendance.user.email,
        eventName: attendance.event.name
      }
    });
  } catch (error) {
    console.error('Error removing attendee:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing attendee from event'
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceList,
  checkAttendance,
  updateLecturesMissed,
  updateReportingTime,
  deleteAttendance,
  addAttendee,
  removeAttendee
};
