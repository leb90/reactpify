#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🔍 Checking dependencies...');

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
  
  // Método 3: Intentar requerir el módulo
  let canImport = false;
  try {
    execSync(`node -e "import('${dep}')"`, { stdio: 'pipe' });
    canImport = true;
  } catch (error) {
    // Module can't be imported
  }
  
  console.log(`  📋 ${dep}:`);
  console.log(`    - node_modules: ${nodeModulesExists}`);
  console.log(`    - package.json: ${packageJsonHasDep}`);
  console.log(`    - importable: ${canImport}`);
  
  // La dependencia está instalada si al menos uno de los métodos funciona
  return nodeModulesExists || packageJsonHasDep || canImport;
}

// Función para agregar dependencias faltantes al package.json
function addMissingDependenciesToPackageJson(missingDeps) {
  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Asegurar que devDependencies existe
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    
    // Mapeo de dependencias con sus versiones
    const depVersions = {
      'vite': '^6.0.7',
      'react': '^19.1.0',
      'react-dom': '^19.1.0',
      '@vitejs/plugin-react': '^4.3.4',
      '@tailwindcss/vite': '^4.0.13',
      'typescript': '~5.7.3',
      '@types/react': '^19.0.2',
      '@types/react-dom': '^19.0.2',
      '@types/node': '^22.10.2',
      'tailwindcss': '^4.0.13',
      'vite-plugin-static-copy': '^2.1.0',
      'chokidar': '^4.0.1',
      'glob': '^11.0.0'
    };
    
    // Agregar dependencias faltantes
    let added = 0;
    missingDeps.forEach(dep => {
      if (depVersions[dep] && !packageJson.devDependencies[dep]) {
        packageJson.devDependencies[dep] = depVersions[dep];
        added++;
        console.log(`  ✅ Added ${dep}@${depVersions[dep]} to package.json`);
      }
    });
    
    if (added > 0) {
      // Escribir el package.json actualizado
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`📦 Added ${added} dependencies to package.json`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('⚠️  Could not update package.json:', error.message);
    return false;
  }
}

// Verificar si las dependencias críticas están instaladas
const criticalDeps = [
  // Dependencias básicas
  'vite', 
  'react', 
  'react-dom', 
  '@vitejs/plugin-react',
  // Dependencias de Tailwind (usadas en vite.config.ts)
  '@tailwindcss/vite',
  'tailwindcss',
  // Dependencias de TypeScript
  'typescript',
  '@types/react',
  '@types/react-dom', 
  '@types/node',
  // Dependencias de plugins de Vite
  'vite-plugin-static-copy',
  'chokidar',
  'glob'
];
console.log('📋 Dependency check results:');
const missingDeps = criticalDeps.filter(dep => !isDependencyInstalled(dep));

if (missingDeps.length > 0) {
  console.log('📦 Installing missing dependencies:', missingDeps.join(', '));
  
  // Primero agregar al package.json
  const addedToPackageJson = addMissingDependenciesToPackageJson(missingDeps);
  
  console.log('⏳ This may take a few minutes...');
  
  try {
    execSync('npm install', { stdio: 'inherit', timeout: 300000 }); // 5 min timeout
    console.log('✅ Dependencies installed successfully');
    
    // Verificar nuevamente después de la instalación - más permisivo
    const stillMissing = criticalDeps.filter(dep => !isDependencyInstalled(dep));
    if (stillMissing.length > 0) {
      console.log('⚠️  Some dependencies might still be missing:', stillMissing.join(', '));
      console.log('💡 This might be OK if they are installed with different names');
      console.log('🚀 Attempting to build anyway...');
    }
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    console.log('💡 Please run: npm install');
    process.exit(1);
  }
} else {
  console.log('✅ All dependencies are already installed');
}

console.log('🚀 Building with Vite...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  console.log('💡 Try running: npx vite build');
  process.exit(1);
} 