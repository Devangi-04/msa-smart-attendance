const QRCode = require('qrcode');
const { validateLocation } = require('../utils/locationUtils');
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
        reportingTime: new Date(), // Current time when marking attendance
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

module.exports = {
  markAttendance,
  getAttendanceList,
  checkAttendance,
  updateLecturesMissed,
  deleteAttendance
};
