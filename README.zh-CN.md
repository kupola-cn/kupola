[English](./README.md) | [文档站](https://kupola-cn.github.io/kupola/)

# Kupola

Kupola 是面向服务端渲染 HTML 的零框架交互层。小型局部交互使用指令运行时，JavaScript 主导的视图使用 signal / template API，需要复用的复杂交互再选择可选组件库。

## 安装

```bash
npm install @kupola/kupola
```

```html
<div k-data="{ count: 0 }">
  <button @click="count++" k-text="count"></button>
</div>
<script type="module">
  import { walk } from '@kupola/kupola/directives'
  walk(document.body)
</script>
```

指令表达式只适用于可信应用模板。它们基于 `new Function()`，不是沙箱。用户内容使用 `k-text`；使用 `k-html` 前由应用接入 sanitizer。

## 文档入口

- [快速开始](https://kupola-cn.github.io/kupola/guide/getting-started)
- [指令能力矩阵](https://kupola-cn.github.io/kupola/guide/directive-matrix)
- [表单状态策略](https://kupola-cn.github.io/kupola/guide/form-state)
- [动态片段协议](https://kupola-cn.github.io/kupola/guide/dynamic-fragments)
- [安全策略接入](https://kupola-cn.github.io/kupola/guide/security-policy)
- [性能边界](https://kupola-cn.github.io/kupola/guide/performance)

开发与发布检查使用 `npm run verify`。Kupola 支持 Node 18、20、22；其他信息见 [changelog](./CHANGELOG.md)、[贡献指南](./CONTRIBUTING.md)、[安全政策](./SECURITY.md)、[行为准则](./CODE_OF_CONDUCT.md) 和 [MIT 许可证](./LICENSE)。
