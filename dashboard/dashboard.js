function initDashboard(options) {
  options = options || {};
  
  initSidebar(options.sidebarItems);
  initStatusBar(options.statusItems);
  initHeader(options.headerItems);
}

function initSidebar(items) {
  const sidebarItems = document.querySelectorAll('.ds-dashboard__sidebar-item');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebarItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      
      const title = item.getAttribute('data-title');
      if (title) {
        const contentTitle = document.querySelector('.ds-dashboard__content h1');
        if (contentTitle) {
          contentTitle.textContent = title;
        }
      }
      
      const clickHandler = item.getAttribute('data-click');
      if (clickHandler && typeof window[clickHandler] === 'function') {
        window[clickHandler](item);
      }
    });
  });
  
  if (items && Array.isArray(items)) {
    renderSidebarItems(items);
  }
}

function renderSidebarItems(items) {
  const nav = document.querySelector('.ds-dashboard__sidebar-nav');
  if (!nav) return;
  
  nav.innerHTML = items.map(item => `
    <div class="ds-dashboard__sidebar-item${item.active ? ' is-active' : ''}" 
         data-title="${item.title}" 
         ${item.click ? `data-click="${item.click}"` : ''}>
      <img src="${item.icon}" width="18" height="18" alt="${item.title}" class="icon">
      ${item.badge ? `<span class="ds-navlist__badge" style="position: absolute; top: -4px; right: -4px; font-size: 10px; padding: 1px 4px;">${item.badge}</span>` : ''}
    </div>
  `).join('');
}

function initStatusBar(statusItems) {
  const footerLeft = document.querySelector('.ds-dashboard__footer-left');
  const footerRight = document.querySelector('.ds-dashboard__footer-right');
  
  if (!footerLeft || !footerRight) return;
  
  if (statusItems && statusItems.left) {
    footerLeft.innerHTML = statusItems.left.map(item => `
      <div class="ds-dashboard__status-item">
        ${item.type === 'dot' ? `<span class="ds-dashboard__status-dot${item.status ? ' is-' + item.status : ''}"></span>` : ''}
        <span>${item.text}</span>
      </div>
    `).join('');
  }
  
  if (statusItems && statusItems.right) {
    footerRight.innerHTML = statusItems.right.map(item => `
      <div class="ds-dashboard__status-item">
        <span>${item.text}</span>
      </div>
    `).join('');
  }
  
  updateCurrentTime();
  setInterval(updateCurrentTime, 60000);
}

function updateCurrentTime() {
  const timeEl = document.querySelector('.ds-dashboard__status-item[data-time]');
  if (timeEl) {
    const now = new Date();
    timeEl.querySelector('span:last-child').textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
}

function initHeader(headerItems) {
  const headerCenter = document.querySelector('.ds-dashboard__header-center');
  
  if (headerCenter && headerItems && Array.isArray(headerItems)) {
    headerCenter.innerHTML = headerItems.map(item => `
      <button class="ds-btn ds-btn--${item.variant || 'ghost'} ds-btn--sm">${item.text}</button>
    `).join('');
  }
}

function setActiveSidebarItem(title) {
  const items = document.querySelectorAll('.ds-dashboard__sidebar-item');
  items.forEach(item => {
    if (item.getAttribute('data-title') === title) {
      item.classList.add('is-active');
    } else {
      item.classList.remove('is-active');
    }
  });
}

function setPageTitle(title, subtitle) {
  const contentTitle = document.querySelector('.ds-dashboard__content h1');
  const contentSubtitle = document.querySelector('.ds-dashboard__content p.text-secondary');
  
  if (contentTitle) contentTitle.textContent = title;
  if (contentSubtitle && subtitle) contentSubtitle.textContent = subtitle;
}

function setStatusItem(index, text, type) {
  const footerLeft = document.querySelector('.ds-dashboard__footer-left');
  const items = footerLeft.querySelectorAll('.ds-dashboard__status-item');
  
  if (items[index]) {
    items[index].innerHTML = `
      ${type === 'dot' ? '<span class="ds-dashboard__status-dot"></span>' : ''}
      <span>${text}</span>
    `;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDashboard,
    initSidebar,
    initStatusBar,
    initHeader,
    setActiveSidebarItem,
    setPageTitle,
    setStatusItem
  };
}