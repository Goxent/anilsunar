import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'SASTO_EMAIL',
  'SASTO_PASSWORD',
  'RESEND_API_KEY',
  'VITE_ANTHROPIC_API_KEY',
  'SYNC_SECRET_TOKEN'
];

console.log('🔍 Checking environment variables...');

let missing = false;
REQUIRED_VARS.forEach(v => {
  if (!process.env[v]) {
    console.error(`❌ Missing: ${v}`);
    missing = true;
  } else {
    console.log(`✅ Found: ${v}`);
  }
});

if (missing) {
  console.error('\n⚠️ Some environment variables are missing! Please check your .env file.');
  process.exit(1);
} else {
  console.log('\n🚀 All environment variables are set correctly!');
}
