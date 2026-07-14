(function () {
  'use strict';

  const THEME_KEY = 'kupola-theme';
  const BRAND_KEY = 'kupola-brand';
  
  const BRAND_OPTIONS = [
    { id: 'green', name: '翠绿', color: '#32F08C' },
    { id: 'xionghuang', name: '雄黄', color: '#FF9900' },
    { id: 'jianghuang', name: '姜黄', color: '#E2C027' },
    { id: 'lanlv', name: '蓝绿', color: '#12A182' },
    { id: 'kongquelan', name: '孔雀蓝', color: '#0EB0C9' },
    { id: 'meiguizi', name: '玫瑰紫', color: '#BA2F7B' },
    { id: 'shihong', name: '柿红', color: '#F2481B' },
    { id: 'quhong', name: '紫云', color: '#B1A6CC' },
    { id: 'shanchahong', name: '山茶红', color: '#F05A46' },
    { id: 'zengqing', name: '曾青', color: '#535164' },
    { id: 'roulan', name: '柔蓝', color: '#106898' }
  ];

  const KUPOLA_CONFIG = window.KupolaConfig || {
    theme: { default: 'dark', brand: 'zengqing' },
    paths: { icons: '/icons/', base: '/' }
  };

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return KUPOLA_CONFIG.theme.default;
  }

  function getPreferredBrand() {
    const saved = localStorage.getItem(BRAND_KEY);
    if (saved) return saved;
    return KUPOLA_CONFIG.theme.brand;
  }

  function applyTheme(theme) {
    const root = document.documentElement;

    if (root.hasAttribute('data-kupola-theme-preloaded')) {
      root.style.removeProperty('--bg-base-default');
      root.style.removeProperty('--text-default');
      root.removeAttribute('data-kupola-theme-preloaded');
    }

    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    updateThemeIcons();
  }

  function applyBrand(brand) {
    if (brand) {
      document.documentElement.setAttribute('data-brand', brand);
      localStorage.setItem(BRAND_KEY, brand);
      updateBrandIcons();
    }
  }

  function updateThemeIcons() {
    const iconsPath = KUPOLA_CONFIG.paths.base + KUPOLA_CONFIG.paths.icons.replace(/^\//, '');
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    
    document.querySelectorAll('[data-theme-toggle]').forEach(toggleBtn => {
      const iconEl = toggleBtn.querySelector('.theme-icon');
      if (iconEl) {
        iconEl.src = currentTheme === 'dark' ? iconsPath + 'sun.svg' : iconsPath + 'moon.svg';
      }
    });
  }

  function updateBrandIcons() {
    const currentBrand = document.documentElement.getAttribute('data-brand') || getPreferredBrand();
    
    document.querySelectorAll('[data-brand-toggle]').forEach(brandToggle => {
      const brandIcon = brandToggle.querySelector('.brand-icon');
      if (brandIcon) {
        const brand = BRAND_OPTIONS.find(b => b.id === currentBrand);
        if (brand) {
          brandIcon.style.backgroundColor = brand.color;
        }
      }
      const brandName = brandToggle.querySelector('.brand-name');
      if (brandName) {
        const brand = BRAND_OPTIONS.find(b => b.id === currentBrand);
        if (brand) {
          brandName.textContent = brand.name;
        }
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function bindToggleButtons() {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        toggleTheme();
      };
    });
    
    document.querySelectorAll('[data-brand-btn]').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const brandId = btn.getAttribute('data-brand-btn');
        applyBrand(brandId);
        
        const brandPicker = document.getElementById('brand-picker') || 
                           document.getElementById('brand-picker-auto');
        if (brandPicker) {
          brandPicker.style.display = 'none';
        }
      };
    });
  }

  applyTheme(getPreferredTheme());
  applyBrand(getPreferredBrand());
  
  document.body.classList.add('theme-initialized');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggleButtons);
  } else {
    bindToggleButtons();
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  window.KupolaTheme = {
    toggle: toggleTheme,
    set: applyTheme,
    get: function () {
      return document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    },
    setBrand: applyBrand,
    getBrand: function () {
      return document.documentElement.getAttribute('data-brand') || getPreferredBrand();
    }
  };
})();