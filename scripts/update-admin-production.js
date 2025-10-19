/**
 * Update Admin MES ID in Production (Vercel)
 * 
 * This script updates the admin's MES ID in the production database.
 * 
 * Usage:
 * 1. Set the DATABASE_URL environment variable to your production database
 * 2. Run: node scripts/update-admin-production.js
 * 
 * OR deploy this as a Vercel Serverless Function and call it once
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminInProduction() {
  try {
    console.log('🔄 Updating admin MES ID in production...\n');

    // Configuration
    const NEW_MES_ID = 'misadmin2025@msa.com';
    const ADMIN_EMAIL = 'admin@attendance.com'; // Use this to find the admin

    // Find admin by email
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });

    if (!admin) {
      console.log('❌ Admin user not found with email:', ADMIN_EMAIL);
      console.log('💡 Trying to find by role...');
      
      const adminByRole = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!adminByRole) {
        console.log('❌ No admin user found in database!');
        return { success: false, message: 'No admin found' };
      }

      console.log('✅ Found admin:', adminByRole.name);
      
      // Update admin
      const updated = await prisma.user.update({
        where: { id: adminByRole.id },
        data: { mesId: NEW_MES_ID }
      });

      console.log('✅ Admin MES ID updated successfully!');
      console.log('Updated details:');
      console.log(`  Name: ${updated.name}`);
      console.log(`  Email: ${updated.email}`);
      console.log(`  MES ID: ${updated.mesId}`);
      
      return { success: true, data: updated };
    }

    // Update admin
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { mesId: NEW_MES_ID }
    });

    console.log('✅ Admin MES ID updated successfully!');
    console.log('Updated details:');
    console.log(`  Name: ${updated.name}`);
    console.log(`  Email: ${updated.email}`);
    console.log(`  MES ID: ${updated.mesId}`);

    return { success: true, data: updated };

  } catch (error) {
    console.error('❌ Error updating admin:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  updateAdminInProduction()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Update completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Update failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = updateAdminInProduction;
