/**
 * @kupola/vite-plugin - Vite plugin for Kupola development
 *
 * Features:
 * - Auto-import useDeps/useQuery when detected in code
 * - Auto-inject Kupola CSS
 * - Dev-time dependency graph visualization
 * - Transform helper for @depends-like syntax
 */

/**
 * @param {Object} options
 * @param {boolean} [options.autoCSS=true] - Auto inject Kupola CSS
 * @param {boolean} [options.autoImport=true] - Auto import useDeps/useQuery
 * @param {boolean} [options.devTools=true] - Enable dev tools in dev mode
 * @param {string} [options.cssPath] - Custom CSS path
 * @param {boolean} [options.themePreload=true] - Auto inject theme preload script
 */
export function kupola(options = {}) {
  const {
    autoCSS = true,
    autoImport = true,
    devTools = true,
    cssPath = null,
    themePreload = true,
  } = options;

  let isDev = false;

  return {
    name: 'kupola',
    enforce: 'pre',

    configResolved(config) {
      isDev = config.command === 'serve';
    },

    // Auto-import useDeps/useQuery
    transform(code, id) {
      if (!autoImport) {return null;}
      if (!id.endsWith('.js') && !id.endsWith('.ts') && !id.endsWith('.vue') && !id.endsWith('.jsx') && !id.endsWith('.tsx')) {
        return null;
      }

      // Skip node_modules
      if (id.includes('node_modules')) {return null;}

      let transformed = code;
      let hasChanges = false;

      // Detect useDeps usage without import
      if (code.includes('useDeps(') && !code.includes('from \'@kupola/kupola\'') && !code.includes('from \'kupola\'') && !code.includes('from "../js/depends.js"') && !code.includes('from "./js/depends.js"')) {
        const importStatement = 'import { useDeps } from \'@kupola/kupola\';\n';
        transformed = importStatement + transformed;
        hasChanges = true;
      }

      // Detect useQuery usage without import
      if (code.includes('useQuery(') && !code.includes('from \'@kupola/kupola\'') && !code.includes('from \'kupola\'') && !code.includes('from "../js/depends.js"') && !code.includes('from "./js/depends.js"')) {
        if (!transformed.includes('import { useQuery }')) {
          const importStatement = 'import { useQuery } from \'@kupola/kupola\';\n';
          transformed = importStatement + transformed;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        return {
          code: transformed,
          map: null,
        };
      }

      return null;
    },

    // Inject CSS and theme preload script
    transformIndexHtml(html) {
      let transformed = html;

      // Inject theme preload script
      if (themePreload && !transformed.includes('data-kupola-theme-preloaded')) {
        const preloadScript = '<script>(function(){if(document.documentElement.hasAttribute("data-kupola-theme-preloaded"))return;var h=document.documentElement,t=localStorage.getItem("kupola-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");h.setAttribute("data-theme",t);var d=t==="dark";h.style.backgroundColor=d?"#0C0C0D":"#FFFFFF";h.style.color=d?"#E5E7EB":"#0F1117";var s=document.createElement("style");s.textContent=d?"body,header,aside,footer{background:#1A1B1D;color:#E5E7EB}":"body,header,aside,footer{background:#F5F5F5;color:#0F1117}";document.head.appendChild(s);h.setAttribute("data-kupola-theme-preloaded","true")})();</script>';

        transformed = transformed.replace(
          '<head>',
          `<head>\n${preloadScript}\n`,
        );
      }

      // Inject CSS
      if (autoCSS) {
        const cssLink = cssPath || '/css/kupola.css';
        if (!transformed.includes(cssLink)) {
          transformed = transformed.replace(
            '</head>',
            `  <link rel="stylesheet" href="${cssLink}">\n</head>`,
          );
        }
      }

      return transformed;
    },

    // Dev tools integration
    configureServer(server) {
      if (!devTools || !isDev) {return;}

      // Add middleware for dependency graph API
      server.middlewares.use('/__kupola-deps', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          version: '1.2.1',
          features: [ 'useDeps', 'useQuery', 'Scheduler', 'CacheManager' ],
        }));
      });
    },

    // Handle hot update for depends files
    handleHotUpdate(ctx) {
      const { file } = ctx;
      if (file.includes('depends.js')) {
        // Force full reload when core depends files change
        return [];
      }
    },
  };
}

export default kupola;
