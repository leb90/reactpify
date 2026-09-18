# Reactpify

**Build Shopify theme sections with React.** You write a `.tsx` component; Reactpify generates the Liquid section, its schema, an SEO fallback, and hydrates the component in the browser.

Reactpify installs **on top of an existing Shopify theme**. It does not replace your theme, and it never touches your theme's own assets.

---

## How it works

You write one file:

```tsx
// src/components/hello/Hello.tsx
interface HelloProps {
  title?: string;
  showButton?: boolean;
}

export const Hello = ({ title = 'Hello World', showButton = true }: HelloProps) => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-bold">{title}</h2>
    {showButton && <button type="button">Click me</button>}
  </div>
);
```

On `npm run build`, Reactpify reads the component's props with the TypeScript compiler and generates `sections/hello.liquid`:

- a `{% schema %}` with a `text` setting for `title` and a `checkbox` for `showButton`, using your default values
- a `<script type="application/json" data-section-data>` block carrying the merchant's settings
- a `<div data-fallback>` with server-rendered HTML, so the section is indexable without JavaScript
- a `data-component-root="Hello"` attribute that the runtime uses to mount React

It also registers the component in `src/main.tsx` for you. There is no manual registration step.

---

## Requirements

An existing Online Store 2.0 theme directory containing `assets/`, `layout/`, `sections/`, `snippets/` and `templates/`. Tested against **Dawn** and **Horizon**.

If you don't have one yet:

```bash
# Install the Shopify CLI
npm install -g @shopify/cli

# Pull your live theme...
shopify theme pull

# ...or start from Dawn
shopify theme init my-theme --clone-url="https://github.com/Shopify/dawn"
```

---

## Installation

Run this **inside your theme directory**:

```bash
cd your-theme-folder/
npm install reactpifyjs
```

The postinstall step detects the theme, copies the build system in, adds the Reactpify tags to `layout/theme.liquid`, and creates an example component. Existing files are never overwritten.

Then:

```bash
npm run build
```

### Connecting to your store

```bash
cp .env.example .env
```

Set `SHOPIFY_STORE` (required) and, optionally, `SHOPIFY_DEV_THEME_ID` / `SHOPIFY_PROD_THEME_ID`. Then:

```bash
npm run env:dev     # shopify theme dev against your store
npm run env:push    # upload the theme
npm run env:pull    # download the theme
```

---

## Prop mapping

Each prop on your component becomes a schema setting. The prop name is converted to `snake_case` for the setting `id`, and the value is passed back to React as `camelCase`.

| Prop type in TypeScript | Liquid setting |
| --- | --- |
| `string` | `text` |
| `number` | `number` |
| `boolean` | `checkbox` |
| string literal union | `select`, one option per member |

Default values in the component signature become the setting defaults. Props that React can't receive from Liquid, such as functions, are skipped.

String props get a more specific setting type when their **name** matches a known pattern, so you rarely have to hand-edit the schema:

| Prop name ends with | Liquid setting |
| --- | --- |
| `image`, `photo`, `picture`, `thumbnail`, `logo`, `banner` | `image_picker` |
| `url`, `link`, `href` | `url` |
| `color` / `colour` | `color` |
| `description`, `subtitle`, `content`, `body`, `message`, `excerpt` | `textarea` |

A prop named exactly `product` or `collection` becomes a `product` or `collection` picker.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Production build: bundles React and regenerates all Liquid |
| `npm run watch` | Rebuilds on change during development |
| `npm run dev` | Vite dev server |
| `npm run type-check` | `tsc --noEmit` |
| `npm run clean` | Removes the generated `assets/reactpify.*` files |
| `npm run env:dev` / `env:push` / `env:pull` | Shopify CLI wrappers that read `.env` |

---

## Editing generated Liquid

Generated sections start with this marker:

```liquid
{% comment %}
  REACTPIFY-AUTOGEN
  Generated from src/components/test/Test.tsx. Edits are overwritten on every build.
  Delete this comment block to take ownership of the file.
{% endcomment %}
```

**Delete that comment block and the file is yours.** Reactpify detects the missing marker and stops regenerating it, so your edits survive every subsequent build. This also means a section you've taken ownership of will not pick up new props automatically.

To customise the Liquid while keeping regeneration, edit the source template at `src/components/<name>/section.<name>.liquid` instead. That file is the input; `sections/<name>.liquid` is the output.

---

## Snippets

Any file matching `src/snippets/snippet.<name>.liquid` is compiled to `snippets/<name>.liquid` on build, with fragments injected. Render it as usual:

```liquid
{% render 'custom-metaobject' %}
```

---

## Fragments

Fragments are reusable chunks of schema JSON, stored in `src/utils/schema-fragments/`. Reactpify ships with `color-scheme` and `section-spacing`.

Create `src/utils/schema-fragments/custom-colors.liquid`:

```liquid
{
  "type": "select",
  "id": "custom_color",
  "label": "Custom Color",
  "options": [
    { "value": "red", "label": "Red" },
    { "value": "blue", "label": "Blue" }
  ]
}
```

Reference it by filename inside any schema, and it is inlined at build time with the surrounding indentation preserved:

```liquid
{% schema %}
{
  "settings": [
    FRAGMENT.custom-colors,
    FRAGMENT.color-scheme
  ]
}
{% endschema %}
```

---

## Styling

Tailwind CSS v4 is configured in `src/styles/index.css`, which loads each stylesheet into an explicit cascade layer:

```css
@import './main.css';
@import './theme-extracted.css' layer(theme);
@import './base.css'            layer(base);
@import './animations.css'      layer(base);
@import './components.css'      layer(components);
@import './utilities.css'       layer(utilities);
```

Tailwind's global preflight is **disabled**. The reset in `base.css` is scoped to `[data-component-root]` so it can't leak into your theme, and the layer order guarantees that a single utility class still beats that scoped reset.

There is no `tailwind.config.js`: Tailwind v4 is configured from CSS.

The **theme style analyzer** runs on each build, reads the CSS custom properties your theme defines on `:root` and `html`, and writes them to `src/styles/theme-extracted.css`. That lets your components consume the theme's own colours and spacing. The file is generated, so don't edit it.

To outline the elements the runtime mounted, append `?reactpify-debug` to the URL or run `localStorage.setItem('reactpify-debug', 'true')`. Reactpify then sets `data-reactpify-debug="true"` on `<html>`, which is what the debug styles hook into. Without the flag those styles never apply, so they cost nothing in production.

The runtime also exposes `window.reactpify` with `registry()`, `refresh()`, `mount()` and `unmount()` for inspecting or re-scanning the page from the console.

---

## Project structure

```
your-theme/
├── src/
│   ├── components/
│   │   └── hello/
│   │       ├── Hello.tsx                   # you write this
│   │       └── section.hello.liquid        # generated source template
│   ├── snippets/
│   │   └── snippet.custom-metaobject.liquid
│   ├── styles/
│   │   ├── index.css                       # entry point
│   │   └── theme-extracted.css             # generated
│   ├── utils/schema-fragments/             # reusable schema chunks
│   └── main.tsx                            # generated registry
├── sections/
│   └── hello.liquid                        # generated output
├── snippets/
│   └── custom-metaobject.liquid            # generated output
├── assets/
│   ├── reactpify.js                        # bundle
│   └── reactpify.css                       # styles
├── .shopifyignore                          # keeps src/ and node_modules/ off the store
├── .theme-check.yml
└── vite.config.ts
```

Everything Reactpify emits into `assets/` is prefixed `reactpify.`, so it can never collide with your theme's own files.

---

## Theme Editor

Sections mount on page load, and the runtime also listens for `shopify:section:load` and `shopify:section:unload` so components remount correctly when a merchant adds, moves or removes a section in the customizer. React roots are unmounted on removal rather than left behind. A `MutationObserver` picks up sections injected dynamically, such as in a cart drawer.

Each component is wrapped in an error boundary: if one component throws, the rest of the page keeps working and the SEO fallback stays visible.

---

## Validating your theme

Reactpify ships a `.theme-check.yml` that excludes `src/` from analysis, since those files contain `FRAGMENT.*` placeholders that aren't valid Liquid until the build inlines them.

```bash
shopify theme check
```

Generated sections and snippets are expected to pass with no errors and no warnings.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes
4. Push and open a Pull Request

## License

MIT License — see [LICENSE](LICENSE).
