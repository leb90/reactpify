#!/usr/bin/env node

/**
 * Reactpify Setup
 * Installs Reactpify on top of an existing Shopify theme.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_MARKER = '{% comment %} Reactpify {% endcomment %}';

const CONFIG_FILES = [
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite-fragment-injection.ts',
  'env.example',
  'start-dev.ps1',
  'start-dev.sh'
];

const IGNORE_HEADER = '# Reactpify';

const SHOPIFYIGNORE_ENTRIES = [
  'node_modules/*',
  'src/*',
  'vite-plugins/*',
  'scripts/*',
  '*.ts',
  '*.tsx',
  'package.json',
  'package-lock.json',
  'tsconfig*.json',
  '.env',
  '.env.*',
  'assets/*.map'
];

const GITIGNORE_ENTRIES = [
  'node_modules/',
  '.env',
  '.env.local',
  '.shopify/',
  'assets/reactpify.js',
  'assets/reactpify.js.map',
  'assets/reactpify.css',
  '*.tsbuildinfo',
  '*.tgz'
];

const THEME_CHECK_HEADER =
  '# Reactpify keeps its Liquid sources under src/. They hold FRAGMENT.*\n' +
  '# placeholders and only become valid theme files once the build runs.';

const THEME_CHECK_IGNORES = ['node_modules/**', 'src/**', 'vite-plugins/**', 'scripts/**'];

const SOURCE_DIRECTORIES = [
  'src/styles',
  'src/utils',
  'src/components',
  'src/redux',
  'src/snippets'
];

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

function resolveThemeDirectory() {
  const candidate = process.env.INIT_CWD || process.cwd();
  return path.resolve(candidate);
}

function isShopifyTheme() {
  const hasRequiredDirectories = ['layout', 'sections', 'assets'].every((dir) =>
    fs.existsSync(path.resolve(dir))
  );
  const hasThemeLayout =
    fs.existsSync('layout/theme.liquid') || fs.existsSync('layout/password.liquid');

  return hasRequiredDirectories && hasThemeLayout;
}

function reportMissingThemeStructure() {
  log("❌ This doesn't look like a Shopify theme directory.", 'red');
  log(`   Checked: ${process.cwd()}`, 'yellow');
  log('   Expected layout/, sections/ and assets/ plus layout/theme.liquid.', 'yellow');
}

function copyFileIfMissing(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath) || fs.existsSync(destinationPath)) return false;

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  return true;
}

function copyDirectoryIfMissing(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  let copied = 0;
  fs.mkdirSync(destinationDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copied += copyDirectoryIfMissing(source, destination);
    } else if (copyFileIfMissing(source, destination)) {
      copied += 1;
    }
  }

  return copied;
}

function installProjectFiles() {
  let copied = 0;

  for (const file of CONFIG_FILES) {
    const destination = file === 'env.example' ? '.env.example' : file;
    if (copyFileIfMissing(path.join(PACKAGE_ROOT, file), destination)) copied += 1;
  }

  for (const directory of [...SOURCE_DIRECTORIES, 'vite-plugins']) {
    copied += copyDirectoryIfMissing(path.join(PACKAGE_ROOT, directory), directory);
  }

  copied += copyFileIfMissing(
    path.join(PACKAGE_ROOT, 'scripts/shopify-env.js'),
    'scripts/shopify-env.js'
  )
    ? 1
    : 0;

  copied += copyFileIfMissing(path.join(PACKAGE_ROOT, 'src/main.tsx'), 'src/main.tsx') ? 1 : 0;

  log(`✅ Installed ${copied} project file(s)`, 'green');
}

function appendSection(filePath, block) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const padding = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';

  fs.writeFileSync(filePath, `${existing}${padding}${block}\n`);
}

function normalizePattern(pattern) {
  return pattern
    .trim()
    .replace(/\/\*$/, '')
    .replace(/\/+$/, '');
}

function mergeIgnoreFile(filePath, entries) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const alreadyIgnored = new Set(existing.split('\n').map(normalizePattern));
  const missing = entries.filter((entry) => !alreadyIgnored.has(normalizePattern(entry)));

  if (missing.length === 0) return;

  appendSection(filePath, `${IGNORE_HEADER}\n${missing.join('\n')}`);
  log(`✅ ${filePath} updated (${missing.length} entry/ies added)`, 'green');
}

function mergeThemeCheck() {
  const configPath = '.theme-check.yml';

  if (!fs.existsSync(configPath)) {
    fs.copyFileSync(path.join(PACKAGE_ROOT, '.theme-check.yml'), configPath);
    log('✅ Created .theme-check.yml', 'green');
    return;
  }

  const existing = fs.readFileSync(configPath, 'utf8');
  const missing = THEME_CHECK_IGNORES.filter((pattern) => !existing.includes(pattern));

  if (missing.length === 0) return;

  const entries = missing.map((pattern) => `  - ${pattern}`).join('\n');
  const ignoreKeyPattern = /^ignore:[ \t]*$/m;

  if (ignoreKeyPattern.test(existing)) {
    fs.writeFileSync(configPath, existing.replace(ignoreKeyPattern, `ignore:\n${entries}`));
  } else {
    appendSection(configPath, `${THEME_CHECK_HEADER}\nignore:\n${entries}`);
  }

  log(`✅ .theme-check.yml updated (${missing.length} ignore rule(s) added)`, 'green');
}

function insertBeforeTag(content, tag, snippet) {
  const pattern = new RegExp(`([ \\t]*)</${tag}>`, 'i');

  if (!pattern.test(content)) return null;

  return content.replace(pattern, (_, indentation) => {
    const indented = snippet
      .split('\n')
      .map((line) => `${indentation}  ${line}`)
      .join('\n');

    return `${indented}\n${indentation}</${tag}>`;
  });
}

function updateThemeLayout() {
  const layoutPath = 'layout/theme.liquid';

  if (!fs.existsSync(layoutPath)) {
    log('⚠️  layout/theme.liquid not found. Add the Reactpify tags manually.', 'yellow');
    return false;
  }

  const original = fs.readFileSync(layoutPath, 'utf8');

  if (original.includes(THEME_MARKER)) {
    log('✅ Reactpify tags already present in layout/theme.liquid', 'green');
    return true;
  }

  const withStyles = insertBeforeTag(
    original,
    'head',
    `${THEME_MARKER}\n{{ 'reactpify.css' | asset_url | stylesheet_tag }}`
  );
  // The bundle is ESM, so it needs type="module" rather than script_tag.
  const withScripts = insertBeforeTag(
    withStyles ?? original,
    'body',
    `<script type="module" src="{{ 'reactpify.js' | asset_url }}"></script>`
  );

  if (!withScripts) {
    log('⚠️  Could not locate </head> or </body> in layout/theme.liquid.', 'yellow');
    return false;
  }

  fs.writeFileSync(layoutPath, withScripts);
  log('✅ Added Reactpify tags to layout/theme.liquid', 'green');
  return true;
}

function updatePackageJson() {
  const packagePath = 'package.json';
  let pkg = {};

  if (fs.existsSync(packagePath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch {
      log('⚠️  package.json is not valid JSON, creating a new one.', 'yellow');
    }
  }

  pkg.name ??= path.basename(process.cwd());
  pkg.version ??= '1.0.0';
  pkg.description ??= 'Shopify theme with React components powered by Reactpify';
  pkg.private ??= true;
  pkg.type ??= 'module';

  pkg.scripts = {
    ...pkg.scripts,
    dev: 'vite serve --mode development',
    build: 'vite build',
    watch: 'vite build --watch --mode development',
    'type-check': 'tsc --noEmit'
  };

  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  log('✅ package.json updated', 'green');
}

function createExampleComponent() {
  const componentPath = 'src/components/test/Test.tsx';

  if (fs.existsSync(componentPath)) return;

  fs.mkdirSync(path.dirname(componentPath), { recursive: true });
  fs.writeFileSync(
    componentPath,
    `import { useState } from 'react';

interface TestProps {
  title?: string;
  showButton?: boolean;
}

export const Test = ({ title = 'Hello World', showButton = true }: TestProps) => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="reactpify-container max-w-md mx-auto p-6">
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>

        {showButton && (
          <button
            type="button"
            onClick={() => setClicked(!clicked)}
            className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-semibold"
          >
            {clicked ? 'Clicked!' : 'Click me'}
          </button>
        )}
      </div>
    </div>
  );
};
`
  );

  log('✅ Created example component src/components/test/Test.tsx', 'green');
}

function runSetup() {
  const themeDirectory = resolveThemeDirectory();

  if (themeDirectory === PACKAGE_ROOT) {
    log('ℹ️  Reactpify setup skipped: running inside the Reactpify package itself.', 'yellow');
    return;
  }

  process.chdir(themeDirectory);

  log('🚀 Installing Reactpify on your Shopify theme...\n', 'bold');

  if (!isShopifyTheme()) {
    reportMissingThemeStructure();
    process.exitCode = 1;
    return;
  }

  log('✅ Shopify theme detected', 'green');

  installProjectFiles();
  mergeIgnoreFile('.gitignore', GITIGNORE_ENTRIES);
  mergeIgnoreFile('.shopifyignore', SHOPIFYIGNORE_ENTRIES);
  mergeThemeCheck();
  createExampleComponent();

  updatePackageJson();
  const themeUpdated = updateThemeLayout();

  log('\n🎉 Reactpify installed successfully!', 'green');
  log('\n📋 Next steps:', 'bold');
  log('1. npm run build        # generate assets/reactpify.js, assets/reactpify.css and sections/', 'blue');
  log('2. npm run watch        # rebuild on every change', 'blue');
  log(
    themeUpdated
      ? '3. Add the "Test" section from the Shopify theme editor'
      : '3. Add the Reactpify tags to your theme layout manually',
    'blue'
  );
  log('\n📖 https://github.com/leb90/reactpify', 'yellow');
}

try {
  runSetup();
} catch (error) {
  log(`❌ Reactpify setup failed: ${error.message}`, 'red');
  log('   Run "npx reactpify" from your theme directory to retry.', 'yellow');
  process.exitCode = 1;
}
