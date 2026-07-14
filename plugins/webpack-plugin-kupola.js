/**
 * @kupola/webpack-plugin - Webpack plugin for Kupola development
 *
 * Features:
 * - Auto-inject Kupola CSS
 * - Auto-inject theme preload script to prevent flash of white
 * - Works with html-webpack-plugin
 */

class KupolaWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      autoCSS: true,
      themePreload: false,
      cssPath: null,
      ...options,
    };
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('KupolaWebpackPlugin', (compilation) => {
      if (compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
        compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tap(
          'KupolaWebpackPlugin',
          (htmlPluginData) => {
            let html = htmlPluginData.html;

            // Inject blocking theme-dark.css for CSS variables (before any rendering)
            if (this.options.autoCSS && !html.includes('theme-dark.css')) {
              const cssBasePath = this.options.cssPath ? this.options.cssPath.replace(/\/kupola\.css$/, '') : '';
              const themeCSSLink = `<link rel="stylesheet" href="${cssBasePath ? cssBasePath + '/' : ''}theme-dark.css">`;
              html = html.replace(
                '<head>',
                `<head>\n${themeCSSLink}\n`,
              );
            }

            // Inject theme preload script
            if (this.options.themePreload && !html.includes('theme-preload.js')) {
              const cssBasePath = this.options.cssPath ? this.options.cssPath.replace(/\/kupola\.css$/, '') : '';
              const preloadScript = `<script src="${cssBasePath ? cssBasePath + '/' : ''}theme-preload.js"></script>`;

              html = html.replace(
                '<head>',
                `<head>\n${preloadScript}\n`,
              );
            }

            // Inject CSS
            if (this.options.autoCSS) {
              const cssLink = this.options.cssPath || 'kupola.css';
              if (!html.includes(cssLink)) {
                html = html.replace(
                  '</head>',
                  `  <link rel="stylesheet" href="${cssLink}">\n</head>`,
                );
              }
            }

            htmlPluginData.html = html;
            return htmlPluginData;
          },
        );
      }
    });
  }
}

module.exports = KupolaWebpackPlugin;
