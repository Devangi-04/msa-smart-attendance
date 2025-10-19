#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Interactive script to configure Firebase for Smart Attendance System
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

console.log('\n🔥 Firebase Setup for Smart Attendance System\n');
console.log('This script will help you configure Firebase/Firestore as your cloud database.\n');

async function main() {
  console.log('📋 Before you begin, make sure you have:\n');
  console.log('1. Created a Firebase project at https://console.firebase.google.com');
  console.log('2. Enabled Firestore Database in your project');
  console.log('3. Registered a web app in your Firebase project\n');

  const ready = await question('Have you completed the above steps? (yes/no): ');
  
  if (ready.toLowerCase() !== 'yes' && ready.toLowerCase() !== 'y') {
    console.log('\n📝 Please complete the setup steps first:\n');
    console.log('1. Go to https://console.firebase.google.com');
    console.log('2. Click "Add project" or select existing project');
    console.log('3. Go to Firestore Database → Create database');
    console.log('4. Go to Project Settings → General → Your apps → Web app');
    console.log('5. Copy your Firebase configuration\n');
    console.log('Then run this script again!\n');
    rl.close();
    return;
  }

  console.log('\n🔧 Great! Let\'s configure Firebase.\n');

  // Get Firebase Web Config
  console.log('📱 Step 1: Firebase Web Configuration');
  console.log('Go to: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration\n');

  const apiKey = await question('Enter your Firebase API Key: ');
  const authDomain = await question('Enter your Auth Domain (e.g., your-app.firebaseapp.com): ');
  const projectId = await question('Enter your Project ID: ');
  const storageBucket = await question('Enter your Storage Bucket (e.g., your-app.appspot.com): ');
  const messagingSenderId = await question('Enter your Messaging Sender ID: ');
  const appId = await question('Enter your App ID: ');

  // Ask about Firebase Admin SDK
  console.log('\n🔐 Step 2: Firebase Admin SDK (Optional but recommended)');
  console.log('This is needed for server-side operations.\n');
  
  const setupAdmin = await question('Do you want to set up Firebase Admin SDK? (yes/no): ');
  
  let adminProjectId = '';
  let adminClientEmail = '';
  let adminPrivateKey = '';

  if (setupAdmin.toLowerCase() === 'yes' || setupAdmin.toLowerCase() === 'y') {
    console.log('\n📝 To get your service account credentials:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Download the JSON file\n');

    adminProjectId = await question('Enter Project ID from service account: ');
    adminClientEmail = await question('Enter Client Email from service account: ');
    console.log('\nPaste your Private Key (it starts with -----BEGIN PRIVATE KEY-----)');
    console.log('Press Enter twice when done:\n');
    
    let privateKeyLines = [];
    let line;
    while ((line = await question('')) !== '') {
      privateKeyLines.push(line);
    }
    adminPrivateKey = privateKeyLines.join('\\n');
  }

  // Generate JWT Secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(64).toString('hex');

  // Create .env content
  let envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# Choose ONE of the following:

# Option 1: PostgreSQL (for SQL-based cloud databases)
# DATABASE_URL="postgresql://username:password@host:5432/database"

# Option 2: SQLite (for local development)
DATABASE_URL="file:./database.sqlite"

# JWT Secret (Auto-generated)
JWT_SECRET="${jwtSecret}"

# CORS Configuration
CORS_ORIGIN=*

# Firebase Configuration
FIREBASE_API_KEY=${apiKey}
FIREBASE_AUTH_DOMAIN=${authDomain}
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_STORAGE_BUCKET=${storageBucket}
FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
FIREBASE_APP_ID=${appId}
`;

  if (adminProjectId) {
    envContent += `\n# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=${adminProjectId}
FIREBASE_ADMIN_CLIENT_EMAIL=${adminClientEmail}
FIREBASE_ADMIN_PRIVATE_KEY="${adminPrivateKey}"
`;
  }

  // Write to .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Firebase configuration saved to .env file!\n');

  // Create Firebase security rules file
  const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if true; // Public read for QR scanning
      allow create: if request.auth != null;
      allow update: if request.auth != null && isAdmin();
      allow delete: if isAdmin();
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // No updates allowed
      allow delete: if isAdmin();
    }
  }
}`;

  const rulesPath = path.join(__dirname, 'firestore.rules');
  fs.writeFileSync(rulesPath, securityRules);

  console.log('✅ Firestore security rules created in firestore.rules\n');
  console.log('📝 Copy these rules to Firebase Console → Firestore Database → Rules tab\n');

  console.log('📋 Next Steps:\n');
  console.log('1. Install Firebase packages:');
  console.log('   npm install firebase firebase-admin\n');
  console.log('2. Copy firestore.rules content to Firebase Console:');
  console.log('   Firebase Console → Firestore Database → Rules\n');
  console.log('3. Test Firebase connection:');
  console.log('   node test-firebase.js\n');
  console.log('4. Start your application:');
  console.log('   npm run dev\n');

  console.log('🎉 Firebase setup complete!\n');
  console.log('📚 For more information, see FIREBASE_SETUP_GUIDE.md\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
