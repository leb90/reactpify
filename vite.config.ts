import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { autoComponentRegistry } from './vite-plugins/auto-component-registry.ts';
import { liquidSync } from './vite-plugins/liquid-sync.ts';
import { themeStyleAnalyzer } from './vite-plugins/theme-style-analyzer.ts';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const fromRoot = (...segments: string[]) => resolve(projectRoot, ...segments);

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    base: '',
    plugins: [
      react(),
      tailwindcss(),
      themeStyleAnalyzer({
        themeAssetsPath: 'assets',
        outputPath: 'src/styles/theme-extracted.css'
      }),
      autoComponentRegistry(),
      liquidSync()
    ],
    resolve: {
      alias: {
        '@components': fromRoot('src/utils/components'),
        '@redux': fromRoot('src/redux'),
        '@helpers': fromRoot('src/utils/helpers'),
        '@interfaces': fromRoot('src/utils/interfaces'),
        '@src': fromRoot('src')
      }
    },
    build: {
      outDir: fromRoot('assets'),
      emptyOutDir: false,
      target: 'es2022',
      cssTarget: 'chrome111',
      cssCodeSplit: false,
      sourcemap: isDevelopment,
      minify: isDevelopment ? false : 'oxc',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 600,
      reportCompressedSize: false,
      rollupOptions: {
        // Every emitted file must stay under the reactpify.* namespace: the
        // output folder is the theme's own assets/ directory.
        input: { reactpify: fromRoot('src/main.tsx') },
        output: {
          entryFileNames: 'reactpify.js',
          chunkFileNames: 'reactpify-[name]-[hash].js',
          assetFileNames: (asset) => {
            const name = asset.names?.[0] ?? '';
            return name.endsWith('.css') ? 'reactpify.css' : 'reactpify-[name][extname]';
          }
        }
      }
    },
    server: {
      host: true,
      port: 3000,
      strictPort: false,
      open: false
    }
  };
});
