import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../redux/store';

/**
 * Central rendering system
 * 
 * Finds elements with data-component-root, extracts JSON from data-section-data script
 * and renders the corresponding React component.
 */

interface ComponentData {
  [key: string]: any;
}

interface ComponentRegistry {
  [componentName: string]: React.ComponentType<any>;
}

let componentRegistry: ComponentRegistry = {};

/**
 * Register a component in the global registry
 */
export const registerComponent = (name: string, component: React.ComponentType<any>) => {
  componentRegistry[name] = component;
};

/**
 * Render a specific component
 * @param rootElementSelector - CSS selector of the container
 * @param componentName - Name of the component to render
 * @param Component - React component (optional, can be obtained from registry)
 */
export const renderComponent = <T extends ComponentData>(
  rootElementSelector: string,
  componentName?: string,
  Component?: React.ComponentType<T>
): void => {
  const rootElements = document.querySelectorAll(rootElementSelector);
  
  rootElements.forEach((rootElement) => {
    try {
      const dataScript = rootElement.querySelector('[data-section-data]') as HTMLScriptElement;
      
      if (!dataScript || !dataScript.textContent) {
        console.warn(`No data found for component in: ${rootElementSelector}`);
        return;
      }

      let sectionData: T;
      try {
        sectionData = JSON.parse(dataScript.textContent);
      } catch (error) {
        console.error('Error parsing component data:', error);
        return;
      }

      let ComponentToRender = Component;
      
      if (!ComponentToRender && componentName) {
        ComponentToRender = componentRegistry[componentName];
      }
      
      if (!ComponentToRender && sectionData.componentName) {
        ComponentToRender = componentRegistry[sectionData.componentName];
      }

      if (!ComponentToRender) {
        console.error(`Component not found: ${componentName || sectionData.componentName || 'unknown'}`);
        return;
      }

      const root = createRoot(rootElement);
      root.render(
        <Provider store={store}>
          <ComponentToRender {...sectionData} />
        </Provider>
      );
      
      console.log(`✅ Rendered component: ${componentName || sectionData.componentName}`);
      
    } catch (error) {
      console.error(`Error rendering component in ${rootElementSelector}:`, error);
    }
  });
};

/**
 * Auto-render all components found on the page
 */
export const autoRenderComponents = (): void => {
  const componentRoots = document.querySelectorAll('[data-component-root]');
  
  componentRoots.forEach((element) => {
    const componentName = element.getAttribute('data-component-root');
    if (componentName && componentRegistry[componentName]) {
      renderComponent(`[data-component-root="${componentName}"]`, componentName);
    }
  });
};

/**
 * Initialize the rendering system
 */
export const initRenderSystem = (): void => {
  console.log('🚀 Initializing React render system...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRenderComponents);
  } else {
    autoRenderComponents();
  }
  
  window.addEventListener('popstate', autoRenderComponents);
  
  console.log(`📦 Registered components: ${Object.keys(componentRegistry).join(', ')}`);
};

/**
 * Get the component registry (for debugging)
 */
export const getComponentRegistry = (): ComponentRegistry => {
  return { ...componentRegistry };
};

/**
 * Clear the registry (useful for testing)
 */
export const clearComponentRegistry = (): void => {
  componentRegistry = {};
}; 