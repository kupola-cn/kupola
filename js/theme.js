import { getIconsPath, getDefaultTheme, getDefaultBrand, setConfig } from './kupola-config.js';

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

function getTheme() {
  return localStorage.getItem(THEME_KEY) || getDefaultTheme();
}

function setTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') return;
  
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if (toggleBtn) {
    toggleBtn.setAttribute('data-current-theme', theme);
    const icon = toggleBtn.querySelector('.theme-icon');
    if (icon) {
      const iconPath = icon.src.substring(0, icon.src.lastIndexOf('/') + 1);
      icon.src = theme === 'dark' 
        ? iconPath + 'sun.svg' 
        : iconPath + 'moon.svg';
    }
  }
}

function getBrand() {
  return localStorage.getItem(BRAND_KEY) || getDefaultBrand();
}

function setBrand(brandId) {
  const brand = BRAND_OPTIONS.find(b => b.id === brandId);
  if (!brand) return;
  
  document.documentElement.setAttribute('data-brand', brandId);
  localStorage.setItem(BRAND_KEY, brandId);
  
  const brandToggle = document.querySelector('[data-brand-toggle]');
  if (brandToggle) {
    brandToggle.setAttribute('data-current-brand', brandId);
    const brandIcon = brandToggle.querySelector('.brand-icon');
    if (brandIcon) {
      brandIcon.style.backgroundColor = brand.color;
    }
    const brandName = brandToggle.querySelector('.brand-name');
    if (brandName) {
      brandName.textContent = brand.name;
    }
  }
  
  const brandButtons = document.querySelectorAll('[data-brand-btn]');
  brandButtons.forEach(btn => {
    if (btn.getAttribute('data-brand-btn') === brandId) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });
}

function updateThemeIcon(toggleBtn) {
  const iconEl = toggleBtn.querySelector('.theme-icon');
  if (iconEl) {
    const currentTheme = getTheme();
    const iconsPath = getIconsPath();
    iconEl.src = currentTheme === 'dark' 
      ? iconsPath + 'sun.svg' 
      : iconsPath + 'moon.svg';
  }
}

function initTheme() {
  
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if (toggleBtn) {
    const iconEl = toggleBtn.querySelector('.theme-icon');
    if (iconEl && iconEl.src) {
      const iconPath = iconEl.src.substring(0, iconEl.src.lastIndexOf('/') + 1);
      const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      const relativeIconsPath = iconPath.replace(window.location.origin + basePath, '');
      if (relativeIconsPath !== iconPath) {
        setConfig({
          paths: {
            icons: relativeIconsPath,
            base: basePath
          }
        });
      }
    }
  }
  
  const savedTheme = getTheme();
  setTheme(savedTheme);
  
  const savedBrand = getBrand();
  setBrand(savedBrand);
  
  if (toggleBtn) {
    updateThemeIcon(toggleBtn);
    const existingOnClick = toggleBtn.onclick;
    toggleBtn.onclick = function(e) {
      e.preventDefault();
      const currentTheme = getTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      updateThemeIcon(toggleBtn);
      if (typeof existingOnClick === 'function') {
        existingOnClick.call(this, e);
      }
    };
  }
  
  let brandPicker = document.getElementById('brand-picker');
  if (!brandPicker) {
    brandPicker = document.createElement('div');
    brandPicker.id = 'brand-picker';
    brandPicker.style.position = 'fixed';
    brandPicker.style.top = '64px';
    brandPicker.style.right = '16px';
    brandPicker.style.zIndex = '9998';
    brandPicker.style.display = 'none';
    brandPicker.style.padding = '12px';
    brandPicker.style.width = '200px';
    brandPicker.style.gridTemplateColumns = 'repeat(3, 1fr)';
    brandPicker.style.gap = '6px';
    brandPicker.style.backgroundColor = 'var(--bg-base-secondary)';
    brandPicker.style.border = '1px solid var(--border-neutral-l1)';
    brandPicker.style.borderRadius = '8px';
    brandPicker.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    brandPicker.style.overflow = 'hidden';
    
    BRAND_OPTIONS.forEach(brand => {
      const btn = document.createElement('button');
      btn.setAttribute('data-brand-btn', brand.id);
      btn.style.display = 'flex';
      btn.style.justifyContent = 'center';
      btn.style.alignItems = 'center';
      btn.style.height = '60px';
      btn.style.backgroundColor = brand.color;
      btn.style.color = ['#32F08C', '#FF9900', '#E2C027', '#0EB0C9', '#B1A6CC'].includes(brand.color) ? '#0C0C0D' : '#FFFFFF';
      btn.style.fontWeight = '500';
      btn.style.borderRadius = '4px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.margin = '0';
      btn.style.padding = '0';
      btn.textContent = brand.name;
      brandPicker.appendChild(btn);
    });
    
    document.body.appendChild(brandPicker);
  }
  
  const brandToggle = document.querySelector('[data-brand-toggle]');
  
  if (brandToggle && brandPicker) {
    brandToggle.onclick = function(e) {
      e.stopPropagation();
      e.preventDefault();
      const isHidden = brandPicker.style.display === 'none';
      brandPicker.style.display = isHidden ? 'grid' : 'none';
      
      if (isHidden) {
        setTimeout(() => {
          document.addEventListener('click', closeBrandPicker, true);
        }, 0);
      } else {
        document.removeEventListener('click', closeBrandPicker, true);
      }
    };
    
    brandPicker.onclick = function(e) {
      e.stopPropagation();
    };
  }
  
  function closeBrandPicker(e) {
    if (brandPicker && brandToggle) {
      if (!brandPicker.contains(e.target) && !brandToggle.contains(e.target)) {
        brandPicker.style.display = 'none';
        document.removeEventListener('click', closeBrandPicker, true);
      }
    }
  }
  
  const brandButtons = document.querySelectorAll('[data-brand-btn]');
  
  brandButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const brandId = btn.getAttribute('data-brand-btn');
      setBrand(brandId);
      if (brandPicker) {
        brandPicker.style.display = 'none';
      }
    });
  });
}

function createThemeToggle() {
  const btn = document.createElement('button');
  btn.setAttribute('data-theme-toggle', '');
  btn.setAttribute('data-current-theme', getTheme());
  btn.className = 'ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon';
  btn.style.position = 'fixed';
  btn.style.top = '16px';
  btn.style.right = '16px';
  btn.style.zIndex = '9999';
  
  const icon = document.createElement('img');
  icon.className = 'theme-icon';
  const iconsPath = getIconsPath();
  icon.src = getTheme() === 'dark' 
    ? iconsPath + 'sun.svg' 
    : iconsPath + 'moon.svg';
  icon.width = 14;
  icon.height = 14;
  icon.alt = 'Toggle theme';
  
  btn.appendChild(icon);
  document.body.appendChild(btn);
  
  btn.onclick = function(e) {
    e.preventDefault();
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  return btn;
}

function createBrandPicker() {
  const container = document.createElement('div');
  container.id = 'brand-picker-auto';
  container.style.position = 'fixed';
  container.style.top = '56px';
  container.style.right = '16px';
  container.style.zIndex = '9998';
  container.style.display = 'none';
  container.style.padding = '12px';
  container.style.width = '200px';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '6px';
  container.style.backgroundColor = 'var(--bg-base-secondary)';
  container.style.border = '1px solid var(--border-neutral-l1)';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
  container.style.overflow = 'hidden';
  
  BRAND_OPTIONS.forEach(brand => {
    const btn = document.createElement('button');
    btn.setAttribute('data-brand-btn', brand.id);
    btn.style.display = 'flex';
    btn.style.justifyContent = 'center';
    btn.style.alignItems = 'center';
    btn.style.height = '60px';
    btn.style.backgroundColor = brand.color;
    btn.style.color = ['#32F08C', '#FF9900', '#E2C027', '#0EB0C9', '#B1A6CC'].includes(brand.color) ? '#0C0C0D' : '#FFFFFF';
    btn.style.fontWeight = '500';
    btn.style.borderRadius = '4px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.margin = '0';
    btn.style.padding = '0';
    btn.textContent = brand.name;
    container.appendChild(btn);
  });
  
  document.body.appendChild(container);
  
  const toggleBtn = document.createElement('button');
  toggleBtn.setAttribute('data-brand-toggle', '');
  toggleBtn.setAttribute('data-current-brand', getBrand());
  toggleBtn.className = 'ds-btn ds-btn--ghost ds-btn--sm';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.top = '16px';
  toggleBtn.style.right = '56px';
  toggleBtn.style.zIndex = '9999';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.gap = '6px';
  
  const brandIcon = document.createElement('span');
  brandIcon.className = 'brand-icon';
  brandIcon.style.width = '12px';
  brandIcon.style.height = '12px';
  brandIcon.style.borderRadius = '50%';
  brandIcon.style.backgroundColor = BRAND_OPTIONS.find(b => b.id === getBrand()).color;
  
  const brandName = document.createElement('span');
  brandName.className = 'brand-name';
  brandName.style.fontSize = '11px';
  brandName.textContent = BRAND_OPTIONS.find(b => b.id === getBrand()).name;
  
  toggleBtn.appendChild(brandIcon);
  toggleBtn.appendChild(brandName);
  document.body.appendChild(toggleBtn);
  
  toggleBtn.onclick = function(e) {
    e.stopPropagation();
    e.preventDefault();
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'grid' : 'none';
    
    if (isHidden) {
      setTimeout(() => {
        document.addEventListener('click', closeBrandPickerAuto, true);
      }, 0);
    } else {
      document.removeEventListener('click', closeBrandPickerAuto, true);
    }
  };
  
  container.onclick = function(e) {
    e.stopPropagation();
  };
  
  function closeBrandPickerAuto(e) {
    if (!container.contains(e.target) && !toggleBtn.contains(e.target)) {
      container.style.display = 'none';
      document.removeEventListener('click', closeBrandPickerAuto, true);
    }
  }
  
  const brandButtons = container.querySelectorAll('[data-brand-btn]');
  brandButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const brandId = btn.getAttribute('data-brand-btn');
      setBrand(brandId);
      container.style.display = 'none';
    });
  });
  
  return { toggleBtn, container };
}

export { 
  getTheme, setTheme, initTheme, createThemeToggle,
  getBrand, setBrand, BRAND_OPTIONS, createBrandPicker,
  THEME_KEY, BRAND_KEY
};