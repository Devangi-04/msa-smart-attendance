#!/usr/bin/env node

/**
 * Cloud Database Setup Script
 * This script helps you configure your cloud database connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🌐 Smart Attendance System - Cloud Database Setup\n');
  console.log('This script will help you configure your cloud database connection.\n');

  // Show database provider options
  console.log('📊 Choose your cloud database provider:\n');
  console.log('1. Supabase (Recommended - Free tier available)');
  console.log('2. Railway (Easy deployment)');
  console.log('3. Render (Good for full stack)');
  console.log('4. Neon (Serverless PostgreSQL)');
  console.log('5. Custom PostgreSQL URL\n');

  const choice = await question('Enter your choice (1-5): ');

  let databaseUrl = '';
  let instructions = '';

  switch (choice.trim()) {
    case '1':
      instructions = `
📝 Supabase Setup Instructions:
1. Go to https://supabase.com and create an account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" (URI format)
5. Replace [YOUR-PASSWORD] with your database password
`;
      console.log(instructions);
      databaseUrl = await question('\nPaste your Supabase connection string: ');
      break;

    case '2':
      instructions = `
📝 Railway Setup Instructions:
1. Go to https://railway.app and sign up
2. Create a new project
3. Add PostgreSQL database
4. Click on PostgreSQL → Connect tab
5. Copy the "Postgres Connection URL"
`;
      console.log(instructions);
      databaseUrl = await question('\nPaste your Railway connection string: ');
      break;

    case '3':
      instructions = `
📝 Render Setup Instructions:
1. Go to https://render.com and sign up
2. Create a new PostgreSQL database
3. Copy the "External Database URL"
`;
      console.log(instructions);
      databaseUrl = await question('\nPaste your Render connection string: ');
      break;

    case '4':
      instructions = `
📝 Neon Setup Instructions:
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string
`;
      console.log(instructions);
      databaseUrl = await question('\nPaste your Neon connection string: ');
      break;

    case '5':
      console.log('\n📝 Enter your custom PostgreSQL connection string');
      console.log('Format: postgresql://username:password@host:5432/database\n');
      databaseUrl = await question('Connection string: ');
      break;

    default:
      console.log('❌ Invalid choice. Exiting...');
      rl.close();
      return;
  }

  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    console.log('\n❌ Invalid database URL. Must start with "postgresql://"');
    rl.close();
    return;
  }

  // Generate JWT secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(64).toString('hex');

  // Create .env content
  const envContent = `# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (Cloud PostgreSQL)
DATABASE_URL="${databaseUrl}"

# JWT Secret (Auto-generated secure key)
JWT_SECRET="${jwtSecret}"

# CORS Configuration
CORS_ORIGIN=*

# Email Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@attendance.com
`;

  // Write to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env file!');
  console.log('\n📋 Next steps:\n');
  console.log('1. Generate Prisma Client:');
  console.log('   npx prisma generate\n');
  console.log('2. Run database migrations:');
  console.log('   npx prisma migrate deploy\n');
  console.log('3. Seed the database with default users:');
  console.log('   npm run prisma:seed\n');
  console.log('4. Start your application:');
  console.log('   npm start\n');
  console.log('🎉 Your cloud database is ready to use!\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
