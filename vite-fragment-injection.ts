import fs from 'fs';
import path from 'path';

const FRAGMENTS_DIR = 'src/utils/schema-fragments';
const FRAGMENT_PATTERN = /([ \t]*)FRAGMENT\.([a-zA-Z0-9-_]+)/g;

let fragmentCache: Record<string, string> | null = null;

export function invalidateFragmentCache(): void {
  fragmentCache = null;
}

function stripLeadingComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function loadFragments(): Record<string, string> {
  if (fragmentCache) return fragmentCache;

  const fragments: Record<string, string> = {};

  if (!fs.existsSync(FRAGMENTS_DIR)) {
    fs.mkdirSync(FRAGMENTS_DIR, { recursive: true });
    fragmentCache = fragments;
    return fragments;
  }

  for (const file of fs.readdirSync(FRAGMENTS_DIR)) {
    if (!file.endsWith('.liquid')) continue;

    const name = path.basename(file, '.liquid');
    const raw = fs.readFileSync(path.join(FRAGMENTS_DIR, file), 'utf-8');
    fragments[name] = stripLeadingComments(raw);
  }

  fragmentCache = fragments;
  return fragments;
}

export function getFragments(): Record<string, string> {
  return loadFragments();
}

function reindent(block: string, indentation: string): string {
  const lines = block.split('\n');
  const smallestIndent = lines
    .filter((line) => line.trim())
    .reduce((smallest, line) => Math.min(smallest, line.length - line.trimStart().length), Infinity);

  const offset = Number.isFinite(smallestIndent) ? smallestIndent : 0;

  return lines
    .map((line, index) => {
      if (!line.trim()) return '';
      const dedented = line.slice(offset);
      return index === 0 ? dedented : indentation + dedented;
    })
    .join('\n');
}

export async function fragmentInjection(content: string): Promise<string> {
  const fragments = loadFragments();
  const missing = new Set<string>();

  const result = content.replace(
    FRAGMENT_PATTERN,
    (fullMatch, indentation: string, name: string) => {
      const fragment = fragments[name];

      if (fragment === undefined) {
        missing.add(name);
        return fullMatch;
      }

      return indentation + reindent(fragment, indentation);
    }
  );

  for (const name of missing) {
    console.warn(`⚠️  [FRAGMENT] Not found: FRAGMENT.${name}`);
  }

  return result;
}
