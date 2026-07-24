// SPDX-License-Identifier: MIT
/**
 * vite-plugin-kupola
 *
 * Vite plugin for @kupola/platform.
 * - Auto-imports CSS tokens when Kupola components are used
 * - Optional: inject theme configuration
 *
 * Usage (vite.config.js):
 *   import kupola from '@kupola/vite-plugin';
 *   export default { plugins: [kupola({ css: true })] };
 */

export default function kupolaPlugin(options = {}) {
  const {
    css = true,
    theme = 'dark',
  } = options;

  let cssInjected = false;

  return {
    name: 'kupola',
    enforce: 'pre',

    transform(code, id) {
      if (!css || cssInjected) return null;
      if (id.includes('node_modules')) return null;

      // Detect Kupola imports
      const hasKupolaImport = /from\s+['"]@kupola\//.test(code);
      if (!hasKupolaImport) return null;

      cssInjected = true;

      // Inject CSS import at the top of the module
      const cssImport = `import '@kupola/platform/css';\n`;
      const themeAttr = theme ? `\n// Auto-set theme: document.documentElement.dataset.theme = '${theme}';` : '';

      return {
        code: cssImport + themeAttr + '\n' + code,
        map: null,
      };
    },

    // Reset injection flag for HMR
    handleHotUpdate({ file }) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        cssInjected = false;
      }
    },
  };
}
