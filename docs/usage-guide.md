# Kupola 完整使用指南

> **版本**: v1.2.1 | **定位**: 无框架依赖的数据依赖管理标准 + UI 组件库  
> **包名**: `@kupola/kupola` | **协议**: MIT

---

## 目录

1. [快速开始](#1-快速开始)
2. [ref — 响应式引用](#2-ref--响应式引用)
3. [声明式数据依赖 (useDeps)](#3-声明式数据依赖)
4. [UI 组件库](#4-ui-组件库)
5. [Table 与 Pagination](#5-table-与-pagination)
6. [状态管理 (Store)](#6-状态管理)
7. [表单验证](#7-表单验证)
8. [主题系统](#8-主题系统)
9. [CSS 设计系统](#9-css-设计系统)
10. [工具函数](#10-工具函数)
11. [npm 包结构](#11-npm-包结构)

---

## 1. 快速开始

### 1.1 安装

```bash
npm install @kupola/kupola
```

### 1.2 三种引入方式

**方式一：ES Module（推荐）**
```html
<link rel="stylesheet" href="node_modules/@kupola/kupola/dist/css/kupola.css">
<script type="module">
  import { ref, useDeps } from '@kupola/kupola';
</script>
```

**方式二：仅引入依赖子系统**
```js
import { useDeps, useQuery } from '@kupola/kupola/depends';
```

**方式三：原生 HTML 直接引用**
```html
<link rel="stylesheet" href="css/kupola.css">
<script type="module">
  import { useDeps, ref } from './src/index.js';
</script>
```

### 1.3 最小示例

```html
<div id="app">
  <button class="ds-btn ds-btn--primary" onclick="handleClick()">点击</button>
</div>

<script type="module">
  import { ref } from '@kupola/kupola';

  const count = ref(0);
  const handleClick = () => count.value++;
</script>
```

---

## 2. ref — 响应式引用

`ref` 是 Kupola 提供的轻量响应式原语，位于 `data-bind.js` 中。

```js
import { ref } from '@kupola/kupola';

const count = ref(0);
console.log(count.value); // 0

count.value = 5;
console.log(count.value); // 5

// 订阅变化
count._subscribers.add((newVal) => {
  console.log('count changed to:', newVal);
});
```

---

## 3. 声明式数据依赖

这是 Kupola 的**核心功能**。用声明式语法描述数据需求，框架自动处理获取、缓存、重试。

### 3.1 useDeps — 多数据源依赖

```js
import { useDeps, ref } from '@kupola/kupola';

// 创建响应式参数
const userId = ref(1);

const deps = useDeps(
  { userId },  // 响应式参数（参数变化自动重新获取）
  {
    // 数据源 1：HTTP 请求
    user: {
      source: '/api/users',       // API 地址
      method: 'GET',              // HTTP 方法
      staleTime: 30000,           // 30秒内使用缓存
      retry: 3,                   // 失败重试3次
      retryDelay: 1000,           // 重试间隔1秒
    },
    // 数据源 2：自定义函数
    posts: {
      source: async (params) => {
        const res = await fetch(`/api/posts?userId=${params.userId}`);
        return res.json();
      },
      staleTime: 60000,
    }
  }
);

// 使用返回结果
console.log(deps.user.data.value);      // 用户数据（初始为 null）
console.log(deps.user.loading.value);   // 加载状态
console.log(deps.user.error.value);     // 错误信息
console.log(deps.user.lastUpdated.value); // 最后更新时间戳

// 手动刷新
await deps.user.refresh();

// 清理（组件卸载时调用）
deps._dispose();
```

### 3.2 返回值结构

每个依赖项返回：

```js
{
  data:        { value: T | null },      // 数据
  loading:     { value: boolean },       // 加载中
  error:       { value: string | null }, // 错误信息
  lastUpdated: { value: number | null }, // 最后更新时间
  refresh():   Promise<void>,           // 手动刷新
  setValue(v): void,                    // 设置值（仅 StorageSource）
  send(msg):   void,                    // 发送消息（仅 WebSocketSource）
  _source:     DependsSource            // 底层数据源实例
}
```

### 3.3 useQuery — 单个查询

```js
import { useQuery } from '@kupola/kupola';

const { data, loading, error, refresh } = useQuery({
  source: '/api/config',
  staleTime: 300000  // 缓存5分钟
});
```

### 3.4 六种数据源

#### HTTP 数据源（FetchedSource）
```js
{
  source: '/api/users',        // URL 字符串
  method: 'GET',               // GET | POST | PUT | DELETE
  staleTime: 30000,            // 缓存时间（毫秒）
  retry: 3,                    // 重试次数
  retryDelay: 1000,            // 初始重试延迟
  headers: { 'X-Token': 'xxx' } // 自定义请求头
}
```

#### 函数数据源（FunctionSource）
```js
{
  source: async (params) => {
    const res = await fetch(`/api/search?q=${params.keyword}`);
    return res.json();
  },
  staleTime: 10000
}
```

#### 本地存储数据源（StorageSource）
```js
{
  source: 'localStorage:app-config',  // localStorage:key 格式
  staleTime: 0                         // 0 表示始终读取存储
}

// 写入值
deps.config.setValue({ theme: 'dark', lang: 'zh' });
```

#### 路由数据源（RouteSource）
```js
{
  source: 'route:params',    // 读取路由参数
  staleTime: 0
}
```

#### 静态数据源（StaticSource）
```js
{
  source: () => [1, 2, 3],  // 同步返回数据
  staleTime: Infinity
}
```

#### WebSocket 数据源（WebSocketSource）
```js
{
  source: 'ws://localhost:8080/ws',  // WebSocket URL
  reconnect: true,                    // 自动重连
  reconnectInterval: 3000             // 重连间隔
}

// 发送消息
deps.ws.send({ type: 'subscribe', channel: 'updates' });
```

### 3.5 缓存策略

```js
import { Scheduler, CacheManager, clearCache } from '@kupola/kupola';

// 手动清除全局缓存
clearCache();

// 使用 CacheManager
const cache = new CacheManager();
cache.set('key', data, 30000);       // 设置缓存，TTL 30秒
const entry = cache.get('key');       // 获取缓存条目
console.log(entry.isFresh);           // 是否新鲜
console.log(entry.isStale);           // 是否过期
const staleData = cache.getStale('key'); // 获取过期数据（用于 SWR）
cache.delete('key');                  // 删除
cache.clear();                        // 清空所有

// Scheduler - 微任务批量更新
const scheduler = new Scheduler();
scheduler.schedule(() => updateUI());  // 同一 tick 内多次调用只执行一次
```

---

## 4. UI 组件库

所有组件使用 Kupola CSS（`ds-` 前缀），无需额外框架。

### 5.1 组件列表

| 组件 | 初始化 | 清理 | 说明 |
|------|--------|------|------|
| Dropdown | `initDropdown(el)` | `cleanupDropdown(el)` | 下拉菜单 |
| Select | `initSelect(el)` | `cleanupSelect(el)` | 自定义选择器 |
| Datepicker | `initDatepicker(el)` | `cleanupDatepicker(el)` | 日期选择器 |
| Timepicker | `initTimepicker(el)` | `cleanupTimepicker(el)` | 时间选择器 |
| Slider | `initSlider(el)` | `cleanupSlider(el)` | 滑块 |
| Carousel | `initCarousel(el)` | `cleanupCarousel(el)` | 轮播图 |
| Drawer | `initDrawer(el)` | `cleanupDrawer(el)` | 抽屉面板 |
| Modal | `initModal(el)` | `cleanupModal(el)` | 模态框 |
| Dialog | `new Dialog(options)` | — | 对话框 |
| Notification | `initNotifications()` | — | 通知 |
| Message | `initMessages()` | — | 消息提示 |
| FileUpload | `initFileUpload(el)` | `cleanupFileUpload(el)` | 文件上传 |
| Collapse | `initCollapse(el)` | `cleanupCollapse(el)` | 折叠面板 |
| ColorPicker | `initColorPicker(el)` | `cleanupColorPicker(el)` | 颜色选择器 |
| Calendar | `initCalendar(el)` | `cleanupCalendar(el)` | 日历 |
| DynamicTags | `initDynamicTags(el)` | `cleanupDynamicTags(el)` | 动态标签 |
| ImagePreview | `showImagePreview(src)` | — | 图片预览 |
| Tag | `initTag(el)` | `cleanupTag(el)` | 标签 |
| StatCard | `initStatCard(el)` | `cleanupStatCard(el)` | 统计卡片 |
| Heatmap | `initHeatmap(el)` | `cleanupHeatmap(el)` | 热力图 |
| Tooltip | `initTooltip(el)` | `cleanupTooltip(el)` | 工具提示 |
| VirtualList | `initVirtualList(el, opts)` | `cleanupVirtualList(el)` | 虚拟列表 |
| Countdown | `initCountdown(el)` | `cleanupCountdown(el)` | 倒计时 |
| NumberInput | `initNumberInput(el)` | `cleanupNumberInput(el)` | 数字输入 |
| SlideCaptcha | `initSlideCaptchas()` | `cleanupSlideCaptcha(el)` | 滑块验证码 |

### 5.2 使用示例

```js
import { initDropdown, initModal, initNotifications } from '@kupola/kupola';

// 初始化所有下拉菜单
initDropdowns();

// 初始化单个模态框
const modal = initModal(document.getElementById('my-modal'));

// 批量初始化
initNotifications();
```

---

## 5. Table 与 Pagination

KupolaTable 是一个全功能的 Headless 表格组件，支持 11 种高级特性。

### 6.1 基础用法

```js
import { initTable } from '@kupola/kupola';

const table = initTable('#table-container', {
  columns: [
    { key: 'id', title: 'ID', width: 60, sortable: true },
    { key: 'name', title: '姓名', sortable: true },
    { key: 'email', title: '邮箱' },
    {
      key: 'role', title: '角色', sortable: true,
      render: (value, row) => `<strong>${value}</strong>`
    },
    {
      key: 'status', title: '状态',
      render: (v) => v === 'active' ? '✅ 活跃' : '❌ 停用'
    }
  ],
  rowKey: 'id',
  pageSize: 10,
  striped: true,       // 斑马纹
  hoverable: true,     // 悬浮高亮
  bordered: false,     // 边框
  compact: false,      // 紧凑模式
  emptyText: '暂无数据',
  loadingText: '加载中...',
  showFilter: true,    // 显示搜索工具栏
  showToolbar: true,   // 显示工具栏
  showExport: true,    // 显示导出按钮
  showPageSize: true,  // 显示每页条数选择

  // 回调
  onSort: (sorts) => console.log('排序:', sorts),
  onFilter: (text) => console.log(`过滤: ${text}`),
  onRowClick: (row, index, event) => console.log('点击行:', row),
  onPageChange: (page, pageSize) => console.log('翻页:', page)
});

// 设置数据（支持数组、ref、useDeps）
table.setData([
  { id: 1, name: '张三', email: 'zhang@test.com', role: 'admin', status: 'active' },
  { id: 2, name: '李四', email: 'li@test.com', role: 'viewer', status: 'inactive' }
]);
table.setData(deps.users.data); // 直接传入 useDeps 的 ref

// 控制
table.setLoading(true);
table.setColumns(newColumns);
table.refresh();
table.getPage(); // { current, pageSize, total }
table.destroy();
```

### 6.2 行选择（checkbox / radio）

```js
const table = initTable('#table', {
  columns: [...],
  selection: 'checkbox',  // 'checkbox' | 'radio'
  onSelect: (selectedKeys, selectedRows) => {
    console.log('选中:', selectedKeys, selectedRows);
  }
});

// API
table.selectAll();          // 全选当前页
table.deselectAll();        // 取消全选
table.invertSelection();    // 反选
table.selectRow(1);         // 选中某行
table.deselectRow(1);       // 取消某行
table.getSelectedKeys();    // 获取选中 key 数组
table.getSelectedRows();    // 获取选中行数据
```

### 6.3 行展开

```js
const table = initTable('#table', {
  columns: [...],
  expandable: (row) => `
    <div style="padding: 12px;">
      <p>详细信息: ${row.description}</p>
      <p>创建时间: ${row.createdAt}</p>
    </div>
  `,
  onExpand: (key, isExpanded) => {
    console.log(`行 ${key} ${isExpanded ? '展开' : '折叠'}`);
  }
});

// expandable 也可以返回 DOM 元素
expandable: (row) => {
  const div = document.createElement('div');
  div.innerHTML = `<pre>${JSON.stringify(row, null, 2)}</pre>`;
  return div;
}
```

### 6.4 行内编辑

```js
const table = initTable('#table', {
  columns: [
    { key: 'name', title: '姓名' },
    {
      key: 'role', title: '角色',
      editType: 'select',  // 下拉编辑
      editOptions: [
        { value: 'admin', label: '管理员' },
        { value: 'viewer', label: '查看者' }
      ]
    },
    { key: 'email', title: '邮箱', editable: false } // 禁止编辑此列
  ],
  editable: true,  // 启用行内编辑（双击触发）
  onEditSave: (row, colKey, newValue, allData) => {
    // 自定义保存逻辑（如调用 API）
    row[colKey] = newValue;
    console.log(`保存 ${colKey}: ${newValue}`);
  },
  onEditCancel: (editingCell) => {
    console.log('取消编辑:', editingCell);
  }
});
// 双击单元格进入编辑模式，Enter 保存，Escape 取消
```

### 6.5 列固定（sticky）

```js
const table = initTable('#table', {
  columns: [
    { key: 'id', title: 'ID', width: 80, fixed: 'left' },    // 固定左侧
    { key: 'name', title: '姓名', width: 120, fixed: 'left' },
    { key: 'col1', title: '列1' },
    { key: 'col2', title: '列2' },
    // ... 很多列 ...
    { key: 'action', title: '操作', width: 150, fixed: 'right' } // 固定右侧
  ]
});
// 表格容器自动添加 overflow-x: auto，固定列在水平滚动时保持可见
```

### 6.6 列拖拽调整宽度

```js
const table = initTable('#table', {
  columns: [...],
  resizable: true,  // 启用列拖拽
  onColumnResize: (colKey, newWidth) => {
    console.log(`列 ${colKey} 宽度调整为 ${newWidth}px`);
  }
});
// 拖拽列头右边缘即可调整宽度，最小宽度 50px
```

### 6.7 行拖拽排序

```js
const table = initTable('#table', {
  columns: [...],
  draggable: true,  // 启用行拖拽
  onRowDragEnd: (movedRow, fromIndex, toIndex, newData) => {
    console.log(`行从 ${fromIndex} 移到 ${toIndex}`);
    // newData 是拖拽后的完整数据数组
  }
});
```

### 6.8 合并单元格

```js
const table = initTable('#table', {
  columns: [...],
  mergeCells: (data) => [
    // 第 0 行第 0 列，跨 2 行 1 列
    { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
    // 第 3 行第 1 列，跨 1 行 3 列
    { row: 3, col: 1, rowSpan: 1, colSpan: 3 }
  ]
});
// mergeCells 函数接收当前页数据，返回合并配置数组
```

### 6.9 树形表格

```js
const treeData = [
  {
    id: 1, name: '总部', budget: 1000000,
    children: [
      {
        id: 11, name: '技术部', budget: 500000,
        children: [
          { id: 111, name: '前端组', budget: 200000 },
          { id: 112, name: '后端组', budget: 300000 }
        ]
      },
      { id: 12, name: '市场部', budget: 300000 }
    ]
  },
  { id: 2, name: '分公司', budget: 500000 }
];

const table = initTable('#table', {
  columns: [
    { key: 'name', title: '部门' },
    { key: 'budget', title: '预算', sortable: true }
  ],
  tree: {
    childrenKey: 'children',     // 子节点字段名
    defaultExpandAll: false      // 是否默认全部展开
  }
});
table.setData(treeData);
```

### 6.10 大数据虚拟滚动

```js
// 10 万行数据也能流畅滚动
const table = initTable('#table', {
  columns: [...],
  virtualScroll: {
    rowHeight: 40,      // 每行高度（px），必须固定
    overscan: 5,        // 上下额外渲染行数
    maxHeight: '600px'  // 容器最大高度
  }
});
table.setData(hugeDataset); // 100000+ 条数据
```

### 6.11 多列排序

```js
const table = initTable('#table', {
  columns: [
    { key: 'department', title: '部门', sortable: true },
    { key: 'name', title: '姓名', sortable: true },
    { key: 'salary', title: '薪资', sortable: true }
  ],
  multiSort: true,  // 启用多列排序
  onSort: (sorts) => {
    // sorts = [{ key: 'department', order: 'asc' }, { key: 'salary', order: 'desc' }]
    console.log('多列排序:', sorts);
  }
});
// 排序指示器显示优先级序号：1▲ 2▼
```

### 6.12 导出 CSV

```js
// 方式 1：工具栏导出按钮
const table = initTable('#table', {
  columns: [...],
  showToolbar: true,
  showExport: true  // 工具栏显示「导出 CSV」按钮
});

// 方式 2：编程式导出
table.exportCSV('用户列表.csv');  // 自动下载，包含 BOM（Excel 兼容）
```

### 6.13 完整配置参考

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | Array | `[]` | 列配置 |
| `rowKey` | String | `'id'` | 行唯一标识字段 |
| `selection` | String | `null` | `'checkbox'` \| `'radio'` |
| `expandable` | Function | `null` | `(row) => HTML/DOM` |
| `editable` | Boolean | `false` | 启用行内编辑 |
| `resizable` | Boolean | `false` | 列宽拖拽 |
| `draggable` | Boolean | `false` | 行拖拽排序 |
| `multiSort` | Boolean | `false` | 多列排序 |
| `tree` | Object | `null` | `{ childrenKey, defaultExpandAll }` |
| `virtualScroll` | Object | `null` | `{ rowHeight, overscan, maxHeight }` |
| `mergeCells` | Function | `null` | `(data) => [{row, col, rowSpan, colSpan}]` |
| `showFilter` | Boolean | `false` | 显示搜索栏 |
| `showToolbar` | Boolean | `false` | 显示工具栏 |
| `showExport` | Boolean | `false` | 显示导出按钮 |
| `showPageSize` | Boolean | `false` | 显示每页条数选择 |
| `pageSize` | Number | `10` | 每页条数 |
| `pageSizes` | Array | `[10,20,50,100]` | 可选条数 |
| `striped` | Boolean | `true` | 斑马纹 |
| `hoverable` | Boolean | `true` | 悬浮高亮 |
| `bordered` | Boolean | `false` | 边框 |
| `compact` | Boolean | `false` | 紧凑模式 |

**列配置（columns 每项）：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `key` | String | 数据字段名 |
| `title` | String | 列标题 |
| `width` | Number/String | 列宽 |
| `minWidth` | Number/String | 最小列宽 |
| `align` | String | `'left'` \| `'center'` \| `'right'` |
| `sortable` | Boolean | 可排序 |
| `sorter` | Function | `(a, b, order) => Number` 自定义排序 |
| `fixed` | String | `'left'` \| `'right'` 固定列 |
| `render` | Function | `(value, row, index) => HTML/DOM` |
| `editable` | Boolean | `false` 禁止编辑此列 |
| `editType` | String | `'text'` \| `'number'` \| `'email'` 等 |
| `editOptions` | Array | 下拉选项 `[{ value, label }]` |

### 6.14 Pagination 组件（独立使用）

```js
import { initPagination } from '@kupola/kupola';

const pagination = initPagination('#pagination-container', {
  total: 100,
  current: 1,
  pageSize: 10,
  maxPages: 7,
  showTotal: true,
  showSizeChanger: true,
  pageSizes: [10, 20, 50],
  onChange: (page, pageSize) => {
    console.log(`跳转到第 ${page} 页，每页 ${pageSize} 条`);
  }
});

pagination.setCurrent(3);
pagination.setTotal(200);
pagination.setPageSize(20);
pagination.destroy();
```

---

## 6. 状态管理

```js
import { createStore, getStore } from '@kupola/kupola';

// 创建 Store（类似 Pinia）
const useCounterStore = createStore('counter', {
  state: () => ({
    count: 0,
    name: '计数器'
  }),

  getters: {
    double: (state) => state.count * 2,
    greeting: (state) => `${state.name}: ${state.count}`
  },

  mutations: {
    increment(state) { state.count++; },
    decrement(state) { state.count--; },
    setCount(state, val) { state.count = val; }
  },

  actions: {
    async incrementAsync({ commit }) {
      await new Promise(r => setTimeout(r, 500));
      commit('increment');
    }
  }
});

// 使用
const store = getStore('counter');
store.commit('increment');
console.log(store.state.count);   // 1
console.log(store.double);         // 2

// 异步操作
await store.dispatch('incrementAsync');

// 监听变化
store.observe((newState, oldState) => {
  console.log('Store 变化:', newState.count);
});
```

---

## 7. 表单验证

```js
import { validator, initFormValidation } from '@kupola/kupola';

// 内置规则
validator.isEmail('test@example.com');     // true
validator.isPhone('13800138000');          // true
validator.isURL('https://example.com');    // true
validator.isEmpty('');                     // true
validator.minLength('abc', 3);             // true
validator.maxLength('abc', 5);             // true

// HTML 声明式验证
<form id="my-form">
  <input type="text" data-rules="required|minLength:3|maxLength:20">
  <input type="email" data-rules="required|email">
  <input type="password" data-rules="required|minLength:6">
</form>

<script type="module">
  import { initFormValidation } from '@kupola/kupola';
  const result = await initFormValidation('#my-form');
  if (result.valid) {
    console.log('验证通过', result.data);
  }
</script>
```

---

## 8. 主题系统

```js
import { initTheme, setTheme, getTheme, setBrand, getBrand, BRAND_OPTIONS } from '@kupola/kupola';

// 初始化主题
initTheme();

// 切换亮/暗主题
setTheme('dark');
setTheme('light');
console.log(getTheme()); // 'dark'

// 品牌色切换
setBrand('green');
console.log(getBrand()); // 'green'

// 可用品牌色
console.log(BRAND_OPTIONS);
// ['zengqing', 'green', 'xionghuang', 'lanlv', 'meiguizi', ...]
```

**HTML 中切换主题：**
```html
<button class="ds-btn" onclick="Kupola.setTheme('dark')">暗色</button>
<button class="ds-btn" onclick="Kupola.setTheme('light')">亮色</button>
```

---

## 9. CSS 设计系统

Kupola CSS 使用 `ds-` 前缀，基于 CSS 变量系统。

### 12.1 按钮

```html
<button class="ds-btn">默认按钮</button>
<button class="ds-btn ds-btn--primary">主要按钮</button>
<button class="ds-btn ds-btn--secondary">次要按钮</button>
<button class="ds-btn ds-btn--sm">小按钮</button>
<button class="ds-btn ds-btn--md">中按钮</button>
<button class="ds-btn ds-btn--lg">大按钮</button>
<button class="ds-btn" disabled>禁用按钮</button>
<button class="ds-btn ds-btn--loading">加载中</button>
```

### 12.2 表单控件

```html
<input type="text" class="ds-input" placeholder="普通输入">
<input type="text" class="ds-input ds-input--success" value="成功">
<input type="text" class="ds-input ds-input--error" value="错误">
<input type="text" class="ds-input ds-input--warning" value="警告">
<input type="text" class="ds-input" disabled placeholder="禁用">
```

### 12.3 表单布局

```html
<form class="ds-form">
  <div class="ds-form__group">
    <label class="ds-form__label">
      <span class="ds-form__required">*</span> 用户名
    </label>
    <input type="text" class="ds-input">
    <div class="ds-form__error">请输入用户名</div>
  </div>
  <div class="ds-form__actions">
    <button class="ds-btn ds-btn--primary">提交</button>
    <button class="ds-btn">取消</button>
  </div>
</form>
```

### 12.4 下拉菜单

```html
<div class="ds-dropdown">
  <button class="ds-dropdown__trigger ds-btn ds-btn--secondary">
    选择操作 <span>▾</span>
  </button>
  <div class="ds-dropdown__menu">
    <button class="ds-dropdown__item">编辑</button>
    <button class="ds-dropdown__item">复制</button>
    <button class="ds-dropdown__item">删除</button>
  </div>
</div>
```

### 12.5 CSS 变量

```css
/* 颜色 */
var(--bg-brand)           /* 品牌色背景 */
var(--bg-brand-hover)     /* 品牌色悬浮 */
var(--bg-base-secondary)  /* 基础背景 */
var(--bg-overlay-l1)      /* 覆盖层 L1 */
var(--bg-overlay-l2)      /* 覆盖层 L2 */
var(--bg-success-default) /* 成功色 */
var(--bg-error-default)   /* 错误色 */
var(--bg-warning-default) /* 警告色 */

/* 文字 */
var(--text-default)       /* 默认文字 */
var(--text-secondary)     /* 次要文字 */
var(--text-tertiary)      /* 辅助文字 */
var(--text-onbrand)       /* 品牌色上的文字 */
var(--text-success)       /* 成功文字 */
var(--text-error)         /* 错误文字 */

/* 边框 */
var(--border-neutral-l1)  /* 浅边框 */
var(--border-neutral-l2)  /* 深边框 */

/* 间距 */
var(--spacer-4)  var(--spacer-8)  var(--spacer-12)
var(--spacer-16) var(--spacer-24) var(--spacer-32)

/* 圆角 */
var(--radius-4)  var(--radius-8)  var(--radius-12)
```

---

## 10. 工具函数

```js
import { debounce, throttle, deepClone, uuid, isEmpty } from '@kupola/kupola';

// 防抖
const debouncedSearch = debounce(() => {
  fetchResults();
}, 300);

// 节流
const throttledScroll = throttle(() => {
  updatePosition();
}, 100);

// 深拷贝
const copy = deepClone({ a: { b: [1, 2, 3] } });

// 生成 UUID
const id = uuid(); // 'a1b2c3d4-...'

// 判空
isEmpty('');        // true
isEmpty([]);        // true
isEmpty({});        // true
isEmpty(null);      // true

// 其他常用
import { uniqueArray, chunkArray, groupBy, sortBy, filterBy } from '@kupola/kupola';
uniqueArray([1, 2, 2, 3]);     // [1, 2, 3]
chunkArray([1,2,3,4,5], 2);    // [[1,2], [3,4], [5]]
groupBy(users, 'role');         // { admin: [...], viewer: [...] }
sortBy(users, 'name');          // 按 name 排序
```

---

## 11. npm 包结构

### 11.1 子包导出

| 导入路径 | 说明 |
|---------|------|
| `@kupola/kupola` | 主包，包含所有功能 |
| `@kupola/kupola/depends` | 仅依赖子系统 |
| `@kupola/kupola/vite` | Vite 插件 |
| `@kupola/kupola/dist/css/kupola.css` | CSS 样式 |
| `@kupola/kupola/dist/icons/*` | 图标文件 |

### 11.2 构建命令

```bash
npm run build        # Vite 构建（输出到 dist/）
npm run build:rollup # Rollup 构建
npm run dev          # 开发服务器
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

### 11.3 目录结构

```
@kupola/kupola/
├── dist/                    # 构建产物
│   ├── kupola.esm.js        # ES Module 格式
│   ├── kupola.cjs.js        # CommonJS 格式
│   ├── kupola.umd.js        # UMD 格式
│   ├── css/                 # CSS 文件
│   ├── icons/               # SVG 图标
│   ├── plugins/             # Vite 插件
│   └── types/               # TypeScript 类型
├── js/                      # 源码（ES Module）
├── css/                     # CSS 源码
├── plugins/                 # 插件源码
├── types/kupola.d.ts        # 类型定义
└── test/test-all.html       # 终极测试页面
```

---

## 附录：完整 API 速查表

### ref
```
ref(value)           → { value, _subscribers }
```

### useDeps
```
useDeps(props, config) → { [key]: { data, loading, error, refresh, _source }, _dispose }
useQuery(config)       → { data, loading, error, refresh }
clearCache()           → void
```

### 数据源配置
```
source: '/api/path'                    → HTTP GET
source: async (params) => data         → 自定义函数
source: 'localStorage:key'             → 本地存储
source: 'route:params'                 → 路由参数
source: 'ws://host/ws'                 → WebSocket
```

### UI 组件初始化
```
initDropdown(el)    initSelect(el)      initDatepicker(el)
initModal(el)       initDrawer(el)      initCarousel(el)
initSlider(el)      initCollapse(el)    initTooltip(el)
initCalendar(el)    initColorPicker(el) initFileUpload(el)
initTable(el, opts) initPagination(el, opts)
```

### Table API
```
initTable(el, { columns, rowKey, selection, expandable, editable, resizable,
  draggable, multiSort, tree, virtualScroll, mergeCells, showFilter, showExport,
  pageSize, striped, hoverable, bordered, compact })

table.setData(data)        // 设置数据（数组/ref/useDeps）
table.setLoading(bool)     // 设置加载状态
table.setColumns(cols)     // 更新列配置
table.refresh()            // 重新渲染
table.getPage()            // { current, pageSize, total }
table.exportCSV(filename)  // 导出 CSV

// 选择
table.selectAll() / deselectAll() / invertSelection()
table.selectRow(key) / deselectRow(key)
table.getSelectedKeys() / getSelectedRows()

table.destroy()            // 销毁
```
