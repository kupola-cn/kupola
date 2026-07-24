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
