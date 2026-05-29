/**
 * AuDHD HQ Auth Module
 * Shared utilities for authentication and auth state management
 * 
 * Handles:
 * - Auth state listener setup
 * - Auth checks
 * - Logout
 * - UID retrieval
 */

import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

/**
 * localStorage key for user UID
 */
const AUTH_UID_KEY = HQKeys.USER_UID;

/**
 * Initialize auth state listener
 * Runs callback when auth state changes
 * 
 * @param {Function} callback - Called with user object (or null)
 * @returns {Function} Unsubscribe function
 */
export function initAuthListener(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User logged in
      localStorage.setItem(AUTH_UID_KEY, user.uid);
      callback(user);
    } else {
      // User logged out
      localStorage.removeItem(AUTH_UID_KEY);
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 * Uses localStorage for fast sync check
 * 
 * @returns {boolean} True if user UID exists in localStorage
 */
export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_UID_KEY);
}

/**
 * Get current user UID from localStorage
 * Synchronous, use for local operations
 * 
 * @returns {string|null} User UID or null if not authenticated
 */
export function getUserUID() {
  return localStorage.getItem(AUTH_UID_KEY);
}

/**
 * Handle logout
 * Signs out from Firebase, clears localStorage, redirects to login
 * 
 * @returns {Promise<void>}
 */
export async function handleLogout() {
  try {
    await signOut(auth);
    localStorage.removeItem(AUTH_UID_KEY);
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if signOut fails
    localStorage.removeItem(AUTH_UID_KEY);
    window.location.href = 'login.html';
  }
}

/**
 * Auth gate — the ONLY gate pages should use.
 *
 * Strategy (two-stage):
 *  1. Fast sync pre-check: if no UID in localStorage at all, redirect
 *     immediately so there is no content flash on cold loads.
 *  2. Firebase confirmation: waits for onAuthStateChanged to verify the
 *     session token is still valid. If Firebase says the session is gone
 *     (revoked, deleted, expired) the stale localStorage entry is cleared
 *     and the user is sent to login.
 *
 * Preserves the page URL as ?returnTo= so login can send users back.
 *
 * Usage (in page <script type="module">):
 *   import { requireAuth } from './core/hq-auth.js';
 *   await requireAuth();
 *   // page init code here — only runs if auth confirmed
 */
export async function requireAuth() {
  function buildReturnTo() {
    return encodeURIComponent(
      window.location.pathname + window.location.search + window.location.hash
    );
  }

  // Stage 1 — fast sync kick (no UID at all → instant redirect, no flicker)
  if (!isAuthenticated()) {
    window.location.href = `login.html?returnTo=${buildReturnTo()}`;
    return;
  }

  // Stage 2 — Firebase session verification
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      // 5s timeout: Firebase hasn't responded — trust localStorage and proceed
      unsubscribe();
      resolve();
    }, 5000);

    const unsubscribe = initAuthListener((user) => {
      clearTimeout(timer);
      unsubscribe();
      if (!user) {
        // Firebase confirmed session is invalid — clean up and redirect
        localStorage.removeItem(AUTH_UID_KEY);
        window.location.href = `login.html?returnTo=${buildReturnTo()}`;
        // Promise intentionally never resolves — redirect takes over
        return;
      }
      resolve(user);
    });
  });
}

/**
 * requireAuthAsync — alias for requireAuth (backward compat).
 * Prefer requireAuth() in new code.
 */
export const requireAuthAsync = requireAuth;

/**
 * Check auth without redirecting
 * Returns true/false for conditional logic
 * 
 * @returns {Promise<boolean>} True if authenticated
 */
export function checkAuth() {
  return new Promise((resolve) => {
    const unsubscribe = initAuthListener((user) => {
      unsubscribe();
      resolve(!!user);
    });
    
    // Timeout after 5 seconds (fallback)
    setTimeout(() => {
      unsubscribe();
      resolve(isAuthenticated());
    }, 5000);
  });
}

/**
 * Get user UID with Firebase verification
 * Waits for Firebase to confirm auth state
 * 
 * @returns {Promise<string|null>} User UID or null
 */
export function getUserUIDAsync() {
  return new Promise((resolve) => {
    const unsubscribe = initAuthListener((user) => {
      unsubscribe();
      resolve(user ? user.uid : null);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      unsubscribe();
      resolve(getUserUID());
    }, 5000);
  });
}

export default {
  initAuthListener,
  isAuthenticated,
  getUserUID,
  handleLogout,
  requireAuth,
  requireAuthAsync,
  checkAuth,
  getUserUIDAsync,
  AUTH_UID_KEY
};
