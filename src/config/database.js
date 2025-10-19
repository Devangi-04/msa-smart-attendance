/**
 * Database Configuration
 * Automatically uses Firebase if configured, otherwise falls back to Prisma
 */

// Check if Firebase is configured
const useFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY;

let db;

if (useFirebase) {
  console.log('🔥 Using Firebase/Firestore as database');
  try {
    db = require('../adapters/firestoreAdapter');
  } catch (error) {
    console.error('❌ Firebase adapter error:', error.message);
    console.log('⚠️  Falling back to Prisma');
    const { PrismaClient } = require('@prisma/client');
    db = new PrismaClient();
  }
} else {
  console.log('🗄️  Using Prisma (PostgreSQL/SQLite) as database');
  const { PrismaClient } = require('@prisma/client');
  db = new PrismaClient();
}

module.exports = db;
