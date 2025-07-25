# 🚀 Reactpify

**The easiest way to add React components to any Shopify theme**

[![npm version](https://img.shields.io/npm/v/reactpifyjs.svg)](https://www.npmjs.com/package/reactpifyjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/reactpifyjs.svg)](https://www.npmjs.com/package/reactpifyjs)

Reactpify seamlessly integrates **React components** into **Shopify themes** with intelligent **Liquid auto-generation**, **Tailwind CSS**, and **Vite** for the best developer experience.

## ✨ Features

- 🎯 **Zero Configuration** - Works out of the box with any Shopify theme
- 🤖 **Auto-Generation** - Intelligent Liquid template creation from React props
- 🛡️ **Manual Edit Detection** - Preserves your custom Liquid code automatically
- 🎨 **Tailwind CSS** - Built-in styling with component isolation
- ⚡ **Vite Powered** - Lightning-fast development with HMR
- 🔄 **Redux Ready** - State management included
- 🛍️ **Metaobject Support** - Native Shopify dynamic content integration
- 📱 **Responsive** - Mobile-first design principles

## 🚀 Quick Start

### Installation

```bash
npm install reactpifyjs
# or
yarn add reactpifyjs
```

### Setup

1. **Initialize in your Shopify theme:**

```bash
npx reactpifyjs init
```

2. **Start development:**

```bash
npm run dev
```

3. **Create your first component:**

```bash
npx reactpifyjs create welcome-banner
```

## 📁 Project Structure

```
your-shopify-theme/
├── src/
│   ├── components/
│   │   ├── welcome-banner/
│   │   │   ├── WelcomeBanner.tsx      # React component
│   │   │   └── section.welcome-banner.liquid  # Auto-generated
│   ├── main.tsx                       # Entry point
│   └── styles/
│       └── main.css                   # Tailwind CSS
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind configuration
└── assets/
    ├── reactpify.js                   # Built bundle
    └── reactpify.css                  # Built styles
```

## 🎯 Creating Components

### 1. React Component Example

```tsx
// src/components/hero-banner/HeroBanner.tsx
import React from 'react';

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonUrl?: string;
  backgroundColor?: 'primary' | 'secondary' | 'accent';
  showVideo?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title = 'Welcome to Our Store',
  subtitle,
  buttonText = 'Shop Now',
  buttonUrl = '#',
  backgroundColor = 'primary',
  showVideo = false
}) => {
  return (
    <div className={`hero-banner bg-${backgroundColor}-600 text-white p-8`}>
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      {subtitle && <p className="text-xl mb-6">{subtitle}</p>}
      
      <a 
        href={buttonUrl}
        className="btn-primary"
      >
        {buttonText}
      </a>
      
      {showVideo && (
        <div className="mt-8">
          <video autoPlay muted loop className="w-full rounded-lg">
            <source src="/path/to/video.mp4" type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );
};
```

### 2. Auto-Generated Liquid

Reactpify automatically creates this Liquid section:

```liquid
<!-- Auto-generated section with Shopify admin settings -->
<section class="hero-banner-section" data-component-root="HeroBanner">
  <!-- Fallback content for SEO/loading -->
  <div class="hero-fallback">
    <h1>{{ section.settings.title }}</h1>
    <p>{{ section.settings.subtitle }}</p>
    <a href="{{ section.settings.buttonUrl }}">{{ section.settings.buttonText }}</a>
  </div>
  
  <!-- React component data -->
  <script type="application/json" data-section-data>
    {
      "title": {{ section.settings.title | json }},
      "subtitle": {{ section.settings.subtitle | json }},
      "buttonText": {{ section.settings.buttonText | json }},
      "buttonUrl": {{ section.settings.buttonUrl | json }},
      "backgroundColor": {{ section.settings.backgroundColor | json }},
      "showVideo": {{ section.settings.showVideo }}
    }
  </script>
</section>

{% schema %}
{
  "name": "Hero Banner",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Welcome to Our Store"
    },
    {
      "type": "textarea",
      "id": "subtitle", 
      "label": "Subtitle"
    },
    {
      "type": "text",
      "id": "buttonText",
      "label": "Button Text",
      "default": "Shop Now"
    },
    {
      "type": "url",
      "id": "buttonUrl",
      "label": "Button URL"
    },
    {
      "type": "select",
      "id": "backgroundColor",
      "label": "Background Color",
      "options": [
        {"value": "primary", "label": "Primary"},
        {"value": "secondary", "label": "Secondary"},
        {"value": "accent", "label": "Accent"}
      ],
      "default": "primary"
    },
    {
      "type": "checkbox",
      "id": "showVideo",
      "label": "Show Video",
      "default": false
    }
  ],
  "presets": [
    {
      "name": "Hero Banner",
      "category": "Banners"
    }
  ]
}
{% endschema %}
```

## 🛡️ Manual Edit Protection

Reactpify intelligently detects manual edits and preserves them:

```liquid
{% comment %} MANUAL EDIT {% endcomment %}
<!-- This file won't be auto-regenerated -->

<section class="custom-hero">
  <!-- Your custom Liquid code here -->
  {% for product in collections.featured.products limit: 3 %}
    <div>{{ product.title }}</div>
  {% endfor %}
</section>
```

## ⚙️ Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { autoLiquidGenerator } from 'reactpifyjs/vite-plugins/auto-liquid-generator';
import { autoComponentRegistry } from 'reactpifyjs/vite-plugins/auto-component-registry';

export default defineConfig({
  plugins: [
    react(),
    autoLiquidGenerator(),
    autoComponentRegistry()
  ],
  // ... other config
});
```

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./sections/**/*.liquid",
    "./snippets/**/*.liquid"
  ],
  corePlugins: {
    preflight: false, // Prevents conflicts with theme CSS
  },
  important: '[data-component-root]', // Scopes to components only
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
};
```

## 🔄 Development Workflow

### Watch Mode
```bash
npm run watch
```
- Auto-regenerates Liquid templates
- Preserves manual edits
- Hot-reloads React components

### Build for Production
```bash
npm run build
```

### Deploy to Shopify
```bash
npm run shopify:push
```

## 🛍️ Metaobject Integration

Work with Shopify metaobjects seamlessly:

```tsx
interface ProductFeatureProps {
  metaobject: {
    title: string;
    description: string;
    features: string[];
    image: string;
  };
}

export const ProductFeature: React.FC<ProductFeatureProps> = ({ metaobject }) => {
  return (
    <div className="product-feature">
      <img src={metaobject.image} alt={metaobject.title} />
      <h3>{metaobject.title}</h3>
      <p>{metaobject.description}</p>
      <ul>
        {metaobject.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
    </div>
  );
};
```

## 📚 CLI Commands

```bash
# Initialize Reactpify in existing theme
npx reactpifyjs init

# Create new component
npx reactpifyjs create <component-name>

# Generate Liquid from React component
npx reactpifyjs generate <component-name>

# Clean generated files
npx reactpifyjs clean
```

## 🎨 Styling Best Practices

### Component Isolation

```css
/* Components are automatically wrapped */
.reactpify-component {
  isolation: isolate;
  /* Your component styles won't leak */
}
```

### Tailwind Usage

```tsx
// ✅ Good - Scoped to component
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Content
</div>

// ✅ Good - Custom utility classes
<div className="btn-primary card-gradient">
  Content  
</div>
```

## 🚨 Troubleshooting

### Common Issues

**CSS not loading:**
```html
<!-- Ensure this is in your theme.liquid -->
<link rel="stylesheet" href="{{ 'reactpify.css' | asset_url }}">
<script type="module" src="{{ 'reactpify.js' | asset_url }}"></script>
```

**Component not rendering:**
- Check browser console for errors
- Verify component is registered in `main.tsx`
- Ensure `data-component-root` attribute matches component name

**Build errors:**
- Run `npm run clean` and rebuild
- Check for TypeScript errors
- Verify all imports are correct

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Reactpify](https://github.com/reactpify)

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Blazing fast build tool
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Shopify](https://shopify.dev/) - Ecommerce platform

---

**Made with ❤️ for the Shopify community**

[⭐ Star this repo](https://github.com/leb90/reactpify) if you find it helpful!
