import { access, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
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

  for (const [ name, entry ] of exportEntries) {
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

for (const [ name, value ] of Object.entries({
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
const platformRoot = await import(
  pathToFileURL(resolvePackagePath('packages/platform', platform.pkg.exports['.'].import)).href
);

for (const [ name, value ] of Object.entries({
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

for (const [ name, value ] of Object.entries({
  directivesWalk: directives.walk,
  directivesWalkOnce: directives.walkOnce,
})) {
  if (typeof value !== 'function') {
    throw new Error(`Expected @kupola/platform/directives to export ${name} as a function.`);
  }
}

// Cross-entry shared runtime: the root bundle and the /directives subpath
// bundle must write into the same custom-directive registry when both are
// loaded in one document. Otherwise directives registered through one entry
// point silently disappear from the other (regression class fixed in 3.3.x).
const sharedDirectivesKey = Symbol.for('kupola.platform.customDirectives');
const sharedRegistry = globalThis[sharedDirectivesKey]
  || (globalThis[sharedDirectivesKey] = new Map());
const smokeSubpathDirective = '__kupola_smoke_subpath__';
const smokeRootDirective = '__kupola_smoke_root__';
directives.registerDirective(smokeSubpathDirective, {});
platformRoot.registerDirective(smokeRootDirective, {});
if (!sharedRegistry.has(smokeSubpathDirective) || !sharedRegistry.has(smokeRootDirective)) {
  throw new Error(
    'Platform root and /directives subpath bundles do not share the custom directive registry.',
  );
}
sharedRegistry.delete(smokeSubpathDirective);
sharedRegistry.delete(smokeRootDirective);

// ── @kupola/components ──────────────────────────────────────────────────────
const components = await testPackage('packages/components', '@kupola/components');
const componentsIconConfig = await import(
  pathToFileURL(resolvePackagePath('packages/components', components.pkg.exports['./icon-config'].import)).href
);
for (const name of [ 'registerIcons', 'getIcon', 'clearIcons' ]) {
  if (typeof componentsIconConfig[name] !== 'function') {
    throw new Error(`Expected @kupola/components/icon-config to export ${name} as a function.`);
  }
}
const componentsUi = await import(
  pathToFileURL(resolvePackagePath('packages/components', components.pkg.exports['./ui'].import)).href
);
for (const name of [ 'createIconResolver', 'createKupolaIconProvider', 'setupUi' ]) {
  if (typeof componentsUi[name] !== 'function') {
    throw new Error(`Expected @kupola/components/ui to export ${name} as a function.`);
  }
}
const componentsViews = await readFile(
  resolvePackagePath('packages/components', components.pkg.exports['./views'].import),
  'utf8',
);

for (const dependency of [ '@kupola/platform/component', '@kupola/platform/template' ]) {
  if (!componentsViews.includes(dependency)) {
    throw new Error(
      `Expected @kupola/components/views to preserve its external ${dependency} import.`,
    );
  }
}

// ── @kupola/ai-adapter ──────────────────────────────────────────────────────
const aiAdapter = await testPackage('packages/ai-adapter', '@kupola/ai-adapter');

const auth = await testPackage('packages/auth', '@kupola/auth');
const authRoot = await import(pathToFileURL(resolvePackagePath('packages/auth', auth.pkg.exports['.'].import)).href);

if (typeof authRoot.createAuthContext !== 'function' && typeof authRoot.getAuthContext !== 'function') {
  throw new Error('Expected @kupola/auth to export an auth context helper.');
}

const router = await testPackage('packages/router', '@kupola/router');
const routerRoot = await import(
  pathToFileURL(resolvePackagePath('packages/router', router.pkg.exports['.'].import)).href
);

if (typeof routerRoot.createRouter !== 'function') {
  throw new Error('Expected @kupola/router to export createRouter as a function.');
}

const cliPath = resolvePackagePath('packages/create-kupola', 'index.js');
const { stdout: cliHelp } = await execFileAsync(process.execPath, [ cliPath, '--help' ]);
if (!cliHelp.includes('Usage: create-kupola')) {
  throw new Error('Expected @kupola/create-kupola --help to provide non-interactive usage output.');
}

const totalExports = core.exportCount + platform.exportCount + components.exportCount +
  aiAdapter.exportCount + auth.exportCount + router.exportCount;
console.log(
  `Package smoke test passed for ${totalExports} export entries across 6 packages ` +
  `(core: ${core.exportCount}, platform: ${platform.exportCount}, ` +
  `components: ${components.exportCount}, ai-adapter: ${aiAdapter.exportCount}, ` +
  `auth: ${auth.exportCount}, router: ${router.exportCount}).`,
);
