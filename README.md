# Reactpify

**Build Shopify theme sections with React.** You write a `.tsx` component; Reactpify generates the Liquid section, its schema, an SEO fallback, and hydrates the component in the browser.

Reactpify installs **on top of an existing Shopify theme**. It does not replace your theme, and it never overwrites your theme's own assets (`main.js`, `base.css`, and so on). Emitted files are namespaced `reactpify.*`.

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

- Node.js `^20.19.0` or `>=22.12.0`
- An existing Online Store 2.0 theme directory containing `assets/`, `layout/`, `sections/`, `snippets/` and `templates/`

Tested against **Dawn** and **Horizon**.

If you don't have a theme yet:

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

`reactpifyjs` ships its toolchain (React, Vite, Tailwind, TypeScript) as its own dependencies, so **one `npm install` is enough**. Setup does not spawn a nested install and does not add those packages to your theme's `devDependencies`.

The `postinstall` script then:

1. Copies `vite.config.ts`, `src/`, `vite-plugins/` and related files (skipping anything you already have)
2. Merges Reactpify entries into `.gitignore`, `.shopifyignore` and `.theme-check.yml` if the theme already ships those files, instead of replacing them
3. Injects `reactpify.css` and `<script type="module" src="{{ 'reactpify.js' | asset_url }}">` into `layout/theme.liquid`
4. Creates the example component `src/components/test/Test.tsx`
5. Adds `dev`, `build`, `watch` and `type-check` to your `package.json`

Setup is idempotent: running it again copies 0 files and does not duplicate the layout tags or ignore entries.

Then:

```bash
npm run build
```

Add the **Test** section from the Shopify theme editor, or reference it from a JSON template.

### If postinstall did not run

Recent npm versions can skip install scripts until you approve them. From the theme directory:

```bash
npx reactpify
```

That is the same setup as `postinstall`. Use it to retry after a failed or blocked install.

### Connecting to your store

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `SHOPIFY_STORE` | yes | Store domain, without `https://` |
| `SHOPIFY_DEV_THEME_ID` / `SHOPIFY_PROD_THEME_ID` | no | Pin `theme dev` / `theme push` to a theme |
| `SHOPIFY_STORE_PASSWORD` | no | Password-page secret; passed as `--store-password`, never on the printed command line |
| `SHOPIFY_CLI_THEME_TOKEN` | no | Theme Access token for CI or non-interactive use |

`.env` is gitignored (Dawn's default ignore file does not cover it; setup adds the entry) and listed in `.shopifyignore`, so it is not committed or uploaded.

Setup copies `scripts/shopify-env.js`. From the theme:

```bash
node scripts/shopify-env.js dev     # shopify theme dev
node scripts/shopify-env.js push    # upload the theme
node scripts/shopify-env.js pull    # download the theme
```

If the Shopify CLI is not on `PATH`, the wrapper falls back to `npx @shopify/cli`.

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

String props get a more specific setting type when their **name** matches a known pattern:

| Prop name ends with | Liquid setting |
| --- | --- |
| `image`, `photo`, `picture`, `thumbnail`, `logo`, `banner` | `image_picker` |
| `url`, `link`, `href` | `url` |
| `color` / `colour` | `color` |
| `description`, `subtitle`, `content`, `body`, `message`, `excerpt` | `textarea` |

A prop named exactly `product` or `collection` becomes a `product` or `collection` picker.

An `image_picker` is passed to the component as a CDN URL (`image_url`, width 1600).

---

## Scripts

After install, your theme has:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build: bundles React and regenerates Liquid |
| `npm run watch` | Rebuilds on change |
| `npm run dev` | Vite dev server |
| `npm run type-check` | `tsc --noEmit` |

Inside the Reactpify repo itself, `npm run env:dev` / `env:push` / `env:pull` wrap the Shopify CLI. In a consumer theme use `node scripts/shopify-env.js <dev\|push\|pull>` as above.

---

## Editing generated Liquid

Generated sections start with this marker, in **both** `src/components/<name>/section.<name>.liquid` and `sections/<name>.liquid`:

```liquid
{% comment %}
  REACTPIFY-AUTOGEN
  Generated from src/components/hello/Hello.tsx. Edits are overwritten on every build.
  Delete this comment block to take ownership of the file.
{% endcomment %}
```

**Delete that comment block from `sections/<name>.liquid` (the file Shopify serves) and the file is yours.** The next build logs `section left untouched, it is manually owned` and will not restore the marker. A section you've taken ownership of will not pick up new props automatically.

To customise the Liquid while keeping regeneration, edit the source template at `src/components/<name>/section.<name>.liquid` instead. That file is the input; `sections/<name>.liquid` is the output.

Removing a component deletes its autogenerated section. Manually owned sections are left in place.

---

## Snippets

Every `.liquid` file under `src/snippets/` is copied to `snippets/` on build, with fragments injected. A `snippet.` filename prefix is stripped (`snippet.price-badge.liquid` → `snippets/price-badge.liquid`). Render it as usual:

```liquid
{% render 'price-badge', product: product %}
```

Snippets are verbatim copies of the source you edit; they are not regenerated from React and have no ownership marker.

---

## Fragments

Fragments are reusable chunks of schema JSON, stored in `src/utils/schema-fragments/`. Reactpify ships with `color-scheme` and `section-spacing`. Generated sections include both by default.

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

To outline the elements the runtime mounted, append `?reactpify-debug` to the URL or run `localStorage.setItem('reactpify-debug', 'true')`. Reactpify then sets `data-reactpify-debug="true"` on `<html>`, which is what the debug styles hook into. Without the flag those styles never apply.

The runtime also exposes `window.reactpify` with `registry()`, `refresh()`, `mount()` and `unmount()` when debug is on, or in Vite development mode.

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
│   │   └── price-badge.liquid
│   ├── styles/
│   │   ├── index.css                       # entry point
│   │   └── theme-extracted.css             # generated
│   ├── utils/schema-fragments/             # reusable schema chunks
│   └── main.tsx                            # generated registry
├── sections/
│   └── hello.liquid                        # generated output
├── snippets/
│   └── price-badge.liquid
├── assets/
│   ├── reactpify.js                        # bundle
│   └── reactpify.css                       # styles
├── scripts/
│   └── shopify-env.js                      # Shopify CLI wrapper
├── .shopifyignore                          # keeps src/ and node_modules/ off the store
├── .theme-check.yml
└── vite.config.ts
```

---

## Theme Editor

Sections mount on page load. The runtime listens for `shopify:section:load` and `shopify:section:unload` so components remount when a merchant adds, moves or removes a section in the customizer. React roots are unmounted on removal rather than left behind. A `MutationObserver` picks up sections injected dynamically, such as in a cart drawer.

Each component is wrapped in an error boundary: if one component throws, the rest of the page keeps working and the SEO fallback stays visible.

---

## Validating your theme

Setup merges ignore rules for `src/`, `vite-plugins/` and `scripts/` into `.theme-check.yml`, because those trees contain `FRAGMENT.*` placeholders that aren't valid Liquid until the build inlines them. Your theme's own theme-check rules are left intact.

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
