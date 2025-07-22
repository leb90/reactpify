# 🚀 Getting Started with Reactpify

Choose how you want to use Reactpify in your project:

## 🎯 Option 1: Use as Template (Recommended)

**Best for:** Starting a new Shopify theme with React or adding React to an existing theme.

### Step 1: Clone the Repository
```bash
# Clone Reactpify to your project
git clone https://github.com/yourusername/reactpify.git my-shopify-theme
cd my-shopify-theme

# Remove git history and start fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit with Reactpify"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure for Your Store
```bash
# Login to Shopify CLI (if not already)
shopify auth login

# Connect to your store
shopify theme init

# Or connect to existing theme
shopify theme pull --store=your-store.myshopify.com
```

### Step 4: Start Development
```bash
# Option A: Automatic (opens 2 terminals)
./start-dev.ps1    # Windows
./start-dev.sh     # Mac/Linux

# Option B: Manual (run in 2 separate terminals)
npm run watch      # Terminal 1 - Auto-build React & Liquid
npm run dev        # Terminal 2 - Shopify live preview
```

### Step 5: Create Your First Component
```bash
# Just create the React component - Liquid auto-generates!
mkdir src/components/my-awesome-component
# Create MyAwesomeComponent.tsx with your React code
# The liquid file will be auto-generated on build! ✨
```

---

## 📦 Option 2: NPM Package (Future)

**Best for:** Adding React to existing themes without changing the entire structure.

> ⚠️ **Coming Soon**: This option requires publishing Reactpify to npm registry.

### Future Usage:
```bash
# Install Reactpify as dependency
npm install reactpify

# Initialize in your existing theme
npx reactpify init

# Add React components
npx reactpify create component-name
```

---

## 🤔 Which Option Should I Choose?

### ✅ **Use Option 1 (Git Clone) if:**
- Starting a new Shopify theme
- Want full control over the build process
- Want to customize the entire architecture
- Building a custom theme from scratch
- Want all example components and Redux setup

### ✅ **Use Option 2 (NPM) if:** *(When available)*
- Have an existing Shopify theme
- Want minimal setup
- Just need to add a few React components
- Don't want to change your build process
- Prefer a CLI-based workflow

---

## 🛠️ After Setup

Regardless of which option you choose:

1. **Edit `layout/theme.liquid`** to include Reactpify:
```liquid
<script type="module" src="{{ 'reactpify.js' | asset_url }}"></script>
```

2. **Create React components** in `src/components/`

3. **Use in Shopify** by adding the auto-generated sections in the theme editor

4. **Deploy** with `npm run build && shopify theme push`

---

## 🆘 Need Help?

- 📖 Read the full [README.md](README.md)
- 🐛 Report issues on GitHub
- 💬 Join our community discussions
- 📧 Contact support

---

**Happy coding with Reactpify! 🎉** 