#!/usr/bin/env node
/**
 * bump-cache-version.js — AuDHD HQ Pre-Deploy Tool
 * FIX-07: Automates SW cache bump + APP_VERSION so deploys never ship stale caches.
 *
 * Bumps TWO things in one pass:
 *   1. CACHE string in sw.js          (e.g. audhd-hq-v18 → audhd-hq-v19)
 *   2. APP_VERSION in hq-deploy-gate.js (e.g. 2026-05-20-a → 2026-05-21-a)
 *
 * Usage:
 *   node bump-cache-version.js          — bump both (default)
 *   node bump-cache-version.js --dry    — preview only, no write
 *   node bump-cache-version.js --reset 20  — set SW cache to a specific version
 *
 * Add to package.json:
 *   "scripts": {
 *     "predeploy": "node bump-cache-version.js"
 *   }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SW_PATH   = path.join(__dirname, 'sw.js');
const GATE_PATH = path.join(__dirname, 'core', 'hq-deploy-gate.js');

const SW_PATTERN   = /const CACHE = 'audhd-hq-v(\d+)'/;
const GATE_PATTERN = /const APP_VERSION\s*=\s*'([^']+)'/;

// --- Parse args ---
const args     = process.argv.slice(2);
const isDry    = args.includes('--dry');
const resetIdx = args.indexOf('--reset');
const resetTo  = resetIdx !== -1 ? parseInt(args[resetIdx + 1], 10) : null;

let allOk = true;

function checkFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[bump-cache] ❌  ${label} not found at: ${filePath}`);
    allOk = false;
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

// --- Read files ---
const swContent   = checkFile(SW_PATH,   'sw.js');
const gateContent = checkFile(GATE_PATH, 'hq-deploy-gate.js');
if (!allOk) process.exit(1);

// --- Parse SW cache version ---
const swMatch = swContent.match(SW_PATTERN);
if (!swMatch) {
  console.error(`[bump-cache] ❌  Could not find CACHE version line in sw.js`);
  console.error(`             Expected: const CACHE = 'audhd-hq-vNN'`);
  process.exit(1);
}
const currentSW = parseInt(swMatch[1], 10);
const nextSW    = resetTo !== null ? resetTo : currentSW + 1;

// --- Parse APP_VERSION ---
const gateMatch = gateContent.match(GATE_PATTERN);
if (!gateMatch) {
  console.error(`[bump-cache] ❌  Could not find APP_VERSION in hq-deploy-gate.js`);
  console.error(`             Expected: const APP_VERSION = 'YYYY-MM-DD-x'`);
  process.exit(1);
}
const currentVersion = gateMatch[1];

// Build next APP_VERSION: today's date + suffix 'a', or increment suffix if same day
function nextAppVersion(current) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const m = current.match(/^(\d{4}-\d{2}-\d{2})-([a-z])$/);
  if (m && m[1] === today) {
    // Same day — increment suffix: a→b, b→c, etc.
    const nextChar = String.fromCharCode(m[2].charCodeAt(0) + 1);
    return `${today}-${nextChar}`;
  }
  // New day (or unexpected format) — reset to 'a'
  return `${today}-a`;
}
const nextVersion = nextAppVersion(currentVersion);

// --- Dry run ---
if (isDry) {
  console.log(`[bump-cache] 🔍 DRY RUN`);
  console.log(`             SW cache:    v${currentSW} → v${nextSW}`);
  console.log(`             APP_VERSION: ${currentVersion} → ${nextVersion}`);
  process.exit(0);
}

// --- Write sw.js ---
const updatedSW = swContent.replace(SW_PATTERN, `const CACHE = 'audhd-hq-v${nextSW}'`);
fs.writeFileSync(SW_PATH, updatedSW, 'utf8');

// --- Write hq-deploy-gate.js ---
const updatedGate = gateContent.replace(
  GATE_PATTERN,
  `const APP_VERSION   = '${nextVersion}'`
);
fs.writeFileSync(GATE_PATH, updatedGate, 'utf8');

console.log(`[bump-cache] ✅  SW cache bumped:    v${currentSW} → v${nextSW}`);
console.log(`[bump-cache] ✅  APP_VERSION bumped: ${currentVersion} → ${nextVersion}`);
