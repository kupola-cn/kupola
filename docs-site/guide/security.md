# 安全边界

Kupola 的指令系统适合增强由应用自己渲染的可信 HTML。它不是沙箱，也不应该用来执行来自普通用户、CMS 编辑器或第三方接口的未审查表达式。

## 基本原则

- 只在受信任的模板中使用 `k-data`、`k-bind`、`k-on`、`k-model`、`k-if`、`k-for`、`k-class`、`k-style`、`k-init` 等指令。
- 不要把用户输入拼接进指令表达式，例如 `k-on:click="..."` 或 `:href="..."`。
- 需要展示用户输入时，优先使用 `k-text` 或普通文本插值，让浏览器按文本处理内容。
- 服务端仍然负责鉴权、权限、数据范围和输出编码。前端指令只能改善交互，不能替代服务端安全控制。
- 运行时 warning 只用于开发阶段暴露错误写法，不是安全机制。

## k-html

`k-html` 会写入 `innerHTML`，只应用于已经清洗或完全可信的 HTML。

```html
<!-- 推荐：普通用户内容使用文本绑定 -->
<div k-text="comment"></div>

<!-- 仅限可信或已消毒的 HTML -->
<div k-html="trustedHtml"></div>
```

不要把评论、富文本、URL 参数、接口返回的任意字符串直接传给 `k-html`。如果业务必须渲染富文本，应先在服务端或可信的 HTML sanitizer 中移除脚本、事件属性、危险 URL 和不允许的标签。

## 表达式与事件

Kupola 指令表达式会在当前 `k-data` 作用域内编译并求值。模板作者等同于代码作者，因此表达式必须来自项目源码或可信模板。

```html
<!-- 合适：固定模板中的业务表达式 -->
<button @click="count++">+</button>

<!-- 不合适：把用户配置拼进表达式 -->
<button k-on:click="userProvidedExpression">Run</button>
```

对外部链接、图片地址、下载地址等属性绑定，业务层应限制协议和来源。尤其不要允许未校验的 `javascript:`、`data:` 或跨域可执行内容进入敏感属性。

## CSP

Kupola 的 HTML 指令表达式使用 `new Function()` 编译执行，因此页面 CSP 需要允许 `unsafe-eval`。这是“零框架交互增强”换取原生 HTML 书写体验的运行时边界，不代表表达式是沙箱。

如果你的应用必须使用严格 CSP，并且不能开启 `unsafe-eval`，不要在该页面使用 `k-data`、`k-text`、`k-on` 等需要表达式求值的 HTML 指令。优先使用 `signal()`、`effect()`、`render()`、组件工厂和普通 DOM 事件在 JavaScript 中组织交互。

当浏览器因为 CSP 阻止表达式编译时，Kupola 会在表达式错误中保留原始错误，并提示这是 `unsafe-eval` / 严格 CSP 环境导致的问题。

## 动态属性

`:href`、`:src`、`:action` 等动态属性不会自动判断业务可信度。推荐在 controller 中先规范化 URL，再绑定到模板：

```js
function safeHttpUrl(value) {
  const url = new URL(value, location.origin)
  if (!['http:', 'https:'].includes(url.protocol)) {
    return ''
  }
  return url.href
}
```

```html
<a :href="safeUrl">打开</a>
```

不要把未经校验的外部字符串直接绑定到可导航、可加载或可提交的敏感属性。

## 动态片段

`walk()` 只初始化 DOM，不会消毒 HTML。通过 AJAX、局部刷新或后端片段插入 HTML 前，应确保片段来自可信模板，并且服务端已经完成输出编码。

```js
// 仅用于可信模板片段
container.innerHTML = await fetch('/trusted-fragment').then(r => r.text())
instance = walk(container)
```

不要对用户生成 HTML 直接 `innerHTML + walk()`。如果业务必须渲染富文本，应先通过可信 sanitizer 清洗，再只在必要位置使用 `k-html`。

## 组件内容

组件的 `content`、`render`、`formatter` 等选项如果接受字符串，默认应按文本或受控模板处理。需要传入 HTML 时，调用方必须明确知道该内容已经可信。
