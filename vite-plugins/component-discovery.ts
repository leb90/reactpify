import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { analyzeComponentFile, type ComponentAnalysis } from './component-analysis.ts';

export interface DiscoveredComponent {
  analysis: ComponentAnalysis;
  filePath: string;
  directory: string;
  importPath: string;
}

const IGNORED_SUFFIXES = ['.test.tsx', '.spec.tsx', '.stories.tsx', '.d.tsx'];

function isComponentFile(fileName: string): boolean {
  if (!fileName.endsWith('.tsx')) return false;
  if (IGNORED_SUFFIXES.some((suffix) => fileName.endsWith(suffix))) return false;

  return /^[A-Z]/.test(fileName);
}

function collectFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      collectFiles(fullPath, found);
    } else if (isComponentFile(entry)) {
      found.push(fullPath);
    }
  }

  return found;
}

export function discoverComponents(componentsDir: string): DiscoveredComponent[] {
  if (!existsSync(componentsDir)) return [];

  return collectFiles(componentsDir).map((filePath) => ({
    analysis: analyzeComponentFile(filePath),
    filePath,
    directory: join(filePath, '..'),
    importPath: relative('src', filePath).replace(/\\/g, '/').replace(/\.tsx$/, '')
  }));
}
