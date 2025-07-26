import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../redux';

type ComponentType = React.ComponentType<any>;

interface ComponentRegistry {
  [key: string]: ComponentType;
}

const componentRegistry: ComponentRegistry = {};

/**
 * Registra un componente en el sistema
 */
export function registerComponent(name: string, component: ComponentType) {
  componentRegistry[name] = component;
  console.log(`🔧 Component registered: ${name}`);
}

/**
 * Obtiene el registro completo de componentes
 */
export function getComponentRegistry(): ComponentRegistry {
  return componentRegistry;
}

/**
 * Maneja la hidratación de un componente específico
 */
function hydrateComponent(container: HTMLElement, componentName: string, props: any) {
  const Component = componentRegistry[componentName];
  
  if (!Component) {
    console.error(`❌ Component not found: ${componentName}`);
    container.innerHTML = `
      <div class="reactpify-error">
        <strong>Error:</strong> Component "${componentName}" not found
      </div>
    `;
    return;
  }

  try {
    // Marcar como loading
    container.classList.add('reactpify-loading');
    
    // Crear root y renderizar
    const root = createRoot(container);
    
    root.render(
      <Provider store={store}>
        <div className="reactpify-component">
          <Component {...props} />
        </div>
      </Provider>
    );

    // Marcar como hidratado después del render
    setTimeout(() => {
      container.classList.remove('reactpify-loading');
      container.classList.add('reactpify-hydrated');
      
      // Evento personalizado para notificar hidratación
      const event = new CustomEvent('reactpify:hydrated', {
        detail: { componentName, props }
      });
      container.dispatchEvent(event);
      
      console.log(`✅ Component hydrated: ${componentName}`);
    }, 0);

  } catch (error) {
    console.error(`❌ Error hydrating component ${componentName}:`, error);
    container.classList.remove('reactpify-loading');
    container.classList.add('reactpify-error');
    container.innerHTML = `
      <div class="reactpify-error">
        <strong>Hydration Error:</strong> ${componentName}<br>
        <small>${error instanceof Error ? error.message : 'Unknown error'}</small>
      </div>
    `;
  }
}

/**
 * Inicializa el sistema de renderizado
 */
export function initRenderSystem() {
  console.log('🚀 Initializing Reactpify render system...');
  
  // Detectar modo debug
  const isDebugMode = window.location.search.includes('reactpify-debug') || 
                     localStorage.getItem('reactpify-debug') === 'true';
  
  if (isDebugMode) {
    document.documentElement.setAttribute('data-reactpify-debug', 'true');
    console.log('🐛 Debug mode enabled');
  }

  // Función para procesar componentes
  function processComponents() {
    const components = document.querySelectorAll('[data-component-root]');
    
    if (components.length === 0) {
      console.log('ℹ️ No components found on this page');
      return;
    }

    console.log(`🔍 Found ${components.length} component(s) to hydrate`);

    components.forEach((container) => {
      const componentName = container.getAttribute('data-component-root');
      
      if (!componentName) {
        console.warn('⚠️ Component container missing data-component-root attribute', container);
        return;
      }

      // Verificar si ya está hidratado
      if (container.classList.contains('reactpify-hydrated')) {
        console.log(`⏭️ Component already hydrated: ${componentName}`);
        return;
      }

      // Buscar datos del componente
      const dataScript = container.querySelector('script[data-section-data]');
      let props = {};

      if (dataScript) {
        try {
          props = JSON.parse(dataScript.textContent || '{}');
          console.log(`📄 Props loaded for ${componentName}:`, props);
        } catch (error) {
          console.warn(`⚠️ Failed to parse props for ${componentName}:`, error);
        }
      } else {
        console.log(`ℹ️ No props found for ${componentName}, using defaults`);
      }

      // Hidratar el componente
      hydrateComponent(container as HTMLElement, componentName, props);
    });
  }

  // Procesar componentes existentes
  processComponents();

  // Observer para componentes dinámicos (ej: AJAX loads)
  const observer = new MutationObserver((mutations) => {
    let hasNewComponents = false;
    
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Verificar si es un componente o contiene componentes
          if (element.hasAttribute?.('data-component-root') || 
              element.querySelector?.('[data-component-root]')) {
            hasNewComponents = true;
          }
        }
      });
    });

    if (hasNewComponents) {
      console.log('🔄 New components detected, processing...');
      setTimeout(processComponents, 0);
    }
  });

  // Observar cambios en el DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Event listeners globales
  window.addEventListener('reactpify:refresh', processComponents);
  
  // API global para debugging
  if (isDebugMode) {
    (window as any).reactpify = {
      registry: componentRegistry,
      refresh: processComponents,
      hydrate: hydrateComponent,
      enableDebug: () => {
        document.documentElement.setAttribute('data-reactpify-debug', 'true');
        localStorage.setItem('reactpify-debug', 'true');
      },
      disableDebug: () => {
        document.documentElement.removeAttribute('data-reactpify-debug');
        localStorage.removeItem('reactpify-debug');
      }
    };
  }

  console.log('✅ Reactpify render system initialized');
  console.log(`📦 ${Object.keys(componentRegistry).length} component(s) registered:`, Object.keys(componentRegistry));
} 