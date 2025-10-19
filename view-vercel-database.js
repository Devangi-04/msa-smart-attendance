/**
 * View Vercel Production Database
 * 
 * This script connects to your Vercel production database and displays the data.
 * 
 * Usage:
 * 1. Get your production DATABASE_URL from Vercel
 * 2. Set it as environment variable: set DATABASE_URL=your-production-url
 * 3. Run: node view-vercel-database.js
 */

const { PrismaClient } = require('@prisma/client');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dev.db')) {
  console.log('\n❌ Production DATABASE_URL not set!\n');
  console.log('📋 Steps to connect to Vercel database:\n');
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Copy the DATABASE_URL value');
  console.log('3. Run this command in terminal:\n');
  console.log('   set DATABASE_URL=your-production-database-url\n');
  console.log('4. Then run: node view-vercel-database.js\n');
  process.exit(1);
}

const prisma = new PrismaClient();

async function viewProductionDatabase() {
  try {
    console.log('\n🔍 Connecting to Vercel Production Database...\n');
    console.log('Database URL:', process.env.DATABASE_URL.substring(0, 30) + '...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Connected successfully!\n');

    // Get all users
    console.log('=== USERS ===\n');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mesId: true,
        role: true,
        rollNo: true,
        department: true,
        createdAt: true
      },
      orderBy: { role: 'desc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found in production database!\n');
    } else {
      console.log(`Total Users: ${users.length}\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.role})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   MES ID: ${user.mesId || 'Not set'}`);
        console.log(`   Roll No: ${user.rollNo || 'N/A'}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log('');
      });
    }

    // Get all events
    console.log('\n=== EVENTS ===\n');
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        date: true,
        status: true,
        venue: true,
        _count: {
          select: { attendance: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    if (events.length === 0) {
      console.log('❌ No events found in production database!\n');
    } else {
      console.log(`Total Events: ${events.length}\n`);
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Date: ${new Date(event.date).toLocaleDateString()}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Venue: ${event.venue || 'N/A'}`);
        console.log(`   Attendance: ${event._count.attendance} people`);
        console.log('');
      });
    }

    // Get attendance stats
    console.log('\n=== ATTENDANCE STATISTICS ===\n');
    const totalAttendance = await prisma.attendance.count();
    console.log(`Total Attendance Records: ${totalAttendance}\n`);

    // Admin info
    console.log('\n=== ADMIN USERS ===\n');
    const admins = users.filter(u => u.role === 'ADMIN');
    if (admins.length === 0) {
      console.log('⚠️  No admin users found!\n');
    } else {
      admins.forEach(admin => {
        console.log(`👤 ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   MES ID: ${admin.mesId || '❌ NOT SET'}`);
        console.log('');
      });
    }

    console.log('\n=== Database View Complete ===\n');

  } catch (error) {
    console.error('\n❌ Error connecting to database:', error.message);
    console.error('\nFull error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if DATABASE_URL is correct');
    console.log('2. Verify database is accessible');
    console.log('3. Make sure Prisma schema matches production database\n');
  } finally {
    await prisma.$disconnect();
  }
}

viewProductionDatabase();
