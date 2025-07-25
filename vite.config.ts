import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { fragmentInjection } from './vite-fragment-injection';
import { autoComponentRegistry } from './vite-plugins/auto-component-registry';

/**
 * Hybrid Liquid Copy Plugin  
 * Copies Liquid templates from src/components to sections/ with fragment injection
 */
function hybridLiquidPlugin() {
  return {
    name: 'hybrid-liquid-copy',
    buildStart() {
      copyHybridLiquidFiles();
    },
    handleHotUpdate({ file }: { file: string }) {
      if (file.includes('src/components/') && file.endsWith('.liquid')) {
        copyHybridLiquidFiles();
      }
    }
  };
}

/**
 * Check if a file was manually edited (has custom content beyond auto-generation)
 */
function isManuallyEditedLiquid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Check for explicit manual edit markers (highest priority)
    const hasManualMarker = content.includes('<!-- MANUAL EDIT -->') || 
                           content.includes('{% comment %} MANUAL EDIT {% endcomment %}');
    
    if (hasManualMarker) {
      console.log(`\x1b[91m📝 [MANUAL-MARK]\x1b[0m Detected manual edit by marker: ${filePath}`);
      return true;
    }
    
    // 2. Check if file has our auto-generation signature
    const isAutoGenerated = content.includes('Auto-generated with Metaobject Support');
    
    // 3. If it doesn't have our signature, it's likely manually created/edited
    if (!isAutoGenerated) {
      console.log(`\x1b[93m📝 [MANUAL-CONTENT]\x1b[0m Detected manual edit (no auto-gen signature): ${filePath}`);
      return true;
    }
    
    // 4. Check for manual modifications in auto-generated files
    const hasManualModifications = 
      content.includes('MODIFIED MANUALLY') ||
      content.includes('CUSTOM LIQUID') ||
      content.includes('manually customized') ||
      content.includes('Manual edit') ||
      content.includes('custom code') ||
      // Check if standard comments were modified
      (content.includes('{% comment %}') && 
       content.includes('FOR TEST') ||
       content.includes('MANUAL') ||
       content.includes('Custom'));

    if (hasManualModifications) {
      console.log(`\x1b[93m📝 [MANUAL-DETECT]\x1b[0m Detected manual modifications in content: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a file is a React component liquid file that should be auto-generated
 */
function isReactComponentFile(filePath: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // React component files are in src/components/ and have section.*.liquid pattern
  const isInComponentsDir = normalizedPath.includes('src/components/');
  const isSectionFile = path.basename(filePath).startsWith('section.');
  
  return isInComponentsDir && isSectionFile;
}

/**
 * Hybrid copy function with fragment injection
 */
async function copyHybridLiquidFiles() {
  const srcDir = 'src/components';
  const destDir = 'sections';

  if (!fs.existsSync(srcDir)) {
    console.log('📁 Source components directory not found');
    return;
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  console.log('🔄 Processing hybrid Liquid files...');

  async function processDirectory(currentDir: string) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        await processDirectory(sourcePath);
      } else if (item.name.startsWith('section.') && item.name.endsWith('.liquid')) {
        await processLiquidFile(sourcePath);
      }
    }
  }

  async function processLiquidFile(sourcePath: string) {
    try {
      const content = fs.readFileSync(sourcePath, 'utf-8');
      
      // Process fragments
      const processedContent = await fragmentInjection(content);
      
      // Determine target filename
      const fileName = path.basename(sourcePath);
      const targetFileName = fileName.replace(/^section\./, '');
      const targetPath = path.join(destDir, targetFileName);

      // Write processed content
      fs.writeFileSync(targetPath, processedContent);
      
      console.log(`🎯 [HYBRID] ${sourcePath} → ${targetPath}`);
    } catch (error) {
      console.error(`❌ Error processing ${sourcePath}:`, error);
    }
  }

  try {
    await processDirectory(srcDir);
    console.log('📦 Hybrid Liquid files processed successfully!');
  } catch (error) {
    console.error('❌ Error during hybrid liquid processing:', error);
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    autoComponentRegistry(),
    hybridLiquidPlugin()
  ],
  
  define: {
    'process.env': '{}',
    'process.env.NODE_ENV': JSON.stringify(mode),
    'global': 'globalThis',
  },

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.tsx')
      },
      output: {
        dir: 'assets',
        entryFileNames: 'reactpify.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'reactpify.css';
          }
          return '[name].[ext]';
        },
        format: 'es'
      }
    },
    outDir: 'assets',
    emptyOutDir: false,
    watch: mode === 'development' ? {} : null,
    minify: mode === 'development' ? false : 'esbuild',
    cssCodeSplit: false
  },


  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/utils/components'),
      '@helpers': resolve(__dirname, 'src/utils/helpers'),
      '@interfaces': resolve(__dirname, 'src/utils/interfaces'),
      '@redux': resolve(__dirname, 'src/redux'),
      '@src': resolve(__dirname, 'src')
    }
  },


  server: {
    port: 3000,
    host: true
  },


  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})); 