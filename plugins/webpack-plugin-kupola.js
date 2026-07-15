// SPDX-License-Identifier: MIT
/**
 * webpack-plugin-kupola
 *
 * Webpack plugin for @kupola/kupola.
 * - Auto-imports CSS tokens when Kupola components are detected
 *
 * Usage (webpack.config.js):
 *   const KupolaPlugin = require('@kupola/webpack-plugin');
 *   module.exports = { plugins: [new KupolaPlugin({ css: true })] };
 */

class KupolaWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      css: options.css !== false,
      theme: options.theme || 'dark',
    };
  }

  apply(compiler) {
    const { css, theme } = this.options;
    if (!css) return;

    // Use NormalModule hook to inject CSS import
    compiler.hooks.compilation.tap('KupolaWebpackPlugin', (compilation) => {
      const NormalModule = compiler.webpack.NormalModule || require('webpack/lib/NormalModule');

      if (NormalModule && NormalModule.getCompilationHooks) {
        NormalModule.getCompilationHooks(compilation).loader.tap(
          'KupolaWebpackPlugin',
          (loaderContext) => {
            // No-op: we use the source hook below
          }
        );
      }
    });

    // Inject via source replacement
    compiler.hooks.thisCompilation.tap('KupolaWebpackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'KupolaWebpackPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          // Inject theme attribute into HTML assets if present
          for (const asset of Object.keys(compilation.assets)) {
            if (asset.endsWith('.html')) {
              const source = compilation.assets[asset].source();
              if (source.includes('@kupola/') && !source.includes('kupola.css')) {
                const withCSS = source.replace(
                  '</head>',
                  '  <link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/index.css">\n</head>'
                );
                compilation.assets[asset] = {
                  source: () => withCSS,
                  size: () => withCSS.length,
                };
              }
            }
          }
        }
      );
    });
  }
}

module.exports = KupolaWebpackPlugin;
