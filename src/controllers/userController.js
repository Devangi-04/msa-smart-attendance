const prisma = require('../config/database');
const ExcelJS = require('exceljs');

// Get all users list (public - no sensitive data)
const getUsersList = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        rollNo: true,
        stream: true,
        year: true,
        division: true,
        msaTeam: true,
        gender: true,
        dateOfBirth: true,
        admissionNumber: true,
        mesId: true,
        createdAt: true
        // Exclude password and sensitive fields
      },
      orderBy: [
        { role: 'desc' }, // Admins first
        { name: 'asc' }   // Then alphabetically
      ]
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users list'
    });
  }
};

// Export users to Excel
const exportUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rollNo: true,
        stream: true,
        year: true,
        division: true,
        department: true,
        msaTeam: true,
        gender: true,
        dateOfBirth: true,
        phone: true,
        admissionNumber: true,
        mesId: true,
        createdAt: true
      },
      orderBy: [
        { role: 'desc' },
        { name: 'asc' }
      ]
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MSA Members');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Roll No', key: 'rollNo', width: 15 },
      { header: 'Stream', key: 'stream', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Division', key: 'division', width: 10 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'MSA Team', key: 'msaTeam', width: 20 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Admission No', key: 'admissionNumber', width: 15 },
      { header: 'MES ID', key: 'mesId', width: 15 },
      { header: 'Joined On', key: 'createdAt', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    users.forEach((user, index) => {
      worksheet.addRow({
        sno: index + 1,
        name: user.name || 'N/A',
        email: user.email,
        role: user.role,
        rollNo: user.rollNo || 'N/A',
        stream: user.stream || 'N/A',
        year: user.year || 'N/A',
        division: user.division || 'N/A',
        department: user.department || 'N/A',
        msaTeam: user.msaTeam || 'N/A',
        gender: user.gender || 'N/A',
        dob: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
        phone: user.phone || 'N/A',
        admissionNumber: user.admissionNumber || 'N/A',
        mesId: user.mesId || 'N/A',
        createdAt: new Date(user.createdAt).toLocaleString('en-IN')
      });
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=msa-members-${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users'
    });
  }
};

module.exports = {
  getUsersList,
  exportUsers
};
