# Router 简介

> `@kupola/router` — 完整的轻量级 SPA 路由库，支持嵌套路由、路由守卫、动画过渡和权限集成。

## 什么是 Router？

Router 是 Kupola 的独立路由包，提供**声明式路由配置 → 路由匹配 → 导航控制 → 视图渲染**的完整链路。

你可以用它来：

- **定义路由**：声明式配置路径、组件、嵌套关系
- **导航控制**：支持 Hash/History/Memory 三种模式
- **路由守卫**：全局守卫、路由独享守卫、组件内守卫
- **嵌套路由**：实现复杂布局（如管理后台侧边栏 + 内容区）
- **路由动画**：CSS 过渡类 + JS 钩子，支持 GSAP 等动画库
- **权限集成**：与 `@kupola/auth` 深度集成，开箱即用的权限路由

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    @kupola/router                           │
├─────────────────────────────────────────────────────────────┤
│  路由配置          路由模式          导航工具               │
│  Routes Config    Hash/History     Link Directive          │
│  Nested Routes    Memory           RouterView Directive    │
│  Dynamic Params                    Programmatic Nav        │
├─────────────────────────────────────────────────────────────┤
│  路由守卫                    路由匹配                      │
│  beforeEach                  Route Matcher                │
│  beforeResolve               Dynamic Params               │
│  afterEach                   Wildcard Routes              │
│  beforeEnter/beforeLeave     Nested Route Matching        │
├─────────────────────────────────────────────────────────────┤
│  路由动画          滚动恢复          权限集成                │
│  CSS Transitions  Scroll Restore   @kupola/auth            │
│  JS Hooks         Scroll Position  Permission Guard        │
└─────────────────────────────────────────────────────────────┘
```

## 安装

```bash
npm install @kupola/router
```

> `@kupola/core ^3.0.0` 和 `@kupola/platform ^3.0.0` 作为 peer dependency 自动要求安装。

## 快速开始

```js
import { createRouter, registerRouterLinkDirective, registerRouterViewDirective, installRouter } from '@kupola/router';
import { walk } from '@kupola/platform/directives';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', name: 'home', component: () => import('./Home') },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('./Dashboard'),
      children: [
        { path: '', name: 'dashboard-home', component: () => import('./Dashboard/Home') },
        { path: 'settings', name: 'dashboard-settings', component: () => import('./Dashboard/Settings') },
      ],
    },
    { path: '/users/:id', name: 'user-detail', component: () => import('./UserDetail') },
    { path: '*', name: 'not-found', component: () => import('./NotFound') },
  ],
});

installRouter(router);
router.init();

walk(document.body);
registerRouterLinkDirective(walk);
registerRouterViewDirective(walk);
```

```html
<a k-router-link="/dashboard">仪表盘</a>
<a k-router-link="/users/1">用户详情</a>

<div k-router-view></div>
```

## 核心概念

| 概念 | 说明 |
|------|------|
| **路由配置** | 声明式定义路径、组件、子路由、元信息 |
| **路由模式** | Hash / History / Memory 三种导航模式 |
| **路由匹配** | 支持动态参数、可选参数、通配符路由 |
| **嵌套路由** | 父路由包含子路由，通过 RouterView 渲染 |
| **路由守卫** | 导航前后执行的钩子函数，用于权限校验 |
| **Link 指令** | 声明式导航链接，自动处理点击事件 |
| **RouterView** | 路由视图容器，自动渲染匹配的组件 |
| **编程式导航** | `router.push()` / `router.replace()` / `router.back()` |

## 与 @kupola/auth 集成

Router 与 Auth 深度集成，可通过 `setupAuthGuard` 快速实现权限路由：

```js
import { createRouter } from '@kupola/router';
import { setupAuthGuard } from '@kupola/router/auth';
import { getAuthContext, onAuthContextChange } from '@kupola/auth';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/admin', name: 'admin', component: () => import('./Admin'), meta: { requiresAuth: true, permission: 'admin' } },
  ],
});

setupAuthGuard(router, {
  authContext: () => getAuthContext(),
  onAuthChange: onAuthContextChange,
  loginPath: '/login',
  forbiddenPath: '/403',
});
```

## 下一步

- [API 参考](./api) — 完整 API 文档
