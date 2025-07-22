# Reactpify 🚀

**The easiest way to add React components to any Shopify theme.**

A super simple library that automatically generates Liquid templates from React components, making it effortless to add modern interactivity to your Shopify store without changing your existing theme structure.

[![npm version](https://img.shields.io/npm/v/reactpify.svg)](https://www.npmjs.com/package/reactpify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Why Reactpify?

**Traditional Shopify development:**
- ❌ Limited interactivity with vanilla JS
- ❌ Difficult state management
- ❌ No component reusability
- ❌ Complex to maintain interactive features

**With Reactpify:**
- ✅ **Write React components** with full state management
- ✅ **Automatic Liquid generation** - no manual template writing
- ✅ **Works with any theme** - integrate without breaking existing code
- ✅ **TypeScript support** - full type safety
- ✅ **Live development** - see changes instantly
- ✅ **SEO friendly** - server-side rendered with React hydration

## 🚀 Quick Start

### 1. Choose Your Setup Method

**📋 Option A: Use as Template (Recommended)**
```bash
# Clone Reactpify as your project base
git clone https://github.com/yourusername/reactpify.git my-shopify-theme
cd my-shopify-theme
npm install
npm run setup  # Automated setup
```

**📦 Option B: NPM Package** *(Coming Soon)*
```bash
npm install reactpify
npx reactpify init
```

**🔗 [Full setup guide with detailed steps →](GETTING_STARTED.md)**

> 💡 **Pro tip:** The setup automatically creates a `.env` file for your Shopify store configuration!

### 2. Start Development

**🚀 Quick Start (2 terminals needed):**
```bash
# Terminal 1: Auto-build React + generate Liquid
npm run watch

# Terminal 2: Shopify live preview
npm run dev        # Uses hardcoded store values
# OR
npm run env:dev    # Uses .env file variables
```

**⚡ Or use automation scripts:**
```bash
./start-dev.ps1  # Windows - opens both terminals automatically
./start-dev.sh   # Mac/Linux - opens both terminals automatically
```

**💡 Available Shopify commands:**
```bash
# Direct commands (hardcoded values)
npm run dev              # Development server
npm run shopify:push     # Deploy to main theme

# Environment-based commands (reads .env file)
npm run env:dev          # Development server
npm run env:push:dev     # Deploy to dev theme
npm run env:push:prod    # Deploy to production theme
```

### 3. Create Your First Component

Create a React component in `src/components/`:

```tsx
// src/components/product-rating/ProductRating.tsx
import React, { useState } from 'react';

interface ProductRatingProps {
  productId: string;
  initialRating?: number;
  showReviewCount?: boolean;
  allowUserRating?: boolean;
}

export const ProductRating: React.FC<ProductRatingProps> = ({
  productId,
  initialRating = 0,
  showReviewCount = true,
  allowUserRating = true
}) => {
  const [rating, setRating] = useState(initialRating);
  const [userRating, setUserRating] = useState(0);

  const handleRatingClick = (value: number) => {
    if (allowUserRating) {
      setUserRating(value);
      // Send to your rating API
      fetch('/api/rate-product', {
        method: 'POST',
        body: JSON.stringify({ productId, rating: value })
      });
    }
  };

  return (
    <div className="product-rating">
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star)}
            className={`star ${star <= (userRating || rating) ? 'active' : ''}`}
            disabled={!allowUserRating}
          >
            ⭐
          </button>
        ))}
      </div>
      {showReviewCount && (
        <span className="review-count">({Math.floor(Math.random() * 100)} reviews)</span>
      )}
    </div>
  );
};
```

### 4. Build and See the Magic! ✨

```bash
npm run build
```

**Reactpify automatically:**
- ✅ Detects your React component props
- ✅ Generates `section.product-rating.liquid` with Shopify schema
- ✅ Creates the data bridge between Liquid and React
- ✅ Registers the component in the rendering system
- ✅ Copies everything to your `sections/` folder

### 5. Use in Shopify

Your component is now available in the **Shopify Theme Editor**! 

Add it to any template or use it programmatically:

```liquid
<!-- In any .liquid file -->
<div data-component-root="ProductRating">
  <script type="application/json" data-section-data>
    {
      "productId": "{{ product.id }}",
      "initialRating": 4.5,
      "showReviewCount": true,
      "allowUserRating": true
    }
  </script>
</div>
```

## 🏗️ How It Works

### The Magic Behind the Scenes

1. **You write React** with TypeScript interfaces
2. **Reactpify scans** your component props automatically
3. **Liquid templates are generated** with proper Shopify schema
4. **Components are registered** in the rendering system
5. **Everything is copied** to the right folders

### Architecture Overview

```
Your Shopify Theme/
├── src/                          # Your React components
│   ├── components/               # Main Shopify components
│   │   └── product-rating/
│   │       ├── ProductRating.tsx # Your React component
│   │       └── section.product-rating.liquid # Auto-generated!
│   ├── utils/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── atoms/           # Basic elements (Button, Input)
│   │   │   └── molecules/       # Combined components (SearchBox, ProductCard)
│   │   ├── helpers/renderComponents.tsx # Magic happens here
│   │   └── interfaces/          # TypeScript interfaces
│   ├── redux/                    # Redux state management
│   │   ├── slices/              # Redux slices (cart, user, ui)
│   │   ├── store.ts             # Store configuration
│   │   └── hooks.ts             # Typed hooks
│   └── main.tsx                  # Auto-updated registry
├── sections/                     # Shopify sections (auto-populated)
│   └── product-rating.liquid    # Ready to use!
├── assets/
│   └── reactpify.js             # Compiled React bundle
└── layout/theme.liquid          # Include reactpify.js here
```

## 📋 Integration with Existing Themes

Reactpify works with **any existing Shopify theme**. Here's how to integrate it:

### Step 1: Add to Your Existing Theme

```bash
# In your existing theme directory
git clone https://github.com/yourusername/reactpify.git reactpify-temp
cp -r reactpify-temp/src .
cp reactpify-temp/package.json .
cp reactpify-temp/vite.config.ts .
cp reactpify-temp/tsconfig.json .
cp -r reactpify-temp/vite-plugins .
rm -rf reactpify-temp
npm install
```

### Step 2: Update Your theme.liquid

Add this line before the closing `</body>` tag:

```liquid
<!-- Add this to layout/theme.liquid -->
<script type="module" src="{{ 'reactpify.js' | asset_url }}"></script>
```

### Step 3: Start Development

```bash
npm run watch    # Terminal 1: Watch for React components
npm run dev      # Terminal 2: Shopify dev server
```

### Step 4: Deploy

```bash
npm run build && npm run shopify:push
```

That's it! Your existing theme now supports React components.

## 🎯 Development Workflow

### Daily Development

1. **Start the development environment**
   ```bash
   ./start-dev.ps1  # Windows
   ./start-dev.sh   # Mac/Linux
   ```

2. **Create React components** in `src/components/`
3. **See instant updates** in your Shopify preview
4. **Components appear automatically** in Theme Editor
5. **Deploy when ready** with `npm run shopify:push`

### Component Types

Reactpify automatically detects different prop types and creates appropriate Shopify settings:

```tsx
interface MyComponentProps {
  title: string;           // → text input
  showButton?: boolean;    // → checkbox
  buttonColor?: string;    // → text input  
  maxItems?: number;       // → number input
}
```

Generated Shopify schema:
```json
{
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title"
    },
    {
      "type": "checkbox", 
      "id": "showbutton",
      "label": "Show Button",
      "default": true
    }
  ]
}
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run watch` | 📺 Watch mode - Auto-generates Liquid templates |
| `npm run dev` | 🛍️ Shopify theme dev server |
| `npm run build` | 📦 Build for production |
| `npm run shopify:push` | 🚀 Deploy to Shopify store |
| `./start-dev.ps1` | 🪟 Automatic setup (Windows) |
| `./start-dev.sh` | 🐧 Automatic setup (Mac/Linux) |

## 🧩 Reusable Components

Reactpify includes **example components** following Atomic Design principles:

```tsx
// Use pre-built atoms and molecules
import { Button, Input, SearchBox, ProductCard } from '@components';

export const MyComponent = () => {
  return (
    <div>
      <SearchBox 
        placeholder="Search products..." 
        onSearch={(query) => console.log(query)} 
      />
      <ProductCard 
        title="Amazing Product"
        price="$29.99"
        imageUrl="/product.jpg"
        onAddToCart={() => console.log('Added!')}
      />
    </div>
  );
};
```

**Included examples:**
- **Atoms**: `Button`, `Input` - Basic building blocks
- **Molecules**: `SearchBox`, `ProductCard` - Combined components

*Feel free to modify or delete these and create your own!*

## 🔥 Redux State Management

Reactpify includes **Redux Toolkit** setup with example slices for common e-commerce needs:

```tsx
// Use Redux in your components
import { useAppSelector, useAppDispatch, addToCart } from '../../redux';

export const AddToCartButton = ({ product }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  
  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      variantId: product.variants[0].id,
      title: product.title,
      price: product.price,
      quantity: 1
    }));
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart ({cartItems.length})
    </button>
  );
};
```

**Included slices:**
- **Cart**: `addToCart`, `removeFromCart`, `updateQuantity`, `toggleCart`
- **User**: `setUser`, `addToWishlist`, `addToRecentlyViewed`
- **UI**: `setMenuOpen`, `openQuickView`, `addToast`, `setLoading`

*Redux is automatically integrated with all components via Provider!*

## 💡 Real-World Examples

### Example 1: Product Quick View Modal

```tsx
// src/components/quick-view/QuickView.tsx
export const QuickView = ({ productHandle, showPrice = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState(null);

  const loadProduct = async () => {
    const response = await fetch(`/products/${productHandle}.js`);
    setProduct(await response.json());
  };

  return (
    <>
      <button onClick={() => { setIsOpen(true); loadProduct(); }}>
        Quick View
      </button>
      {isOpen && (
        <div className="modal">
          {/* Your modal content */}
        </div>
      )}
    </>
  );
};
```

**Usage in any product card:**
```liquid
<div data-component-root="QuickView">
  <script type="application/json" data-section-data>
    {
      "productHandle": "{{ product.handle }}",
      "showPrice": true
    }
  </script>
</div>
```

### Example 2: Live Search with Filters

```tsx
// src/components/search/LiveSearch.tsx
export const LiveSearch = ({ collectionHandle, showFilters = true }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({});

  const search = async () => {
    // Implement your search logic
    const response = await fetch(`/search?q=${query}&collection=${collectionHandle}`);
    setResults(await response.json());
  };

  return (
    <div className="live-search">
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      {/* Results and filters */}
    </div>
  );
};
```

### Example 3: Shopping Cart with Real-time Updates

```tsx
// src/components/cart/MiniCart.tsx
export const MiniCart = ({ showItemCount = true }) => {
  const [cart, setCart] = useState({ items: [], total_price: 0 });

  const addToCart = async (variantId: string, quantity: number) => {
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });
    
    // Refresh cart
    const response = await fetch('/cart.js');
    setCart(await response.json());
  };

  return (
    <div className="mini-cart">
      {showItemCount && <span>({cart.items.length})</span>}
      {/* Cart dropdown */}
    </div>
  );
};
```

## ⚙️ Configuration

### Shopify CLI Setup

Make sure you have Shopify CLI installed:

```bash
npm install -g @shopify/cli @shopify/theme
```

### Environment Setup

Update `package.json` with your store details:

```json
{
  "scripts": {
    "dev": "shopify theme dev --store=your-store.myshopify.com",
    "shopify:push": "npm run build && shopify theme push --store=your-store.myshopify.com"
  }
}
```

### TypeScript Configuration

Reactpify includes full TypeScript support. Extend types as needed:

```typescript
// src/utils/interfaces/custom.ts
export interface CustomComponentProps {
  // Your custom interfaces
}
```

## 🚧 Advanced Usage

### Custom Rendering Logic

Override the default rendering for specific components:

```tsx
// src/utils/helpers/customRenderer.tsx
import { registerComponent } from './renderComponents';
import { MyAdvancedComponent } from '../components/MyAdvancedComponent';

// Custom registration with initialization logic
registerComponent('MyAdvancedComponent', (props) => {
  // Custom initialization
  return <MyAdvancedComponent {...props} />;
});
```

### Global State Management

Add Redux or Zustand for complex state:

```bash
npm install @reduxjs/toolkit react-redux
```

```tsx
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Your reducers
  }
});
```

### Custom Liquid Generation

Extend the auto-generation for complex use cases:

```typescript
// vite-plugins/custom-liquid-generator.ts
export function customLiquidGenerator() {
  // Your custom generation logic
}
```

## 🐛 Troubleshooting

### Common Issues

**Components not appearing in Theme Editor?**
- Run `npm run build` to regenerate Liquid files
- Check that `reactpify.js` is loaded in your theme.liquid

**TypeScript errors?**
- Ensure all props are properly typed in interfaces
- Check `tsconfig.json` includes all necessary paths

**Styles not working?**
- Add your CSS to `src/styles/` or use CSS-in-JS
- Include stylesheets in your component or globally

**Development server not starting?**
- Verify Shopify CLI is installed and authenticated
- Check your store URL in package.json scripts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🚀 Deployment & Production

### Development Workflow
```bash
# Start development (2 terminals)
npm run watch    # Auto-builds React + generates Liquid
npm run dev      # Shopify live preview with hot reload

# Use automation scripts
./start-dev.ps1  # Windows
./start-dev.sh   # Mac/Linux
```

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to development theme
npm run shopify:push:dev

# Deploy to production theme  
npm run shopify:push:prod

# Deploy to main theme
npm run shopify:push
```

### Environment Configuration
```bash
# Edit .env file with your store details
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_DEV_THEME_ID=123456789
SHOPIFY_PROD_THEME_ID=987654321
```

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Deploy to Shopify
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: shopify theme push
        env:
          SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.SHOPIFY_TOKEN }}
```

### Publishing as NPM Package *(Future)*

Want to publish your own version?

```bash
# Update package.json with your details
npm version patch
npm publish

# Create CLI tool for users
npm link
npx your-reactpify-cli init
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📚 **Documentation**: [Full documentation](https://reactpify.dev)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/reactpify/issues)
- 💬 **Discord**: [Join our community](https://discord.gg/reactpify)
- 📧 **Email**: support@reactpify.dev

## 🌟 Show Your Support

If Reactpify helps you build better Shopify stores, please give it a ⭐ on GitHub!

---

**Built to make Shopify + React development effortless** 💙

### What's Next?

- 🔮 **CLI tool** for easier project initialization
- 🎨 **Component library** with pre-built Shopify components  
- 🚀 **Performance optimizations** for larger stores
- 📱 **Mobile-specific components** and optimizations

[Get Started](#quick-start) | [Examples](#real-world-examples) | [Contributing](#contributing)
