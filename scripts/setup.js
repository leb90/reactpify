#!/usr/bin/env node

/**
 * Reactpify Setup Script
 * Interactive setup for new Reactpify projects
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function updateThemeLayout() {
  const layoutPath = 'layout/theme.liquid';
  
  if (!checkFileExists(layoutPath)) {
    log('⚠️  Warning: layout/theme.liquid not found. You may need to create it manually.', 'yellow');
    return;
  }

  const content = fs.readFileSync(layoutPath, 'utf8');
  const reactifyScript = `<script type="module" src="{{ 'reactpify.js' | asset_url }}"></script>`;
  
  if (content.includes('reactpify.js')) {
    log('✅ Reactpify script already included in theme.liquid', 'green');
    return;
  }

  // Add before closing </body> tag
  const updatedContent = content.replace(
    /<\/body>/i,
    `  ${reactifyScript}\n</body>`
  );

  fs.writeFileSync(layoutPath, updatedContent);
  log('✅ Added Reactpify script to layout/theme.liquid', 'green');
}

function createExampleComponent() {
  const componentDir = 'src/components/welcome-banner';
  const componentPath = path.join(componentDir, 'WelcomeBanner.tsx');

  if (checkFileExists(componentPath)) {
    log('✅ Example component already exists', 'green');
    return;
  }

  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  const componentCode = `import React from 'react';

interface WelcomeBannerProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
}

/**
 * Welcome Banner - Your first Reactpify component!
 * This component will auto-generate its Liquid template
 */
export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title = 'Welcome to Reactpify! 🚀',
  subtitle = 'Your React components are now working in Shopify!',
  backgroundColor = 'blue'
}) => {
  return (
    <div className={\`welcome-banner bg-\${backgroundColor}-600 text-white p-8 text-center\`}>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-xl opacity-90">{subtitle}</p>
      <div className="mt-6">
        <button 
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          onClick={() => alert('React is working! 🎉')}
        >
          Test React Interaction
        </button>
      </div>
    </div>
  );
};`;

  fs.writeFileSync(componentPath, componentCode);
  log('✅ Created example WelcomeBanner component', 'green');
}

function runSetup() {
  log('🚀 Setting up Reactpify...\n', 'bold');

  // Check if we're in a Shopify theme
  if (!checkFileExists('layout') || !checkFileExists('sections')) {
    log('❌ This doesn\'t appear to be a Shopify theme directory.', 'red');
    log('   Make sure you\'re in a directory with layout/ and sections/ folders.', 'yellow');
    process.exit(1);
  }

  // Update theme.liquid
  log('📝 Updating layout/theme.liquid...', 'blue');
  updateThemeLayout();

  // Create example component
  log('🎨 Creating example component...', 'blue');
  createExampleComponent();

  // Build the project
  log('🔨 Building Reactpify...', 'blue');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build completed successfully', 'green');
  } catch (error) {
    log('❌ Build failed. Please run "npm run build" manually.', 'red');
  }

  // Success message
  log('\n🎉 Reactpify setup completed!', 'green');
  log('\n📋 Next steps:', 'bold');
  log('1. Run "npm run watch" in one terminal', 'blue');
  log('2. Run "npm run dev" in another terminal', 'blue');
  log('3. Add the "Welcome Banner" section in your Shopify theme editor', 'blue');
  log('4. Start creating your own React components!', 'blue');
  log('\n📖 Read GETTING_STARTED.md for detailed instructions.', 'yellow');
}

runSetup(); 