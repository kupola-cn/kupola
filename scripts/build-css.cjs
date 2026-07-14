#!/usr/bin/env node
/**
 * build-css.js — Merge and minify Kupola CSS into a single file.
 *
 * Usage:
 *   node scripts/build-css.cjs
 *
 * Output:
 *   dist/kupola.min.css — All CSS merged and minified
 *   dist/kupola.css     — All CSS merged (unminified, for debugging)
 */

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.resolve(__dirname, '..', 'css');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'dist');

// Import order must match kupola.css @import order
const IMPORT_ORDER = [
  'colors-and-type.css',
  'theme-dark.css',
  'theme-light.css',
  'brand-themes.css',
  'scaffold.css',
  'dashboard.css',
  'components.css',
  'components-ext.css',
  'states.css',
  'utilities.css',
  'responsive.css',
  'accessibility.css',
  'animations.css',
  'table.css'
];

function resolveImports(cssContent, basePath) {
  // Replace @import url('...') with actual file content
  return cssContent.replace(/@import\s+url\(['"]?([^'")\s]+)['"]?\)\s*;/g, (match, url) => {
    const filePath = path.join(basePath, url);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Recursively resolve imports
      return resolveImports(content, path.dirname(filePath));
    }
    console.warn(`  Warning: Import not found: ${url}`);
    return `/* Import not found: ${url} */`;
  });
}

function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around selectors/braces
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

const THEME_VARS = `:root {
  --bg-base-default: #0C0C0D;
  --bg-base-secondary: #1A1B1D;
  --bg-base-tertiary: #222427;
  --bg-overlay-l1: rgba(255, 255, 255, 0.04);
  --bg-overlay-l2: rgba(255, 255, 255, 0.06);
  --bg-overlay-l3: rgba(255, 255, 255, 0.08);
  --bg-overlay-l4: rgba(255, 255, 255, 0.12);
  --bg-menu: #1A1B1D;
  --bg-tooltip: #1A1B1D;
  --bg-invert: #FFFFFF;
  --bg-invert-hover: #F5F5F5;
  --bg-invert-active: #E5E5E5;
  --bg-invert-disabled: rgba(255, 255, 255, 0.2);
  --special-bgtabsoverlay: rgba(0, 0, 0, 0.2);
  --text-default: #E5E7EB;
  --text-default-hover: #FFFFFF;
  --text-default-active: #FFFFFF;
  --text-secondary: #B8BDCA;
  --text-secondary-hover: #E5E7EB;
  --text-secondary-active: #E5E7EB;
  --text-tertiary: #9CA3AF;
  --text-disabled: #8B93A1;
  --text-onbrand: #FFFFFF;
  --text-onaccent: #FFFFFF;
  --icon-default: #E5E7EB;
  --icon-default-hover: #FFFFFF;
  --icon-default-active: #FFFFFF;
  --icon-secondary: #B8BDCA;
  --icon-secondary-hover: #E5E7EB;
  --icon-secondary-active: #E5E7EB;
  --icon-tertiary: #9CA3AF;
  --icon-disabled: #8B93A1;
  --icon-onbrand: #FFFFFF;
  --icon-onaccent: #FFFFFF;
  --border-neutral-l1: rgba(255, 255, 255, 0.12);
  --border-neutral-l2: rgba(255, 255, 255, 0.18);
  --border-neutral-l3: rgba(255, 255, 255, 0.25);
  --border-contrast: #0C0C0D;
  --bg-brand-popup: rgba(83, 81, 100, 0.15);
  --icon-filter: brightness(0) saturate(0) invert(0.9);
}

`;

function buildCSS() {
  console.log('Building Kupola CSS...');

  // Read main entry file
  const mainFile = path.join(CSS_DIR, 'kupola.css');
  if (!fs.existsSync(mainFile)) {
    console.error(`Main CSS file not found: ${mainFile}`);
    process.exit(1);
  }

  const mainContent = fs.readFileSync(mainFile, 'utf-8');

  // Resolve all @import statements
  let merged = resolveImports(mainContent, CSS_DIR);

  // Inject theme variables at the beginning
  merged = THEME_VARS + merged;

  // Also check for any files not in the import list (like dashboard.css)
  // and add them as optional separate output

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write unminified version
  const unminPath = path.join(OUTPUT_DIR, 'kupola.css');
  fs.writeFileSync(unminPath, merged, 'utf-8');
  const unminSize = (fs.statSync(unminPath).size / 1024).toFixed(1);
  console.log(`  Unminified: ${unminPath} (${unminSize} KB)`);

  // Write minified version
  const minified = minifyCSS(merged);
  const minPath = path.join(OUTPUT_DIR, 'kupola.min.css');
  fs.writeFileSync(minPath, minified, 'utf-8');
  const minSize = (fs.statSync(minPath).size / 1024).toFixed(1);
  console.log(`  Minified:   ${minPath} (${minSize} KB)`);

  // Estimate gzip size (rough approximation)
  const gzipEstimate = (minSize * 0.25).toFixed(1);
  console.log(`  Est. gzip:  ~${gzipEstimate} KB`);

  // Summary
  const files = IMPORT_ORDER.filter(f => fs.existsSync(path.join(CSS_DIR, f)));
  console.log(`  Source files: ${files.length}`);
  console.log('CSS build complete!');
}

buildCSS();
