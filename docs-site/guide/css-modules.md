# CSS Modules — 作用域样式

Kupola 提供 `css` 标签模板字面量来实现组件级作用域样式。每个 CSS 模板会生成唯一的类名前缀，自动避免全局样式冲突。样式通过 `<style>` 标签注入到 `<head>` 中，支持去重和引用计数。

## 快速开始

```js
import { css } from '@kupola/platform'

const styles = css`
  .root { color: red; }
  .item { padding: 8px; }
  .item:hover { color: blue; }
`

// styles.root === "k0-root"
// styles.item === "k0-item"

// 在模板中使用
html`<div class="${styles.root}">
  <span class="${styles.item}">Hello</span>
</div>`

// 组件卸载时清理
styles.dispose()
```

## API 参考

### css

`css` 是一个标签模板字面量（tagged template literal），接收 CSS 文本并返回一个类名映射对象。

```js
const styles = css`
  .root { color: red; }
  .item { padding: 8px; }
`
```

**返回值**：`CssModuleResult` — 类名映射对象，每个原始类名映射到带作用域前缀的类名。附带 `dispose()` 方法。

```js
{
  root: "k0-root",
  item: "k0-item",
  dispose: () => { /* 移除注入的 <style> 标签 */ },
}
```

**类名提取规则**：

- `css` 会扫描 CSS 文本中所有以 `.` 开头的类选择器，提取类名。
- 每个类名会被重写为 `{scopeId}-{className}` 格式（如 `k0-root`）。
- 返回对象中只包含被扫描到的类名，未使用的类名不会出现。

## 作用域隔离

### 基本作用域

每个 `css` 调用生成唯一的 scope ID（`k0`, `k1`, `k2`, ...），所有类选择器都被重写：

```js
const styles = css`
  .card { border: 1px solid #ccc; }
  .card .title { font-size: 16px; }
  .card:hover { border-color: blue; }
`

// 注入的 CSS:
// .k0-card { border: 1px solid #ccc; }
// .k0-card .k0-title { font-size: 16px; }
// .k0-card:hover { border-color: blue; }
```

### :global() 全局选择器

使用 `:global()` 包裹不需要作用域处理的选择器：

```js
const styles = css`
  .root { color: red; }
  :global(.external) { font-size: 14px; }
  :global(.parent .child) { margin: 0; }
  :global(:not(.excluded)) { padding: 0; }
`

// styles.root 存在，但 styles.external 不存在
// 注入的 CSS 中 :global(.external) 保持原样
```

`:global()` 内的类名不会被扫描到返回对象中，也不会被作用域重写。

### :scope 占位符

`:scope` 会被替换为当前作用域类名：

```js
const styles = css`
  :scope { display: block; }
  :scope:hover { opacity: 0.8; }
`

// 注入的 CSS:
// .k0 { display: block; }
// .k0:hover { opacity: 0.8; }
```

### @keyframes 作用域

`@keyframes` 动画名称也会被作用域化，同时 `animation` 和 `animation-name` 中的引用也会被更新：

```js
const styles = css`
  .root { animation: fadeIn 1s; }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

// 注入的 CSS:
// .k0-root { animation: k0-fadeIn 1s; }
// @keyframes k0-fadeIn { ... }
```

## 去重机制

多次调用 `css` 使用相同 CSS 文本时，只会注入一次 `<style>` 标签，并返回相同的 scope ID 和类名映射：

```js
const a = css`.x { color: red; }`
const b = css`.x { color: red; }`

console.log(a === b) // false（不同对象）
console.log(a.x === b.x) // true（相同类名）
// DOM 中只有一个 <style> 标签
```

内部通过引用计数管理：每次使用相同 CSS 文本时递增计数，每次 `dispose()` 时递减计数。引用计数归零时才真正移除 `<style>` 标签。

## dispose()

释放对样式标签的引用。当最后一个引用被释放时，移除 DOM 中的 `<style>` 标签。

```js
const styles = css`.card { padding: 16px; }`

// 组件卸载时调用
styles.dispose()

// 幂等：多次调用安全
styles.dispose()
```

> **重要**：在组件销毁时调用 `dispose()` 以避免内存泄漏。如果忘记调用，样式标签会一直保留在 DOM 中。

## 模板插值

`css` 标签模板支持插值，适合动态值（如主题变量）：

```js
const color = '#3b82f6'
const padding = '16px'

const styles = css`
  .root {
    color: ${color};
    padding: ${padding};
  }
`
```

插值后的完整 CSS 文本用于去重匹配。如果插值相同，则复用缓存；插值不同，则创建新的作用域。

## 完整示例

```js
import { defineComponent, html, css } from '@kupola/platform'
import { signal } from '@kupola/core'

const Card = defineComponent({
  setup({ props }) {
    const expanded = signal(false)

    const styles = css`
      :scope {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        transition: box-shadow 0.2s;
      }
      :scope:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      }
      .title {
        font-size: 16px;
        font-weight: 600;
      }
      .body {
        margin-top: 12px;
        animation: slideDown 0.3s ease;
      }
      .toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
        transform: ${() => expanded.value ? 'rotate(180deg)' : 'rotate(0deg)'};
        transition: transform 0.2s;
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      :global(.dark-mode) :scope {
        border-color: #333;
        background: #1a1a1a;
      }
    `

    return {
      styles,
      expanded,
      toggle: () => { expanded.value = !expanded.value },
      destroy: () => styles.dispose(),
    }
  },

  destroyed({ styles }) {
    // 组件销毁时清理样式
    styles.dispose()
  },
})
```

## 最佳实践

### 每个组件一个 css 调用

```js
const Panel = defineComponent({
  setup() {
    const styles = css`
      .panel { /* ... */ }
      .header { /* ... */ }
      .body { /* ... */ }
    `
    return { styles, destroy: () => styles.dispose() }
  },
  destroyed({ destroy }) {
    destroy()
  },
})
```

### 配合 effectScope 自动清理

```js
import { effectScope, onScopeDispose } from '@kupola/core'

const scope = effectScope()
scope.run(() => {
  const styles = css`.my-component { /* ... */ }`
  onScopeDispose(() => styles.dispose())
  // ...
})
```

### 避免在循环中创建

```js
// ❌ 不推荐 — 每次渲染创建新样式标签
items.forEach(item => {
  const styles = css`.item { color: ${item.color}; }`
})

// ✅ 推荐 — 使用 CSS 变量
const styles = css`
  .item { color: var(--item-color); }
`
items.forEach(item => {
  el.style.setProperty('--item-color', item.color)
})
```