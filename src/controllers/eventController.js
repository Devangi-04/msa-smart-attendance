const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const moment = require('moment');
const prisma = require('../config/database');

// Normalize department names to group similar departments
const normalizeDepartment = (dept) => {
  if (!dept) return 'No Department';
  
  const deptLower = dept.toLowerCase().trim();
  
  // Information Technology variations
  if (deptLower.includes('information technology') || 
      deptLower === 'it' || 
      deptLower.includes('bsc it') ||
      deptLower.includes('b.sc it') ||
      deptLower.includes('bscit') ||
      deptLower.includes('bsc-it')) {
    return 'Information Technology';
  }
  
  // Computer Science variations
  if (deptLower.includes('computer science') || 
      deptLower === 'cs' || 
      deptLower.includes('bsc cs') ||
      deptLower.includes('b.sc cs')) {
    return 'Computer Science';
  }
  
  // Add more normalizations as needed
  // Electronics variations
  if (deptLower.includes('electronics') || deptLower === 'ec') {
    return 'Electronics';
  }
  
  // Return original if no match
  return dept;
};

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

    // Segregate attendance by year and sort by normalized department within each year
    const fyAttendance = event.attendance.filter(att => att.user.year === 'FY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const syAttendance = event.attendance.filter(att => att.user.year === 'SY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const tyAttendance = event.attendance.filter(att => att.user.year === 'TY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const otherAttendance = event.attendance.filter(att => !['FY', 'SY', 'TY'].includes(att.user.year)).sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Set column widths
    worksheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'department', width: 25 },
      { key: 'year', width: 10 },
      { key: 'rollNo', width: 12 },
      { key: 'name', width: 25 },
      { key: 'division', width: 10 },
      { key: 'msaTeam', width: 15 },
      { key: 'phone', width: 15 },
      { key: 'email', width: 30 },
      { key: 'reportingTime', width: 20 },
      { key: 'lecturesMissed', width: 15 },
      { key: 'latitude', width: 12 },
      { key: 'longitude', width: 12 }
    ];

    let currentRow = 1;

    // Add event info at the top
    worksheet.getCell(`A${currentRow}`).value = 'Event Name:';
    worksheet.getCell(`B${currentRow}`).value = event.name;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Event Date:';
    worksheet.getCell(`B${currentRow}`).value = moment(event.date).format('YYYY-MM-DD HH:mm');
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Attendees:';
    worksheet.getCell(`B${currentRow}`).value = event.attendance.length;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Helper function to add year section
    const addYearSection = (yearName, attendanceData) => {
      if (attendanceData.length === 0) return;

      // Add year header
      worksheet.getCell(`A${currentRow}`).value = yearName;
      worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Add column headers
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['S.No', 'Department', 'Year', 'Roll No', 'Name', 'Division', 'MSA Team', 'Contact No', 'Email', 'Reporting Time', 'Lectures Missed', 'Latitude', 'Longitude'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 20;
      currentRow++;

      // Add data rows
      attendanceData.forEach((att, index) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          normalizeDepartment(att.user.department),
          att.user.year || 'N/A',
          att.user.rollNo || 'N/A',
          att.user.name,
          att.user.division || 'N/A',
          att.user.msaTeam || 'N/A',
          att.user.phone || 'N/A',
          att.user.email,
          moment(att.reportingTime || att.markedAt).format('YYYY-MM-DD HH:mm:ss'),
          att.lecturesMissed || 0,
          att.latitude.toFixed(6),
          att.longitude.toFixed(6)
        ];
        
        // Format phone number as text to prevent Excel errors
        const phoneCell = dataRow.getCell(8); // Phone is column 8 (Contact No)
        phoneCell.numFmt = '@'; // Text format

        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        currentRow++;
      });

      // Add total count row
      worksheet.getCell(`A${currentRow}`).value = `Total ${yearName}:`;
      worksheet.getCell(`B${currentRow}`).value = attendanceData.length;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow += 2; // Add spacing between sections
    };

    // Add sections for each year
    addYearSection('FY (First Year)', fyAttendance);
    addYearSection('SY (Second Year)', syAttendance);
    addYearSection('TY (Third Year)', tyAttendance);
    if (otherAttendance.length > 0) {
      addYearSection('Others', otherAttendance);
    }

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

// Export monthly attendance report - User-wise attendance totals
const exportMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch all events in the month with attendance
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        attendance: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No events found for the selected month'
      });
    }

    // Create a map of users and their attendance count
    const userAttendanceMap = new Map();

    events.forEach(event => {
      event.attendance.forEach(att => {
        const userId = att.user.id;
        if (!userAttendanceMap.has(userId)) {
          userAttendanceMap.set(userId, {
            user: att.user,
            count: 0,
            totalLecturesMissed: 0,
            events: []
          });
        }
        const userData = userAttendanceMap.get(userId);
        userData.count++;
        userData.totalLecturesMissed += (att.lecturesMissed || 0);
        userData.events.push({
          name: event.name,
          date: event.date,
          lecturesMissed: att.lecturesMissed || 0
        });
      });
    });

    // Convert map to array
    const usersWithAttendance = Array.from(userAttendanceMap.values());

    // Segregate by year and sort by normalized department within each year
    const fyUsers = usersWithAttendance.filter(u => u.user.year === 'FY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const syUsers = usersWithAttendance.filter(u => u.user.year === 'SY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const tyUsers = usersWithAttendance.filter(u => u.user.year === 'TY').sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });
    
    const otherUsers = usersWithAttendance.filter(u => !['FY', 'SY', 'TY'].includes(u.user.year)).sort((a, b) => {
      const deptA = normalizeDepartment(a.user.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.user.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.user.name.localeCompare(b.user.name);
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Attendance');

    // Set column widths
    worksheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'department', width: 25 },
      { key: 'year', width: 10 },
      { key: 'rollNo', width: 12 },
      { key: 'name', width: 25 },
      { key: 'division', width: 10 },
      { key: 'msaTeam', width: 20 },
      { key: 'phone', width: 15 },
      { key: 'totalEvents', width: 15 },
      { key: 'totalLectures', width: 18 }
    ];

    let currentRow = 1;

    // Add title
    worksheet.getCell(`A${currentRow}`).value = `Monthly Attendance Report - ${moment(startDate).format('MMMM YYYY')}`;
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' }
    };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = `Total Events: ${events.length}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = `Total Unique Attendees: ${usersWithAttendance.length}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Helper function to add year section
    const addYearSection = (yearName, userData) => {
      if (userData.length === 0) return;

      // Year header
      worksheet.getCell(`A${currentRow}`).value = yearName;
      worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Column headers
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['S.No', 'Department', 'Year', 'Roll No', 'Name', 'Division', 'MSA Team', 'Phone', 'Events Attended', 'Total Lectures Missed'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 20;
      currentRow++;

      // Data rows
      userData.forEach((item, index) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          normalizeDepartment(item.user.department),
          item.user.year || 'N/A',
          item.user.rollNo || 'N/A',
          item.user.name,
          item.user.division || 'N/A',
          item.user.msaTeam || 'N/A',
          item.user.phone || 'N/A',
          item.count,
          item.totalLecturesMissed
        ];

        // Format phone as text
        const phoneCell = dataRow.getCell(8);
        phoneCell.numFmt = '@';

        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        currentRow++;
      });

      // Add total count row
      worksheet.getCell(`A${currentRow}`).value = `Total ${yearName}:`;
      worksheet.getCell(`B${currentRow}`).value = userData.length;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow += 2; // Add spacing between sections
    };

    // Add sections for each year
    addYearSection('FY (First Year)', fyUsers);
    addYearSection('SY (Second Year)', syUsers);
    addYearSection('TY (Third Year)', tyUsers);
    if (otherUsers.length > 0) {
      addYearSection('Others', otherUsers);
    }

    // Set response headers
    const monthName = moment(startDate).format('MMMM-YYYY');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=monthly-attendance-report-${monthName}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting monthly report',
      error: error.message
    });
  }
};

// Get defaulter list for an event (users who didn't attend)
const getDefaulterList = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { department, year, division } = req.query;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        attendance: {
          select: {
            userId: true
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

    // Get list of user IDs who attended
    const attendedUserIds = event.attendance.map(att => att.userId);

    // Build where clause for users who didn't attend
    const where = {
      id: {
        notIn: attendedUserIds
      },
      role: 'USER' // Only include regular users, not admins
    };

    // Add filters
    if (department) {
      where.department = department;
    }
    if (year) {
      where.year = year;
    }
    if (division) {
      where.division = division;
    }

    // Get all users who didn't attend
    const defaulters = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        year: true,
        division: true,
        department: true,
        msaTeam: true,
        phone: true,
        stream: true
      },
      orderBy: [
        { year: 'asc' },
        { division: 'asc' },
        { rollNo: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          venue: event.venue
        },
        defaulters,
        totalDefaulters: defaulters.length,
        totalAttended: attendedUserIds.length
      }
    });
  } catch (error) {
    console.error('Error getting defaulter list:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving defaulter list'
    });
  }
};

// Export defaulter list to Excel
const exportDefaulterList = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        attendance: {
          select: {
            userId: true
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

    // Get list of user IDs who attended
    const attendedUserIds = event.attendance.map(att => att.userId);

    // Get all users who didn't attend (excluding admins)
    const defaulters = await prisma.user.findMany({
      where: {
        id: {
          notIn: attendedUserIds
        },
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        year: true,
        division: true,
        department: true,
        msaTeam: true,
        phone: true,
        stream: true
      },
      orderBy: [
        { year: 'asc' },
        { division: 'asc' },
        { rollNo: 'asc' }
      ]
    });

    // Separate by year
    const fyDefaulters = defaulters.filter(u => u.year === 'FY');
    const syDefaulters = defaulters.filter(u => u.year === 'SY');
    const tyDefaulters = defaulters.filter(u => u.year === 'TY');
    const otherDefaulters = defaulters.filter(u => !['FY', 'SY', 'TY'].includes(u.year));

    // Create Excel workbook
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Defaulters');

    // Set column widths
    worksheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'department', width: 25 },
      { key: 'year', width: 10 },
      { key: 'rollNo', width: 12 },
      { key: 'name', width: 25 },
      { key: 'division', width: 10 },
      { key: 'msaTeam', width: 15 },
      { key: 'phone', width: 15 },
      { key: 'email', width: 30 }
    ];

    let currentRow = 1;

    // Add event info at the top
    worksheet.getCell(`A${currentRow}`).value = 'Event Name:';
    worksheet.getCell(`B${currentRow}`).value = event.name;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Event Date:';
    worksheet.getCell(`B${currentRow}`).value = moment(event.date).format('YYYY-MM-DD HH:mm');
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Attended:';
    worksheet.getCell(`B${currentRow}`).value = attendedUserIds.length;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Defaulters:';
    worksheet.getCell(`B${currentRow}`).value = defaulters.length;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } };
    worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } };
    currentRow += 2;

    // Helper function to normalize department
    const normalizeDepartment = (dept) => {
      if (!dept) return 'N/A';
      const deptMap = {
        'CS': 'Computer Science',
        'IT': 'Information Technology',
        'MECH': 'Mechanical Engineering',
        'CIVIL': 'Civil Engineering',
        'EE': 'Electrical Engineering',
        'EC': 'Electronics & Communication',
        'AIDS': 'Artificial Intelligence & Data Science'
      };
      return deptMap[dept] || dept;
    };

    // Helper function to add year section
    const addYearSection = (yearName, userData) => {
      if (userData.length === 0) return;

      // Add year header
      worksheet.getCell(`A${currentRow}`).value = `${yearName} - DEFAULTERS`;
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC3545' } // Red color for defaulters
      };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Add column headers
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['S.No', 'Department', 'Year', 'Roll No', 'Name', 'Division', 'MSA Team', 'Contact No', 'Email'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC3545' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 20;
      currentRow++;

      // Add data rows
      userData.forEach((user, index) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          normalizeDepartment(user.department),
          user.year || 'N/A',
          user.rollNo || 'N/A',
          user.name,
          user.division || 'N/A',
          user.msaTeam || 'N/A',
          user.phone || 'N/A',
          user.email
        ];

        // Format phone number as text
        const phoneCell = dataRow.getCell(8);
        phoneCell.numFmt = '@';

        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        currentRow++;
      });

      // Add total count row
      worksheet.getCell(`A${currentRow}`).value = `Total ${yearName} Defaulters:`;
      worksheet.getCell(`B${currentRow}`).value = userData.length;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } };
      worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } };
      currentRow += 2; // Add spacing between sections
    };

    // Add sections for each year
    addYearSection('FY (First Year)', fyDefaulters);
    addYearSection('SY (Second Year)', syDefaulters);
    addYearSection('TY (Third Year)', tyDefaulters);
    if (otherDefaulters.length > 0) {
      addYearSection('Others', otherDefaulters);
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=defaulters_${event.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting defaulter list:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting defaulter list'
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
  getDashboardStats,
  exportMonthlyReport,
  getDefaulterList,
  exportDefaulterList
};
