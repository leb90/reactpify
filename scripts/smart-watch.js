#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🔍 Checking dependencies for watch mode...');

// Función para verificar si una dependencia está realmente instalada
function isDependencyInstalled(dep) {
  // Método 1: Verificar en node_modules
  const nodeModulesPath = join('node_modules', dep);
  const nodeModulesExists = existsSync(nodeModulesPath);
  
  // Método 2: Verificar en package.json
  let packageJsonHasDep = false;
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    packageJsonHasDep = !!(
      packageJson.dependencies?.[dep] || 
      packageJson.devDependencies?.[dep]
    );
  } catch (error) {
    // Ignore package.json read errors
  }
  
  // La dependencia está instalada si al menos uno de los métodos funciona
  return nodeModulesExists || packageJsonHasDep;
}

const criticalDeps = [
  'vite',
  '@vitejs/plugin-react', 
  'tailwindcss',
  '@tailwindcss/vite',
  'typescript',
  'vite-plugin-static-copy',
  '@types/react',
  '@types/react-dom',
  'react',
  'react-dom',
  'react-redux',
  '@reduxjs/toolkit',
  'vite-tsconfig-paths',
  'glob',
  'esbuild'
];
const missingDeps = criticalDeps.filter(dep => !isDependencyInstalled(dep));

if (missingDeps.length > 0) {
  console.log('❌ Missing dependencies for watch mode:', missingDeps.join(', '));
  console.log('💡 Please run "npm run build" first to install dependencies');
  console.log('   Then you can use "npm run watch" for development');
  process.exit(1);
}

console.log('✅ All dependencies are ready');
console.log('👀 Starting watch mode...');

try {
  execSync('npx vite build --watch --mode development', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Watch mode failed');
  console.log('💡 Try running: npx vite build --watch --mode development');
  process.exit(1);
} 