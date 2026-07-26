# Router API 参考

## 核心 API

### createRouter

创建路由实例。

```js
const router = createRouter(options);
```

**参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `mode` | `'hash' \| 'history' \| 'memory'` | 路由模式，默认 `'history'` |
| `routes` | `RouteConfig[]` | 路由配置数组 |
| `base` | `string` | 基础路径，默认 `''` |
| `scrollBehavior` | `'auto' \| 'smooth' \| 'manual' \| Function` | 滚动行为，默认 `'auto'` |
| `transition` | `TransitionConfig` | 全局过渡配置 |

**返回值**：`Router` 实例

### Router 实例方法

| 方法 | 说明 |
|------|------|
| `push(location, options?)` | 导航到新路由，添加历史记录 |
| `replace(location, options?)` | 导航到新路由，替换当前历史记录 |
| `back()` | 返回上一页 |
| `forward()` | 前进到下一页 |
| `go(delta)` | 前进或后退指定页数 |
| `match(path)` | 匹配路由，返回路由信息 |
| `resolve(to)` | 根据路由名或路径解析完整路径 |
| `beforeEach(guard)` | 注册全局前置守卫 |
| `beforeResolve(guard)` | 注册全局解析守卫 |
| `afterEach(callback)` | 注册全局后置回调 |
| `onError(callback)` | 注册错误回调 |
| `init()` | 初始化路由 |
| `destroy()` | 销毁路由 |

### useRouter

获取当前路由实例。

```js
const router = useRouter();
```

### useRoute

获取当前路由信息。

```js
const route = useRoute();
// { path, name, params, query, meta, fullPath, matched }
```

### installRouter

安装路由实例到全局。

```js
installRouter(router);
```

## 路由配置

### RouteConfig

```js
{
  path: '/users/:id',           // 路径
  name: 'user-detail',          // 路由名称（可选）
  component: () => import('./UserDetail'),  // 组件
  components: { default, sidebar },  // 命名视图（可选）
  children: [...],              // 子路由（可选）
  meta: { requiresAuth: true }, // 元信息（可选）
  beforeEnter: (to, from) => {}, // 路由独享守卫（可选）
  beforeLeave: (to, from) => {}, // 路由独享守卫（可选）
  transition: {},               // 过渡配置（可选）
}
```

### 动态路由

```js
{ path: '/users/:id' }              // 必需参数
{ path: '/search/:keyword?' }       // 可选参数
{ path: '/posts/:year/:month/:day' } // 多个参数
```

### 通配符路由

```js
{ path: '*', name: 'not-found' }        // 匹配所有路径
{ path: '/users/*', name: 'users-catch' } // 匹配 /users/ 下所有路径
```

## 路由守卫

### 全局守卫

```js
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/login' };
  }
  return true;
});

router.beforeResolve((to, from) => {
  // 在路由解析前执行
});

router.afterEach((to, from) => {
  // 导航完成后执行
});
```

### 路由独享守卫

```js
{
  path: '/dashboard',
  beforeEnter: (to, from) => {
    console.log('Entering dashboard');
  },
  beforeLeave: (to, from) => {
    console.log('Leaving dashboard');
  },
}
```

### 组件内守卫

```js
export default {
  beforeRouteEnter(to, from, next) {
    // 在组件渲染前执行
    next();
  },
  beforeRouteUpdate(to, from, next) {
    // 在路由更新时执行（参数变化但组件复用）
    next();
  },
  beforeRouteLeave(to, from, next) {
    // 在离开路由时执行
    if (hasUnsavedChanges) {
      if (!confirm('Are you sure?')) return false;
    }
    next();
  },
};
```

## 指令

### k-router-link

```html
<a k-router-link="/dashboard">仪表盘</a>
<a k-router-link="/users" k-router-active-class="active">用户管理</a>
<a k-router-link="/login" k-router-replace>登录</a>
```

**属性**：

| 属性 | 说明 |
|------|------|
| `k-router-link` | 目标路径或命名路由对象 |
| `k-router-active-class` | 激活时的 CSS 类名 |
| `k-router-replace` | 是否使用 replace 模式 |

### k-router-view

```html
<div k-router-view></div>
<div k-router-view="sidebar"></div>
```

**属性**：

| 属性 | 说明 |
|------|------|
| `k-router-view` | 视图名称，默认 `'default'` |

## 过渡动画

### CSS 过渡

```css
.k-router-enter { opacity: 0; transform: translateX(20px); }
.k-router-enter-active { transition: all 0.3s ease; }
.k-router-enter-to { opacity: 1; transform: translateX(0); }

.k-router-leave { opacity: 1; transform: translateX(0); }
.k-router-leave-active { transition: all 0.3s ease; }
.k-router-leave-to { opacity: 0; transform: translateX(-20px); }
```

### JS 钩子

```js
const router = createRouter({
  transition: {
    onEnter: (el, done) => {
      gsap.from(el, { opacity: 0, x: 20, duration: 0.3, onComplete: done });
    },
    onLeave: (el, done) => {
      gsap.to(el, { opacity: 0, x: -20, duration: 0.3, onComplete: done });
    },
  },
});
```

## 滚动恢复

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { selector: to.hash };
    }
    return { x: 0, y: 0 };
  },
});
```

## 权限集成

### setupAuthGuard

```js
import { setupAuthGuard } from '@kupola/router/auth';
import { getAuthContext } from '@kupola/auth';

setupAuthGuard(router, {
  authContext: () => getAuthContext(),
  loginPath: '/login',
  forbiddenPath: '/403',
  notFoundPath: '/404',
});
```

## SSR 支持

### matchRouteServer

```js
import { matchRouteServer } from '@kupola/router/server';

const match = matchRouteServer(routes, req.path, { query: req.query });
```

### createServerRouter

```js
import { createServerRouter } from '@kupola/router/server';

const serverRouter = createServerRouter({ routes });
const match = serverRouter.match('/users/123');
```
