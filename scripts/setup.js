#!/usr/bin/env node

/**
 * Reactpify Setup Script
 * Automatic installation on existing Shopify themes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Detectar si estamos ejecutando desde node_modules y ajustar working directory
function adjustWorkingDirectory() {
  const currentDir = process.cwd();
  
  // Si estamos en node_modules/reactpifyjs, necesitamos ir al directorio raíz del tema
  if (currentDir.includes('node_modules/reactpifyjs') || currentDir.includes('node_modules\\reactpifyjs')) {
    // Buscar hacia arriba hasta encontrar el directorio que contiene node_modules
    let themeDir = currentDir;
    while (themeDir && !themeDir.endsWith('node_modules')) {
      themeDir = path.dirname(themeDir);
    }
    
    if (themeDir.endsWith('node_modules')) {
      themeDir = path.dirname(themeDir); // Subir un nivel más para salir de node_modules
      
      // Cambiar el working directory
      process.chdir(themeDir);
      console.log(`📁 Working directory adjusted to: ${process.cwd()}`);
    }
  }
}

// Ajustar working directory antes de hacer cualquier cosa
adjustWorkingDirectory();

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
  const fullPath = path.resolve(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function checkDirectoryExists(dirPath) {
  const fullPath = path.resolve(process.cwd(), dirPath);
  try {
    const stat = fs.statSync(fullPath);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
}

function isShopifyTheme() {
  const hasLayout = checkDirectoryExists('layout');
  const hasSections = checkDirectoryExists('sections'); 
  const hasAssets = checkDirectoryExists('assets');
  const hasThemeFile = checkFileExists('layout/theme.liquid') || checkFileExists('layout/password.liquid');
  
  // Debug output only if check fails
  if (!hasLayout || !hasSections || !hasAssets || !hasThemeFile) {
    console.log(`\n🔍 Debug: Current directory: ${process.cwd()}`);
    console.log(`- layout/ directory: ${hasLayout}`);
    console.log(`- sections/ directory: ${hasSections}`);
    console.log(`- assets/ directory: ${hasAssets}`);
    console.log(`- theme.liquid file: ${hasThemeFile}`);
    
    // Mostrar contenido del directorio actual
    try {
      const files = fs.readdirSync(process.cwd());
      console.log(`\n📂 Contents of current directory:`);
      files.slice(0, 10).forEach(file => { // Mostrar solo los primeros 10
        const stat = fs.statSync(file);
        console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
      });
      if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more items`);
      }
    } catch (error) {
      console.log(`⚠️  Could not read directory contents`);
    }
  }
  
  return hasLayout && hasSections && hasAssets && hasThemeFile;
}

function updateThemeLayout() {
  const layoutPath = 'layout/theme.liquid';
  
  if (!checkFileExists(layoutPath)) {
    log('⚠️  Warning: layout/theme.liquid not found. Skipping theme update.', 'yellow');
    log('   Please manually add the Reactpify scripts to your theme layout.', 'yellow');
    return false;
  }

  let content = fs.readFileSync(layoutPath, 'utf8');
  
  // Check if already installed
  if (content.includes('main.js') && content.includes('main.css')) {
    log('✅ Reactpify scripts already included in theme.liquid', 'green');
    return true;
  }

  // Add CSS before closing </head>
  if (!content.includes('main.css')) {
    content = content.replace(
      /<\/head>/i,
      `  {{ 'main.css' | asset_url | stylesheet_tag }}\n</head>`
    );
  }

  // Add JS before closing </body>
  if (!content.includes('main.js')) {
    content = content.replace(
      /<\/body>/i,
      `  {{ 'main.js' | asset_url | script_tag }}\n</body>`
    );
  }

  fs.writeFileSync(layoutPath, content);
  log('✅ Added Reactpify scripts to layout/theme.liquid', 'green');
  return true;
}

function createDirectories() {
  const dirs = [
    'src',
    'src/components', 
    'src/styles',
    'src/utils',
    'src/utils/helpers',
    'src/utils/components',
    'src/utils/components/atoms',
    'src/utils/components/molecules',
    'vite-plugins'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`📁 Created directory: ${dir}`, 'blue');
    }
  });
}

function copyConfigFiles() {
  const configFiles = [
    'vite.config.ts',
    'tailwind.config.js', 
    'tsconfig.json',
    'tsconfig.node.json',
    'vite-fragment-injection.ts'
  ];

  let copied = 0;
  configFiles.forEach(file => {
    const sourcePath = path.join(process.cwd(), 'node_modules', 'reactpifyjs', file);
    const destPath = file;
    
    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        log(`📄 Copied ${file}`, 'blue');
        copied++;
      } catch (error) {
        log(`⚠️  Failed to copy ${file}`, 'yellow');
      }
    }
  });
  
  if (copied > 0) {
    log(`✅ Copied ${copied} configuration files`, 'green');
  }
}

function copyVitePlugins() {
  const pluginsDir = 'vite-plugins';
  const sourceDir = path.join(process.cwd(), 'node_modules', 'reactpifyjs', 'vite-plugins');
  
  if (!fs.existsSync(sourceDir)) {
    log('⚠️  Vite plugins not found in node_modules', 'yellow');
    return;
  }

  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(pluginsDir, file);
        
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          log(`🔌 Copied plugin: ${file}`, 'blue');
        }
      }
    });
    log('✅ Vite plugins installed', 'green');
  } catch (error) {
    log('⚠️  Error copying Vite plugins', 'yellow');
  }
}

function createTestComponent() {
  const componentDir = 'src/components/test';
  const componentPath = path.join(componentDir, 'Test.tsx');
  const liquidPath = path.join(componentDir, 'section.test.liquid');

  if (checkFileExists(componentPath)) {
    log('✅ Test component already exists', 'green');
    return;
  }

  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Create React component
  const componentCode = `import React, { useState } from 'react';

interface TestProps {
  title?: string;
  showButton?: boolean;
}

export const Test: React.FC<TestProps> = ({
  title = "Hello World",
  showButton = true
}) => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="reactpify-container max-w-md mx-auto p-6">
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        
        {showButton && (
          <button 
            onClick={() => setClicked(!clicked)}
            className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-semibold"
          >
            {clicked ? '✅ Clicked!' : '👋 Click me'}
          </button>
        )}
      </div>
    </div>
  );
};`;

  // Create Liquid template
  const liquidCode = `{% comment %}
Auto-generated by Reactpify
Component: Test
{% endcomment %}

<div data-component-root data-section-data='{{ section | json | escape }}'>
  <div data-fallback>
    <div class="max-w-md mx-auto p-6">
      <div class="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 class="text-2xl font-bold mb-4">{{ section.settings.title | default: 'Hello World' }}</h1>
        
        {% if section.settings.show_button %}
          <button class="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-semibold">
            👋 Click me
          </button>
        {% endif %}
      </div>
    </div>
  </div>
</div>

{{ 'main.css' | asset_url | stylesheet_tag }}
{{ 'main.js' | asset_url | script_tag }}

{% schema %}
{
  "name": "Test",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Hello World"
    },
    {
      "type": "checkbox",
      "id": "show_button",
      "label": "Show Button",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Test"
    }
  ]
}
{% endschema %}`;

  fs.writeFileSync(componentPath, componentCode);
  fs.writeFileSync(liquidPath, liquidCode);
  log('✅ Created Test component with Liquid template', 'green');
}

function createMainEntry() {
  const mainPath = 'src/main.tsx';
  
  if (checkFileExists(mainPath)) {
    log('✅ Main entry already exists', 'green');
    return;
  }

  const mainCode = `import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

import { Test } from './components/test/Test';

registerComponent('Test', Test);

initRenderSystem();

console.log('🚀 Initializing Reactpify');
console.log('✅ Reactpify initialized successfully');`;

  fs.writeFileSync(mainPath, mainCode);
  log('✅ Created main entry point', 'green');
}

function updatePackageJson() {
  const packagePath = 'package.json';
  
  if (!checkFileExists(packagePath)) {
    log('⚠️  package.json not found in theme', 'yellow');
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add Reactpify scripts if they don't exist
    if (!pkg.scripts) pkg.scripts = {};
    
    if (!pkg.scripts.watch) {
      pkg.scripts.watch = 'vite build --watch --mode development';
    }
    if (!pkg.scripts.build) {
      pkg.scripts.build = 'vite build';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    log('✅ Updated package.json with Reactpify scripts', 'green');
  } catch (error) {
    log('⚠️  Could not update package.json', 'yellow');
  }
}

function runSetup() {
  log('🚀 Installing Reactpify on your Shopify theme...\n', 'bold');

  // Check if we're in a Shopify theme
  if (!isShopifyTheme()) {
    log('❌ This doesn\'t appear to be a Shopify theme directory.', 'red');
    log('   Make sure you\'re in a directory with layout/, sections/, and assets/ folders.', 'yellow');
    process.exit(1);
  }

  log('✅ Shopify theme detected', 'green');

  // Create directory structure
  log('📁 Creating directory structure...', 'blue');
  createDirectories();

  // Copy configuration files
  log('📄 Installing configuration files...', 'blue');
  copyConfigFiles();

  // Copy Vite plugins
  log('🔌 Installing Vite plugins...', 'blue');
  copyVitePlugins();

  // Update theme.liquid
  log('📝 Updating layout/theme.liquid...', 'blue');
  const themeUpdated = updateThemeLayout();

  // Create test component
  log('🎨 Creating test component...', 'blue');
  createTestComponent();

  // Create main entry
  log('⚙️  Creating main entry point...', 'blue');
  createMainEntry();

  // Update package.json
  log('📦 Updating package.json...', 'blue');
  updatePackageJson();

  // Success message
  log('\n🎉 Reactpify installed successfully!', 'green');
  log('\n📋 Next steps:', 'bold');
  log('1. Run "npm run build" to compile your components', 'blue');
  log('2. Run "npm run watch" for development mode', 'blue');
  if (themeUpdated) {
    log('3. Add the "Test" section in your Shopify theme editor', 'blue');
  } else {
    log('3. Manually add Reactpify scripts to your theme layout', 'blue');
  }
  log('4. Start building amazing React components!', 'blue');
  log('\n📖 Visit https://github.com/leb90/reactpify for documentation', 'yellow');
}

runSetup(); 