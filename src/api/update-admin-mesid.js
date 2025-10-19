/**
 * Vercel Serverless Function to Update Admin MES ID
 * 
 * This is a one-time use endpoint to update the admin's MES ID in production.
 * 
 * Usage:
 * 1. Deploy to Vercel
 * 2. Visit: https://your-app.vercel.app/api/update-admin-mesid?secret=YOUR_SECRET_KEY
 * 3. Delete or disable this file after use for security
 */

const { PrismaClient } = require('@prisma/client');

// Security: Set a secret key in Vercel environment variables
const SECRET_KEY = process.env.ADMIN_UPDATE_SECRET || 'change-this-secret-key-123';

module.exports = async (req, res) => {
  // Security check
  const { secret } = req.query;
  
  if (secret !== SECRET_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Invalid secret key'
    });
  }

  const prisma = new PrismaClient();

  try {
    console.log('Updating admin MES ID in production...');

    const NEW_MES_ID = 'misadmin2025@msa.com';

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    console.log('Found admin:', admin.name);

    // Update admin MES ID
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { mesId: NEW_MES_ID }
    });

    console.log('Admin updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Admin MES ID updated successfully',
      data: {
        name: updated.name,
        email: updated.email,
        mesId: updated.mesId,
        role: updated.role
      }
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating admin MES ID',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
};
