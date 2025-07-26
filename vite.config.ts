import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';
import { fragmentInjection } from './vite-fragment-injection';
import { autoComponentRegistry } from './vite-plugins/auto-component-registry';
import { autoLiquidSync } from './vite-plugins/auto-liquid-sync';
import { themeStyleAnalyzer } from './vite-plugins/theme-style-analyzer';
import { bidirectionalWatch } from './vite-plugins/bidirectional-watch';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: '',
    plugins: [
      react(),
      tailwindcss(),
      themeStyleAnalyzer({
        themeAssetsPath: 'assets',
        outputPath: 'src/styles/theme-extracted.css',
        enabled: true
      }),
      bidirectionalWatch({
        enabled: isDev,
        srcComponentsPath: 'src/components',
        sectionsPath: 'sections',
        debounceMs: 300
      }),
      autoComponentRegistry(),
      autoLiquidSync(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/components/**/section.*.liquid',
            dest: resolve(__dirname, 'sections'),
            rename: (name) => name.replace(/^section\./, '').concat('.liquid'),
            transform: async (content) => {
              return await fragmentInjection(content.toString());
            },
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@components': resolve(__dirname, 'src/utils/components'),
        '@redux': resolve(__dirname, 'src/redux'),
        '@helpers': resolve(__dirname, 'src/utils/helpers'),
        '@interfaces': resolve(__dirname, 'src/utils/interfaces'),
      },
    },
    build: {
      outDir: resolve(__dirname, 'assets'),
      emptyOutDir: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main.tsx'),
          'main-css': resolve(__dirname, 'src/styles.tsx'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: (chunkInfo) => {
            if (chunkInfo.name && chunkInfo.name.endsWith('.css')) {
              return 'main.css';
            }
            return '[name][extname]';
          },
          manualChunks: undefined,
        }
      },
      cssCodeSplit: false,
      cssTarget: 'chrome80',
      target: 'es2020',
      sourcemap: isDev,
      watch: isDev ? {
        exclude: ['node_modules/**', 'assets/**', 'sections/**'],
        include: ['src/**'],
        buildDelay: 300,
        chokidar: {
          ignored: [
            '**/node_modules/**',
            '**/assets/**',
            '**/sections/**'
          ],
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
          },
        },
      } : undefined,
      chunkSizeWarningLimit: 2000,
      minify: mode === 'development' ? false : 'esbuild',
      assetsInlineLimit: 0,
    },
    server: {
      host: true,
      port: 3000,
      strictPort: false,
      open: false
    }
  };
}); 