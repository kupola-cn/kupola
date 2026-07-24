import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function readJson(file) {
  return JSON.parse(await readFile(path.join(rootDir, file), 'utf8'));
}

function resolvePackagePath(pkgDir, target) {
  return path.resolve(rootDir, pkgDir, target.replace(/^\.\//, ''));
}

async function assertFile(pkgDir, target, label) {
  const filePath = resolvePackagePath(pkgDir, target);
  try {
    await access(filePath);
  } catch {
    throw new Error(`${label} points to a missing file: ${target}`);
  }
  return filePath;
}

async function assertImport(pkgDir, target, label) {
  const filePath = await assertFile(pkgDir, target, `${label} import`);
  await import(pathToFileURL(filePath).href);
}

async function assertRequire(pkgDir, target, label) {
  const filePath = await assertFile(pkgDir, target, `${label} require`);
  require(filePath);
}

async function testPackage(pkgDir, pkgName) {
  const pkg = await readJson(path.join(pkgDir, 'package.json'));
  const exportEntries = Object.entries(pkg.exports || {});

  for (const [name, entry] of exportEntries) {
    if (typeof entry === 'string') {
      await assertFile(pkgDir, entry, `${pkgName}${name}`);
      continue;
    }

    if (entry.import) {
      await assertImport(pkgDir, entry.import, `${pkgName}${name}`);
    }
    if (entry.require) {
      await assertRequire(pkgDir, entry.require, `${pkgName}${name}`);
    }
    if (entry.types) {
      await assertFile(pkgDir, entry.types, `${pkgName}${name} types`);
    }
  }

  if (pkg.main) {
    await assertRequire(pkgDir, pkg.main, `${pkgName} main`);
  }
  if (pkg.module) {
    await assertImport(pkgDir, pkg.module, `${pkgName} module`);
  }
  if (pkg.types) {
    await assertFile(pkgDir, pkg.types, `${pkgName} types`);
  }

  return { pkg, exportCount: exportEntries.length };
}

// ── @kupola/core ────────────────────────────────────────────────────────────
const core = await testPackage('packages/core', '@kupola/core');
const coreRoot = await import(pathToFileURL(resolvePackagePath('packages/core', core.pkg.exports['.'].import)).href);

for (const [name, value] of Object.entries({
  signal: coreRoot.signal,
  computed: coreRoot.computed,
  effect: coreRoot.effect,
  batch: coreRoot.batch,
})) {
  if (typeof value !== 'function') {
    throw new Error(`Expected @kupola/core to export ${name} as a function.`);
  }
}

// ── @kupola/platform ────────────────────────────────────────────────────────
const platform = await testPackage('packages/platform', '@kupola/platform');
const platformRoot = await import(pathToFileURL(resolvePackagePath('packages/platform', platform.pkg.exports['.'].import)).href);

for (const [name, value] of Object.entries({
  html: platformRoot.html,
  render: platformRoot.render,
  walk: platformRoot.walk,
  walkOnce: platformRoot.walkOnce,
  setHtmlSanitizer: platformRoot.setHtmlSanitizer,
  defineComponent: platformRoot.defineComponent,
})) {
  if (typeof value !== 'function') {
    throw new Error(`Expected @kupola/platform to export ${name} as a function.`);
  }
}

// ── @kupola/platform/directives ─────────────────────────────────────────────
const directives = await import(
  pathToFileURL(resolvePackagePath('packages/platform', platform.pkg.exports['./directives'].import)).href
);

for (const [name, value] of Object.entries({
  directivesWalk: directives.walk,
  directivesWalkOnce: directives.walkOnce,
})) {
  if (typeof value !== 'function') {
    throw new Error(`Expected @kupola/platform/directives to export ${name} as a function.`);
  }
}

// ── @kupola/components ──────────────────────────────────────────────────────
const components = await testPackage('packages/components', '@kupola/components');

// ── @kupola/ai-adapter ──────────────────────────────────────────────────────
const aiAdapter = await testPackage('packages/ai-adapter', '@kupola/ai-adapter');

const totalExports = core.exportCount + platform.exportCount + components.exportCount + aiAdapter.exportCount;
console.log(
  `Package smoke test passed for ${totalExports} export entries across 4 packages ` +
  `(core: ${core.exportCount}, platform: ${platform.exportCount}, ` +
  `components: ${components.exportCount}, ai-adapter: ${aiAdapter.exportCount}).`,
);
