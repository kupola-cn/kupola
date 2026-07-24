import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
const args = isWindows
  ? [ '/d', '/s', '/c', 'npm pack --dry-run --json' ]
  : [ 'pack', '--dry-run', '--json' ];
const result = spawnSync(command, args, {
  cwd: rootDir,
  encoding: 'utf8',
});

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error(result.stderr || `npm pack --dry-run exited with status ${result.status}.`);
}

let report;
try {
  [ report ] = JSON.parse(result.stdout);
} catch (error) {
  throw new Error(`Unable to parse npm pack output: ${error.message}`);
}

if (!report || !Array.isArray(report.files)) {
  throw new Error('npm pack --dry-run did not return a file manifest.');
}

const forbidden = [
  { pattern: /(^|\/)__tests__(\/|$)/, reason: 'test directory' },
  { pattern: /^packages\/core\/src\/.*\.js$/, reason: 'runtime source file' },
  { pattern: /^dist\/ai-adapter\./, reason: 'unexported AI adapter artifact' },
  { pattern: /(^|\/)(coverage|stories|storybook-static|test)(\/|$)/, reason: 'development output' },
  { pattern: /(^|\/)\.temp(\/|$)/, reason: 'generated VitePress file' },
  { pattern: /\.map$/, reason: 'source map' },
  { pattern: /^dgc\//, reason: 'internal planning file' },
];

const violations = [];
for (const file of report.files) {
  const rule = forbidden.find(item => item.pattern.test(file.path));
  if (rule) {
    violations.push(`${file.path} (${rule.reason})`);
  }
}

if (violations.length > 0) {
  throw new Error(`Forbidden files found in npm package:\n${violations.join('\n')}`);
}

const requiredFiles = [ 'LICENSE', 'README.md', 'package.json', 'version.json' ];
const paths = new Set(report.files.map(file => file.path));
for (const required of requiredFiles) {
  if (!paths.has(required)) {
    throw new Error(`Required npm package file is missing: ${required}`);
  }
}

const packageTargets = new Set([ pkg.main, pkg.module, pkg.types ]);
for (const entry of Object.values(pkg.exports)) {
  if (typeof entry === 'string') {
    packageTargets.add(entry);
    continue;
  }
  for (const target of Object.values(entry)) {
    packageTargets.add(target);
  }
}

for (const target of packageTargets) {
  const packagePath = target.replace(/^\.\//, '');
  if (!paths.has(packagePath)) {
    throw new Error(`Package entry points to a file missing from the tarball: ${target}`);
  }
}

console.log(
  `Package contents passed: ${report.files.length} files, ` +
  `${report.size} B packed, ${report.unpackedSize} B unpacked.`,
);
