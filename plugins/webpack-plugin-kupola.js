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
      themePreload: true,
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

            // Inject theme preload script
            if (this.options.themePreload && !html.includes('data-kupola-theme-preloaded')) {
              const preloadScript = '<script>(function(){if(document.documentElement.hasAttribute("data-kupola-theme-preloaded"))return;var h=document.documentElement,t=localStorage.getItem("kupola-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");h.setAttribute("data-theme",t);h.setAttribute("data-kupola-theme-preloaded","true")})();</script>';

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
