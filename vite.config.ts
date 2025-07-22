import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { autoLiquidGenerator } from './vite-plugins/auto-liquid-generator';
import { autoComponentRegistry } from './vite-plugins/auto-component-registry';

/**
 * Custom plugin to copy Liquid files
 * Copies section.*.liquid → sections/ and snippet.*.liquid → snippets/
 */
function liquidFileCopyPlugin() {
  return {
    name: 'liquid-file-copy',
    buildStart() {
      console.log('🚀 Copying Liquid files...');
      copyLiquidFiles();
    },
    handleHotUpdate({ file }: { file: string }) {
      if (file.endsWith('.liquid')) {
        console.log(`📝 Liquid file changed: ${file}`);
        copyLiquidFiles();
      }
    }
  };
}

function copyLiquidFiles() {
  const srcDir = './src';
  const sectionsDir = './sections';
  const snippetsDir = './snippets';

  if (!fs.existsSync(sectionsDir)) {
    fs.mkdirSync(sectionsDir, { recursive: true });
  }
  if (!fs.existsSync(snippetsDir)) {
    fs.mkdirSync(snippetsDir, { recursive: true });
  }
  function findLiquidFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findLiquidFiles(fullPath));
      } else if (item.endsWith('.liquid')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const liquidFiles = findLiquidFiles(srcDir);

  for (const file of liquidFiles) {
    const fileName = path.basename(file);
    let destDir = '';
    let destFileName = fileName;

    if (fileName.startsWith('section.')) {
      destDir = sectionsDir;
      destFileName = fileName.replace('section.', '');
    }
    else if (fileName.startsWith('snippet.')) {
      destDir = snippetsDir;
      destFileName = fileName.replace('snippet.', '');
    }
    else {
      destDir = sectionsDir;
    }

    const destPath = path.join(destDir, destFileName);

    try {
      fs.copyFileSync(file, destPath);
      console.log(`✅ Copied: ${file} → ${destPath}`);
    } catch (error) {
      console.error(`❌ Error copying ${file}:`, error);
    }
  }

  console.log(`📦 Liquid files copied successfully!`);
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    autoLiquidGenerator(),
    autoComponentRegistry(),
    liquidFileCopyPlugin()
  ],
  

  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'Reactpify',
      fileName: 'reactpify',
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        dir: 'assets',
        entryFileNames: 'reactpify.js',
        format: 'es'
      }
    },
    outDir: 'assets',
    emptyOutDir: false,
    watch: mode === 'development' ? {} : null,
    minify: mode === 'development' ? false : 'esbuild'
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