const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@attendance.com' },
    update: {},
    create: {
      email: 'admin@attendance.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'Administration'
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@attendance.com' },
    update: {},
    create: {
      email: 'user@attendance.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
      department: 'Computer Science'
    }
  });

  console.log('✅ Test user created:', user.email);

  // Create sample event
  const event = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Sample Event - Orientation Day',
      description: 'Welcome orientation for new students',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 100,
      venue: 'Main Auditorium',
      capacity: 200,
      status: 'UPCOMING',
      createdById: admin.id
    }
  });

  console.log('✅ Sample event created:', event.name);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default Credentials:');
  console.log('   Admin: admin@attendance.com / admin123');
  console.log('   User:  user@attendance.com / user123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
