# Pagination 分页

用于分页浏览大量数据。

```js
import { Pagination } from '@kupola/components/pagination'

const pagination = Pagination({
  current: 1,
  pageSize: 20,
  total: 120,
  onChange: ({ current, pageSize }) => {
    loadPage(current, pageSize)
  },
})

document.body.appendChild(pagination.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| current | 当前页 |
| pageSize | 每页条数 |
| total | 总条数 |
| pageSizeOptions | 每页条数选项 |
| onChange | 页码或 pageSize 变化回调 |

## 方法

- `setPage(page)`
- `setPageSize(size)`
- `destroy()`
