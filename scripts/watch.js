#!/usr/bin/env node

import chokidar from 'chokidar';
import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('🚀 Iniciando Reactpify Watch System...');

let isBuilding = false;
let buildQueue = new Set();

/**
 * Ejecutar comando con logging
 */
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error en ${description}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('Done in')) {
        console.warn(`⚠️  ${description} warning:`, stderr);
      }
      
      if (stdout) {
        console.log(`✅ ${description} completado`);
        if (stdout.includes('Done in')) {
          console.log(`   ${stdout.trim()}`);
        }
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Regenerar CSS de Tailwind
 */
async function rebuildCSS() {
  try {
    await runCommand(
      'npx tailwindcss -i src/styles/main.css -o assets/reactpify.css --minify',
      'Regenerando Tailwind CSS'
    );
    return true;
  } catch (error) {
    console.error('❌ Error regenerando CSS:', error.message);
    return false;
  }
}

/**
 * Regenerar sistema híbrido (componentes + liquid)
 */
async function rebuildHybrid() {
  try {
    await runCommand('npm run build', 'Regenerando sistema híbrido');
    return true;
  } catch (error) {
    console.error('❌ Error regenerando sistema híbrido:', error.message);
    return false;
  }
}

/**
 * Procesador de cola de builds
 */
async function processBuildQueue() {
  if (isBuilding || buildQueue.size === 0) return;
  
  isBuilding = true;
  const tasks = [...buildQueue];
  buildQueue.clear();
  
  console.log(`📦 Procesando ${tasks.length} cambio(s)...`);
  
  const needsCSS = tasks.some(task => 
    task.includes('.css') || 
    task.includes('.tsx') || 
    task.includes('.liquid')
  );
  
  const needsHybrid = tasks.some(task => 
    task.includes('src/components/') ||
    task.includes('src/utils/schema-fragments/')
  );
  
  try {
    if (needsCSS) {
      await rebuildCSS();
    }
    
    if (needsHybrid) {
      await rebuildHybrid();
    }
    
    console.log('✅ Todos los cambios procesados\n');
  } catch (error) {
    console.error('❌ Error procesando cambios:', error.message);
  }
  
  isBuilding = false;
  
  // Procesar siguiente lote si hay más cambios
  setTimeout(processBuildQueue, 100);
}

/**
 * Manejar cambio de archivo
 */
function handleFileChange(filePath, changeType = 'change') {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`📝 ${changeType}: ${relativePath}`);
  
  buildQueue.add(relativePath);
  
  // Debounce: esperar 500ms antes de procesar
  setTimeout(processBuildQueue, 500);
}

// Build inicial
console.log('🔧 Build inicial...');
await rebuildCSS();
await rebuildHybrid();

// Configurar watchers
const watchers = [
  // CSS y estilos
  {
    pattern: 'src/styles/**/*.css',
    description: 'CSS files'
  },
  
  // Componentes React
  {
    pattern: 'src/components/**/*.{tsx,ts}',
    description: 'React components'
  },
  
  // Liquid templates  
  {
    pattern: 'src/components/**/*.liquid',
    description: 'Liquid templates'
  },
  
  // Fragmentos de schema
  {
    pattern: 'src/utils/schema-fragments/**/*.liquid', 
    description: 'Schema fragments'
  },
  
  // Configuraciones
  {
    pattern: ['tailwind.config.js', 'vite.config.ts', 'postcss.config.js'],
    description: 'Config files'
  }
];

console.log('\n👀 Iniciando watchers...');

watchers.forEach(({ pattern, description }) => {
  const watcher = chokidar.watch(pattern, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });
  
  watcher
    .on('change', (filePath) => handleFileChange(filePath, 'changed'))
    .on('add', (filePath) => handleFileChange(filePath, 'added'))
    .on('unlink', (filePath) => handleFileChange(filePath, 'deleted'));
    
  console.log(`   ✅ Watching ${description}: ${pattern}`);
});

console.log('\n🎯 Watch system activo. Presiona Ctrl+C para salir...\n');

// Cleanup al salir
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo watch system...');
  process.exit(0);
}); 