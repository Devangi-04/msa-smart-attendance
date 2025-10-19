const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateAdmin() {
  try {
    console.log('\n=== Update Admin Email and MES ID ===\n');

    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        mesId: true,
        role: true
      }
    });

    if (admins.length === 0) {
      console.log('❌ No admin users found in the database.');
      return;
    }

    console.log('Found admin user(s):\n');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   MES ID: ${admin.mesId || 'Not set'}`);
      console.log('');
    });

    let adminToUpdate;
    if (admins.length === 1) {
      adminToUpdate = admins[0];
      console.log(`Updating: ${adminToUpdate.name}\n`);
    } else {
      const choice = await question('Enter the number of admin to update: ');
      const index = parseInt(choice) - 1;
      if (index < 0 || index >= admins.length) {
        console.log('❌ Invalid choice.');
        return;
      }
      adminToUpdate = admins[index];
    }

    // Get new email
    const newEmail = await question(`Enter new email (current: ${adminToUpdate.email}): `);
    const emailToUpdate = newEmail.trim() || adminToUpdate.email;

    // Get new MES ID
    const newMesId = await question(`Enter new MES ID (current: ${adminToUpdate.mesId || 'Not set'}): `);
    const mesIdToUpdate = newMesId.trim() || adminToUpdate.mesId;

    // Confirm update
    console.log('\n--- Confirm Update ---');
    console.log(`Email: ${emailToUpdate}`);
    console.log(`MES ID: ${mesIdToUpdate}`);
    const confirm = await question('\nProceed with update? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Update cancelled.');
      return;
    }

    // Update the admin
    const updated = await prisma.user.update({
      where: { id: adminToUpdate.id },
      data: {
        email: emailToUpdate,
        mesId: mesIdToUpdate
      },
      select: {
        id: true,
        name: true,
        email: true,
        mesId: true,
        role: true
      }
    });

    console.log('\n✅ Admin updated successfully!\n');
    console.log('Updated details:');
    console.log(`Name: ${updated.name}`);
    console.log(`Email: ${updated.email}`);
    console.log(`MES ID: ${updated.mesId}`);
    console.log(`Role: ${updated.role}`);

  } catch (error) {
    console.error('\n❌ Error updating admin:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updateAdmin();
