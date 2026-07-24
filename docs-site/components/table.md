# Table 表格

`Table` 是一个功能较完整的数据表工厂函数，支持排序、筛选、分页、选择、树表和行编辑。

## 基础用法

```js
import { Table } from '@kupola/components/table'

const table = Table({
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
  ],
  rowKey: 'id',
  striped: true,
})

document.getElementById('tableRoot').appendChild(table.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| columns | 列配置 |
| data | 初始数据 |
| rowKey | 行唯一键 |
| striped | 斑马纹行 |
| hoverable | 悬停高亮 |
| selection | `checkbox` / `radio` |
| expandable | 展开行渲染函数 |
| editable | 内联编辑 |
| tree | 树形数据配置 |
| showFilter | 显示筛选输入框 |
| showPagination | 显示分页 |
| emptyText | 空态文案 |

## 方法

- `setData(data)`
- `setLoading(loading)`
- `getData()`
- `getProcessedData()`
- `getSelectedRows()`
- `getSelectedKeys()`
- `selectRow(key)`
- `deselectRow(key)`
- `selectAll()`
- `deselectAll()`
- `toggleExpand(key)`
- `expandAll()`
- `collapseAll()`
- `setSort(key, order)`
- `clearSort()`
- `setPage(page)`
- `setPageSize(size)`
- `setFilterText(text)`
- `getFilterText()`
- `exportCSV()`
- `refresh()`

## 说明

- `emptyText` 不传时使用库内置空态文案。
- `setData()` 支持数组，也支持响应式 `signal` 数据。
