(function() {
  var THEME_KEY = 'kupola-theme';
  var DEFAULT_THEME = 'dark';

  function getStoredTheme() {
    try {
      var s = localStorage.getItem(THEME_KEY);
      if (s === 'dark' || s === 'light') return s;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return DEFAULT_THEME;
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  var storedTheme = getStoredTheme();
  applyTheme(storedTheme);

  function createKupolaThemePlugin(options) {
    var opts = options || {};
    var defaultTheme = opts.defaultTheme || DEFAULT_THEME;

    return {
      install: function(app) {
        var themeState = {
          current: getStoredTheme(),
          set: function(theme) {
            if (theme !== 'dark' && theme !== 'light') return;
            themeState.current = theme;
            applyTheme(theme);
          },
          toggle: function() {
            var newTheme = themeState.current === 'dark' ? 'light' : 'dark';
            themeState.set(newTheme);
          }
        };

        app.config.globalProperties.$kupolaTheme = themeState;

        app.provide('kupolaTheme', themeState);
      }
    };
  }

  function useTheme() {
    var theme = getStoredTheme();
    return {
      current: theme,
      set: function(newTheme) {
        if (newTheme !== 'dark' && newTheme !== 'light') return;
        applyTheme(newTheme);
      },
      toggle: function() {
        var current = getStoredTheme();
        var newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      },
      isDark: function() {
        return getStoredTheme() === 'dark';
      },
      isLight: function() {
        return getStoredTheme() === 'light';
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createKupolaThemePlugin, useTheme };
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return { createKupolaThemePlugin, useTheme }; });
  } else if (typeof window !== 'undefined') {
    window.KupolaVueTheme = { createKupolaThemePlugin, useTheme };
  }
})();