# 服务端渲染 (SSR)

Kupola 支持 SSR 和 hydration。

## 服务端渲染

```js
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'

const count = signal(42)
const template = html`<p>Count: ${count}</p>`

const html = renderToString(template)
// <p>Count: 42<!--6--></p>
```

## 客户端 Hydration

```js
import { hydrate } from '@kupola/platform/render'

// 服务端渲染的 HTML 已存在于 DOM 中
const template = html`<p>Count: ${count}</p>`
hydrate(template, document.getElementById('app'))
```

## 工作原理

1. 服务端：`renderToString()` 生成 HTML + 注释标记
2. 客户端：`hydrate()` 复用现有 DOM，绑定响应式效果
3. 无重复 DOM 操作，性能最优

## Node.js 使用

```js
// server.js
import express from 'express'
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'

const app = express()

app.get('/', (req, res) => {
  const count = signal(0)
  const template = html`<div id="app"><p>Count: ${count}</p></div>`
  const body = renderToString(template)
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        ${body}
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `)
})
```

---

## renderToString(component)

服务端渲染函数，将 Kupola 组件或模板渲染为 HTML 字符串。渲染过程中会插入 hydration 标记，供客户端 hydrate 使用。

### 基本用法

```js
import { html } from '@kupola/platform/template'
import { signal, computed } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'

// 渲染静态模板
const staticHtml = renderToString(html`<h1>Hello World</h1>`)
// <h1>Hello World</h1>

// 渲染带信号的模板
const count = signal(0)
const dynamicHtml = renderToString(html`<p>计数: ${count}</p>`)
// <p>计数: 0<!--6--></p>

// 渲染计算属性
const double = computed(() => count() * 2)
const computedHtml = renderToString(html`<p>双倍: ${double}</p>`)
// <p>双倍: 0<!--6--></p>

// 渲染条件渲染
const show = signal(true)
const conditionalHtml = renderToString(html`
  <div>
    ${() => show() ? html`<p>可见内容</p>` : html`<p>隐藏内容</p>`}
  </div>
`)
// <div><!--6--><p>可见内容</p><!--7--></div>

// 渲染列表
const items = signal(['A', 'B', 'C'])
const listHtml = renderToString(html`
  <ul>
    ${() => items().map(item => html`<li>${item}</li>`)}
  </ul>
`)
// <ul><!--6--><li>A</li><li>B</li><li>C</li><!--7--></ul>
```

### 渲染选项

```js
import { renderToString } from '@kupola/platform/server'

const result = renderToString(component, {
  // 是否包含 hydration 标记（默认 true）
  hydration: true,

  // 自定义缩进
  indent: '  ',

  // 自定义序列化器
  serializer: (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  },
})
```

---

## hydrate(component, container)

客户端 hydration 函数，将服务端渲染的静态 HTML 激活为可交互的响应式应用。

### 基本用法

```js
// client.js
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'
import { hydrate } from '@kupola/platform/render'

const count = signal(0)
const template = html`
  <div id="app">
    <p>当前计数: ${count}</p>
    <button onclick="${() => count.update(v => v + 1)}">+1</button>
  </div>
`

// hydrate 复用服务端已渲染的 DOM，绑定事件和响应式效果
hydrate(template, document.getElementById('root'))
```

### 带初始状态的 Hydration

服务端渲染时可以将初始状态序列化到 HTML 中，客户端 hydrate 时恢复。

```js
// server.js — 服务端
import { renderToString } from '@kupola/platform/server'

const initialState = { count: 42, user: { name: 'Alice' } }

const template = html`<div id="app">...</div>`
const body = renderToString(template)

const html = `
  <!DOCTYPE html>
  <html>
    <body>
      <div id="root">${body}</div>
      <script>
        // 将初始状态注入到全局变量
        window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
      </script>
      <script type="module" src="/client.js"></script>
    </body>
  </html>
`
```

```js
// client.js — 客户端
import { hydrate } from '@kupola/platform/render'
import { signal } from '@kupola/core'

// 从服务端注入的状态恢复
const initialState = window.__INITIAL_STATE__
const count = signal(initialState.count)
const user = signal(initialState.user)

const template = html`
  <div id="app">
    <p>用户: ${() => user().name}</p>
    <p>计数: ${count}</p>
    <button onclick="${() => count.update(v => v + 1)}">+1</button>
  </div>
`

hydrate(template, document.getElementById('root'))
```

---

## Hydration 标记

Kupola 在服务端渲染时会在 HTML 中插入注释标记，客户端 hydrate 时通过这些标记定位动态节点。

### 标记格式

```html
<!-- 服务端渲染输出 -->
<div id="app">
  <h1>用户列表</h1>
  <!--6-->                          <!-- 动态区域开始标记 -->
  <ul>
    <li>Alice</li>                 <!-- 静态内容，无标记 -->
    <li>Bob</li>
  </ul>
  <!--7-->                          <!-- 动态区域结束标记 -->
  <p>总计: <!--8-->2<!--9--> 人</p>  <!-- 文本插值标记 -->
</div>
```

### 标记类型

| 标记模式 | 说明 |
| --- | --- |
| `<!--N-->` | 动态区域开始/结束标记，N 为标记 ID |
| `<!--N-->value<!--N+1-->` | 文本插值标记，包裹动态文本值 |
| `<!--N--><!--N+1-->` | 空标记对，表示条件渲染的占位 |

### 标记的作用

```js
// 服务端渲染时自动生成标记
const show = signal(true)
const html = renderToString(html`
  <div>
    ${() => show() ? html`<span>可见</span>` : null}
  </div>
`)
// 输出: <div><!--6--><span>可见</span><!--7--></div>

// 客户端 hydrate 时：
// 1. 找到标记 <!--6--> 和 <!--7--> 之间的 DOM 范围
// 2. 复用这些 DOM 节点（不重新创建）
// 3. 绑定响应式效果：当 show 变为 false 时，移除 <span>
// 4. 当 show 变为 true 时，重新插入 <span>
```

---

## 组件状态同步

Hydration 过程中，客户端组件的状态需要与服务端渲染的状态保持一致。

```js
// ==========================================
// 共享组件定义
// ==========================================
// components/Counter.js
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'

export function Counter(initialCount = 0) {
  const count = signal(initialCount)

  return html`
    <div class="counter">
      <button onclick="${() => count.update(v => v - 1)}">-</button>
      <span>${count}</span>
      <button onclick="${() => count.update(v => v + 1)}">+</button>
    </div>
  `
}

// ==========================================
// 服务端
// ==========================================
// server.js
import { renderToString } from '@kupola/platform/server'
import { Counter } from './components/Counter.js'

app.get('/', (req, res) => {
  const counter = Counter(10) // 初始值为 10
  const body = renderToString(html`
    <div id="app">
      <h1>计数器</h1>
      ${counter}
    </div>
  `)

  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${body}</div>
        <script>
          window.__INITIAL_COUNT__ = 10;
        </script>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `)
})

// ==========================================
// 客户端
// ==========================================
// client.js
import { hydrate } from '@kupola/platform/render'
import { Counter } from './components/Counter.js'

// 使用与服务端相同的初始值
const initialCount = window.__INITIAL_COUNT__
const counter = Counter(initialCount)

const template = html`
  <div id="app">
    <h1>计数器</h1>
    ${counter}
  </div>
`

hydrate(template, document.getElementById('root'))
```

---

## 流式 SSR (Streaming)

对于大型页面，可以使用流式渲染，逐步发送 HTML 到客户端。

```js
// server.js
import { renderToStream } from '@kupola/platform/server'
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'

app.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  // 发送头部
  res.write('<!DOCTYPE html><html><head><title>Streaming SSR</title></head><body>')

  // 流式渲染主体内容
  const stream = renderToStream(html`
    <div id="app">
      <header>页面头部</header>
      <main>
        ${() => {
          // 模拟异步数据加载
          const data = signal(null)
          fetchData().then(d => data.set(d))
          return html`<div>${() => data() ? JSON.stringify(data()) : '加载中...'}</div>`
        }}
      </main>
      <footer>页面底部</footer>
    </div>
  `)

  // 将渲染流管道输出
  for await (const chunk of stream) {
    res.write(chunk)
  }

  // 发送尾部
  res.write('<script type="module" src="/client.js"></script></body></html>')
  res.end()
})
```

### 流式渲染注意事项

- 流式渲染时，hydration 标记仍然正常生成。
- 客户端 hydrate 需要等待完整 HTML 到达后才能执行。
- 流式渲染适合大型页面，可减少首字节时间（TTFB）。
- 需要在客户端监听 `DOMContentLoaded` 或使用 `defer` 脚本确保 hydrate 在完整 DOM 加载后执行。

---

## Express 集成示例

完整的 Express + Kupola SSR 集成示例。

```js
// ==========================================
// server.js — Express 服务端
// ==========================================
import express from 'express'
import { html } from '@kupola/platform/template'
import { signal, computed } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'

const app = express()

// 静态资源服务
app.use(express.static('public'))
app.use('/client', express.static('client'))

// 模拟数据服务
const mockUsers = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', active: true },
  { id: 2, name: '李四', email: 'lisi@example.com', active: false },
  { id: 3, name: '王五', email: 'wangwu@example.com', active: true },
]

// HTML 模板包装器
function renderPage(title, body, initialState = {}) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div id="root">${body}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
        </script>
        <script type="module" src="/client/app.js"></script>
      </body>
    </html>
  `
}

// 首页路由
app.get('/', (req, res) => {
  const title = signal('Kupola SSR 示例')
  const userCount = signal(mockUsers.length)

  const body = renderToString(html`
    <div id="app">
      <h1>${title}</h1>
      <p>当前用户数: ${userCount}</p>
      <nav>
        <a href="/users">用户列表</a>
      </nav>
    </div>
  `)

  res.send(renderPage('首页', body, {
    userCount: mockUsers.length,
  }))
})

// 用户列表路由
app.get('/users', (req, res) => {
  const users = signal(mockUsers)
  const activeCount = computed(() => users().filter(u => u.active).length)

  const body = renderToString(html`
    <div id="app">
      <h1>用户列表</h1>
      <p>总计 ${() => users().length} 人，活跃 ${activeCount} 人</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${() => users().map(user => html`
            <tr>
              <td>${user.id}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.active ? '✅ 活跃' : '❌ 禁用'}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `)

  res.send(renderPage('用户列表', body, {
    users: mockUsers,
  }))
})

// API 路由
app.get('/api/users', (req, res) => {
  res.json(mockUsers)
})

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000')
})
```

```js
// ==========================================
// client/app.js — 客户端入口
// ==========================================
import { html } from '@kupola/platform/template'
import { signal, computed } from '@kupola/core'
import { hydrate } from '@kupola/platform/render'

// 从服务端恢复初始状态
const initialState = window.__INITIAL_STATE__ || {}

// 根据当前路径渲染对应组件
const path = window.location.pathname

if (path === '/') {
  const title = signal('Kupola SSR 示例')
  const userCount = signal(initialState.userCount || 0)

  hydrate(html`
    <div id="app">
      <h1>${title}</h1>
      <p>当前用户数: ${userCount}</p>
      <nav>
        <a href="/users">用户列表</a>
      </nav>
    </div>
  `, document.getElementById('root'))

} else if (path === '/users') {
  const users = signal(initialState.users || [])
  const activeCount = computed(() => users().filter(u => u.active).length)

  hydrate(html`
    <div id="app">
      <h1>用户列表</h1>
      <p>总计 ${() => users().length} 人，活跃 ${activeCount} 人</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${() => users().map(user => html`
            <tr>
              <td>${user.id}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.active ? '✅ 活跃' : '❌ 禁用'}</td>
            </tr>
          `)}
        </tbody>
      </table>
      <button onclick="${async () => {
        const res = await fetch('/api/users')
        const newUsers = await res.json()
        users.set(newUsers)
      }}">刷新数据</button>
    </div>
  `, document.getElementById('root'))
}
```

---

## Fastify 集成示例

使用 Fastify 框架的 Kupola SSR 集成。

```js
// ==========================================
// server.js — Fastify 服务端
// ==========================================
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { html } from '@kupola/platform/template'
import { signal } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = Fastify({ logger: true })

// 注册静态文件服务
app.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/public/',
})

// HTML 模板包装器
function renderPage(title, body, initialState = {}) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body>
        <div id="root">${body}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
        </script>
        <script type="module" src="/public/client.js"></script>
      </body>
    </html>
  `
}

// 首页路由
app.get('/', async (req, reply) => {
  const title = signal('Fastify + Kupola SSR')
  const message = signal('你好，世界！')

  const body = renderToString(html`
    <div id="app">
      <h1>${title}</h1>
      <p>${message}</p>
      <button onclick="${() => message.set('已更新！')}">点击更新</button>
    </div>
  `)

  reply.type('text/html').send(renderPage('首页', body, {
    message: '你好，世界！',
  }))
})

// 带数据获取的路由
app.get('/posts', async (req, reply) => {
  // 在服务端获取数据
  const posts = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10')
    .then(res => res.json())

  const postsSignal = signal(posts)
  const count = signal(posts.length)

  const body = renderToString(html`
    <div id="app">
      <h1>文章列表（共 ${count} 篇）</h1>
      <ul>
        ${() => postsSignal().map(post => html`
          <li>
            <h3>${post.title}</h3>
            <p>${post.body.substring(0, 100)}...</p>
          </li>
        `)}
      </ul>
    </div>
  `)

  reply.type('text/html').send(renderPage('文章列表', body, {
    posts,
  }))
})

// 启动服务
const start = async () => {
  try {
    await app.listen({ port: 3000 })
    console.log('Fastify 服务器运行在 http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

---

## 完整示例：全栈 SSR 页面

以下是一个完整的 SSR 页面示例，涵盖服务端渲染、状态注入、客户端 hydration 和交互。

```js
// ==========================================
// server.js — 完整的 Express 服务端
// ==========================================
import express from 'express'
import { html } from '@kupola/platform/template'
import { signal, computed } from '@kupola/core'
import { renderToString } from '@kupola/platform/server'

const app = express()

// 静态资源
app.use(express.static('public'))
app.use(express.json())

// 模拟数据库
let todos = [
  { id: 1, text: '学习 Kupola SSR', done: true },
  { id: 2, text: '编写应用代码', done: false },
  { id: 3, text: '部署到生产环境', done: false },
]
let nextId = 4

// HTML 页面模板
function renderApp(title, body, state = {}) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
          h1 { margin-bottom: 20px; color: #333; }
          .todo-list { list-style: none; }
          .todo-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #eee; }
          .todo-item.done span { text-decoration: line-through; color: #999; }
          .add-form { display: flex; gap: 8px; margin-bottom: 20px; }
          .add-form input { flex: 1; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
          .add-form button { padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          .stats { color: #666; font-size: 14px; margin-bottom: 16px; }
          button:hover { opacity: 0.8; }
        </style>
      </head>
      <body>
        <div id="root">${body}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(state)};
        </script>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `
}

// 首页路由 — SSR
app.get('/', (req, res) => {
  const todoList = signal(todos)
  const doneCount = computed(() => todoList().filter(t => t.done).length)
  const totalCount = computed(() => todoList().length)

  const body = renderToString(html`
    <div id="app">
      <h1>📝 待办事项</h1>

      <p class="stats">
        已完成 ${doneCount} / ${totalCount} 项
      </p>

      <form class="add-form" onsubmit="${(e) => {
        e.preventDefault()
        // 表单提交将通过客户端 JS 处理
      }}">
        <input
          type="text"
          name="newTodo"
          placeholder="添加新的待办事项..."
          autocomplete="off"
        />
        <button type="submit">添加</button>
      </form>

      <ul class="todo-list">
        ${() => todoList().map(todo => html`
          <li class="todo-item ${todo.done ? 'done' : ''}">
            <input
              type="checkbox"
              ${todo.done ? 'checked' : ''}
              data-id="${todo.id}"
            />
            <span>${todo.text}</span>
            <button
              data-id="${todo.id}"
              style="margin-left: auto; background: none; border: none; color: #ff4d4f; cursor: pointer;"
            >删除</button>
          </li>
        `)}
      </ul>

      ${() => todoList().length === 0 ? html`<p style="color: #999; text-align: center;">暂无待办事项</p>` : ''}
    </div>
  `)

  res.send(renderApp('待办事项', body, { todos }))
})

// API 路由
app.get('/api/todos', (req, res) => res.json(todos))

app.post('/api/todos', (req, res) => {
  const { text } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: '内容不能为空' })
  }
  const todo = { id: nextId++, text: text.trim(), done: false }
  todos.push(todo)
  res.status(201).json(todo)
})

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const todo = todos.find(t => t.id === id)
  if (!todo) return res.status(404).json({ error: '未找到' })
  Object.assign(todo, req.body)
  res.json(todo)
})

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const index = todos.findIndex(t => t.id === id)
  if (index === -1) return res.status(404).json({ error: '未找到' })
  todos.splice(index, 1)
  res.json({ success: true })
})

app.listen(3000, () => {
  console.log('✅ 服务运行在 http://localhost:3000')
})
```

```js
// ==========================================
// client.js — 客户端 hydration
// ==========================================
import { html } from '@kupola/platform/template'
import { signal, computed } from '@kupola/core'
import { hydrate } from '@kupola/platform/render'

// 从服务端恢复状态
const initialState = window.__INITIAL_STATE__ || {}
const todoList = signal(initialState.todos || [])
const doneCount = computed(() => todoList().filter(t => t.done).length)
const totalCount = computed(() => todoList().length)

// 定义模板
const template = html`
  <div id="app">
    <h1>📝 待办事项</h1>

    <p class="stats">
      已完成 ${doneCount} / ${totalCount} 项
    </p>

    <form class="add-form" onsubmit="${async (e) => {
      e.preventDefault()
      const input = e.target.elements.newTodo
      const text = input.value.trim()
      if (!text) return

      // 调用 API 添加
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (res.ok) {
        const newTodo = await res.json()
        todoList.update(list => [...list, newTodo])
        input.value = ''
      }
    }}">
      <input
        type="text"
        name="newTodo"
        placeholder="添加新的待办事项..."
        autocomplete="off"
      />
      <button type="submit">添加</button>
    </form>

    <ul class="todo-list">
      ${() => todoList().map(todo => html`
        <li class="todo-item ${todo.done ? 'done' : ''}">
          <input
            type="checkbox"
            ${todo.done ? 'checked' : ''}
            data-id="${todo.id}"
            onchange="${async (e) => {
              const done = e.target.checked
              const id = parseInt(e.target.dataset.id)
              await fetch('/api/todos/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done }),
              })
              todoList.update(list =>
                list.map(t => t.id === id ? { ...t, done } : t)
              )
            }}"
          />
          <span>${todo.text}</span>
          <button
            data-id="${todo.id}"
            style="margin-left: auto; background: none; border: none; color: #ff4d4f; cursor: pointer;"
            onclick="${async (e) => {
              const id = parseInt(e.target.dataset.id)
              await fetch('/api/todos/' + id, { method: 'DELETE' })
              todoList.update(list => list.filter(t => t.id !== id))
            }}"
          >删除</button>
        </li>
      `)}
    </ul>

    ${() => todoList().length === 0 ? html`<p style="color: #999; text-align: center;">暂无待办事项</p>` : ''}
  </div>
`

// Hydrate: 复用服务端 DOM，绑定事件
hydrate(template, document.getElementById('root'))
```

---

## 说明

- `renderToString()` 是同步的，适合大多数 SSR 场景。
- `renderToStream()` 适合大型页面，可逐步发送 HTML 减少 TTFB。
- Hydration 标记是 Kupola 内部实现细节，通常不需要手动处理。
- 服务端和客户端必须使用相同的组件定义和初始状态，否则会导致 hydration 不匹配。
- 客户端 hydrate 必须在服务端渲染的 DOM 完全加载后执行（使用 `defer` 或在 `DOMContentLoaded` 后调用）。
- 状态序列化（`window.__INITIAL_STATE__`）是实现服务端-客户端状态同步的推荐方式。
- SSR 场景下，事件处理函数（如 `onclick`）在服务端不会执行，仅在客户端 hydrate 后绑定。