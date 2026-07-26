import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const npmCacheDir = path.join(rootDir, 'node_modules', '.cache', 'npm-pack');
const workspacePackages = [
  'core',
  'platform',
  'components',
  'ai-adapter',
  'auth',
  'router',
  'create-kupola',
];
const expectedSideEffects = new Map([
  [ 'core', false ],
  [ 'platform', [ '**/*.css' ] ],
  [ 'components', [ '**/*.css' ] ],
  [ 'auth', false ],
  [ 'router', false ],
]);
const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
const args = isWindows
  ? [ '/d', '/s', '/c', 'npm pack --dry-run --json --ignore-scripts' ]
  : [ 'pack', '--dry-run', '--json', '--ignore-scripts' ];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function pack(packageDir) {
  const result = spawnSync(command, args, {
    cwd: packageDir,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: npmCacheDir },
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `npm pack --dry-run exited with status ${result.status}.`);
  }

  try {
    const [ report ] = JSON.parse(result.stdout);
    if (!report || !Array.isArray(report.files)) {
      throw new Error('npm pack --dry-run did not return a file manifest.');
    }
    return report;
  } catch (error) {
    throw new Error(`Unable to parse npm pack output: ${error.message}`);
  }
}

function getPackageTargets(pkg) {
  const targets = new Set([ pkg.main, pkg.module, pkg.types ].filter(Boolean));

  for (const entry of Object.values(pkg.exports || {})) {
    if (typeof entry === 'string') {
      targets.add(entry);
      continue;
    }
    for (const target of Object.values(entry)) {
      if (typeof target === 'string') {
        targets.add(target);
      }
    }
  }

  if (typeof pkg.bin === 'string') {
    targets.add(pkg.bin);
  } else {
    for (const target of Object.values(pkg.bin || {})) {
      targets.add(target);
    }
  }
  return targets;
}

function validatePackage(packageName) {
  const packageDir = path.join(rootDir, 'packages', packageName);
  const pkg = readJson(path.join(packageDir, 'package.json'));
  const report = pack(packageDir);
  const paths = new Set(report.files.map(file => file.path));
  const packageTargets = new Set(
    [ ...getPackageTargets(pkg) ].map(target => target.replace(/^\.\//, '')),
  );
  const violations = [];

  for (const file of report.files) {
    if (/(^|\/)__tests__(\/|$)/.test(file.path)) {
      violations.push(`${file.path} (test directory)`);
    } else if (packageName !== 'create-kupola' && /^src\/.*\.js$/.test(file.path)) {
      violations.push(`${file.path} (runtime source file)`);
    } else if (/(^|\/)(coverage|stories|storybook-static|test)(\/|$)/.test(file.path)) {
      violations.push(`${file.path} (development output)`);
    } else if (/\.map$/.test(file.path)) {
      violations.push(`${file.path} (source map)`);
    } else if (packageName === 'components'
      && /^dist\/kupola-components(?:-[^/]+)?\.(?:esm\.js|cjs)$/.test(file.path)
      && !packageTargets.has(file.path)) {
      violations.push(`${file.path} (undeclared runtime entry)`);
    }
  }

  if (!paths.has('package.json')) {
    violations.push('package.json (required package metadata is missing)');
  }

  if (expectedSideEffects.has(packageName)
    && JSON.stringify(pkg.sideEffects) !== JSON.stringify(expectedSideEffects.get(packageName))) {
    violations.push('package.json (sideEffects metadata does not match the package runtime contract)');
  }

  for (const target of packageTargets) {
    const packagePath = target.replace(/^\.\//, '');
    if (!paths.has(packagePath)) {
      violations.push(`${target} (declared package entry is missing)`);
    }
  }

  if (violations.length > 0) {
    throw new Error(`${pkg.name} package contents failed:\n${violations.join('\n')}`);
  }

  return {
    name: pkg.name,
    files: report.files.length,
    size: report.size,
  };
}

const summaries = workspacePackages.map(validatePackage);
const totalFiles = summaries.reduce((total, item) => total + item.files, 0);
const totalSize = summaries.reduce((total, item) => total + item.size, 0);

console.log(
  `Package contents passed for ${summaries.length} workspaces: ` +
  `${totalFiles} files, ${totalSize} B packed.`,
);
