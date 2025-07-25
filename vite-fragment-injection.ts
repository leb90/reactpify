import fs from 'fs';
import path from 'path';

/**
 * Fragment injection system for Liquid templates
 * Replaces FRAGMENT.fragment-name with actual content from schema-fragments
 */

const FRAGMENTS_DIR = 'src/utils/schema-fragments';

/**
 * Load all available fragments from the schema-fragments directory
 */
function loadFragments(): Record<string, string> {
  const fragments: Record<string, string> = {};
  
  if (!fs.existsSync(FRAGMENTS_DIR)) {
    console.log(`📁 Creating fragments directory: ${FRAGMENTS_DIR}`);
    fs.mkdirSync(FRAGMENTS_DIR, { recursive: true });
    return fragments;
  }

  const fragmentFiles = fs.readdirSync(FRAGMENTS_DIR)
    .filter(file => file.endsWith('.liquid'));

  for (const file of fragmentFiles) {
    const fragmentName = path.basename(file, '.liquid');
    const fragmentPath = path.join(FRAGMENTS_DIR, file);
    const content = fs.readFileSync(fragmentPath, 'utf-8');
    
    // Extract the actual fragment content (skip HTML comments)
    let fragmentContent = content;
    
    // Remove HTML comments (<!-- ... -->)
    fragmentContent = fragmentContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    
    // If there's still a Liquid comment structure, extract content after -->
    const contentStart = fragmentContent.indexOf('-->\n');
    if (contentStart !== -1) {
      fragmentContent = fragmentContent.substring(contentStart + 4).trim();
    }
    
    fragments[fragmentName] = fragmentContent;
    console.log(`📦 Loaded fragment: ${fragmentName}`);
  }

  return fragments;
}

/**
 * Process a Liquid template and inject fragments
 */
export async function fragmentInjection(content: string): Promise<string> {
  const fragments = loadFragments();
  let processedContent = content;

  // Find all FRAGMENT.* references
  const fragmentPattern = /FRAGMENT\.([a-zA-Z0-9-_]+)/g;
  const matches = [...content.matchAll(fragmentPattern)];

  if (matches.length > 0) {
    console.log(`🔄 Processing ${matches.length} fragment(s)...`);
  }

  for (const match of matches) {
    const [fullMatch, fragmentName] = match;
    
    if (fragments[fragmentName]) {
      processedContent = processedContent.replace(fullMatch, fragments[fragmentName]);
      console.log(`✅ Injected fragment: ${fragmentName}`);
    } else {
      console.warn(`⚠️  Fragment not found: ${fragmentName}`);
      // Leave the FRAGMENT.* reference as-is if not found
    }
  }

  return processedContent;
} 