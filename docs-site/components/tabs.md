# Tabs 选项卡

用于在同一页面区域内切换多个内容面板。

```js
import { Tabs } from '@kupola/kupola/components/tabs'

const tabs = Tabs({
  activeKey: 'profile',
  items: [
    { key: 'profile', label: '资料', content: '用户资料' },
    { key: 'security', label: '安全', content: '安全设置' },
  ],
  onChange: (key) => console.log(key),
})

document.body.appendChild(tabs.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| items | 选项卡列表 |
| activeKey | 当前激活项 |
| onChange | 切换回调 |

## 方法

- `setActive(key)`
- `destroy()`
