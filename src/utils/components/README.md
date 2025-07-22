# Reusable Components

This folder contains example reusable components following **Atomic Design** principles.

## 📁 Structure

```
components/
├── atoms/          # Basic building blocks
│   ├── Button.tsx  # Reusable button component
│   └── Input.tsx   # Reusable input component
└── molecules/      # Combinations of atoms
    ├── SearchBox.tsx    # Input + Button combination
    └── ProductCard.tsx  # Complete product card
```

## 🎯 Purpose

These are **example components** to show you how to structure reusable UI elements. You can:

- ✅ **Use them as-is** in your Shopify components
- ✅ **Modify them** to fit your design system
- ✅ **Delete them** and create your own
- ✅ **Add more** atoms and molecules

## 🚀 Usage

### Import individual components:
```tsx
import { Button, Input } from '@components/atoms';
import { SearchBox, ProductCard } from '@components/molecules';
```

### Or import everything:
```tsx
import { Button, Input, SearchBox, ProductCard } from '@components';
```

### Use in your main components:
```tsx
// src/components/my-search/MySearch.tsx
import { SearchBox } from '@components';

export const MySearch = ({ placeholder }) => {
  const handleSearch = (query: string) => {
    // Your search logic
    console.log('Searching for:', query);
  };

  return (
    <SearchBox
      placeholder={placeholder}
      onSearch={handleSearch}
      buttonText="Find Products"
    />
  );
};
```

## 🎨 Styling

These components use **Tailwind CSS** classes. You can:

1. **Customize Tailwind** in your `tailwind.config.js`
2. **Override classes** via the `className` prop
3. **Replace with your CSS** framework (CSS modules, styled-components, etc.)

## 🧩 Atomic Design

**Atoms** = Basic elements (Button, Input, Icon)
**Molecules** = Groups of atoms (SearchBox, ProductCard)
**Organisms** = Groups of molecules (Header, ProductGrid)
**Templates** = Page layouts
**Pages** = Specific instances

## 💡 Tips

- Keep atoms **simple and focused** on one thing
- Make molecules **composable** and flexible
- Use **TypeScript interfaces** for proper prop types
- Add **default props** for common use cases
- Include **accessibility** attributes (aria-label, etc.)

---

**Feel free to delete this folder and create your own component structure!** 