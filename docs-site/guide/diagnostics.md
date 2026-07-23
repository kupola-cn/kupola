# 诊断信息

Kupola 的运行时诊断使用稳定 code，方便搜索日志、编写测试和定位文档。

格式：

```txt
[kupola W001] <button> has an empty @click expression.
[kupola E001] Error evaluating k-text on <span>: user.name
```

核心运行时只包含 code 和简短消息。详细原因和修复建议放在文档中，避免增加核心库体积。

## Errors

| Code | 含义 | 推荐修复 |
| --- | --- | --- |
| `E001` | 指令表达式执行失败。 | 检查表达式中的变量是否存在、对象是否为 `null`、方法是否抛错。 |
| `E002` | `k-for` 表达式格式错误。 | 使用 `item in items` 或 `(item, index) in items`。 |
| `E003` | `k-data` 解析失败的兜底错误。 | 检查 `k-data` 表达式是否是对象字面量或已注册的 scope 名称。 |

## Warnings

| Code | 含义 | 推荐修复 |
| --- | --- | --- |
| `W001` | 需要表达式的指令为空。 | 补上表达式，或删除该指令。 |
| `W002` | 指令缺少必要参数，例如 `k-on` 没有事件名。 | 使用 `@click="..."` 或 `k-on:click="..."`。 |
| `W003` | `k-model` 用在了非表单元素上。 | 只在 `<input>`、`<select>`、`<textarea>` 上使用 `k-model`。 |
| `W004` | 同一次 `k-for` 渲染中出现重复 key。 | 使用数据库 id、稳定业务 id，或生成唯一 key。 |
| `W005` | 同一元素同时使用 `k-for` 和 `k-if`。 | 用外层包裹拆开列表和条件生命周期。 |
| `W006` | 同一元素同时使用 `k-class` 和 `:class` / `k-bind:class`。 | 条件 class 用 `k-class`，完整替换 class 才用 `:class`。 |
| `W007` | 同一元素同时使用 `k-style` 和 `:style` / `k-bind:style`。 | 条件 style 用 `k-style`，完整替换 style 才用 `:style`。 |
| `W008` | 同一元素同时使用 `k-model` 和 `:checked` / `k-bind:checked`。 | 让 `k-model` 独占 checked 状态。 |
| `W009` | 同一元素同时使用 `k-model` 和 `:value` / `k-bind:value`。 | 让 `k-model` 独占 value 状态；checkbox/radio 的动态 value 除外。 |
| `W010` | `k-else-if` / `k-else` 没有紧邻 `k-if`。 | 把分支放在同一层级并紧跟 `k-if` 后面。 |
| `W011` | `k-transition` 没有配合 `k-show` 或 `k-if`。 | 加上 `k-show` / `k-if`，或删除 `k-transition`。 |
| `W012` | 同一个 root 被重复 `walk()`。 | 使用 `walkOnce()`，或先 `destroyWalk(root)` 再重新初始化。 |
| `W013` | `k-data` 引用了未注册的命名 scope。 | 先调用 `defineScope(name, ...)`，或改成对象字面量。 |

## 常见示例

空表达式：

```html
<!-- 会触发 W001 -->
<button @click="">保存</button>
```

修复：

```html
<button @click="save()">保存</button>
```

重复初始化：

```js
// 会触发 W012
walk(root)
walk(root)
```

修复：

```js
walkOnce(root)
```

或在替换后端片段前销毁旧实例：

```js
destroyWalk(root)
root.innerHTML = await fetch('/users/fragment').then(r => r.text())
walkOnce(root)
```
