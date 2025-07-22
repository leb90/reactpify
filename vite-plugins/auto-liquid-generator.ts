import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to auto-generate Liquid templates when React components are created
 */
export function autoLiquidGenerator() {
  return {
    name: 'auto-liquid-generator',
        buildStart() {
      console.log('🤖 Auto-liquid generator initialized');
      checkAllComponents();
    },
    
    handleHotUpdate({ file }: { file: string }) {
      if (!file.includes('src/components/') || !file.endsWith('.tsx')) {
        return;
      }

      const componentDir = path.dirname(file);
      const componentName = path.basename(file, '.tsx');
      const kebabName = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
      const liquidFileName = `section.${kebabName}.liquid`;
      const liquidFilePath = path.join(componentDir, liquidFileName);

      if (fs.existsSync(liquidFilePath)) {
        return;
      }

      if (fs.existsSync(file)) {
        generateLiquidTemplate(componentName, componentDir);
        console.log(`\n🚀 NEW COMPONENT DETECTED!`);
        console.log(`📁 ${componentName}.tsx → section.${kebabName}.liquid`);
        console.log(`✅ Auto-generated Liquid template!`);
      }
    }
  };
}

/**
 * Automatically generates a Liquid template for a React component
 */
function generateLiquidTemplate(componentName: string, componentDir: string) {
  const kebabName = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  const liquidFileName = `section.${kebabName}.liquid`;
  const liquidFilePath = path.join(componentDir, liquidFileName);

  const reactFilePath = path.join(componentDir, `${componentName}.tsx`);
  const reactContent = fs.readFileSync(reactFilePath, 'utf-8');
  
  const propsMatch = reactContent.match(/interface\s+\w*Props\s*{([^}]+)}/s) || 
                     reactContent.match(/\w+:\s*React\.FC<{([^}]+)}>/s);
  
  let detectedProps: string[] = [];
  if (propsMatch) {
    const propsString = propsMatch[1];
    detectedProps = propsString.match(/(\w+)\??:/g)?.map(prop => prop.replace(/\??:/, '')) || [];
  }

  const template = generateLiquidContent(componentName, kebabName, detectedProps);

  fs.writeFileSync(liquidFilePath, template, 'utf-8');
}

/**
 * Generates the Liquid template content
 */
function generateLiquidContent(componentName: string, kebabName: string, props: string[]): string {
  // Generate settings dynamically based on detected props
  const settings = props.map(prop => {
    if (prop.toLowerCase().includes('show') || prop.toLowerCase().includes('enable')) {
      return `    {
      "type": "checkbox",
      "id": "${prop.toLowerCase()}",
      "label": "${prop.replace(/([A-Z])/g, ' $1').trim()}",
      "default": true
    }`;
    } else if (prop.toLowerCase().includes('title') || prop.toLowerCase().includes('text')) {
      return `    {
      "type": "text",
      "id": "${prop.toLowerCase()}",
      "label": "${prop.replace(/([A-Z])/g, ' $1').trim()}",
      "default": "Sample ${prop}"
    }`;
    } else {
      return `    {
      "type": "text",
      "id": "${prop.toLowerCase()}",
      "label": "${prop.replace(/([A-Z])/g, ' $1').trim()}"
    }`;
    }
  }).join(',\n');

  return `{% comment %}
  ${componentName} Section - Auto-generated
  Liquid template that renders SSR data and prepares React hydration
{% endcomment %}

{% schema %}
{
  "name": "${componentName.replace(/([A-Z])/g, ' $1').trim()}",
  "tag": "section",
  "class": "${kebabName}-section",
  "settings": [
    {
      "type": "header",
      "content": "${componentName} Settings"
    }${settings ? ',\n' + settings : ''}
  ]
}
{% endschema %}

{%- liquid
  ${props.map(prop => `assign ${prop.toLowerCase()} = section.settings.${prop.toLowerCase()}`).join('\n  ')}
-%}

<section class="${kebabName}-section" id="${kebabName}-section-{{ section.id }}">
  
  {%- comment -%} React Component Root {%- endcomment -%}
  <div data-component-root="${componentName}" class="${kebabName}-container">
    
    {%- comment -%} JSON data for React - Script with data-section-data {%- endcomment -%}
    <script type="application/json" data-section-data>
      {
        "componentName": "${componentName}",
        ${props.map(prop => `"${prop}": {{ ${prop.toLowerCase()} | json }}`).join(',\n        ')},
        "settings": {
          ${props.map(prop => `"${prop}": {{ ${prop.toLowerCase()} | json }}`).join(',\n          ')},
          "sectionId": "{{ section.id }}"
        }
      }
    </script>

    {%- comment -%} Fallback Content - Shows if JavaScript doesn't load {%- endcomment -%}
    <div class="${kebabName}-fallback">
      <div class="fallback-content">
        <p>Loading ${componentName}...</p>
      </div>
    </div>
  </div>
</section>

  {%- comment -%} Basic CSS for Fallback {%- endcomment -%}
<style>
  .${kebabName}-section {
    margin: 2rem 0;
  }

  .${kebabName}-container {
    max-width: 100%;
  }

  /* Fallback styles - hidden when React loads */
  .${kebabName}-fallback {
    display: block;
  }

  .${kebabName}-container:has(.${kebabName}) .${kebabName}-fallback {
    display: none;
  }

  .fallback-content {
    text-align: center;
    padding: 2rem;
    background: #f5f5f5;
    border-radius: 8px;
  }

  /* Loading state */
  .${kebabName}-container[data-component-root] {
    min-height: 200px;
    position: relative;
  }

  .${kebabName}-container[data-component-root]:not(:has(.${kebabName}))::after {
    content: "Loading ${componentName}...";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #666;
    font-size: 0.9rem;
  }
</style>`;
}

/**
 * Check all existing components to generate missing Liquid templates
 */
function checkAllComponents() {
  const componentsDir = 'src/components';
  
  if (!fs.existsSync(componentsDir)) {
    return;
  }

  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.tsx')) {
        const componentDir = path.dirname(fullPath);
        const componentName = path.basename(item, '.tsx');
        const kebabName = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        const liquidFileName = `section.${kebabName}.liquid`;
        const liquidFilePath = path.join(componentDir, liquidFileName);

        if (!fs.existsSync(liquidFilePath)) {
          generateLiquidTemplate(componentName, componentDir);
          console.log(`✨ Auto-generated missing Liquid template: ${liquidFileName}`);
        }
      }
    }
  }

  scanDirectory(componentsDir);
} 