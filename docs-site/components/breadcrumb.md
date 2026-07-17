# Breadcrumb 面包屑

用于展示页面层级路径。

```js
import { Breadcrumb } from '@kupola/kupola/components/breadcrumb'

const breadcrumb = Breadcrumb({
  items: [
    { label: '首页', href: '/' },
    { label: '系统管理', href: '/system' },
    { label: '用户管理' },
  ],
})

document.body.appendChild(breadcrumb.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 路径项 |
| separator | 分隔符 |

## 路径项

| 字段 | 说明 |
| --- | --- |
| label | 显示文本 |
| href | 链接地址 |
