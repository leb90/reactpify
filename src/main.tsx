import React from 'react';
import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

// Auto-generated imports
import { TestComponent } from './components/test-component/TestComponent';

/**
 * Main entry point
 * Registers all React components and initializes the rendering system
 */

console.log('🚀 Initializing Reactpify');

// Auto-generated component registrations
registerComponent('TestComponent', TestComponent);

initRenderSystem();

export { getComponentRegistry } from './utils/helpers/renderComponents';

console.log('✅ Reactpify initialized successfully');