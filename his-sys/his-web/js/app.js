/**
 * HIS 管理系统 - 前端核心逻辑
 * 适配 ds-dashboard icon-only 侧边栏布局
 */
(function () {
    'use strict';

    // ── 认证检查 ──────────────────────────────────────────
    const token = localStorage.getItem('his_token');
    if (!token) {
        window.location.href = '/static/login.html';
        return;
    }

    // ── API 封装 ──────────────────────────────────────────
    const api = {
        async request(url, options = {}) {
            const headers = {
                'Authorization': 'Bearer ' + localStorage.getItem('his_token'),
                'Content-Type': 'application/json',
                ...options.headers,
            };
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (data.code === 401 || res.status === 401) {
                localStorage.removeItem('his_token');
                localStorage.removeItem('his_user');
                window.location.href = '/static/login.html';
                return null;
            }
            return data;
        },
        get(url) { return this.request(url); },
        post(url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
        put(url, body) { return this.request(url, { method: 'PUT', body: JSON.stringify(body) }); },
        del(url) { return this.request(url, { method: 'DELETE' }); },
    };

    // ── 用户信息 ──────────────────────────────────────────
    const userInfo = JSON.parse(localStorage.getItem('his_user') || '{}');
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = userInfo.real_name || userInfo.username || '-';

    // ── 退出登录 ──────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('his_token');
            localStorage.removeItem('his_user');
            window.location.href = '/static/login.html';
        });
    }

    // ── 菜单定义 ──────────────────────────────────────────
    const menuConfig = [
        {
            title: '系统管理', icon: 'settings', code: 'system',
            children: [
                { title: '用户管理', icon: 'user', path: '/system/users', code: 'system:user', page: 'users' },
                { title: '组织管理', icon: 'home', path: '/system/organizations', code: 'system:org', page: 'organizations' },
                { title: '部门管理', icon: 'grid-2x2', path: '/system/departments', code: 'system:dept', page: 'departments' },
                { title: '角色管理', icon: 'shield', path: '/system/roles', code: 'system:role', page: 'roles' },
            ]
        },
        {
            title: '耗材管理', icon: 'box', code: 'material',
            children: [
                { title: '耗材目录', icon: 'file-text', path: '/material/catalog', code: 'material:catalog', page: 'materials' },
                { title: '供应商管理', icon: 'users', path: '/material/suppliers', code: 'material:supplier', page: 'suppliers' },
            ]
        },
        {
            title: '采购管理', icon: 'dollar', code: 'purchase',
            children: [
                { title: '采购订单', icon: 'file', path: '/purchase/orders', code: 'purchase:order', page: 'purchase-orders' },
            ]
        },
        {
            title: '库存管理', icon: 'layers', code: 'inventory',
            children: [
                { title: '库存查询', icon: 'table', path: '/inventory/list', code: 'inventory:view', page: 'inventory' },
            ]
        },
    ];

    // ── 渲染菜单（icon-only 侧边栏） ─────────────────────
    let userPermissions = [];

    async function loadMenus() {
        const data = await api.get('/api/auth/profile');
        if (data && data.code === 0) {
            userPermissions = data.data.permissions || [];
        }
        renderMenu();
        handleRoute();
    }

    function hasPermission(code) {
        return userPermissions.includes(code);
    }

    function renderMenu() {
        const nav = document.getElementById('sideNav');
        if (!nav) return;
        let html = '';

        // 首页图标（始终显示）
        html += `<a class="ds-dashboard__sidebar-item" data-page="home" data-title="首页">
            <img src="/static/icons/dashboard.svg" width="18" height="18" alt="首页" class="icon">
        </a>`;

        let firstGroup = true;

        menuConfig.forEach(group => {
            const visibleChildren = (group.children || []).filter(c => hasPermission(c.code));
            if (visibleChildren.length === 0) return;

            // 分组分隔线
            html += '<div class="ds-dashboard__sidebar-divider"></div>';

            visibleChildren.forEach(item => {
                html += `<a class="ds-dashboard__sidebar-item" data-page="${item.page}" data-path="${item.path}" data-title="${item.title}">
                    <img src="/static/icons/${item.icon}.svg" width="18" height="18" alt="${item.title}" class="icon">
                </a>`;
            });
        });

        nav.innerHTML = html;

        // 绑定点击事件
        nav.querySelectorAll('.ds-dashboard__sidebar-item').forEach(el => {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                const page = this.dataset.page;
                const title = this.dataset.title;
                window.location.hash = page;
                setActiveNav(this);
                loadPage(page, title);
            });
        });
    }

    function setActiveNav(activeEl) {
        document.querySelectorAll('.ds-dashboard__sidebar-item').forEach(el => el.classList.remove('is-active'));
        if (activeEl) activeEl.classList.add('is-active');
    }

    // ── 路由管理 ──────────────────────────────────────────
    function handleRoute() {
        const hash = window.location.hash.replace('#', '') || '';

        // 无 hash 时显示首页
        if (!hash) {
            const homeEl = document.querySelector('.ds-dashboard__sidebar-item[data-page="home"]');
            if (homeEl) setActiveNav(homeEl);
            loadPage('home', '首页');
            return;
        }

        let targetEl = null;
        document.querySelectorAll('.ds-dashboard__sidebar-item').forEach(el => {
            if (el.dataset.page === hash) targetEl = el;
        });

        if (targetEl) {
            setActiveNav(targetEl);
            loadPage(hash, targetEl.dataset.title);
        } else {
            // 未知路由，显示首页
            const homeEl = document.querySelector('.ds-dashboard__sidebar-item[data-page="home"]');
            if (homeEl) setActiveNav(homeEl);
            loadPage('home', '首页');
        }
    }

    window.addEventListener('hashchange', handleRoute);

    // ── 页面加载 ──────────────────────────────────────────
    async function loadPage(page, title) {
        const content = document.getElementById('mainContent');
        const headerTitle = document.getElementById('headerTitle');
        if (headerTitle) headerTitle.textContent = title || page;

        content.innerHTML = '<div class="page-header"><h2 class="page-header__title">' + (title || page) + '</h2></div><p style="color:var(--text-tertiary)">加载中...</p>';

        try {
            const res = await fetch('/static/pages/' + page + '.html');
            if (res.ok) {
                const html = await res.text();
                content.innerHTML = html;
                // 执行页面内联脚本
                const scripts = content.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            } else {
                content.innerHTML += '<p style="color:var(--text-tertiary)">页面不存在</p>';
            }
        } catch (e) {
            content.innerHTML += '<p style="color:var(--status-error-default)">加载失败</p>';
        }
    }

    // ── 底部时间 ──────────────────────────────────────────
    function updateFooterTime() {
        const el = document.getElementById('footerTime');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleString('zh-CN', { hour12: false });
        }
    }
    updateFooterTime();
    setInterval(updateFooterTime, 1000);

    // ── 启动 ──────────────────────────────────────────────
    loadMenus();

    // 暴露 api 给页面脚本使用
    window.HIS_API = api;
})();