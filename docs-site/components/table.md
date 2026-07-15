# Table 表格

## 基础用法

```js
import { Table } from '@kupola/kupola/components/table'

const table = new Table({
  el: '#app',
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
    { key: 'email', title: '邮箱' },
  ],
  data: [
    { name: 'Alice', age: 25, email: 'alice@example.com' },
    { name: 'Bob', age: 30, email: 'bob@example.com' },
  ],
})
```

## 配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| el | string \| Element | - | 挂载元素 |
| columns | array | - | 列配置 |
| data | array | - | 数据 |
| rowKey | string | 'id' | 行唯一键 |
| pagination | boolean | true | 显示分页 |
| pageSize | number | 10 | 每页条数 |
| sortable | boolean | false | 可排序 |
| selectable | boolean \| string | false | 可选择（'radio' \| 'checkbox'） |

## 列配置

```js
{
  key: 'name',           // 字段名
  title: '姓名',         // 表头文本
  width: 150,            // 列宽
  sortable: true,        // 可排序
  sorter: (a, b) => a - b, // 自定义排序
  render: (val, row) => `<strong>${val}</strong>`, // 自定义渲染
}
```

## 方法

- `table.setData(data)` - 更新数据
- `table.getSelected()` - 获取选中行
- `table.selectRow(key)` - 选中行
- `table.deselectRow(key)` - 取消选中
- `table.sort(key, order)` - 排序
- `table.filter(filters)` - 过滤
- `table.exportCSV(filename)` - 导出 CSV

## 示例

### 可排序表格

```js
const table = new Table({
  el: '#app',
  columns: [
    { key: 'name', title: '姓名', sortable: true },
    { key: 'age', title: '年龄', sortable: true },
  ],
  data: users,
})
```

### 可选择行

```js
const table = new Table({
  el: '#app',
  columns: [...],
  data: users,
  selectable: 'checkbox', // 或 'radio'
})

// 获取选中
const selected = table.getSelected()
```
