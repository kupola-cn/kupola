/**
 * Build CSS — copy source + produce minified bundles.
 *
 * Output:
 *   dist/css/index.css          (full, unminified)
 *   dist/css/index.min.css      (full, minified)
 *   dist/css/tokens.css         (tokens only)
 *   dist/css/tokens.min.css
 *   dist/css/components.css     (components only)
 *   dist/css/components.min.css
 *   dist/css/responsive.css     (responsive utilities)
 *   dist/css/responsive.min.css
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

const SRC = path.join(__dirname, '..', 'packages', 'css');
const DIST = path.join(__dirname, '..', 'dist', 'css');

// 1. Copy source CSS files to dist
fs.mkdirSync(DIST, { recursive: true });

const cssFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  fs.copyFileSync(path.join(SRC, file), path.join(DIST, file));
}

// 2. Resolve @import in index.css to produce a single bundled file
function resolveImports(filePath, seen = new Set()) {
  if (seen.has(filePath)) return '';
  seen.add(filePath);

  const content = fs.readFileSync(filePath, 'utf-8');
  return content.replace(/@import\s+['"](.+?)['"]\s*;/g, (_, importPath) => {
    const resolved = path.resolve(path.dirname(filePath), importPath);
    return resolveImports(resolved, seen);
  });
}

const bundleMap = {
  'index.css': path.join(SRC, 'index.css'),
  'tokens.css': path.join(SRC, 'tokens.css'),
  'components.css': path.join(SRC, 'components.css'),
  'responsive.css': path.join(SRC, 'responsive.css'),
};

const minifier = new CleanCSS({
  level: 2,
  returnPromise: false,
  sourceMap: false,
});

let totalOrig = 0;
let totalMin = 0;

for (const [name, srcPath] of Object.entries(bundleMap)) {
  if (!fs.existsSync(srcPath)) continue;

  const bundled = resolveImports(srcPath);
  const minName = name.replace('.css', '.min.css');

  const result = minifier.minify(bundled);

  fs.writeFileSync(path.join(DIST, minName), result.styles);

  const origSize = Buffer.byteLength(bundled);
  const minSize = Buffer.byteLength(result.styles);
  totalOrig += origSize;
  totalMin += minSize;

  const ratio = ((1 - minSize / origSize) * 100).toFixed(1);
  console.log(`  ${name.padEnd(20)} ${(origSize / 1024).toFixed(1)}KB → ${(minSize / 1024).toFixed(1)}KB (${ratio}% saved)`);
}

console.log(`\n  Total: ${(totalOrig / 1024).toFixed(1)}KB → ${(totalMin / 1024).toFixed(1)}KB (${((1 - totalMin / totalOrig) * 100).toFixed(1)}% saved)`);
console.log('  CSS build complete.');
