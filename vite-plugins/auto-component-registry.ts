import fs from 'fs';
import path from 'path';

/**
 * Plugin to auto-register React components in main.tsx
 */
export function autoComponentRegistry() {
  return {
    name: 'auto-component-registry',
    buildStart() {
      updateMainTsx();
    },
    
    handleHotUpdate({ file }: { file: string }) {
      if (file.includes('src/components/') && file.endsWith('.tsx')) {
        updateMainTsx();
      }
    }
  };
}

/**
 * Updates main.tsx with all found components
 */
function updateMainTsx() {
  const componentsDir = 'src/components';
  const mainTsxPath = 'src/main.tsx';

  if (!fs.existsSync(componentsDir)) {
    return;
  }

  const components = findAllComponents(componentsDir);
  
  if (components.length === 0) {
    return;
  }

  const imports = components.map(comp => 
    `import { ${comp.name} } from './${comp.relativePath}';`
  ).join('\n');

  const registrations = components.map(comp => 
    `registerComponent('${comp.name}', ${comp.name});`
  ).join('\n');

  const mainTsxContent = `import React from 'react';
import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

// Auto-generated imports
${imports}

/**
 * Main entry point
 * Registers all React components and initializes the rendering system
 */

console.log('🚀 Initializing Reactpify');

// Auto-generated component registrations
${registrations}

initRenderSystem();

export { getComponentRegistry } from './utils/helpers/renderComponents';

console.log('✅ Reactpify initialized successfully');`;

  if (fs.existsSync(mainTsxPath)) {
    const currentContent = fs.readFileSync(mainTsxPath, 'utf-8');
    if (currentContent === mainTsxContent) {
      return;
    }
  }

  fs.writeFileSync(mainTsxPath, mainTsxContent, 'utf-8');
  console.log(`🔄 Registry updated: ${components.length} components registered`);
}

/**
 * Find all React components in src/components/
 */
function findAllComponents(dir: string): Array<{name: string, relativePath: string}> {
  const components: Array<{name: string, relativePath: string}> = [];

  function scanDirectory(currentDir: string, relativePath: string = '') {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, path.join(relativePath, item));
      } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.stories.')) {
        const componentName = path.basename(item, '.tsx');
        
        if (componentName[0] === componentName[0].toUpperCase()) {
          const compRelativePath = path.join(relativePath, item).replace(/\\/g, '/');
          components.push({
            name: componentName,
            relativePath: `components/${compRelativePath.replace('.tsx', '')}`
          });
        }
      }
    }
  }

  scanDirectory(dir);
  return components;
} 