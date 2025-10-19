// Firebase Admin SDK Configuration (for server-side operations)
const admin = require('firebase-admin');

// Initialize Firebase Admin
let adminApp;
let adminDb;

try {
  // Check if already initialized
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
    });

    adminDb = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    adminApp = admin.app();
    adminDb = admin.firestore();
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  console.log('ℹ️  Firebase Admin is optional. App will work without it for basic features.');
}

module.exports = {
  admin,
  adminApp,
  adminDb
};
