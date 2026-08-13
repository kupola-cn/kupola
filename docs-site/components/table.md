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

---

## 排序

通过 `columns` 中配置 `sortable` 启用列排序。支持单列排序和多列排序。

### 单列排序

```js
import { Table } from '@kupola/components/table'

const table = Table({
  columns: [
    { key: 'name', title: '姓名', sortable: true },
    {
      key: 'age',
      title: '年龄',
      sortable: true,
      // 自定义排序函数
      sorter: (a, b) => a.age - b.age,
    },
    {
      key: 'birthday',
      title: '生日',
      sortable: true,
      // 按日期排序
      sorter: (a, b) => new Date(a.birthday) - new Date(b.birthday),
    },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25, birthday: '2001-03-15' },
    { id: 2, name: 'Bob', age: 30, birthday: '1996-07-22' },
    { id: 3, name: 'Charlie', age: 22, birthday: '2004-01-10' },
  ],
  rowKey: 'id',
})

// 编程式排序
table.setSort('age', 'asc')   // 升序
table.setSort('age', 'desc')  // 降序
table.clearSort()              // 清除排序
```

### 多列排序

```js
const table = Table({
  columns: [
    { key: 'department', title: '部门', sortable: true },
    { key: 'name', title: '姓名', sortable: true },
    { key: 'salary', title: '薪资', sortable: true, sorter: (a, b) => a.salary - b.salary },
  ],
  data: [
    { id: 1, department: '技术部', name: 'Alice', salary: 15000 },
    { id: 2, department: '技术部', name: 'Bob', salary: 18000 },
    { id: 3, department: '市场部', name: 'Charlie', salary: 12000 },
    { id: 4, department: '市场部', name: 'Diana', salary: 13000 },
  ],
  rowKey: 'id',
  multiSort: true,  // 启用多列排序
})
```

---

## 筛选

### 全局筛选

通过 `showFilter` 启用全局文本筛选，`filterable` 配置列级筛选。

```js
const table = Table({
  columns: [
    { key: 'name', title: '姓名', filterable: true },
    { key: 'department', title: '部门', filterable: true },
    {
      key: 'status',
      title: '状态',
      filterable: true,
      // 自定义筛选函数
      filter: (value, record) => record.status === value,
    },
  ],
  data: [
    { id: 1, name: 'Alice', department: '技术部', status: 'active' },
    { id: 2, name: 'Bob', department: '市场部', status: 'inactive' },
    { id: 3, name: 'Charlie', department: '技术部', status: 'active' },
  ],
  rowKey: 'id',
  showFilter: true,
})

// 编程式筛选
table.setFilterText('技术部')
console.log(table.getFilterText()) // '技术部'
```

### 列级筛选

```js
const table = Table({
  columns: [
    {
      key: 'status',
      title: '状态',
      filterable: true,
      // 下拉筛选选项
      filters: [
        { text: '启用', value: 'active' },
        { text: '禁用', value: 'inactive' },
        { text: '待审核', value: 'pending' },
      ],
      filter: (value, record) => record.status === value,
    },
    {
      key: 'age',
      title: '年龄',
      filterable: true,
      // 数值范围筛选
      filter: (value, record) => {
        if (value === '18-25') return record.age >= 18 && record.age <= 25
        if (value === '26-35') return record.age >= 26 && record.age <= 35
        if (value === '36+') return record.age >= 36
        return true
      },
      filters: [
        { text: '18-25 岁', value: '18-25' },
        { text: '26-35 岁', value: '26-35' },
        { text: '36 岁以上', value: '36+' },
      ],
    },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25, status: 'active' },
    { id: 2, name: 'Bob', age: 32, status: 'inactive' },
    { id: 3, name: 'Charlie', age: 40, status: 'active' },
    { id: 4, name: 'Diana', age: 22, status: 'pending' },
  ],
  rowKey: 'id',
})
```

---

## 选择

通过 `selection` 启用行选择，支持复选框和单选框模式。

### 多选（checkbox）

```js
const table = Table({
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
    { id: 3, name: 'Charlie', age: 22 },
  ],
  rowKey: 'id',
  selection: 'checkbox',
  // 选中回调
  onSelect: (selectedKeys, selectedRows) => {
    console.log('选中行:', selectedKeys, selectedRows)
  },
})

// 编程式选择
table.selectRow(1)        // 选中 id=1 的行
table.deselectRow(1)      // 取消选中
table.selectAll()         // 全选
table.deselectAll()       // 取消全选

// 获取选中状态
const keys = table.getSelectedKeys()   // [1, 2]
const rows = table.getSelectedRows()   // [{ id: 1, ... }, { id: 2, ... }]
```

### 单选（radio）

```js
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
  selection: 'radio',
  selectedKeys: [1],  // 默认选中
  onSelect: (keys, rows) => {
    console.log('当前选中:', rows[0])
  },
})
```

---

## 树形表格

通过 `treeData` 配置启用树形数据展示，支持展开/收起。

```js
const table = Table({
  columns: [
    { key: 'name', title: '名称' },
    { key: 'size', title: '大小' },
    { key: 'type', title: '类型' },
  ],
  data: [
    {
      id: 1,
      name: 'src',
      type: 'folder',
      size: '-',
      children: [
        { id: 2, name: 'index.js', type: 'file', size: '2.1 KB' },
        { id: 3, name: 'App.js', type: 'file', size: '5.4 KB' },
        {
          id: 4,
          name: 'components',
          type: 'folder',
          size: '-',
          children: [
            { id: 5, name: 'Header.js', type: 'file', size: '1.2 KB' },
            { id: 6, name: 'Footer.js', type: 'file', size: '0.8 KB' },
          ],
        },
      ],
    },
    { id: 7, name: 'package.json', type: 'file', size: '0.5 KB' },
  ],
  rowKey: 'id',
  tree: {
    childrenKey: 'children',  // 子节点字段名，默认 'children'
    defaultExpandAll: false,  // 是否默认展开所有节点
    indentSize: 24,           // 缩进尺寸（px）
  },
})

// 展开/收起控制
table.toggleExpand(1)   // 切换 id=1 的行展开状态
table.expandAll()       // 展开全部
table.collapseAll()     // 收起全部
```

---

## 内联编辑

通过 `editable` 配置启用行内编辑。

```js
import { html } from '@kupola/platform'

const table = Table({
  columns: [
    { key: 'name', title: '姓名', editable: true },
    {
      key: 'age',
      title: '年龄',
      editable: true,
      // 自定义编辑组件
      editRender: (value, record) => html`
        <input type="number" value="${value}" min="0" max="120" />
      `,
    },
    {
      key: 'status',
      title: '状态',
      editable: true,
      // 下拉编辑
      editRender: (value, record) => html`
        <select>
          <option value="active" ${value === 'active' ? 'selected' : ''}>启用</option>
          <option value="inactive" ${value === 'inactive' ? 'selected' : ''}>禁用</option>
        </select>
      `,
    },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25, status: 'active' },
    { id: 2, name: 'Bob', age: 30, status: 'inactive' },
  ],
  rowKey: 'id',
  editable: {
    editTriggers: ['click', 'dblclick'],  // 触发编辑的方式
    // 编辑确认回调
    onEdit: (newData, oldData, rowKey) => {
      console.log('编辑行:', rowKey, '旧数据:', oldData, '新数据:', newData)
      // 同步到后端
      fetch('/api/users/' + rowKey, {
        method: 'PUT',
        body: JSON.stringify(newData),
      })
    },
  },
})
```

---

## 虚拟滚动

处理大数据量时启用虚拟滚动以提升性能。

```js
const table = Table({
  columns: [
    { key: 'id', title: 'ID', width: 80 },
    { key: 'name', title: '姓名' },
    { key: 'email', title: '邮箱' },
    { key: 'phone', title: '电话' },
  ],
  // 生成 10000 条模拟数据
  data: Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    name: `用户 ${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `138${String(i + 1).padStart(8, '0')}`,
  })),
  rowKey: 'id',
  virtualScroll: {
    rowHeight: 48,     // 每行高度（px）
    overscan: 10,      // 预渲染行数（超出可视区域）
    height: 600,       // 表格容器高度（px）
  },
})
```

---

## 导出 CSV

通过 `exportCSV()` 方法导出表格数据为 CSV 文件。

```js
const table = Table({
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
    { key: 'department', title: '部门' },
  ],
  data: [
    { id: 1, name: 'Alice', age: 25, department: '技术部' },
    { id: 2, name: 'Bob', age: 30, department: '市场部' },
  ],
  rowKey: 'id',
})

// 基础导出
table.exportCSV()

// 带选项的导出
table.exportCSV({
  filename: 'users.csv',           // 文件名
  columns: ['name', 'department'], // 只导出指定列
  excludeColumns: ['age'],         // 排除指定列
  // 自定义列头
  headers: {
    name: '姓名',
    age: '年龄',
    department: '部门',
  },
  // 格式化单元格
  formatter: (value, column, row) => {
    if (column === 'age') return `${value} 岁`
    return value
  },
  // 仅导出当前筛选后的数据
  useFilteredData: true,
})
```

---

## 完整示例：综合数据表格

以下是一个集成了排序、筛选、分页、选择功能的完整数据表格示例：

```js
import { Table } from '@kupola/components/table'
import { html } from '@kupola/platform'

// 模拟用户数据
const userData = [
  { id: 1, name: '张三', age: 28, email: 'zhangsan@example.com', department: '技术部', status: 'active', salary: 18000 },
  { id: 2, name: '李四', age: 32, email: 'lisi@example.com', department: '技术部', status: 'active', salary: 22000 },
  { id: 3, name: '王五', age: 26, email: 'wangwu@example.com', department: '市场部', status: 'inactive', salary: 15000 },
  { id: 4, name: '赵六', age: 35, email: 'zhaoliu@example.com', department: '市场部', status: 'active', salary: 20000 },
  { id: 5, name: '孙七', age: 29, email: 'sunqi@example.com', department: '人事部', status: 'active', salary: 16000 },
  { id: 6, name: '周八', age: 31, email: 'zhouba@example.com', department: '人事部', status: 'inactive', salary: 17000 },
  { id: 7, name: '吴九', age: 24, email: 'wujiu@example.com', department: '技术部', status: 'active', salary: 14000 },
  { id: 8, name: '郑十', age: 38, email: 'zhengshi@example.com', department: '财务部', status: 'active', salary: 25000 },
]

const table = Table({
  columns: [
    {
      key: 'name',
      title: '姓名',
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: 'age',
      title: '年龄',
      sortable: true,
      sorter: (a, b) => a.age - b.age,
      width: 80,
    },
    {
      key: 'email',
      title: '邮箱',
      filterable: true,
    },
    {
      key: 'department',
      title: '部门',
      filterable: true,
      filters: [
        { text: '技术部', value: '技术部' },
        { text: '市场部', value: '市场部' },
        { text: '人事部', value: '人事部' },
        { text: '财务部', value: '财务部' },
      ],
      filter: (value, record) => record.department === value,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      filters: [
        { text: '在职', value: 'active' },
        { text: '离职', value: 'inactive' },
      ],
      filter: (value, record) => record.status === value,
      // 自定义渲染
      render: (value) => {
        const statusMap = {
          active: html`<span style="color: green;">● 在职</span>`,
          inactive: html`<span style="color: red;">● 离职</span>`,
        }
        return statusMap[value] || value
      },
    },
    {
      key: 'salary',
      title: '薪资',
      sortable: true,
      sorter: (a, b) => a.salary - b.salary,
      // 格式化显示
      render: (value) => `¥${value.toLocaleString()}`,
    },
  ],
  data: userData,
  rowKey: 'id',
  striped: true,
  hoverable: true,
  selection: 'checkbox',
  showFilter: true,
  showPagination: true,
  pagination: {
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
    showQuickJumper: true,
  },
  // 选中行回调
  onSelect: (selectedKeys, selectedRows) => {
    console.log(`已选中 ${selectedKeys.length} 行:`, selectedKeys)
  },
  // 工具栏操作按钮
  toolbar: html`
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <button onclick="this.closest('.kupola-table').__table.exportCSV({ filename: '用户列表.csv' })">
        导出 CSV
      </button>
      <button onclick="console.log(this.closest('.kupola-table').__table.getSelectedRows())">
        查看选中行
      </button>
    </div>
  `,
})

// 挂载到页面
document.getElementById('tableRoot').appendChild(table.element)

// 将实例挂载到 DOM 以便工具栏按钮访问
table.element.__table = table
```

---

## 列配置详解

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | 列唯一标识，对应数据字段 |
| `title` | `string` | 列头显示文本 |
| `width` | `string \| number` | 列宽 |
| `sortable` | `boolean` | 是否可排序 |
| `sorter` | `(a, b) => number` | 自定义排序比较函数 |
| `filterable` | `boolean` | 是否可筛选 |
| `filter` | `(value, record) => boolean` | 自定义筛选函数 |
| `filters` | `Array<{ text, value }>` | 筛选选项列表 |
| `editable` | `boolean` | 是否可内联编辑 |
| `editRender` | `(value, record) => Node` | 自定义编辑渲染函数 |
| `render` | `(value, record, index) => Node \| string` | 自定义单元格渲染 |
| `align` | `'left' \| 'center' \| 'right'` | 列对齐方式 |
| `fixed` | `'left' \| 'right'` | 固定列 |
| `ellipsis` | `boolean` | 文本溢出省略 |
| `hidden` | `boolean` | 隐藏列 |

---

## 分页配置

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSize` | `number` | `10` | 每页条数 |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | 每页条数选项 |
| `showQuickJumper` | `boolean` | `false` | 显示快速跳转 |
| `showTotal` | `boolean` | `true` | 显示总条数 |
| `total` | `number` | 自动计算 | 总条数（用于服务端分页） |

---

## 说明

- `emptyText` 不传时使用库内置空态文案。
- `setData()` 支持数组，也支持响应式 `signal` 数据。
- 虚拟滚动与树形表格互斥，不能同时启用。
- 当同时启用排序和筛选时，筛选优先于排序执行。
- 内联编辑的行在编辑状态下会禁用选择、排序和展开操作。