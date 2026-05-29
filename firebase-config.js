/**
 * Firebase Configuration
 * Core module for initializing Firebase SDK
 * 
 * Contains:
 * - Firebase app initialization
 * - Auth instance
 * - Firestore instance
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

/**
 * Firebase project configuration
 * Project: audhd-hq
 * Plan: Spark (free tier)
 */
const firebaseConfig = {
  apiKey: "AIzaSyBHCJnFUUd3I9wY9Yd96sWoa-HmoZaEBI0",
  authDomain: "audhd-hq.firebaseapp.com",
  projectId: "audhd-hq",
  storageBucket: "audhd-hq.firebasestorage.app",
  messagingSenderId: "729155533112",
  appId: "1:729155533112:web:b199ef1ca92390b55da9cd"
};

/**
 * Initialize Firebase
 */
export const app = initializeApp(firebaseConfig);

/**
 * Get Auth instance
 * Used for: signIn, signUp, signOut, onAuthStateChanged
 */
export const auth = getAuth(app);

/**
 * Get Firestore instance
 * Used for: invite code validation, user records (future)
 */
export const db = getFirestore(app);

/**
 * Auth settings (optional enhancements)
 */
auth.languageCode = 'en';

export default app;
