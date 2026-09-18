import type { Plugin } from 'vite';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface ThemeStyleAnalyzerOptions {
  themeAssetsPath?: string;
  outputPath?: string;
  enabled?: boolean;
}

interface CssRule {
  selector: string;
  body: string;
}

const TOKEN_HOST_SELECTORS = [':root', 'html'];

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readTopLevelRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  let selectorStart = 0;
  let depth = 0;
  let blockStart = -1;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];

    if (char === '{') {
      if (depth === 0) blockStart = index;
      depth += 1;
      continue;
    }

    if (char !== '}' || depth === 0) continue;

    depth -= 1;

    if (depth === 0) {
      rules.push({
        selector: css.slice(selectorStart, blockStart).trim(),
        body: css.slice(blockStart + 1, index)
      });
      selectorStart = index + 1;
    }
  }

  return rules;
}

function isTokenHost(selector: string): boolean {
  return selector
    .split(',')
    .map((part) => part.trim())
    .some((part) => TOKEN_HOST_SELECTORS.includes(part));
}

function readCustomProperties(body: string): Array<[string, string]> {
  const declarations: Array<[string, string]> = [];
  let depth = 0;
  let current = '';

  const flush = () => {
    const match = current.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/);
    if (match) declarations.push([match[1], match[2].trim()]);
    current = '';
  };

  for (const char of body) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ';' && depth === 0) {
      flush();
      continue;
    }

    current += char;
  }

  flush();
  return declarations;
}

function collectThemeTokens(cssFiles: string[]): Map<string, string> {
  const tokens = new Map<string, string>();

  for (const file of cssFiles) {
    let content: string;

    try {
      content = stripComments(readFileSync(file, 'utf-8'));
    } catch {
      continue;
    }

    for (const rule of readTopLevelRules(content)) {
      if (rule.selector.startsWith('@')) continue;
      if (!isTokenHost(rule.selector)) continue;

      for (const [name, value] of readCustomProperties(rule.body)) {
        tokens.set(name, value);
      }
    }
  }

  return tokens;
}

function isGeneratedAsset(fileName: string): boolean {
  return fileName === 'main.css' || fileName.startsWith('reactpify');
}

function findThemeCssFiles(themeAssetsPath: string): string[] {
  if (!existsSync(themeAssetsPath)) return [];

  return readdirSync(themeAssetsPath)
    .filter((fileName) => fileName.endsWith('.css') && !isGeneratedAsset(fileName))
    .sort()
    .map((fileName) => join(themeAssetsPath, fileName));
}

function renderTokenFile(tokens: Map<string, string>): string {
  const header = `/*
 * REACTPIFY - Theme design tokens (auto-generated, do not edit)
 *
 * Only CSS custom properties declared on :root / html in the theme assets are
 * mirrored here, so React components can reference the same design tokens.
 * Theme rules are intentionally NOT copied: the theme already ships them, and
 * duplicating them causes specificity conflicts and dead weight in the bundle.
 */
`;

  if (tokens.size === 0) {
    return `${header}\n/* No theme design tokens were found in the theme assets. */\n`;
  }

  const declarations = [...tokens]
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `${header}\n:root {\n${declarations}\n}\n`;
}

export function themeStyleAnalyzer(options: ThemeStyleAnalyzerOptions = {}): Plugin {
  const {
    themeAssetsPath = 'assets',
    outputPath = 'src/styles/theme-extracted.css',
    enabled = true
  } = options;

  let lastOutput: string | null = null;

  return {
    name: 'reactpify-theme-style-analyzer',

    buildStart() {
      if (!enabled) return;

      const cssFiles = findThemeCssFiles(themeAssetsPath);
      const tokens = collectThemeTokens(cssFiles);
      const output = renderTokenFile(tokens);

      if (output === lastOutput) return;
      lastOutput = output;

      if (existsSync(outputPath) && readFileSync(outputPath, 'utf-8') === output) return;

      writeFileSync(outputPath, output, 'utf-8');
      console.log(
        `[reactpify] theme tokens extracted: ${tokens.size} from ${cssFiles.length} file(s)`
      );
    }
  };
}
