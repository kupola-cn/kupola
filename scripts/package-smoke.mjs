import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const exportEntries = Object.entries(pkg.exports);

function resolvePackagePath(target) {
  return path.resolve(rootDir, target.replace(/^\.\//, ''));
}

async function assertFile(target, label) {
  const filePath = resolvePackagePath(target);
  try {
    await access(filePath);
  } catch {
    throw new Error(`${label} points to a missing file: ${target}`);
  }
  return filePath;
}

async function assertImport(target, label) {
  const filePath = await assertFile(target, `${label} import`);
  await import(pathToFileURL(filePath).href);
}

async function assertRequire(target, label) {
  const filePath = await assertFile(target, `${label} require`);
  require(filePath);
}

for (const [name, entry] of exportEntries) {
  if (typeof entry === 'string') {
    await assertFile(entry, name);
    continue;
  }

  if (entry.import) {
    await assertImport(entry.import, name);
  }
  if (entry.require) {
    await assertRequire(entry.require, name);
  }
  if (entry.types) {
    await assertFile(entry.types, `${name} types`);
  }
}

const root = await import(pathToFileURL(resolvePackagePath(pkg.exports['.'].import)).href);
const directives = await import(pathToFileURL(resolvePackagePath(pkg.exports['./directives'].import)).href);

await assertRequire(pkg.main, 'package main');
await assertImport(pkg.module, 'package module');
await assertFile(pkg.types, 'package types');

for (const [name, value] of Object.entries({
  walk: root.walk,
  walkOnce: root.walkOnce,
  setHtmlSanitizer: root.setHtmlSanitizer,
  directivesWalk: directives.walk,
  directivesWalkOnce: directives.walkOnce,
})) {
  if (typeof value !== 'function') {
    throw new Error(`Expected ${name} to be exported as a function.`);
  }
}

console.log(`Package smoke test passed for ${exportEntries.length} export entries.`);
