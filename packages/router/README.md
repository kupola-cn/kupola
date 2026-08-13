# @kupola/router

[![npm version](https://img.shields.io/npm/v/@kupola/router)](https://www.npmjs.com/package/@kupola/router)
[![License](https://img.shields.io/npm/l/@kupola/router)](https://github.com/kupola-cn/kupola/blob/main/LICENSE)

Lightweight SPA routing — Hash/History/Memory modes, route guards, auth integration, scroll management, and SSR support.

## Install

```bash
npm install @kupola/router
```

## Quick Start

```js
import { createApp } from '@kupola/platform';
import { createRouter, registerRouterLinkDirective, registerRouterViewDirective } from '@kupola/router';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: () => import('./pages/Home.js') },
    { path: '/users', component: () => import('./pages/Users.js') },
    { path: '/users/:id', component: () => import('./pages/UserDetail.js') },
  ],
});

registerRouterLinkDirective(router);
registerRouterViewDirective(router);

await createApp(AppRoot).use(router.install()).mountAsync('#app');
```

Template usage:

```js
import { html } from '@kupola/platform';

html`
  <nav>
    <a k-router-link="/users">Users</a>
  </nav>
  <main k-router-view></main>
`;
```

## Route Configuration

```js
const routes = [
  {
    path: '/dashboard',
    component: () => import('./Dashboard.js'),
    meta: { requiresAuth: true },
    children: [
      { path: 'stats', component: () => import('./Stats.js') },
    ],
  },
  { path: '/login', component: () => import('./Login.js') },
  { path: '*', redirect: '/login' },
];
```

## Navigation Guards

```js
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

router.afterEach((to, from) => {
  console.log('Navigated to:', to.path);
});
```

## Auth Guard (with @kupola/auth)

```js
import { setupAuthGuard } from '@kupola/router';
import { useAuth } from '@kupola/auth';

const { isAuthenticated } = useAuth();

setupAuthGuard(router, {
  loginPath: '/login',
  forbiddenPath: '/403',
  notFoundPath: '/404',
  isAuthenticated: () => isAuthenticated.value,
});
```

## Scroll Management

```js
import { createScrollManager } from '@kupola/router';

const scrollManager = createScrollManager(router);
// Automatically restores scroll position on back/forward navigation
```

## Transition Animations

```js
import { createTransitionManager } from '@kupola/router';

const transition = createTransitionManager(router, {
  enter: 'page-enter',
  leave: 'page-leave',
});
```

## SSR

```js
import { createServerRouter, matchRouteServer } from '@kupola/router';

const serverRouter = createServerRouter({ routes });
const { route, params } = await matchRouteServer(serverRouter, '/users/42');
```

## Router Instance API

```js
import { useRouter, useRoute } from '@kupola/router';

const router = useRouter();
const route = useRoute();

router.push('/users');      // Navigate
router.replace('/login');   // Replace current entry
router.go(-1);              // Go back
router.getCurrentRoute();   // { path, params, query, meta }
```

## Directives

| Directive | Attribute | Description |
|-----------|-----------|-------------|
| `k-router-link` | `k-router-link="/path"` | Navigate on click |
| `k-router-view` | `k-router-view` | Render matched component |

## Plugin

```js
import { createRouterPlugin } from '@kupola/router';

const plugin = createRouterPlugin(router);
// Compatible with createApp().use(plugin)
```

## API Reference

| API | Description |
|-----|-------------|
| `createRouter(options)` | Create router instance |
| `installRouter(router)` | Install router into app |
| `initRouter(router)` | Initialize and start listening |
| `createRouterPlugin(router)` | Create a plugin for createApp().use() |
| `useRouter()` | Get current router instance |
| `useRoute()` | Get current route reactive state |
| `registerRouterLinkDirective(router)` | Register k-router-link directive |
| `registerRouterViewDirective(router)` | Register k-router-view directive |
| `setupAuthGuard(router, options)` | Configure auth-based navigation guards |
| `matchRouteServer(router, path)` | Match route on server (SSR) |
| `createServerRouter(options)` | Create server-side router |
| `createScrollManager(router)` | Manage scroll restoration |
| `applyTransition(router, config)` | Apply transition classes |
| `createTransitionManager(router, config)` | Create transition lifecycle manager |

## License

MIT