import type { ComponentAnalysis } from './component-analysis.ts';
import {
  buildPropBindings,
  extractFragmentSettingIds,
  toKebabCase,
  toTitleCase,
  type PropBinding
} from './liquid-schema.ts';
import { getFragments } from '../vite-fragment-injection.ts';

export const AUTOGEN_MARKER = 'REACTPIFY-AUTOGEN';

const DEFAULT_FRAGMENTS = ['color-scheme', 'section-spacing'];
const SHOPIFY_SECTION_NAME_LIMIT = 25;

function availableDefaultFragments(): string[] {
  const fragments = getFragments();
  return DEFAULT_FRAGMENTS.filter((name) => fragments[name] !== undefined);
}

function reservedSettingIds(fragmentNames: string[]): Set<string> {
  const fragments = getFragments();
  const ids = new Set<string>();

  for (const name of fragmentNames) {
    for (const id of extractFragmentSettingIds(fragments[name] ?? '')) {
      ids.add(id);
    }
  }

  return ids;
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : value.slice(0, limit).trim();
}

function indent(block: string, spaces: number): string {
  const padding = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line.trim() ? padding + line : line))
    .join('\n');
}

function buildSettingsBlock(bindings: PropBinding[], fragmentNames: string[]): string {
  const entries = bindings.map(({ setting }) => JSON.stringify(setting, null, 2));
  const fragmentEntries = fragmentNames.map((name) => `FRAGMENT.${name}`);

  return indent([...entries, ...fragmentEntries].join(',\n'), 4);
}

function buildDataScript(bindings: PropBinding[]): string {
  if (bindings.length === 0) return '{}';

  const lines = bindings.map(
    ({ propName, liquidValue }) => `  ${JSON.stringify(propName)}: ${liquidValue}`
  );

  return `{\n${lines.join(',\n')}\n}`;
}

function buildFallback(bindings: PropBinding[]): string {
  const lines: string[] = [];
  const textBindings = bindings.filter(({ setting }) =>
    ['text', 'textarea'].includes(setting.type)
  );
  const [headingBinding, ...bodyBindings] = textBindings;
  const imageBinding = bindings.find(({ setting }) => setting.type === 'image_picker');
  const urlBinding = bindings.find(({ setting }) => setting.type === 'url');

  if (imageBinding) {
    const { id } = imageBinding.setting;
    lines.push(
      `{%- if section.settings.${id} != blank -%}`,
      `  {{ section.settings.${id} | image_url: width: 1600 | image_tag: loading: 'lazy' }}`,
      `{%- endif -%}`
    );
  }

  if (headingBinding) {
    const { id } = headingBinding.setting;
    lines.push(
      `{%- if section.settings.${id} != blank -%}`,
      `  <h2>{{ section.settings.${id} }}</h2>`,
      `{%- endif -%}`
    );
  }

  for (const { setting } of bodyBindings) {
    lines.push(
      `{%- if section.settings.${setting.id} != blank -%}`,
      `  <p>{{ section.settings.${setting.id} }}</p>`,
      `{%- endif -%}`
    );
  }

  if (urlBinding) {
    const { id } = urlBinding.setting;
    lines.push(
      `{%- if section.settings.${id} != blank -%}`,
      `  <a href="{{ section.settings.${id} }}">{{ section.settings.${id} }}</a>`,
      `{%- endif -%}`
    );
  }

  if (lines.length === 0) {
    lines.push('{%- comment -%} Add SEO fallback markup here {%- endcomment -%}');
  }

  return indent(lines.join('\n'), 4);
}

function buildWrapperStyle(reservedIds: Set<string>): string {
  const declarations: string[] = [];

  if (reservedIds.has('padding_top')) {
    declarations.push('padding-top: {{ section.settings.padding_top }}px;');
  }

  if (reservedIds.has('padding_bottom')) {
    declarations.push('padding-bottom: {{ section.settings.padding_bottom }}px;');
  }

  return declarations.length > 0 ? `\n  style="${declarations.join(' ')}"` : '';
}

function buildWrapperClass(componentName: string, reservedIds: Set<string>): string {
  const classes = ['reactpify-section', `${toKebabCase(componentName)}-section`];

  if (reservedIds.has('color_scheme')) {
    classes.push('color-{{ section.settings.color_scheme }}');
  }

  return classes.join(' ');
}

export function generateSectionLiquid(
  analysis: ComponentAnalysis,
  sourceFileName: string
): string {
  const { componentName, props } = analysis;
  const fragmentNames = availableDefaultFragments();
  const reservedIds = reservedSettingIds(fragmentNames);
  const bindings = buildPropBindings(props, reservedIds);
  const sectionName = truncate(toTitleCase(componentName), SHOPIFY_SECTION_NAME_LIMIT);

  const schema = {
    name: sectionName,
    tag: 'section',
    class: 'shopify-section--reactpify',
    presets: [{ name: sectionName }]
  };

  return `{% comment %}
  ${AUTOGEN_MARKER}
  Generated from ${sourceFileName}. Edits are overwritten on every build.
  Delete this comment block to take ownership of the file.
{% endcomment %}

<div
  class="${buildWrapperClass(componentName, reservedIds)}"${buildWrapperStyle(reservedIds)}
  data-component-root="${componentName}"
>
  <script type="application/json" data-section-data>
${indent(buildDataScript(bindings), 4)}
  </script>

  <div data-fallback>
${buildFallback(bindings)}
  </div>
</div>

{% schema %}
{
  "name": ${JSON.stringify(schema.name)},
  "tag": ${JSON.stringify(schema.tag)},
  "class": ${JSON.stringify(schema.class)},
  "settings": [
${buildSettingsBlock(bindings, fragmentNames)}
  ],
  "presets": ${indent(JSON.stringify(schema.presets, null, 2), 2).trimStart()}
}
{% endschema %}
`;
}

export function isAutoGenerated(content: string): boolean {
  return content.includes(AUTOGEN_MARKER);
}
