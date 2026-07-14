(function () {
  if (document.documentElement.hasAttribute('data-kupola-theme-preloaded')) {
    return;
  }

  var k = 'kupola-theme';
  var d = 'dark';

  function getTheme() {
    var s = localStorage.getItem(k);
    if (s === 'dark' || s === 'light') {
      return s;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return d;
  }

  var theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  var root = document.documentElement;
  root.style.setProperty('--bg-base-default', theme === 'dark' ? '#0C0C0D' : '#FFFFFF');
  root.style.setProperty('--text-default', theme === 'dark' ? '#E5E7EB' : '#0F1117');

  document.documentElement.setAttribute('data-kupola-theme-preloaded', 'true');
})();
