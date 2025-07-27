import { Plugin } from 'vite';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import * as glob from 'glob';

interface ThemeStyleAnalyzerOptions {
  themeAssetsPath?: string;
  outputPath?: string;
  enabled?: boolean;
}

export function themeStyleAnalyzer(options: ThemeStyleAnalyzerOptions = {}): Plugin {
  const {
    themeAssetsPath = 'assets',
    outputPath = 'src/styles/theme-extracted.css',
    enabled = true
  } = options;

  let hasProcessedTheme = false;
  let lastProcessedFiles: string[] = [];

  function extractThemeStyles(themeFiles: string[]): string {
    let combinedStyles = '';

    themeFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf-8');
        const filteredContent = filterThemeSelectors(content, file);
        
        if (filteredContent.trim()) {
          combinedStyles += `\n/* Extracted from ${file} */\n${filteredContent}\n`;
        }
        
      } catch (error) {
        console.warn(`⚠️ [THEME-ANALYZER] Could not read ${file}:`, error);
      }
    });

    return combinedStyles;
  }

  function filterThemeSelectors(css: string, fileName: string): string {
    if (!css || css.trim().length === 0) {
      return '';
    }

    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // First pass: Extract valid CSS rules
    const preservePatterns = [
      /:root\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /@font-face\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /@keyframes\s+[^{]+\s*\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g,
      /\.shopify-[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /\.theme-[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /html\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /body\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
      /@media[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,
    ];

    let filteredCss = '';

    preservePatterns.forEach(pattern => {
      const matches = css.match(pattern) || [];
      matches.forEach(match => {
        const openBraces = (match.match(/\{/g) || []).length;
        const closeBraces = (match.match(/\}/g) || []).length;
        
        if (openBraces === closeBraces) {
          filteredCss += match + '\n\n';
        } else {
          console.warn(`⚠️ [THEME-ANALYZER] Incomplete CSS rule ignored in ${fileName}:`, match.substring(0, 100) + '...');
        }
      });
    });

    // Second pass: Remove problematic patterns and invalid CSS
    const excludePatterns = [
      /\*\s*,\s*\*::before\s*,\s*\*::after/,
      /\*\s*\{[^}]*box-sizing[^}]*\}/g,
      /\*\s*\{[^}]*margin[^}]*\}/g,
      /\*\s*\{[^}]*padding[^}]*\}/g,
    ];

    excludePatterns.forEach(pattern => {
      filteredCss = filteredCss.replace(pattern, '');
    });

    // Third pass: Validate and clean individual CSS lines
    filteredCss = validateAndCleanCSS(filteredCss, fileName);

    return scopeThemeStyles(filteredCss.trim());
  }

  function validateAndCleanCSS(css: string, fileName: string): string {
    const lines = css.split('\n');
    const validLines: string[] = [];
    let insideRule = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        validLines.push(line);
        continue;
      }
      
      // Track if we're inside a CSS rule
      if (line.includes('{')) insideRule = true;
      if (line.includes('}')) insideRule = false;
      
      // Skip invalid CSS patterns
      if (isInvalidCSS(line)) {
        console.warn(`⚠️ [THEME-ANALYZER] Invalid CSS skipped in ${fileName}:`, line);
        continue;
      }
      
      validLines.push(line);
    }
    
    return validLines.join('\n');
  }

  function isInvalidCSS(line: string): boolean {
    const trimmed = line.trim();
    
    // Skip lines that are clearly invalid
    const invalidPatterns = [
      /^section\.id\s*$/,                    // Invalid: section.id
      /^[a-z]+\.[a-z]+\s*$/,                // Invalid: word.word without proper CSS syntax
      /^[^{}\s]+\.[^{}\s:]+\s*$/,          // Invalid: selector.invalid without braces or properties
      /^\w+\.\w+\s*$/,                      // Invalid: simple word.word
      /^[^{:;]+\.[^{:;]+\s*$/,             // Invalid: anything.anything without CSS syntax
      /\$\{[^}]*\}/,                        // Template literals
      /\{\{[^}]*\}\}/,                      // Handlebars/Liquid syntax
      /\{%[^%]*%\}/,                        // Liquid tags
      /javascript:/i,                       // JavaScript URLs
      /^function\s*\(/,                     // JavaScript functions
      /^var\s+/,                            // JavaScript variables
      /^let\s+/,                            // JavaScript variables
      /^const\s+/,                          // JavaScript variables
    ];
    
    return invalidPatterns.some(pattern => pattern.test(trimmed));
  }

  function ensureBalancedCSS(css: string): string {
    if (!css || !css.trim()) return '';
    
    // Count braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    
    let balancedCss = css;
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      balancedCss += '\n' + '}'.repeat(missing);
      console.warn(`⚠️ [THEME-ANALYZER] Added ${missing} missing closing braces to CSS`);
    }
    
    // Remove extra closing braces (keep structure intact)
    if (closeBraces > openBraces) {
      const lines = balancedCss.split('\n');
      const cleanLines: string[] = [];
      let braceBalance = 0;
      
      for (const line of lines) {
        const openInLine = (line.match(/\{/g) || []).length;
        const closeInLine = (line.match(/\}/g) || []).length;
        
        braceBalance += openInLine;
        
        if (closeInLine > 0 && braceBalance >= closeInLine) {
          braceBalance -= closeInLine;
          cleanLines.push(line);
        } else if (closeInLine === 0) {
          cleanLines.push(line);
        } else {
          // Skip lines with excess closing braces
          console.warn(`⚠️ [THEME-ANALYZER] Skipped line with excess closing braces: ${line.trim()}`);
        }
      }
      
      balancedCss = cleanLines.join('\n');
    }
    
    // Final validation: ensure no orphaned selectors
    const lines = balancedCss.split('\n');
    const finalLines: string[] = [];
    let expectingBrace = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('/*') || line.endsWith('*/')) {
        finalLines.push(lines[i]);
        continue;
      }
      
      // CSS selector followed by opening brace
      if (line.includes('{')) {
        expectingBrace = false;
        finalLines.push(lines[i]);
      }
      // CSS property: value;
      else if (line.includes(':') && (line.endsWith(';') || line.endsWith(','))) {
        finalLines.push(lines[i]);
      }
      // Closing brace
      else if (line === '}') {
        finalLines.push(lines[i]);
      }
      // CSS selector without opening brace
      else if (line.match(/^[.#@]?[a-zA-Z][a-zA-Z0-9_-]*/) && !expectingBrace) {
        // Check if next non-empty line has opening brace
        let hasFollowingBrace = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (!nextLine) continue;
          if (nextLine.includes('{')) {
            hasFollowingBrace = true;
            break;
          }
          break;
        }
        
        if (hasFollowingBrace) {
          finalLines.push(lines[i]);
          expectingBrace = true;
        } else {
          console.warn(`⚠️ [THEME-ANALYZER] Skipped orphaned selector: ${line}`);
        }
      }
      else {
        // Skip other potentially problematic lines
        console.warn(`⚠️ [THEME-ANALYZER] Skipped unrecognized CSS: ${line}`);
      }
    }
    
    return finalLines.join('\n');
  }

  function scopeThemeStyles(css: string): string {
    if (!css) return css;

    const scopedCss = css
      .replace(/:root\s*{/g, ':root:not([data-component-root]) {')
      .replace(/html\s*{/g, 'html:not(:has([data-component-root])) {')
      .replace(/body\s*{/g, 'body:not(:has([data-component-root])) {')
      .replace(/(@font-face|@keyframes)([^{]+){/g, '$1$2 {');

    return `
/* ====== ORIGINAL THEME STYLES (SCOPED) ====== */
/* These styles only apply OUTSIDE Reactpify components */
/* Automatically extracted to avoid conflicts */

${scopedCss}

/* ====== END THEME STYLES ====== */
`;
  }

  function generateCombinedStyles(themeStyles: string, outputPath: string): void {
    const combinedContent = `/*
 * REACTPIFY - Automatically Extracted Theme Styles
 * 
 * This file contains styles from the original Shopify theme
 * that have been automatically extracted and scoped to avoid
 * conflicts with Reactpify components.
 * 
 * ⚠️  DO NOT edit manually - automatically regenerated
 */

${themeStyles}
`;

    try {
      writeFileSync(outputPath, combinedContent, 'utf-8');
      console.log(`📝 [THEME-ANALYZER] File generated: ${outputPath}`);
    } catch (error) {
      console.error(`❌ [THEME-ANALYZER] Error writing ${outputPath}:`, error);
    }
  }

  function getOriginalThemeFiles(): string[] {
    const themeCssFiles = [
      join(themeAssetsPath, 'base.css'),
      join(themeAssetsPath, 'component.css'), 
      join(themeAssetsPath, 'theme.css'),
      join(themeAssetsPath, 'style.css'),
      join(themeAssetsPath, 'global.css'),
      join(themeAssetsPath, 'overflow-list.css'),
      join(themeAssetsPath, 'template-giftcard.css'),
      join(themeAssetsPath, 'section-main-page.css'),
      join(themeAssetsPath, 'section-main-product.css'),
      join(themeAssetsPath, 'critical.css'),
      join(themeAssetsPath, 'utility.css'),
    ].filter(file => existsSync(file));

    const additionalCssFiles = glob.sync(join(themeAssetsPath, '*.css'), {
      ignore: [
        join(themeAssetsPath, 'main.css'),
        join(themeAssetsPath, 'reactpify*.css'),
        'src/**/*.css',
        'node_modules/**/*.css'
      ]
    });

    const validThemeFiles = [...new Set([...themeCssFiles, ...additionalCssFiles])]
      .filter(file => {
        if (file.includes('src/') || file.includes('node_modules/')) {
          console.log(`🚫 [THEME-ANALYZER] Ignoring Reactpify file: ${file}`);
          return false;
        }
        
        try {
          const content = readFileSync(file, 'utf-8');
          if (content.includes('--reactpify-primary') || content.includes('REACTPIFY')) {
            console.log(`🚫 [THEME-ANALYZER] Ignoring file with Reactpify variables: ${file}`);
            return false;
          }
          return true;
        } catch (error) {
          console.warn(`⚠️ [THEME-ANALYZER] Could not verify ${file}:`, error);
          return false;
        }
      });

    return validThemeFiles;
  }

  function extractCssFromLiquidFiles(): string {
    const liquidDirectories = ['sections', 'snippets', 'layout'];
    let embeddedCss = '';

    liquidDirectories.forEach(dir => {
      if (!existsSync(dir)) return;

      const liquidFiles = glob.sync(`${dir}/**/*.liquid`);
      
      liquidFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
          
          if (styleMatches) {
            styleMatches.forEach(styleBlock => {
              const cssContent = styleBlock.replace(/<\/?style[^>]*>/gi, '').trim();
              if (cssContent) {
                // Apply same validation as regular CSS files
                const validatedCss = validateAndCleanCSS(cssContent, file);
                if (validatedCss.trim()) {
                  embeddedCss += `\n/* === Extracted from ${file} === */\n${validatedCss}\n`;
                }
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ [THEME-ANALYZER] Could not read ${file}:`, error);
        }
      });
    });

    return embeddedCss;
  }

  return {
    name: 'reactpify-theme-style-analyzer',
    
    buildStart() {
      if (!enabled) return;
      if (hasProcessedTheme) {
        console.log('✅ [THEME-ANALYZER] Already processed, skipping...');
        return;
      }
      console.log('🔍 [THEME-ANALYZER] Analyzing original theme styles...');
      
      try {
        const allCssFiles = getOriginalThemeFiles();
        const filesKey = allCssFiles.sort().join('|');
        
        if (lastProcessedFiles.includes(filesKey)) {
          console.log('✅ [THEME-ANALYZER] Files unchanged, skipping...');
          hasProcessedTheme = true;
          return;
        }

        if (allCssFiles.length === 0) {
          console.log('⚠️ [THEME-ANALYZER] No original theme CSS files found');
          console.log('📁 [THEME-ANALYZER] This is normal for new projects or minimal themes');
          
          generateCombinedStyles(`/* 
 * No original theme CSS files were found.
 * This is normal for new projects or themes that only use React components.
 */`, outputPath);
          
          console.log(`✅ [THEME-ANALYZER] Placeholder file generated: ${outputPath}`);
          hasProcessedTheme = true;
          return;
        }

        console.log(`📁 [THEME-ANALYZER] Found ${allCssFiles.length} original theme CSS files:`);
        allCssFiles.forEach(file => console.log(`   - ${file}`));

        const extractedStyles = extractThemeStyles(allCssFiles);
        
        console.log('🔍 [THEME-ANALYZER] Searching for embedded CSS in Liquid files...');
        const embeddedCss = extractCssFromLiquidFiles();
        
        const combinedCss = extractedStyles + (embeddedCss ? `\n\n/* ====== EMBEDDED LIQUID CSS ====== */\n${embeddedCss}` : '');
        
        // Ensure the final CSS is well-formed and balanced
        const balancedCss = ensureBalancedCSS(combinedCss);
        
        generateCombinedStyles(balancedCss, outputPath);
        console.log(`✅ [THEME-ANALYZER] Theme styles extracted to ${outputPath}`);
        
        if (embeddedCss) {
          console.log(`📄 [THEME-ANALYZER] Found embedded CSS in Liquid files`);
        }
        
        hasProcessedTheme = true;
        lastProcessedFiles.push(filesKey);
        
      } catch (error) {
        console.error('❌ [THEME-ANALYZER] Error analyzing styles:', error);
        
        generateCombinedStyles('/* Error analyzing theme styles */', outputPath);
        hasProcessedTheme = true;
      }
    }
  };
} 