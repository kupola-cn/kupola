(function(){
  if(document.documentElement.hasAttribute("data-kupola-theme-preloaded"))return;
  
  const h = document.documentElement;
  
  const KUPOLA_CONFIG = window.KupolaConfig || {
    theme: { default: 'dark', brand: 'zengqing' },
    paths: { icons: '/icons/', base: '/' }
  };
  
  const savedTheme = localStorage.getItem("kupola-theme");
  const savedBrand = localStorage.getItem("kupola-brand");
  
  const theme = savedTheme || 
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") ||
    KUPOLA_CONFIG.theme.default;
    
  const brand = savedBrand || KUPOLA_CONFIG.theme.brand;
  
  h.setAttribute("data-theme", theme);
  h.setAttribute("data-brand", brand);
  h.setAttribute("data-kupola-theme-preloaded", "true");
  
  const iconsPath = KUPOLA_CONFIG.paths.base + KUPOLA_CONFIG.paths.icons.replace(/^\//, '');
  
  document.querySelectorAll('[data-theme-toggle]').forEach(toggleBtn => {
    const iconEl = toggleBtn.querySelector('.theme-icon');
    if (iconEl) {
      iconEl.src = theme === 'dark' ? iconsPath + 'sun.svg' : iconsPath + 'moon.svg';
    }
  });
  
  document.querySelectorAll('[data-brand-toggle]').forEach(brandToggle => {
    const brandIcon = brandToggle.querySelector('.brand-icon');
    if (brandIcon) {
      const BRAND_OPTIONS = [
        { id: 'green', color: '#32F08C' },
        { id: 'xionghuang', color: '#FF9900' },
        { id: 'jianghuang', color: '#E2C027' },
        { id: 'lanlv', color: '#12A182' },
        { id: 'kongquelan', color: '#0EB0C9' },
        { id: 'meiguizi', color: '#BA2F7B' },
        { id: 'shihong', color: '#F2481B' },
        { id: 'quhong', color: '#B1A6CC' },
        { id: 'shanchahong', color: '#F05A46' },
        { id: 'zengqing', color: '#535164' },
        { id: 'roulan', color: '#106898' }
      ];
      const selectedBrand = BRAND_OPTIONS.find(b => b.id === brand);
      if (selectedBrand) {
        brandIcon.style.backgroundColor = selectedBrand.color;
      }
    }
    const brandName = brandToggle.querySelector('.brand-name');
    if (brandName) {
      const BRAND_OPTIONS = [
        { id: 'green', name: '翠绿' },
        { id: 'xionghuang', name: '雄黄' },
        { id: 'jianghuang', name: '姜黄' },
        { id: 'lanlv', name: '蓝绿' },
        { id: 'kongquelan', name: '孔雀蓝' },
        { id: 'meiguizi', name: '玫瑰紫' },
        { id: 'shihong', name: '柿红' },
        { id: 'quhong', name: '紫云' },
        { id: 'shanchahong', name: '山茶红' },
        { id: 'zengqing', name: '曾青' },
        { id: 'roulan', name: '柔蓝' }
      ];
      const selectedBrand = BRAND_OPTIONS.find(b => b.id === brand);
      if (selectedBrand) {
        brandName.textContent = selectedBrand.name;
      }
    }
  });
})();