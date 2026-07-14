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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getStoredTheme: getStoredTheme,
      applyTheme: applyTheme,
      ThemeContext: null,
      ThemeProvider: null,
      useTheme: null
    };
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return { getStoredTheme, applyTheme }; });
  } else if (typeof window !== 'undefined') {
    window.KupolaReactTheme = { getStoredTheme, applyTheme };
  }

  if (typeof window !== 'undefined' && window.React && window.React.createContext) {
    var React = window.React;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var createContext = React.createContext;
    var useContext = React.useContext;

    var ThemeContext = createContext({
      current: storedTheme,
      setTheme: function() {},
      toggleTheme: function() {},
      isDark: false,
      isLight: false
    });

    function ThemeProvider(props) {
      var [theme, setThemeState] = useState(storedTheme);

      useEffect(function() {
        var root = document.documentElement;
        if (!root.hasAttribute('data-theme')) {
          applyTheme(theme);
        }
      }, []);

      function setTheme(newTheme) {
        if (newTheme !== 'dark' && newTheme !== 'light') return;
        setThemeState(newTheme);
        applyTheme(newTheme);
      }

      function toggleTheme() {
        var newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      }

      return React.createElement(
        ThemeContext.Provider,
        {
          value: {
            current: theme,
            setTheme: setTheme,
            toggleTheme: toggleTheme,
            isDark: theme === 'dark',
            isLight: theme === 'light'
          }
        },
        props.children
      );
    }

    function useTheme() {
      var context = useContext(ThemeContext);
      return context;
    }

    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        getStoredTheme: getStoredTheme,
        applyTheme: applyTheme,
        ThemeContext: ThemeContext,
        ThemeProvider: ThemeProvider,
        useTheme: useTheme
      };
    } else if (typeof window !== 'undefined') {
      window.KupolaReactTheme = {
        getStoredTheme: getStoredTheme,
        applyTheme: applyTheme,
        ThemeContext: ThemeContext,
        ThemeProvider: ThemeProvider,
        useTheme: useTheme
      };
    }
  }
})();