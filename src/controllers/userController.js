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

    // Segregate users by year
    const fyUsers = users.filter(user => user.year === 'FY');
    const syUsers = users.filter(user => user.year === 'SY');
    const tyUsers = users.filter(user => user.year === 'TY');
    const otherUsers = users.filter(user => !['FY', 'SY', 'TY'].includes(user.year));

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MSA Members');

    // Set column widths
    worksheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'name', width: 25 },
      { key: 'email', width: 30 },
      { key: 'role', width: 10 },
      { key: 'rollNo', width: 15 },
      { key: 'stream', width: 15 },
      { key: 'year', width: 10 },
      { key: 'division', width: 10 },
      { key: 'department', width: 20 },
      { key: 'msaTeam', width: 20 },
      { key: 'gender', width: 10 },
      { key: 'dob', width: 15 },
      { key: 'phone', width: 15 },
      { key: 'admissionNumber', width: 15 },
      { key: 'mesId', width: 15 },
      { key: 'createdAt', width: 20 }
    ];

    let currentRow = 1;

    // Add title
    worksheet.getCell(`A${currentRow}`).value = 'MSA Members List';
    worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' }
    };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = `Total Members: ${users.length}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Helper function to add year section
    const addYearSection = (yearName, userData) => {
      if (userData.length === 0) return;

      // Add year header
      worksheet.getCell(`A${currentRow}`).value = yearName;
      worksheet.mergeCells(`A${currentRow}:P${currentRow}`);
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;

      // Add column headers
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['S.No', 'Name', 'Email', 'Role', 'Roll No', 'Stream', 'Year', 'Division', 'Department', 'MSA Team', 'Gender', 'Date of Birth', 'Phone', 'Admission No', 'MES ID', 'Joined On'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      currentRow++;

      // Add data rows
      userData.forEach((user, index) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          user.name || 'N/A',
          user.email,
          user.role,
          user.rollNo || 'N/A',
          user.stream || 'N/A',
          user.year || 'N/A',
          user.division || 'N/A',
          user.department || 'N/A',
          user.msaTeam || 'N/A',
          user.gender || 'N/A',
          user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
          user.phone || 'N/A',
          user.admissionNumber || 'N/A',
          user.mesId || 'N/A',
          new Date(user.createdAt).toLocaleString('en-IN')
        ];

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

      // Add count row
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

// Update user by ID (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    console.log('Update user request - ID:', id, 'Body:', JSON.stringify(req.body, null, 2));
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data (exclude password and email from updates)
    const updateData = {};
    const allowedFields = [
      'name', 'role', 'department', 'phone', 'rollNo', 
      'stream', 'year', 'division', 'msaTeam', 'gender', 
      'dateOfBirth', 'admissionNumber', 'mesId'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user by ID (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user && req.user.id === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

module.exports = {
  getUsersList,
  exportUsers,
  updateUser,
  deleteUser
};
