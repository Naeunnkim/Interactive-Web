#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const detailPages = readdirSync(root)
  .filter((file) => /^detail\d{2}\.html$/.test(file))
  .sort();
const errors = [];

if (detailPages.length !== 18) {
  errors.push(`Expected 18 detail pages, found ${detailPages.length}.`);
}

function localReferenceExists(reference) {
  const cleanReference = reference.split('#')[0].split('?')[0];
  return !cleanReference || existsSync(join(root, cleanReference));
}

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const indexReferences = [...indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:https?:|data:|mailto:|#|javascript:)/i.test(reference));

for (const reference of indexReferences) {
  if (!localReferenceExists(reference)) {
    errors.push(`index.html: missing local reference ${reference}.`);
  }
}

const detailLinks = [...indexHtml.matchAll(/href="(detail\d{2}\.html)"/g)].map((match) => match[1]);
if (detailLinks.length !== 18 || new Set(detailLinks).size !== 18) {
  errors.push(`index.html: expected 18 unique detail links, found ${detailLinks.length}.`);
}

for (const page of detailPages) {
  const html = readFileSync(join(root, page), 'utf8');
  const scriptMatch = html.match(/<script\s+src="js\/(\d{2})\.js"/);
  const expectedSet = page.match(/detail(\d{2})/)?.[1];

  if (!scriptMatch || scriptMatch[1] !== expectedSet) {
    errors.push(`${page}: detail script does not match the page number.`);
  }

  if (!html.includes('js/interactive-frame.js')) {
    errors.push(`${page}: missing shared interaction engine.`);
  }

  if (html.includes('getUserMedia')) {
    errors.push(`${page}: direct getUserMedia call duplicates the p5 camera lifecycle.`);
  }

  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !/^(?:https?:|data:|mailto:|#|javascript:)/i.test(reference));

  for (const reference of references) {
    if (!localReferenceExists(reference)) {
      errors.push(`${page}: missing local reference ${reference}.`);
    }
  }
}

for (const page of detailPages) {
  const configFile = `js/${page.slice(6, 8)}.js`;
  const source = readFileSync(join(root, configFile), 'utf8');
  const frameSet = source.match(/frameSet:\s*['"](\d{2})['"]/i)?.[1];
  const skipped = [...source.matchAll(/skipFrames:\s*\[([^\]]*)\]/g)]
    .flatMap((match) => match[1].match(/\d+/g) ?? [])
    .map(Number);

  if (!frameSet) {
    errors.push(`${configFile}: missing frameSet configuration.`);
    continue;
  }

  for (let frame = 1; frame <= 420; frame += 1) {
    if (skipped.includes(frame)) continue;
    const path = `images/frames${frameSet}/${frame}.jpg`;
    if (!existsSync(join(root, path))) {
      errors.push(`${configFile}: missing frame ${path}.`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Project checks passed: ${detailPages.length} detail pages and configured frame assets are present.`);
}
