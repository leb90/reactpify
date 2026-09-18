#!/usr/bin/env node

/**
 * Shopify Environment Runner
 * Reads .env file and runs Shopify commands with expanded variables
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = '.env';
  const env = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }

  return env;
}

// Get command from arguments
const command = process.argv[2];
const env = loadEnvFile();

const SHOPIFY_STORE = env.SHOPIFY_STORE || process.env.SHOPIFY_STORE;
const SHOPIFY_DEV_THEME_ID = env.SHOPIFY_DEV_THEME_ID || process.env.SHOPIFY_DEV_THEME_ID || '';
const SHOPIFY_PROD_THEME_ID = env.SHOPIFY_PROD_THEME_ID || process.env.SHOPIFY_PROD_THEME_ID || '';

if (!SHOPIFY_STORE) {
  console.error('❌ SHOPIFY_STORE is not set. Add it to your .env file:');
  console.error('   SHOPIFY_STORE=your-store.myshopify.com');
  process.exit(1);
}

// Secrets travel through the environment so they never reach the printed
// command line or the shell history.
const secretEnv = {};
const storePassword = env.SHOPIFY_STORE_PASSWORD || process.env.SHOPIFY_STORE_PASSWORD;
const themeToken = env.SHOPIFY_CLI_THEME_TOKEN || process.env.SHOPIFY_CLI_THEME_TOKEN;

if (storePassword) secretEnv.SHOPIFY_FLAG_STORE_PASSWORD = storePassword;
if (themeToken) secretEnv.SHOPIFY_CLI_THEME_TOKEN = themeToken;

function resolveShopifyBinary() {
  try {
    execSync('shopify version', { stdio: 'ignore' });
    return 'shopify';
  } catch {
    console.log('ℹ️  Shopify CLI not found on PATH, falling back to npx.');
    return 'npx --yes @shopify/cli';
  }
}

const cli = resolveShopifyBinary();

const commands = {
  'dev': `${cli} theme dev --store=${SHOPIFY_STORE}`,
  'dev:theme': `${cli} theme dev --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
  'push': `${cli} theme push --store=${SHOPIFY_STORE}`,
  'push:dev': `${cli} theme push --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
  'push:prod': SHOPIFY_PROD_THEME_ID
    ? `${cli} theme push --store=${SHOPIFY_STORE} --theme=${SHOPIFY_PROD_THEME_ID}`
    : `${cli} theme push --store=${SHOPIFY_STORE}`,
  'pull': `${cli} theme pull --store=${SHOPIFY_STORE}`,
  'pull:dev': `${cli} theme pull --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
};

if (!command || !commands[command]) {
  console.log('Usage: node scripts/shopify-env.js <command>');
  console.log('');
  console.log('Available commands:');
  Object.keys(commands).forEach(cmd => {
    console.log(`  ${cmd.padEnd(12)} - ${commands[cmd]}`);
  });
  process.exit(1);
}

console.log(`🛍️ Running: ${commands[command]}`);

try {
  execSync(commands[command], {
    stdio: 'inherit',
    env: { ...process.env, ...env, ...secretEnv }
  });
} catch (error) {
  console.error('❌ Command failed:', error.message);
  process.exit(1);
} 