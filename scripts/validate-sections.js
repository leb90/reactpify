#!/usr/bin/env node

/**
 * Validates that every generated section exposes a schema Shopify can parse.
 */

import fs from 'fs';
import path from 'path';

const SECTIONS_DIR = process.argv[2] || 'sections';
const SCHEMA_PATTERN = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/;
const VALID_ID = /^[a-zA-Z0-9_-]+$/;

const failures = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function validateSetting(file, setting, seenIds) {
  if (!setting.type) return fail(file, 'setting without "type"');

  if (['header', 'paragraph'].includes(setting.type)) return;

  if (!setting.id) return fail(file, `setting of type "${setting.type}" without "id"`);

  if (!VALID_ID.test(setting.id)) {
    fail(file, `invalid setting id "${setting.id}"`);
  }

  if (seenIds.has(setting.id)) {
    fail(file, `duplicate setting id "${setting.id}"`);
  }
  seenIds.add(setting.id);

  if (setting.type === 'select') {
    if (!Array.isArray(setting.options) || setting.options.length === 0) {
      fail(file, `select "${setting.id}" has no options`);
    } else if (
      setting.default !== undefined &&
      !setting.options.some((option) => option.value === setting.default)
    ) {
      fail(file, `select "${setting.id}" default is not one of its options`);
    }
  }

  if (setting.type === 'range') {
    for (const key of ['min', 'max', 'step']) {
      if (typeof setting[key] !== 'number') {
        fail(file, `range "${setting.id}" is missing numeric "${key}"`);
      }
    }
  }

  if (setting.type === 'checkbox' && setting.default !== undefined) {
    if (typeof setting.default !== 'boolean') {
      fail(file, `checkbox "${setting.id}" default must be a boolean`);
    }
  }

  if (setting.type === 'number' && setting.default !== undefined) {
    if (typeof setting.default !== 'number') {
      fail(file, `number "${setting.id}" default must be numeric`);
    }
  }
}

function validateDataScript(file, content) {
  const match = content.match(
    /<script type="application\/json" data-section-data>([\s\S]*?)<\/script>/
  );

  if (!match) return;

  const liquidFree = match[1].replace(/\{\{[^}]*\}\}/g, 'null');

  try {
    JSON.parse(liquidFree);
  } catch (error) {
    fail(file, `data-section-data is not valid JSON: ${error.message}`);
  }
}

function validateSection(file, content) {
  if (!content.includes('data-component-root="')) {
    fail(file, 'missing data-component-root with a component name');
  }

  const schemaMatch = content.match(SCHEMA_PATTERN);
  if (!schemaMatch) return fail(file, 'no {% schema %} block');

  let schema;
  try {
    schema = JSON.parse(schemaMatch[1]);
  } catch (error) {
    return fail(file, `schema is not valid JSON: ${error.message}`);
  }

  if (typeof schema.name !== 'string' || schema.name.length > 25) {
    fail(file, 'schema "name" must be a string of at most 25 characters');
  }

  const seenIds = new Set();
  for (const setting of schema.settings ?? []) {
    validateSetting(file, setting, seenIds);
  }

  validateDataScript(file, content);
}

const files = fs
  .readdirSync(SECTIONS_DIR)
  .filter((entry) => entry.endsWith('.liquid'))
  .map((entry) => path.join(SECTIONS_DIR, entry))
  .filter((file) => fs.readFileSync(file, 'utf-8').includes('REACTPIFY-AUTOGEN'));

for (const file of files) {
  validateSection(file, fs.readFileSync(file, 'utf-8'));
}

if (failures.length > 0) {
  console.error(`❌ ${failures.length} problem(s) found:`);
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log(`✅ ${files.length} generated section(s) validated`);
