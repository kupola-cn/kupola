import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const vitepressBin = path.join(rootDir, 'node_modules', 'vitepress', 'bin', 'vitepress.js');
const maxAttempts = 3;

function isRetryableWindowsConfigError(output) {
  return process.platform === 'win32'
    && /Access is denied|Could not resolve .*\.vitepress[\\/]config\.js/i.test(output);
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = spawnSync(process.execPath, [ vitepressBin, 'build', 'docs-site' ], {
    cwd: rootDir,
    encoding: 'utf8',
    env: process.env,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);

  if (result.status === 0) {process.exitCode = 0; break;}

  if (!isRetryableWindowsConfigError(output) || attempt === maxAttempts) {
    process.exitCode = result.status || 1;
    break;
  }

  console.warn(
    '[kupola] Retrying VitePress build after transient Windows file access error ' +
    `(${attempt}/${maxAttempts - 1}).`,
  );
  await new Promise(resolve => setTimeout(resolve, 250 * attempt));
}
