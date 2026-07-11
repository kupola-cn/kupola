#!/usr/bin/env node
/**
 * build-svg-sprite.js — Merge individual SVG icons into a single SVG sprite.
 *
 * Usage:
 *   node scripts/build-svg-sprite.js
 *
 * Output:
 *   dist/icons.svg — SVG sprite with <symbol> elements
 *
 * Usage in HTML:
 *   <svg width="16" height="16"><use href="icons.svg#icon-user"></use></svg>
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.resolve(__dirname, '..', 'icons');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'icons.svg');

// Skip files that are clearly not individual icons (sprites, variants with hashes)
const SKIP_PATTERNS = [/\.d\./, /\.[0-9a-f]{6}\./];

function shouldSkip(filename) {
  return SKIP_PATTERNS.some(p => p.test(filename));
}

function extractSvgContent(svgString) {
  // Extract viewBox from root <svg> element
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  // Extract inner content (everything between <svg> and </svg>)
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch ? innerMatch[1].trim() : '';

  return { viewBox, inner };
}

function buildSprite() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(ICONS_DIR).filter(f => {
    return f.endsWith('.svg') && !shouldSkip(f);
  });

  // Deduplicate: if both "user.svg" and "user.0c0c0d.svg" exist, prefer "user.svg"
  const seen = new Map();
  for (const file of files) {
    const baseName = file.replace(/\.[0-9a-f]{6}\.svg$/, '.svg');
    const cleanName = baseName.replace('.svg', '');

    if (!seen.has(cleanName) || !file.match(/\.[0-9a-f]{6}\.svg$/)) {
      seen.set(cleanName, file);
    }
  }

  const symbols = [];
  let processed = 0;

  for (const [name, file] of seen) {
    const filePath = path.join(ICONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { viewBox, inner } = extractSvgContent(content);
      if (!inner) continue;

      const id = `icon-${name}`;
      symbols.push(
        `  <symbol id="${id}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`
      );
      processed++;
    } catch (err) {
      console.warn(`  Warning: Could not parse ${file}: ${err.message}`);
    }
  }

  // Sort symbols alphabetically for consistency
  symbols.sort((a, b) => a.localeCompare(b));

  const sprite = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
    ...symbols,
    '</svg>',
    ''
  ].join('\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, sprite, 'utf-8');

  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`SVG Sprite built: ${OUTPUT_FILE}`);
  console.log(`  Icons: ${processed}`);
  console.log(`  Size: ${sizeKB} KB`);
}

buildSprite();
