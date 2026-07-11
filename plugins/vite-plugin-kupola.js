/**
 * @kupola/vite-plugin - Vite plugin for Kupola development
 * 
 * Features:
 * - Auto-import useDeps/useQuery when detected in code
 * - Auto-inject Kupola CSS
 * - Dev-time dependency graph visualization
 * - Transform helper for @depends-like syntax
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * @param {Object} options
 * @param {boolean} [options.autoCSS=true] - Auto inject Kupola CSS
 * @param {boolean} [options.autoImport=true] - Auto import useDeps/useQuery
 * @param {boolean} [options.devTools=true] - Enable dev tools in dev mode
 * @param {string} [options.cssPath] - Custom CSS path
 */
export function kupola(options = {}) {
    const {
        autoCSS = true,
        autoImport = true,
        devTools = true,
        cssPath = null
    } = options;

    let isDev = false;
    let kupolaRoot = null;

    return {
        name: 'kupola',
        enforce: 'pre',

        configResolved(config) {
            isDev = config.command === 'serve';
            kupolaRoot = config.root;
        },

        // Auto-import useDeps/useQuery
        transform(code, id) {
            if (!autoImport) return null;
            if (!id.endsWith('.js') && !id.endsWith('.ts') && !id.endsWith('.vue') && !id.endsWith('.jsx') && !id.endsWith('.tsx')) {
                return null;
            }

            // Skip node_modules
            if (id.includes('node_modules')) return null;

            let transformed = code;
            let hasChanges = false;

            // Detect useDeps usage without import
            if (code.includes('useDeps(') && !code.includes("from '@kupola/kupola'") && !code.includes("from 'kupola'") && !code.includes('from "../js/depends.js"') && !code.includes('from "./js/depends.js"')) {
                const importStatement = `import { useDeps } from '@kupola/kupola';\n`;
                transformed = importStatement + transformed;
                hasChanges = true;
            }

            // Detect useQuery usage without import
            if (code.includes('useQuery(') && !code.includes("from '@kupola/kupola'") && !code.includes("from 'kupola'") && !code.includes('from "../js/depends.js"') && !code.includes('from "./js/depends.js"')) {
                if (!transformed.includes("import { useQuery }")) {
                    const importStatement = `import { useQuery } from '@kupola/kupola';\n`;
                    transformed = importStatement + transformed;
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                return {
                    code: transformed,
                    map: null
                };
            }

            return null;
        },

        // Inject CSS in dev mode
        transformIndexHtml(html) {
            if (!autoCSS) return html;

            const cssLink = cssPath || '/css/kupola.css';
            if (!html.includes(cssLink)) {
                return html.replace(
                    '</head>',
                    `  <link rel="stylesheet" href="${cssLink}">\n</head>`
                );
            }
            return html;
        },

        // Dev tools integration
        configureServer(server) {
            if (!devTools || !isDev) return;

            // Add middleware for dependency graph API
            server.middlewares.use('/__kupola-deps', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    status: 'ok',
                    version: '1.2.1',
                    features: ['useDeps', 'useQuery', 'Scheduler', 'CacheManager']
                }));
            });
        },

        // Handle hot update for depends files
        handleHotUpdate(ctx) {
            const { file, modules } = ctx;
            if (file.includes('depends.js')) {
                // Force full reload when core depends files change
                return [];
            }
        }
    };
}

export default kupola;
