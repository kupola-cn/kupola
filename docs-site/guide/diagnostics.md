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
| `W014` | `k-on` 或 `k-model` 包含未知修饰符。 | 检查拼写，并只使用指令文档列出的修饰符。 |
| `W015` | 修饰符组合冲突，例如 `.passive.prevent` 或 `.number.boolean`。 | 只保留符合所需语义的一个修饰符。 |
| `W016` | 修饰符不适用于当前事件或元素。 | 键盘修饰符只用于键盘事件；`.boolean` 优先用于 radio、checkbox 和 select。 |
| `W017` | 模板中出现未知 `k-*` 指令。 | 检查指令名拼写。 |
| `W018` | 指令使用了不支持的参数。 | 只有 `k-on` 和 `k-bind` 支持冒号参数。 |
| `W019` | 指令使用了不支持的修饰符或数字修饰符位置错误。 | 普通指令不携带修饰符；延迟数字必须配合 `.debounce`。 |
| `W020` | 动态属性被判定为可执行或危险值并已阻止。 | 事件使用 `k-on`；URL 只绑定经过校验的协议和来源。 |
| `W021` | 结构指令组合或位置错误。 | 每个元素只保留一个分支指令；`k-key` 只用在 `k-for` 行上。 |
| `W022` | `k-model` 用在浏览器拥有值的 file input 上。 | 用 `@change` 读取 `event.target.files`，不要把 FileList 当普通文本状态。 |
| `W023` | `k-html` sanitizer 抛错、异步或返回非字符串。 | 使用同步 sanitizer 并始终返回字符串；先完成异步处理再写入 scope。 |
| `W024` | `k-model` 赋值目标不是安全的顶层 scope 属性。 | 使用如 `k-model="name"` 的顶层 key；在业务代码中显式更新深层对象。 |

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
