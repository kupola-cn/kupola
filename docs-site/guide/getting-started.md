# 快速开始

## 安装

```bash
npm install @kupola/kupola
```

## 基础用法

```js
import { signal, html, render } from '@kupola/kupola'

const count = signal(0)

const template = html`
  <div>
    <p>Count: ${count}</p>
    <button @click=${() => count.value++}>+1</button>
  </div>
`

render(template, document.getElementById('app'))
```

## 按需引入

```js
import { Modal } from '@kupola/kupola/components/modal'
import { Table } from '@kupola/kupola/components/table'
```

## 指令系统

```html
<div k-data="{ name: 'World' }">
  <h1 k-text="'Hello, ' + name"></h1>
  <input k-model="name" />
</div>
```

使用 `walk()` 初始化：

```js
import { walk } from '@kupola/kupola'
walk(document.body)
```
