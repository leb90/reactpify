import type { Plugin } from 'vite';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { discoverComponents, type DiscoveredComponent } from './component-discovery.ts';

export interface AutoComponentRegistryOptions {
  componentsDir?: string;
  entryFile?: string;
}

function buildEntryContent(components: DiscoveredComponent[]): string {
  const imports = components
    .map(({ analysis, importPath }) => `import { ${analysis.componentName} } from './${importPath}';`)
    .join('\n');

  const registrations = components
    .map(({ analysis }) => `registerComponent('${analysis.componentName}', ${analysis.componentName});`)
    .join('\n');

  return `import './styles/index.css';
import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

${imports}

${registrations}

initRenderSystem();

export { getComponentRegistry } from './utils/helpers/renderComponents';
`;
}

function warnOnDuplicates(components: DiscoveredComponent[]): void {
  const seen = new Map<string, string>();

  for (const { analysis, filePath } of components) {
    const existing = seen.get(analysis.componentName);

    if (existing) {
      console.warn(
        `[reactpify] duplicate component name "${analysis.componentName}" in ${existing} and ${filePath}. ` +
          'Only one of them will be registered.'
      );
      continue;
    }

    seen.set(analysis.componentName, filePath);
  }
}

export function autoComponentRegistry(options: AutoComponentRegistryOptions = {}): Plugin {
  const { componentsDir = 'src/components', entryFile = 'src/main.tsx' } = options;

  function updateEntry(): void {
    const components = discoverComponents(componentsDir);

    if (components.length === 0) return;

    warnOnDuplicates(components);

    const content = buildEntryContent(components);

    if (existsSync(entryFile) && readFileSync(entryFile, 'utf-8') === content) return;

    writeFileSync(entryFile, content, 'utf-8');
    console.log(`[reactpify] registry updated: ${components.length} component(s)`);
  }

  return {
    name: 'reactpify-auto-component-registry',

    buildStart() {
      updateEntry();
    },

    configureServer(server) {
      server.watcher.on('add', (file) => {
        if (file.endsWith('.tsx')) updateEntry();
      });
      server.watcher.on('unlink', (file) => {
        if (file.endsWith('.tsx')) updateEntry();
      });
    }
  };
}
