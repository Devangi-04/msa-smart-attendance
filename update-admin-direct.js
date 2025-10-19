const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    console.log('\n=== Updating Admin Email and MES ID ===\n');

    // ⚠️ EDIT THESE VALUES BELOW ⚠️
    const NEW_EMAIL = 'admin@attendance.com';  // Keep current email
    const NEW_MES_ID = 'misadmin2025@msa.com';  // New MES ID

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('❌ No admin user found.');
      return;
    }

    console.log('Current admin details:');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`MES ID: ${admin.mesId || 'Not set'}`);
    console.log('\nUpdating to:');
    console.log(`New Email: ${NEW_EMAIL}`);
    console.log(`New MES ID: ${NEW_MES_ID}`);

    // Update admin
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: NEW_EMAIL,
        mesId: NEW_MES_ID
      }
    });

    console.log('\n✅ Admin updated successfully!\n');
    console.log('Updated details:');
    console.log(`Name: ${updated.name}`);
    console.log(`Email: ${updated.email}`);
    console.log(`MES ID: ${updated.mesId}`);
    console.log(`Role: ${updated.role}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
