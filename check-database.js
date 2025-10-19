const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n=== Checking Database Contents ===\n');

    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total Users: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          mesId: true,
          role: true
        }
      });
      console.log('\n👥 Users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.role})`);
        console.log(`    Email: ${user.email}`);
        console.log(`    MES ID: ${user.mesId || 'Not set'}`);
      });
    }

    // Count events
    const eventCount = await prisma.event.count();
    console.log(`\n📅 Total Events: ${eventCount}`);

    if (eventCount > 0) {
      const events = await prisma.event.findMany({
        select: {
          id: true,
          name: true,
          date: true,
          status: true
        },
        take: 5
      });
      console.log('\n📋 Recent Events:');
      events.forEach(event => {
        console.log(`  - ${event.name} (${event.status})`);
        console.log(`    Date: ${new Date(event.date).toLocaleDateString()}`);
      });
    }

    // Count attendance
    const attendanceCount = await prisma.attendance.count();
    console.log(`\n✅ Total Attendance Records: ${attendanceCount}`);

    console.log('\n=== Database Check Complete ===\n');

    if (userCount === 0 && eventCount === 0 && attendanceCount === 0) {
      console.log('⚠️  Database is empty! You may need to seed the database.');
      console.log('   Run: npx prisma db seed');
    }

  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
