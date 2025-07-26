import { Plugin } from 'vite';
import { promises as fs } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fragmentInjection } from '../vite-fragment-injection';

interface ComponentAnalysis {
  componentName: string;
  props: Array<{
    name: string;
    type: string;
    defaultValue?: string;
    required: boolean;
  }>;
  layouts?: string[];
  themes?: string[];
}

export function autoLiquidSync(): Plugin {
  return {
    name: 'auto-liquid-sync',
    buildStart() {
      console.log('🔄 Auto Liquid Sync: Plugin started');
    },
    
    async handleHotUpdate({ file, server }) {
      // Only process .tsx component files
      if (!file.includes('src/components/') || !file.endsWith('.tsx')) {
        return;
      }

      const componentDir = dirname(file);
      const componentName = basename(componentDir);
      
      console.log(`🔄 [AUTO-SYNC] Change detected in: ${componentName}`);
      console.log(`🔄 [AUTO-SYNC] File: ${file}`);
      
      try {
        // Analyze React component
        const analysis = await analyzeReactComponent(file);
        console.log(`🔍 [AUTO-SYNC] Analysis completed:`, {
          component: analysis.componentName,
          props: analysis.props.length,
          layouts: analysis.layouts,
          themes: analysis.themes
        });
        
        // Generate corresponding liquid
        const liquidContent = await generateLiquidFromAnalysis(analysis);
        
        // Write liquid file to src/components/
        const liquidPath = resolve(componentDir, `section.${componentName}.liquid`);
        await fs.writeFile(liquidPath, liquidContent);
        console.log(`✅ [AUTO-SYNC] Liquid source updated: ${liquidPath}`);
        
        // Process fragments and inject
        const processedContent = await fragmentInjection(liquidContent);
        
        // Copy to sections/
        const sectionsPath = resolve('sections', `${componentName}.liquid`);
        await fs.writeFile(sectionsPath, processedContent);
        console.log(`✅ [AUTO-SYNC] Liquid sections updated: ${sectionsPath}`);
        
        // Invalidate in development server
        if (server) {
          const module = server.moduleGraph.getModuleById(file);
          if (module) {
            server.reloadModule(module);
          }
        }
        
      } catch (error) {
        console.error(`❌ [AUTO-SYNC] Error syncing ${componentName}:`, error);
      }
    },

    // Also detect changes during build
    buildEnd() {
      console.log('🔄 [AUTO-SYNC] Build completed');
    }
  };
}

async function analyzeReactComponent(filePath: string): Promise<ComponentAnalysis> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract component name
  const componentNameMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
  const componentName = componentNameMatch?.[1] || basename(dirname(filePath));
  
  // Extract props interface
  const propsInterfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
  const props: ComponentAnalysis['props'] = [];
  
  if (propsInterfaceMatch) {
    const propsContent = propsInterfaceMatch[1];
    
    // Parse each prop
    const propMatches = propsContent.matchAll(/(\w+)\??:\s*([^;]+);?/g);
    
    for (const match of propMatches) {
      const [, name, type] = match;
      const isOptional = match[0].includes('?:');
      
      // Extract default value from destructuring - IMPROVED
      const defaultValuePattern = new RegExp(`${name}\\s*=\\s*([^,}]+)`, 'g');
      const defaultValueMatch = content.match(defaultValuePattern);
      let defaultValue = defaultValueMatch?.[0]?.split('=')[1]?.trim();
      
      // Clean default value
      if (defaultValue) {
        defaultValue = defaultValue.replace(/['"`]/g, '');
      }
      
      props.push({
        name,
        type: type.trim(),
        defaultValue,
        required: !isOptional
      });
    }
  }
  
  // Detect available layouts
  const layoutsMatch = content.match(/if\s*\(\s*layout\s*===?\s*['"]([\w-]+)['"]/g);
  const layouts = layoutsMatch?.map(match => 
    match.match(/['"]([\w-]+)['"]/)?.[1]
  ).filter((layout): layout is string => Boolean(layout)) || ['card'];
  
  // Detect available themes
  const themesMatch = content.match(/themeColors\s*=\s*{([^}]+)}/s);
  const themes = themesMatch?.[1]
    ?.match(/(\w+):/g)
    ?.map(t => t.replace(':', ''))
    || ['blue'];
  
  return {
    componentName,
    props,
    layouts,
    themes
  };
}

async function generateLiquidFromAnalysis(analysis: ComponentAnalysis): Promise<string> {
  const { componentName, props, layouts = ['card'], themes = ['blue'] } = analysis;
  
  // Generate settings structure for schema
  const settings = props.map(prop => {
    const setting: any = {
      type: mapTypeToLiquid(prop.type),
      id: camelToSnake(prop.name),
      label: camelToTitle(prop.name)
    };
    
    if (prop.defaultValue) {
      setting.default = cleanDefaultValue(prop.defaultValue);
    }
    
    // Special configurations based on type
    if (prop.name === 'layout' && layouts.length > 1) {
      setting.type = 'select';
      setting.options = layouts.map(layout => ({
        value: layout,
        label: camelToTitle(layout)
      }));
    }
    
    if (prop.name === 'theme' && themes.length > 1) {
      setting.type = 'select';
      setting.options = themes.map(theme => ({
        value: theme,
        label: camelToTitle(theme)
      }));
    }
    
    return setting;
  });
  
  // Generate basic fallback HTML based on current props
  const fallbackHTML = generateFallbackHTML(analysis);
  
  // Generate data script with current props
  const dataScript = props.map(prop => {
    const snakeName = camelToSnake(prop.name);
    const defaultVal = prop.defaultValue || getDefaultByType(prop.type);
    return `        "${prop.name}": {{ section.settings.${snakeName} | default: ${JSON.stringify(defaultVal)} | json }}`;
  }).join(',\n');
  
  return `<section 
  class="${camelToKebab(componentName)}-section color-{{ section.settings.color_scheme }}"
  style="padding-top: {{ section.settings.padding_top }}px; padding-bottom: {{ section.settings.padding_bottom }}px;"
>
  <div data-component-root="${componentName}">
    {% comment %} HTML shell for SEO - accessible without JavaScript {% endcomment %}
    
${fallbackHTML}

    {% comment %} React component data - will be consumed by JavaScript {% endcomment %}
    <script type='application/json' data-section-data>
      {
${dataScript}
      }
    </script>
  </div>
</section>

{% schema %}
{
  "name": "${camelToTitle(componentName)}",
  "tag": "section",
  "class": "section",
  "settings": [
${settings.map(setting => '    ' + JSON.stringify(setting)).join(',\n')},
    FRAGMENT.color-scheme,
    FRAGMENT.section-spacing
  ],
  "presets": [
    {
      "name": "${camelToTitle(componentName)}",
      "category": "Auto Generated"
    }
  ]
}
{% endschema %}`;
}

function generateFallbackHTML(analysis: ComponentAnalysis): string {
  const { componentName, props, layouts = ['card'] } = analysis;
  
  // Find main props
  const titleProp = props.find(p => p.name === 'title');
  const subtitleProp = props.find(p => p.name === 'subtitle');
  const buttonTextProp = props.find(p => p.name === 'buttonText');
  const showButtonProp = props.find(p => p.name === 'showButton');
  const testModeProp = props.find(p => p.name === 'testMode');
  
  const titleDefault = titleProp?.defaultValue || camelToTitle(componentName);
  const subtitleDefault = subtitleProp?.defaultValue || `${camelToTitle(componentName)} component`;
  const buttonDefault = buttonTextProp?.defaultValue || 'Action Button';
  
  if (layouts.includes('hero')) {
    return `    {% if section.settings.layout == 'hero' %}
      <div class="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-20 px-4" data-fallback>
        <div class="max-w-5xl mx-auto text-center">
          <div class="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white p-16 md:p-24">
            <h1 class="text-5xl md:text-7xl font-black mb-8">
              {{ section.settings.title | default: '${titleDefault}' }}
            </h1>
            {% if section.settings.subtitle %}
              <p class="text-xl md:text-3xl opacity-95 mb-12">{{ section.settings.subtitle }}</p>
            {% endif %}
            {% if section.settings.show_button %}
              <button class="px-10 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-lg font-semibold">
                {{ section.settings.button_text | default: '${buttonDefault}' }}
              </button>
            {% endif %}
          </div>
        </div>
      </div>
    {% else %}
      <div class="max-w-lg mx-auto" data-fallback>
        <div class="p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white text-center">
          <h2 class="text-3xl font-bold mb-4">{{ section.settings.title | default: '${titleDefault}' }}</h2>
          {% if section.settings.subtitle %}
            <p class="text-lg opacity-90 mb-6">{{ section.settings.subtitle }}</p>
          {% endif %}
          
          ${testModeProp ? `
          {% if section.settings.test_mode %}
            <div class="mb-4 p-2 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
              <span class="text-yellow-300 text-xs font-bold">🧪 TEST MODE ACTIVE</span>
            </div>
          {% endif %}` : ''}
          
          {% if section.settings.show_button %}
            <button class="w-full px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30">
              {{ section.settings.button_text | default: '${buttonDefault}' }}
            </button>
          {% endif %}
        </div>
      </div>
    {% endif %}`;
  }
  
  return `    <div class="max-w-lg mx-auto" data-fallback>
      <div class="p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white text-center">
        <h2 class="text-3xl font-bold mb-4">{{ section.settings.title | default: '${titleDefault}' }}</h2>
        {% if section.settings.subtitle %}
          <p class="text-lg opacity-90 mb-6">{{ section.settings.subtitle }}</p>
        {% endif %}
        
        ${testModeProp ? `
        {% if section.settings.test_mode %}
          <div class="mb-4 p-2 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
            <span class="text-yellow-300 text-xs font-bold">🧪 TEST MODE ACTIVE</span>
          </div>
        {% endif %}` : ''}
        
        {% if section.settings.show_button %}
          <button class="w-full px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30">
            {{ section.settings.button_text | default: '${buttonDefault}' }}
          </button>
        {% endif %}
      </div>
    </div>`;
}

// Utility functions
function mapTypeToLiquid(tsType: string): string {
  if (tsType.includes('string')) return 'text';
  if (tsType.includes('number')) return 'range';
  if (tsType.includes('boolean')) return 'checkbox';
  if (tsType.includes('|') && tsType.includes("'")) return 'select';
  return 'text';
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).toLowerCase();
}

function camelToTitle(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

function cleanDefaultValue(value: string): any {
  const cleaned = value.replace(/['"]/g, '');
  if (cleaned === 'true' || cleaned === 'false') return cleaned === 'true';
  if (!isNaN(Number(cleaned))) return Number(cleaned);
  return cleaned;
}

function getDefaultByType(type: string): any {
  if (type.includes('string')) return '';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return true;
  return '';
} 