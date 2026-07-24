# 安全策略接入

Kupola 提供最低限度的动态属性保护和诊断，不提供 HTML sanitizer、URL allowlist、CSP 或权限系统。安全策略必须由应用拥有。

## HTML sanitizer

优先为每个 mount 传入同步 sanitizer，避免全局可变配置在多应用或微前端之间互相影响。

```js
walk(root, {
  sanitizer(html) {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  },
})
```

返回 Promise、非字符串或抛出异常会触发 `W023`，并清空本次 `k-html` 写入。异步富文本处理应先完成再写入 scope，不能直接作为 sanitizer 返回值。

## URL normalizer

在 controller 中按业务来源和用途规范化 URL，再写入 scope。下面只是导航链接示例，不适用于脚本、iframe、文件嵌入等主动内容。

```js
function safeLink(value) {
  const url = new URL(value, location.origin)
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return ''
  if (url.protocol === 'https:' && url.hostname !== 'docs.example.com') return ''
  return url.href
}
```

运行时会拒绝许多危险动态 URL，但业务仍必须定义允许的域名、路径、下载类型与重定向规则。

## CSP 与可信模板

模板表达式使用 `new Function()`，因此需要 `script-src 'unsafe-eval'`。不能使用该 CSP 例外的页面应选择 Kupola 的 JavaScript API、组件 API 和原生事件，不挂载表达式指令。无论是否启用 CSP，都不要将用户可控内容拼接到 `k-data`、`k-on`、`k-bind` 或其他表达式属性中。

`k-style` 不是 CSS sanitizer。用 CSP 的 `style-src`、`img-src`、`font-src`、`connect-src` 限制资源来源，并由业务限制可写 style 属性和值。
