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

    // Segregate users by year and sort by normalized department within each year
    const fyUsers = users.filter(user => user.year === 'FY').sort((a, b) => {
      const deptA = normalizeDepartment(a.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.name.localeCompare(b.name);
    });
    
    const syUsers = users.filter(user => user.year === 'SY').sort((a, b) => {
      const deptA = normalizeDepartment(a.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.name.localeCompare(b.name);
    });
    
    const tyUsers = users.filter(user => user.year === 'TY').sort((a, b) => {
      const deptA = normalizeDepartment(a.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.name.localeCompare(b.name);
    });
    
    const otherUsers = users.filter(user => !['FY', 'SY', 'TY'].includes(user.year)).sort((a, b) => {
      const deptA = normalizeDepartment(a.department) || 'ZZZ';
      const deptB = normalizeDepartment(b.department) || 'ZZZ';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return a.name.localeCompare(b.name);
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MSA Members');

    // Set column widths
    worksheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'department', width: 25 },
      { key: 'year', width: 10 },
      { key: 'name', width: 25 },
      { key: 'rollNo', width: 15 },
      { key: 'division', width: 10 },
      { key: 'email', width: 30 },
      { key: 'phone', width: 15 },
      { key: 'msaTeam', width: 20 },
      { key: 'stream', width: 15 },
      { key: 'gender', width: 10 },
      { key: 'dob', width: 15 },
      { key: 'role', width: 10 },
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
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = `Total Members: ${users.length}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
    currentRow++; // Empty row

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
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Add column headers
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['S.No', 'Department', 'Year', 'Name', 'Roll No', 'Division', 'Email', 'Phone', 'MSA Team', 'Stream', 'Gender', 'Date of Birth', 'Role', 'Admission No', 'MES ID', 'Joined On'];
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
      userData.forEach((user, index) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          index + 1,
          normalizeDepartment(user.department),
          user.year || 'N/A',
          user.name || 'N/A',
          user.rollNo || 'N/A',
          user.division || 'N/A',
          user.email,
          user.phone || 'N/A',
          user.msaTeam || 'N/A',
          user.stream || 'N/A',
          user.gender || 'N/A',
          user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
          user.role,
          user.admissionNumber || 'N/A',
          user.mesId || 'N/A',
          new Date(user.createdAt).toLocaleString('en-IN')
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

    // Fields with unique constraints - only update if not null
    const uniqueFields = ['rollNo', 'admissionNumber', 'mesId'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // For unique fields, skip if value is null to avoid unique constraint issues
        if (uniqueFields.includes(field) && req.body[field] === null) {
          // Only update if the existing value is not null or if we're setting a new value
          if (existingUser[field] !== null) {
            updateData[field] = req.body[field];
          }
        } else {
          // Convert dateOfBirth string to Date object
          if (field === 'dateOfBirth' && req.body[field]) {
            updateData[field] = new Date(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
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
