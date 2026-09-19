import type { ComponentProp } from './component-analysis.ts';

export interface LiquidSetting {
  type: string;
  id: string;
  label: string;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  info?: string;
}

export interface PropBinding {
  propName: string;
  setting: LiquidSetting;
  liquidValue: string;
}

const NAME_HINTS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /(image|photo|picture|thumbnail|logo|banner)$/i, type: 'image_picker' },
  { pattern: /(url|link|href)$/i, type: 'url' },
  { pattern: /colou?r$/i, type: 'color' },
  { pattern: /^(product)$/i, type: 'product' },
  { pattern: /^(collection)$/i, type: 'collection' },
  { pattern: /(description|subtitle|content|body|message|excerpt)$/i, type: 'textarea' }
];

export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

export function toKebabCase(value: string): string {
  return toSnakeCase(value).replace(/_/g, '-');
}

export function toTitleCase(value: string): string {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function resolveSettingType(prop: ComponentProp): string | null {
  if (prop.kind === 'select') return 'select';
  if (prop.kind === 'boolean') return 'checkbox';
  if (prop.kind === 'number') return 'number';

  if (prop.kind === 'string') {
    const hint = NAME_HINTS.find(({ pattern }) => pattern.test(prop.name));
    return hint ? hint.type : 'text';
  }

  return null;
}

function uniqueSettingId(base: string, usedIds: Set<string>): string {
  const safeBase = base || 'setting';
  let candidate = safeBase;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${safeBase}_${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function applyDefault(setting: LiquidSetting, prop: ComponentProp): void {
  const { defaultValue } = prop;
  if (defaultValue === undefined) return;

  switch (setting.type) {
    case 'checkbox':
      if (typeof defaultValue === 'boolean') setting.default = defaultValue;
      return;
    case 'number':
      if (typeof defaultValue === 'number' && Number.isFinite(defaultValue)) {
        setting.default = defaultValue;
      }
      return;
    case 'select':
      if (typeof defaultValue === 'string' && setting.options?.some((o) => o.value === defaultValue)) {
        setting.default = defaultValue;
      }
      return;
    case 'text':
    case 'textarea':
    case 'color':
      if (typeof defaultValue === 'string' && defaultValue.length > 0) {
        setting.default = defaultValue;
      }
      return;
    default:
      return;
  }
}

function buildLiquidValue(settingId: string, settingType: string): string {
  if (settingType === 'image_picker') {
    return `{% if section.settings.${settingId} != blank %}{{ section.settings.${settingId} | image_url: width: 1600 | json }}{% else %}null{% endif %}`;
  }

  return `{{ section.settings.${settingId} | json }}`;
}

export function buildPropBindings(
  props: ComponentProp[],
  reservedIds: Iterable<string> = []
): PropBinding[] {
  const usedIds = new Set(reservedIds);
  const bindings: PropBinding[] = [];

  for (const prop of props) {
    const type = resolveSettingType(prop);
    if (!type) continue;

    const id = uniqueSettingId(toSnakeCase(prop.name), usedIds);

    const setting: LiquidSetting = {
      type,
      id,
      label: toTitleCase(prop.name)
    };

    if (type === 'select') {
      setting.options = prop.options.map((value) => ({
        value,
        label: toTitleCase(value)
      }));
    }

    if (type === 'image_picker') {
      setting.info = 'Passed to the React component as an image URL.';
    }

    applyDefault(setting, prop);

    bindings.push({
      propName: prop.name,
      setting,
      liquidValue: buildLiquidValue(id, type)
    });
  }

  return bindings;
}

export function extractFragmentSettingIds(fragmentContent: string): string[] {
  const ids: string[] = [];
  const pattern = /"id"\s*:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(fragmentContent)) !== null) {
    ids.push(match[1]);
  }

  return ids;
}
