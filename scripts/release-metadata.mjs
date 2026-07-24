import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function readJson(file) {
  return JSON.parse(await readFile(path.join(rootDir, file), 'utf8'));
}

const [ pkg, lock, versionFile, changelog ] = await Promise.all([
  readJson('package.json'),
  readJson('package-lock.json'),
  readJson('version.json'),
  readFile(path.join(rootDir, 'CHANGELOG.md'), 'utf8'),
]);

const versions = new Map([
  [ 'package.json', pkg.version ],
  [ 'package-lock.json', lock.version ],
  [ 'package-lock.json root package', lock.packages?.['']?.version ],
  [ 'version.json', versionFile.version ],
]);

for (const [ source, version ] of versions) {
  if (version !== pkg.version) {
    throw new Error(`${source} version ${version ?? '<missing>'} does not match ${pkg.version}.`);
  }
}

const releaseHeadings = [ `## ${pkg.version}`, `## v${pkg.version}` ];
const hasChangelogEntry = changelog
  .split(/\r?\n/)
  .some(line => releaseHeadings.some(heading => line === heading || line.startsWith(`${heading} (`)));
if (!hasChangelogEntry) {
  throw new Error(`CHANGELOG.md has no release heading for ${pkg.version}.`);
}

if (pkg.engines?.node !== '>=18.0.0') {
  throw new Error('package.json must declare the supported Node baseline as >=18.0.0.');
}

const normalizePackagePath = value => String(value || '').replace(/^\.\//, '');
if (
  normalizePackagePath(pkg.main) !== normalizePackagePath(pkg.exports?.['.']?.require) ||
  normalizePackagePath(pkg.module) !== normalizePackagePath(pkg.exports?.['.']?.import) ||
  normalizePackagePath(pkg.types) !== normalizePackagePath(pkg.exports?.['.']?.types)
) {
  throw new Error('main, module, and types must match the root exports entry.');
}

if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${pkg.version}`) {
  throw new Error(
    `Git tag ${process.env.GITHUB_REF_NAME} does not match package version v${pkg.version}.`,
  );
}

console.log(`Release metadata passed for ${pkg.name}@${pkg.version}.`);
