const QRCode = require('qrcode');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const moment = require('moment');
const prisma = require('../config/database');

const createEvent = async (req, res) => {
  try {
    console.log('Received event creation request:', req.body);
    const { name, date, latitude, longitude, radius } = req.body;
    
    // Debug log
    console.log('Raw values:', {
      name: typeof name + ': ' + name,
      date: typeof date + ': ' + date,
      latitude: typeof latitude + ': ' + latitude,
      longitude: typeof longitude + ': ' + longitude,
      radius: typeof radius + ': ' + radius
    });

    // Validate required fields
    if (!name || !date || !radius) {
      console.log('Missing required fields:', { name, date, radius });
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${!name ? 'name' : ''} ${!date ? 'date' : ''} ${!radius ? 'radius' : ''}`.trim()
      });
    }

    // Validate location
    if (!latitude || !longitude) {
      console.log('Missing location data:', { latitude, longitude });
      return res.status(400).json({
        success: false,
        message: 'Please set the event location using the "Get Current Location" button'
      });
    }

    // Validate data types
    const parsedRadius = parseInt(radius);
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    const parsedDate = new Date(date);

    if (isNaN(parsedRadius) || parsedRadius <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid radius value. Must be a positive number.'
      });
    }

    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates.'
      });
    }

    if (parsedDate.toString() === 'Invalid Date') {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.'
      });
    }

    const { description, venue, capacity, endDate, status } = req.body;

    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required. Please login.'
      });
    }

    const eventData = {
      name: name.trim(),
      description: description?.trim(),
      date: parsedDate,
      endDate: endDate ? new Date(endDate) : null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      radius: parsedRadius,
      venue: venue?.trim(),
      capacity: capacity ? parseInt(capacity) : null,
      createdById: req.user.id,
      status: status || 'UPCOMING'
    };

    console.log('Creating event with processed data:', eventData);
    console.log('User creating event:', req.user);

    // Insert the event into the database
    const event = await prisma.event.create({
      data: eventData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }).catch(error => {
      console.error('Prisma create error:', error);
      throw error;
    });
    
    console.log('Event created successfully:', event);
    
    res.json({
      success: true,
      message: 'Event created successfully',
      eventId: event.id
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event'
    });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            attendance: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    });

    // Add computed fields
    const eventsWithStats = events.map(event => ({
      ...event,
      attendanceCount: event._count.attendance,
      attendancePercentage: event.capacity 
        ? ((event._count.attendance / event.capacity) * 100).toFixed(2)
        : null
    }));
    
    res.json({
      success: true,
      data: eventsWithStats,
      count: events.length
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving events'
    });
  }
};

const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await prisma.event.findUnique({
      where: {
        id: parseInt(eventId)
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true
              }
            }
          },
          orderBy: {
            markedAt: 'desc'
          }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...event,
        attendanceCount: event.attendance.length,
        attendancePercentage: event.capacity 
          ? ((event.attendance.length / event.capacity) * 100).toFixed(2)
          : null
      }
    });
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving event'
    });
  }
};

const generateQR = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Generate a unique token for this QR code
    const token = crypto.randomBytes(16).toString('hex');
    
    // Create QR code data - simpler format for better scanning
    const qrData = JSON.stringify({
      eventId: parseInt(eventId),
      token: token,
      ts: Date.now()
    });
    
    // Generate QR code as data URL with high error correction
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 1,
      width: 400,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store QR code in database
    await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: { qrCode: qrCodeDataURL }
    });
    
    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      eventName: event.name,
      eventDate: event.date
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code'
    });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, date, endDate, latitude, longitude, radius, venue, capacity, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (date) updateData.date = new Date(date);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radius) updateData.radius = parseInt(radius);
    if (venue !== undefined) updateData.venue = venue?.trim();
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null;
    if (status) updateData.status = status;

    const event = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event'
    });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    await prisma.event.delete({
      where: { id: parseInt(eventId) }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event'
    });
  }
};

// Get event statistics
const getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        attendance: {
          include: {
            user: {
              select: {
                department: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Calculate statistics
    const totalAttendees = event.attendance.length;
    const departmentStats = {};
    
    event.attendance.forEach(att => {
      const dept = att.user.department || 'Unknown';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
    });

    const stats = {
      eventName: event.name,
      eventDate: event.date,
      totalAttendees,
      capacity: event.capacity,
      attendanceRate: event.capacity ? ((totalAttendees / event.capacity) * 100).toFixed(2) : null,
      departmentBreakdown: departmentStats,
      status: event.status
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting event stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving event statistics'
    });
  }
};

// Export attendance to Excel
const exportAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        attendance: {
          include: {
            user: true
          },
          orderBy: {
            markedAt: 'asc'
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers for MSA attendance
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Roll No', key: 'rollNo', width: 12 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Class', key: 'class', width: 15 },
      { header: 'Division', key: 'division', width: 10 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'MSA Team', key: 'msaTeam', width: 15 },
      { header: 'Contact No', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Reporting Time', key: 'reportingTime', width: 20 },
      { header: 'Lectures Missed', key: 'lecturesMissed', width: 15 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data rows with MSA fields
    event.attendance.forEach((att, index) => {
      worksheet.addRow({
        sno: index + 1,
        rollNo: att.user.rollNo || 'N/A',
        name: att.user.name,
        class: att.user.year ? `${att.user.year} ${att.user.department || ''}`.trim() : att.user.department || 'N/A',
        division: att.user.division || 'N/A',
        department: att.user.department || 'N/A',
        msaTeam: att.user.msaTeam || 'N/A',
        phone: att.user.phone || 'N/A',
        email: att.user.email,
        reportingTime: moment(att.reportingTime || att.markedAt).format('YYYY-MM-DD HH:mm:ss'),
        lecturesMissed: att.lecturesMissed || 0,
        latitude: att.latitude.toFixed(6),
        longitude: att.longitude.toFixed(6)
      });
    });

    // Add event info at the top
    worksheet.insertRow(1, ['Event Name:', event.name]);
    worksheet.insertRow(2, ['Event Date:', moment(event.date).format('YYYY-MM-DD HH:mm')]);
    worksheet.insertRow(3, ['Total Attendees:', event.attendance.length]);
    worksheet.insertRow(4, []);

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${event.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalEvents = await prisma.event.count();
    const totalAttendance = await prisma.attendance.count();
    const totalUsers = await prisma.user.count();

    const upcomingEvents = await prisma.event.count({
      where: {
        date: {
          gte: new Date()
        },
        status: 'UPCOMING'
      }
    });

    const activeEvents = await prisma.event.count({
      where: { status: 'ACTIVE' }
    });

    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: {
        date: 'desc'
      },
      include: {
        _count: {
          select: {
            attendance: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalEvents,
        totalAttendance,
        totalUsers,
        upcomingEvents,
        activeEvents,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics'
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  generateQR,
  updateEvent,
  deleteEvent,
  getEventStats,
  exportAttendance,
  getDashboardStats
};
