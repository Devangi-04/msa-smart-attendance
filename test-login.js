const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('\n🔍 Testing Login System...\n');

    // Test 1: Find admin by email
    console.log('Test 1: Finding admin by email...');
    const adminByEmail = await prisma.user.findUnique({
      where: { email: 'admin@attendance.com' }
    });
    
    if (adminByEmail) {
      console.log('✅ Admin found by email:', adminByEmail.name);
      console.log('   Email:', adminByEmail.email);
      console.log('   MES ID:', adminByEmail.mesId);
      console.log('   Role:', adminByEmail.role);
    } else {
      console.log('❌ Admin NOT found by email');
    }

    // Test 2: Find user by MES ID
    console.log('\nTest 2: Finding user by MES ID...');
    const userByMesId = await prisma.user.findUnique({
      where: { mesId: 'sshrikesh23cs@student.mes.ac.in' }
    });
    
    if (userByMesId) {
      console.log('✅ User found by MES ID:', userByMesId.name);
      console.log('   Email:', userByMesId.email);
      console.log('   MES ID:', userByMesId.mesId);
      console.log('   Role:', userByMesId.role);
    } else {
      console.log('❌ User NOT found by MES ID');
    }

    // Test 3: Check loginId logic
    console.log('\nTest 3: Testing loginId detection...');
    const testCases = [
      { loginId: 'admin@attendance.com', expected: 'email' },
      { loginId: 'sshrikesh23cs@student.mes.ac.in', expected: 'mesId' },
      { loginId: 'misadmin2025@msa.com', expected: 'mesId' }
    ];

    testCases.forEach(test => {
      const isEmail = test.loginId.includes('@');
      const detectedAs = isEmail ? 'email' : 'mesId';
      const status = detectedAs === test.expected ? '✅' : '❌';
      console.log(`${status} "${test.loginId}" detected as: ${detectedAs} (expected: ${test.expected})`);
    });

    console.log('\n⚠️  ISSUE FOUND:');
    console.log('MES IDs like "sshrikesh23cs@student.mes.ac.in" contain @ symbol!');
    console.log('This causes them to be detected as email instead of MES ID.');
    console.log('\n💡 Solution: Check if it\'s a valid email format, not just contains @\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
