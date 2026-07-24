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

也可以把项目已使用的 sanitizer 注入 Kupola，它会在每次 `k-html` 写入前调用：

```js
import DOMPurify from 'dompurify'
import { setHtmlSanitizer } from '@kupola/kupola'

setHtmlSanitizer(html => DOMPurify.sanitize(html))
```

Kupola 不内置 sanitizer，因为允许的标签、属性和 URL 策略属于应用安全规则。全局 `setHtmlSanitizer()` 只适合单应用；多 root 或微前端应把 sanitizer 作为 `walk()` 选项传入，它会传递到嵌套 `k-data`。`sanitizer: null` 会显式关闭全局 fallback。sanitizer 必须同步返回字符串；抛错、返回 Promise 或非字符串时，Kupola 记录 `W023` 并写入空字符串。

```js
walk(root, { sanitizer: html => DOMPurify.sanitize(html) })
```

完整接入方式见 [安全策略接入](/guide/security-policy)。

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

Kupola 会阻止动态 `on*`、`srcdoc`、`codebase`、原型链键，以及 `base[href]`、`meta[http-equiv]` 的动态写入。URL 使用元素上下文策略：`iframe[src]`、`object[data]`、`embed[src]`、`script[src]` 一律不接受动态 URL；链接可使用 `http:`、`https:`、`mailto:`、`tel:`；表单仅接受 `http:`、`https:`；普通资源仅接受 `http:`、`https:`，图片/音视频资源额外允许受限的 base64 位图 data URL。协议相对 URL、控制字符、所有非 ASCII Unicode 字符、最多三层 percent 编码后的协议绕过都会被拒绝。需要国际化地址时，业务应先规范化为 ASCII / percent-encoded URL。被阻止时会输出 `W020`。

`k-style` 只拒绝明显危险的 `url()` 值；它不会成为 CSS sanitizer、资源来源控制或 CSP 的替代品。业务仍应限制可写 CSS、资源域名与 `style-src` / `img-src` 等 CSP 指令。

这只是最低安全底线，不会自动判断业务可信度。推荐在 controller 中先规范化 URL，再绑定到模板：

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
