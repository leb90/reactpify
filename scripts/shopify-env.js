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

// Set default values if not in .env
const SHOPIFY_STORE = env.SHOPIFY_STORE || 'test-forleb.myshopify.com';
const SHOPIFY_DEV_THEME_ID = env.SHOPIFY_DEV_THEME_ID || '150788800766';
const SHOPIFY_PROD_THEME_ID = env.SHOPIFY_PROD_THEME_ID || '';

// Command mappings
const commands = {
  'dev': `shopify theme dev --store=${SHOPIFY_STORE}`,
  'dev:theme': `shopify theme dev --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
  'push': `shopify theme push --store=${SHOPIFY_STORE}`,
  'push:dev': `shopify theme push --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
  'push:prod': SHOPIFY_PROD_THEME_ID ? 
    `shopify theme push --store=${SHOPIFY_STORE} --theme=${SHOPIFY_PROD_THEME_ID}` :
    `shopify theme push --store=${SHOPIFY_STORE}`,
  'pull': `shopify theme pull --store=${SHOPIFY_STORE}`,
  'pull:dev': `shopify theme pull --store=${SHOPIFY_STORE} --theme=${SHOPIFY_DEV_THEME_ID}`,
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
    env: { ...process.env, ...env }
  });
} catch (error) {
  console.error('❌ Command failed:', error.message);
  process.exit(1);
} 