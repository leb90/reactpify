#!/usr/bin/env node

/**
 * Reactpify Setup
 * Installs Reactpify on top of an existing Shopify theme.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_MARKER = '{% comment %} Reactpify {% endcomment %}';

const REQUIRED_DEV_DEPENDENCIES = {
  '@reduxjs/toolkit': '^2.12.0',
  '@tailwindcss/vite': '^4.3.3',
  '@types/node': '^24.13.5',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.3.0',
  '@vitejs/plugin-react': '^6.1.1',
  react: '^19.3.0',
  'react-dom': '^19.3.0',
  'react-redux': '^9.3.0',
  tailwindcss: '^4.3.3',
  typescript: '~5.9.3',
  vite: '^8.3.0'
};

const CONFIG_FILES = [
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite-fragment-injection.ts',
  '.gitignore',
  '.shopifyignore',
  '.theme-check.yml',
  'env.example',
  'start-dev.ps1',
  'start-dev.sh'
];

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

function insertBeforeTag(content, tag, snippet) {
  const pattern = new RegExp(`([ \\t]*)</${tag}>`, 'i');

  if (!pattern.test(content)) return null;

  return content.replace(
    pattern,
    (_, indentation) => `${indentation}  ${snippet}\n${indentation}</${tag}>`
  );
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
    `${THEME_MARKER}\n  {{ 'reactpify.css' | asset_url | stylesheet_tag }}`
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

  pkg.devDependencies ??= {};
  const added = [];

  for (const [name, version] of Object.entries(REQUIRED_DEV_DEPENDENCIES)) {
    if (!pkg.devDependencies[name]) {
      pkg.devDependencies[name] = version;
      added.push(name);
    }
  }

  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  log(`✅ package.json updated (${added.length} dependency/ies added)`, 'green');

  return added.length > 0;
}

function installDependencies() {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const child = spawn(isWindows ? 'npm.cmd' : 'npm', ['install'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: isWindows
    });

    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
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

async function runSetup() {
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
  createExampleComponent();

  const needsInstall = updatePackageJson();
  const themeUpdated = updateThemeLayout();

  if (needsInstall) {
    log('📦 Installing dependencies...', 'blue');
    const installed = await installDependencies();

    if (!installed) {
      log('⚠️  Dependency install failed. Run "npm install" manually.', 'yellow');
    }
  }

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

runSetup().catch((error) => {
  log(`❌ Reactpify setup failed: ${error.message}`, 'red');
  process.exitCode = 1;
});
