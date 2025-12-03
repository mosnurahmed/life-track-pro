/**
 * Firebase Admin Configuration
 * 
 * Purpose: Initialize Firebase Admin SDK for push notifications
 */

import admin from 'firebase-admin';
import path from 'path';

// Path to service account key
const serviceAccountPath = path.join(
  process.cwd(),
  'firebase-service-account.json'
);

// Check if file exists
import fs from 'fs';
if (!fs.existsSync(serviceAccountPath)) {
  console.warn('⚠️ Firebase service account file not found');
  console.warn('💡 Push notifications will not work');
  console.warn('📝 Place firebase-service-account.json in project root');
}

/**
 * Initialize Firebase Admin
 */
let firebaseInitialized = false;

export const initializeFirebase = () => {
  try {
    if (!firebaseInitialized && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.warn('💡 Push notifications will not work');
  }
};

/**
 * Get Firebase Admin Instance
 */
export const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin;
};

/**
 * Check if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return firebaseInitialized;
};

export default admin;