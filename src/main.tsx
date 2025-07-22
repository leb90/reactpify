import React from 'react';
import { registerComponent, initRenderSystem } from './utils/helpers/renderComponents';

// Auto-generated imports
import { CartSummary } from './components/cart-summary/CartSummary';
import { CountdownTimer } from './components/countdown-timer/CountdownTimer';
import { NewsletterSignup } from './components/newsletter-signup/NewsletterSignup';
import { ProductGallery } from './components/product-gallery/ProductGallery';
import { ProductQuickView } from './components/product-quick-view/ProductQuickView';
import { WelcomeBanner } from './components/welcome-banner/WelcomeBanner';

/**
 * Main entry point
 * Registers all React components and initializes the rendering system
 */

console.log('🚀 Initializing Reactpify');

// Auto-generated component registrations
registerComponent('CartSummary', CartSummary);
registerComponent('CountdownTimer', CountdownTimer);
registerComponent('NewsletterSignup', NewsletterSignup);
registerComponent('ProductGallery', ProductGallery);
registerComponent('ProductQuickView', ProductQuickView);
registerComponent('WelcomeBanner', WelcomeBanner);

initRenderSystem();

export { getComponentRegistry } from './utils/helpers/renderComponents';

console.log('✅ Reactpify initialized successfully');