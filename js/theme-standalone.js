/**
 * Kupola Theme Standalone — lightweight theme toggle (~1KB).
 * 
 * Usage: Include this single script in your page. No other Kupola JS required.
 *   <script src="theme-standalone.js"></script>
 * 
 * Features:
 *   - Reads/writes theme preference from localStorage
 *   - Sets data-theme attribute on <html>
 *   - Auto-binds [data-theme-toggle] buttons
 *   - Supports prefers-color-scheme as default
 *   - Optional: auto-detects brand preference
 */
(function () {
  'use strict';

  var THEME_KEY = 'kupola-theme';
  var BRAND_KEY = 'kupola-brand';

  function getPreferred() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function applyBrand(brand) {
    if (brand) {
      document.documentElement.setAttribute('data-brand', brand);
      localStorage.setItem(BRAND_KEY, brand);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || getPreferred();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function bindToggleButtons() {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleTheme();
      });
    });
  }

  // Initialize immediately (works even before DOMContentLoaded)
  applyTheme(getPreferred());
  applyBrand(localStorage.getItem(BRAND_KEY));

  // Bind toggle buttons when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggleButtons);
  } else {
    bindToggleButtons();
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // Expose minimal API
  window.KupolaTheme = {
    toggle: toggleTheme,
    set: applyTheme,
    get: function () {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
  };
})();
