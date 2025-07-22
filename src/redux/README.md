# Redux State Management

This folder contains **Redux state management** configuration using **Redux Toolkit**.

## 📁 Structure

```
redux/
├── store.ts              # Main store configuration
├── hooks.ts              # Typed hooks for React-Redux
├── slices/               # Redux slices (state + reducers)
│   ├── cartSlice.ts      # Shopping cart state
│   ├── userSlice.ts      # User authentication & profile
│   └── uiSlice.ts        # UI state (modals, loading, etc.)
└── index.ts              # Central exports
```

## 🎯 Purpose

These are **example Redux slices** to show you how to manage global state in Shopify stores. You can:

- ✅ **Use them as-is** for common e-commerce needs
- ✅ **Modify them** to fit your business logic
- ✅ **Delete them** and create your own slices
- ✅ **Add more** slices for additional features

## 🚀 Usage

### Import what you need:
```tsx
import { useAppSelector, useAppDispatch } from '@redux';
import { addToCart, removeFromCart } from '@redux';
```

### Use in your components:
```tsx
// src/components/add-to-cart/AddToCart.tsx
import { useAppSelector, useAppDispatch, addToCart } from '@redux';

export const AddToCart = ({ product }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  
  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      variantId: product.variants[0].id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.featured_image
    }));
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart ({cartItems.length})
    </button>
  );
};
```

## 🛍️ Cart Slice

Manages shopping cart state with actions like:
- `addToCart` - Add product to cart
- `removeFromCart` - Remove product from cart
- `updateQuantity` - Change item quantity
- `toggleCart` - Open/close cart drawer
- `clearCart` - Empty the cart

## 👤 User Slice  

Manages user data and authentication:
- `setUser` - Login user
- `clearUser` - Logout user
- `addToWishlist` - Add to wishlist
- `addToRecentlyViewed` - Track viewed products

## 🎨 UI Slice

Manages interface state:
- `setMenuOpen` - Toggle mobile menu
- `openQuickView` - Open product quick view
- `addToast` - Show notifications
- `setLoading` - Global loading states

## 🔧 Integration

Redux is **automatically integrated** with the Reactpify render system. All your components get access to the Redux store via `Provider`.

## 💾 Persistence

You can add Redux Persist to save cart/user data:

```bash
npm install redux-persist
```

Then configure in your store for persistent cart across sessions.

## 🔍 DevTools

Install Redux DevTools browser extension to debug state changes in development.

## 💡 Tips

- Use **Redux Toolkit** for simpler slice creation
- Keep **side effects** in middleware or components
- Use **TypeScript** for type-safe state management  
- **Normalize data** for complex relationships
- **Memoize selectors** for performance with `createSelector`

---

**Feel free to delete this folder and use your preferred state management solution!** 