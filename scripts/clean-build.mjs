import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageNames = [ 'core', 'platform', 'components', 'ai-adapter', 'auth', 'router' ];
const targets = [
  path.resolve(rootDir, 'dist'),
  ...packageNames.map(name => path.resolve(rootDir, 'packages', name, 'dist')),
];

for (const target of targets) {
  const relative = path.relative(rootDir, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean path outside the repository: ${target}`);
  }
  await rm(target, { recursive: true, force: true });
}

console.log('Build output cleaned.');
