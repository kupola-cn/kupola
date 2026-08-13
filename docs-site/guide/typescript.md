# TypeScript 使用指南

Kupola 提供完整的第一方 TypeScript 类型声明，无需额外安装 `@types/*` 包。所有公共 API 都带有精确的类型推导，让你在 IDE 中获得准确的自动补全和类型检查。

## 1. 类型声明文件位置

Kupola 的类型声明文件随各 npm 包一同发布，源文件位于仓库中：

| 包 | 声明文件位置 |
|---|---|
| `@kupola/core` | `packages/core/src/index.d.ts` |
| `@kupola/platform` | `packages/platform/src/platform.d.ts` + `directives.d.ts` |
| `@kupola/components` | `packages/components/src/types/` 目录 |

`@kupola/components` 的类型按模块组织：

- `common.d.ts` — 公共类型（Destroyable、主题）
- `display.d.ts` — 展示类组件（Tag、Badge、Divider、Collapse、Timeline、Tree、Carousel 等）
- `feedback.d.ts` — 反馈类组件（Alert、Progress、Skeleton、Spin、Empty、Countdown）
- `form-controls.d.ts` — 表单控件（Switch、Select、Checkbox、Radio、Input、Slider、NumberInput、Textarea、Timepicker）
- `form.d.ts` — 表单容器（Form、FormInstance）
- `icons.d.ts` — 图标工具
- `interactive.d.ts` — 交互组件（FileUpload、DynamicTags、ImagePreview、ColorPicker、VirtualList）
- `messaging.d.ts` — 消息与校验（Message、Heatmap、Validation）
- `navigation.d.ts` — 导航组件（Tabs、Pagination、Datepicker、Breadcrumb、Menu、Calendar）
- `overlay.d.ts` — 叠加层组件（Modal、Drawer、Dropdown、Dialog、Notification、Tooltip）
- `schema-form.d.ts` — Schema 驱动的表单（SchemaForm、field builders、校验）
- `table.d.ts` — 表格组件（Table、TableView、FormView）

## 2. 核心类型

### Signal\<T\>

`Signal<T>` 是 Kupola 最基础的响应式原语。创建时会自动推导类型，也可以显式标注：

```ts
import { signal, type Signal } from '@kupola/platform'

// 自动推导
const count = signal(0)          // Signal<number>
const name = signal('Kupola')    // Signal<string>
const items = signal([1, 2, 3]) // Signal<number[]>

// 显式标注（宽松类型或联合类型）
const status: Signal<'idle' | 'loading' | 'error'> = signal('idle')
```

Signal 实例的方法和属性：

```ts
const s = signal(42)

s.value       // number — 读取（在 effect 内自动注册依赖）
s.value = 99  // 写入（值变化时触发订阅者）
s.peek()      // 不注册依赖读取
s.dispose()   // 释放所有订阅引用
s.toString()  // 返回值的字符串表示
s.toJSON()    // 返回原始值（用于 JSON.stringify）
```

### ReadonlySignal\<T\>

`computed()` 返回的是只读信号，不可直接赋值：

```ts
import { computed, type ReadonlySignal } from '@kupola/platform'

const doubled: ReadonlySignal<number> = computed(() => count.value * 2)
```

### SignalOptions

创建 Signal 时传入调试标签：

```ts
import { signal, type SignalOptions } from '@kupola/platform'

const options: SignalOptions = { label: 'userName' }
const name = signal('', options)
```

### Dispose

`effect()` 和 `watch()` 返回的清理函数类型：

```ts
import { effect, type Dispose } from '@kupola/platform'

const stop: Dispose = effect(() => {
  console.log(count.value)
})
// 稍后停止
stop()
```

### Computed\<T\>

`computed()` 返回 `ReadonlySignal<T>`，自动推导返回类型：

```ts
import { computed } from '@kupola/platform'

const count = signal(1)
const doubled = computed(() => count.value * 2)  // ReadonlySignal<number>
const fullName = computed(() => `${firstName.value} ${lastName.value}`) // ReadonlySignal<string>
```

计算属性只在依赖变化时重新求值，并缓存结果直至下次失效。

### DeepReactive\<T\>

`reactive()` 返回深度响应式代理，类型为 `DeepReactive<T>`。该类型递归地将所有嵌套的普通对象和数组属性变为响应式，同时保留内置类型（`Date`、`RegExp`、`Map`、`Set` 等）和 `Signal` 实例的原样：

```ts
import { reactive, type DeepReactive } from '@kupola/platform'

interface Profile {
  age: number
  email: string
}

interface User {
  name: string
  profile: Profile
  tags: string[]
}

const user: DeepReactive<User> = reactive({
  name: 'Alice',
  profile: { age: 30, email: 'a@b.com' },
  tags: ['admin'],
})

// 深层嵌套属性也是响应式的
user.profile.age = 31  // 触发更新
```

**注意**：`Map` 和 `Set` 不会被深度代理。如果你需要 Map 中存储的对象也是响应式的，请先手动包装：

```ts
const map = new Map<string, User>()
map.set('user1', reactive({ name: 'Bob', profile: { age: 25, email: 'b@b.com' }, tags: [] }))
```

### Reactive Built-in 类型

以下类型在 `reactive()` 中不会被代理，保持原样：

`Function`、`Date`、`RegExp`、`ArrayBuffer`、`ArrayBufferView`、`DataView`、`Map`、`Set`、`WeakMap`、`WeakSet`、`Signal`

### MaybeSignal\<T\> / ReactiveValue\<T\>

模板和 API 中常用的联合类型别名：

```ts
import { type MaybeSignal, type ReactiveValue } from '@kupola/platform'

// 接受普通值或 Signal/ReadonlySignal
type MaybeSignal<T> = T | Signal<T> | ReadonlySignal<T>

// 接受普通值、Signal 或 getter 函数
type ReactiveValue<T> = MaybeSignal<T> | (() => T)
```

### View / PageView

视图函数类型：

```ts
import { type View, type PageView } from '@kupola/platform'

// 视图函数：接收 props 返回 TemplateResult
type View<Props = Record<string, unknown>> = (props: Props) => TemplateResult

// PageView 是 View 的语义别名
type PageView<Props = Record<string, unknown>> = View<Props>
```

### EventHandler / AsyncEventHandler

事件回调类型：

```ts
import { type EventHandler, type AsyncEventHandler } from '@kupola/platform'

type EventHandler<E extends Event = Event> = (event: E) => void

type AsyncEventHandler<E extends Event = Event> = (event: E) => MaybePromise<void>
```

### Component / ComponentFactory

组件工厂类型：

```ts
import { type Component, type ComponentFactory } from '@kupola/platform'

type Component<Props extends Record<string, any> = Record<string, any>> = (
  initialProps?: Props,
  children?: ViewChild
) => ComponentInstance

type ComponentFactory<Props = Record<string, any>> = {
  (initialProps?: Props, children?: ViewChild): ComponentInstance
}
```

### ComponentInstance

组件实例的类型定义：

```ts
import { type ComponentInstance } from '@kupola/platform'

interface ComponentInstance {
  readonly element: DocumentFragment
  readonly _instance: TemplateInstance
  destroy: () => void
  update: (props: Record<string, any>) => void
  on: (event: string, handler: (...args: any[]) => void) => () => void
  onBeforeUnmount: (fn: () => void) => () => void
  onAfterUnmount: (fn: () => void) => () => void
}
```

## 3. defineComponent 类型化

`defineComponent` 支持泛型声明 Props 类型，在 `setup` 上下文中自动推导：

```ts
import { defineComponent, type ComponentSetupContext } from '@kupola/platform'

interface MyProps {
  title: string
  count: number
}

const MyComponent = defineComponent<MyProps>({
  setup({ props }) {
    // props.title  → Signal<string>
    // props.count  → Signal<number>
    return html`<h1>${props.title.value}: ${props.count.value}</h1>`
  },
})
```

`ComponentSetupContext<Props>` 包含完整的类型信息：

```ts
interface ComponentSetupContext<Props> {
  readonly props: { [K in keyof Props]: Signal<Props[K]> }
  readonly children: ViewChild
  readonly emit: (event: string, ...args: any[]) => void
  readonly lifecycle: ComponentLifecycleContext<Props>
}
```

### 配合运行时 Props 定义

你可以同时使用泛型（编译时）和 `props` 定义（运行时校验）：

```ts
interface CounterProps {
  count?: number
  label?: string
}

const Counter = defineComponent<CounterProps>({
  props: [
    { name: 'count', type: Number, default: 0 },
    { name: 'label', type: String, default: 'Count' },
  ],
  setup({ props }) {
    // props.count  → Signal<number | undefined>
    // props.label  → Signal<string | undefined>
    return () => html`<div>${props.label.value}: ${props.count.value}</div>`
  },
})
```

### 生命周期上下文

`ComponentLifecycleContext<Props>` 在 `mounted` 和 `destroyed` 钩子中可用：

```ts
interface ComponentLifecycleContext<Props> {
  readonly props: { [K in keyof Props]: Signal<Props[K]> }
  readonly element: Node | null
  readonly elements: Node[]
  readonly signal?: AbortSignal
  onMounted(callback: (context: ComponentLifecycleContext<Props>) => void): () => void
  onCleanup(callback: () => void): () => void
}
```

## 4. defineView 类型化

`defineView` 用于创建轻量无状态视图，泛型参数定义 Props 类型：

```ts
import { defineView } from '@kupola/platform'

interface CardProps {
  name: string
  age: number
}

const Card = defineView<CardProps>((props) => {
  // props.name  → string
  // props.age   → number
  return html`<div class="card">
    <h2>${props.name}</h2>
    <span>${props.age} 岁</span>
  </div>`
})

// 使用
const card = Card({ name: '张三', age: 28 })
```

与 `defineComponent` 不同，`defineView` 的 props 是普通值（非 Signal），直接使用即可。

## 5. useForm 类型化

`useForm` 返回的 `FormState` 中，`values` 是 `Signal` 类型，字段可类型化：

```ts
import { useForm, type FormState } from '@kupola/platform'

interface LoginForm {
  username: string
  password: string
}

const form: FormState = useForm<LoginForm>(
  { username: '', password: '' },
  (values) => {
    // values → Record<string, any>（运行时校验）
    const errors: Partial<Record<keyof LoginForm, string>> = {}
    if (!values.username) errors.username = '请输入用户名'
    if (!values.password) errors.password = '请输入密码'
    return errors
  },
  { validateMode: 'onChange' },
)

// form.values   → Signal<Record<string, any>>
// form.errors   → Signal<Record<string, string>>
// form.isValid  → ReadonlySignal<boolean>
// form.isDirty  → ReadonlySignal<boolean>
```

`FormState` 完整类型：

```ts
interface FormState {
  values: Signal<Record<string, any>>
  errors: Signal<Record<string, string>>
  touched: Signal<Record<string, boolean>>
  isDirty: ReadonlySignal<boolean>
  isValid: ReadonlySignal<boolean>
  isSubmitting: Signal<boolean>
  submitCount: Signal<number>
  setField: (name: string, value: any) => void
  setFields: (patch: Record<string, any>) => void
  setTouched: (name: string) => void
  validate: () => boolean | Promise<boolean>
  reset: (nextInitial?: Record<string, any>) => void
  handleSubmit: (handler: (values: Record<string, any>) => void | Promise<void>) => (event?: Event) => Promise<boolean>
}
```

## 6. useQuery 类型化

`useQuery<T>` 支持泛型，让返回数据具备完整类型：

```ts
import { useQuery } from '@kupola/platform'

interface Patient {
  id: number
  name: string
  age: number
  department: string
}

// 返回类型为 Promise<Patient[]>
const patients = await useQuery<Patient[]>(
  'patients:list',
  () => api.listPatients(),
  { staleTime: 60_000 },
)

// patients 自动具备 Patient[] 类型
patients.forEach((p) => {
  console.log(p.name) // string
  console.log(p.id)   // number
})
```

缓存管理 API 的类型：

```ts
import { invalidateQuery, invalidateQueries, prefetchQuery, getQueryCacheSize, getPendingQueryCount, resetQueryCache } from '@kupola/platform'

// 使单个缓存失效
invalidateQuery('patients:list')

// 按条件批量失效
invalidateQueries((key) => key.startsWith('patients:'))

// 预热缓存
prefetchQuery('patients:list', () => api.listPatients(), { staleTime: 60_000 })

// 查看缓存状态
console.log(getQueryCacheSize())    // number
console.log(getPendingQueryCount()) // number

// 清空缓存
resetQueryCache()
```

## 7. 组件 Props 类型

### Table 组件

```ts
import { Table, type TableColumn, type TableOptions, type TableInstance } from '@kupola/components/table'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

// 列定义 — 自动推导 row 类型
const columns: TableColumn<User>[] = [
  {
    key: 'name',
    title: '姓名',
    sortable: true,
    render: (value, row) => {
      // value → unknown, row → User
      return html`<strong>${row.name}</strong>`
    },
  },
  { key: 'email', title: '邮箱' },
  { key: 'role', title: '角色', align: 'center' },
]

// 表格选项
const tableOptions: TableOptions<User> = {
  data: users,
  columns,
  rowKey: 'id',
  striped: true,
  hoverable: true,
  selection: 'checkbox',
  onRowClick: (row) => {
    // row → User
    console.log(`点击了 ${row.name}`)
  },
  onSelect: (keys, rows) => {
    // keys → unknown[], rows → User[]
    console.log(`选中了 ${rows.length} 行`)
  },
}

// 创建表格实例
const table: TableInstance<User> = Table<User>(tableOptions)

// 实例方法
table.setData(newUsers)           // 更新数据
table.getSelectedRows()           // User[]
table.selectRow(userId)           // 选中行
table.exportCSV()                 // 导出 CSV
table.setSort('name', 'asc')      // 排序
table.setPage(2)                  // 翻页
table.refresh()                   // 刷新
```

### TableView 组件

TableView 是一个返回 `ComponentInstance` 的声明式渲染 API：

```ts
import { TableView } from '@kupola/components/table'

const tableView = TableView<User>({
  data: users,
  columns,
  ariaLabel: '用户列表',
  options: { striped: true, hoverable: true },
})
// tableView → ComponentInstance
```

### Select 组件

```ts
import { Select, type SelectOptions, type SelectOption, type SelectInstance } from '@kupola/components/form-controls'

const options: SelectOption[] = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou', disabled: true },
]

const select: SelectInstance = Select({
  options,
  placeholder: '请选择城市',
  searchable: true,
  clearable: true,
  onChange: (event) => {
    // event.value → string | number | ''
    // event.text  → string
    // event.values → (string | number)[]
  },
})

select.setValue('shanghai')
select.getValue() // 'shanghai'
select.open()
select.isOpen()   // boolean
```

### VirtualList 组件

```ts
import { VirtualList, type VirtualListOptions, type VirtualListInstance } from '@kupola/components/interactive'

interface Item {
  id: number
  text: string
}

const list: VirtualListInstance<Item> = VirtualList<Item>({
  items: items,
  itemHeight: 40,
  height: 400,
  overscan: 5,
  renderItem: (item, index) => {
    // item → Item, index → number
    return html`<div class="row">${item.id}: ${item.text}</div>`
  },
  onItemClick: (item, index) => {
    console.log(`点击了第 ${index} 项: ${item.text}`)
  },
})

list.setData(newItems)
list.scrollTo(50)
```

### SchemaForm 组件

SchemaForm 使用泛型 `TData` 实现端到端类型安全：

```ts
import { SchemaForm, schema, text, email, select, type SchemaFormOptions, type SchemaFormApi } from '@kupola/components/schema-form'

interface UserForm {
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
}

const userSchema = schema<UserForm>({
  name: text('姓名').required('请输入姓名').build(),
  email: email('邮箱').required('请输入邮箱').build(),
  role: select('角色', [
    { label: '管理员', value: 'admin' },
    { label: '编辑者', value: 'editor' },
    { label: '观察者', value: 'viewer' },
  ]).required().build(),
})

const form = SchemaForm<UserForm>({
  schema: userSchema,
  values: { name: '', email: '', role: 'viewer' },
  onSubmit: (data, api, event) => {
    // data  → UserForm
    // api   → SchemaFormApi<UserForm>
    console.log(data.name, data.email, data.role)
  },
  onReady: (api) => {
    // api → SchemaFormApi<UserForm>
    api.setData({ name: '张三', email: 'zhangsan@example.com' })
  },
})
```

### 其他组件类型速览

```ts
// 导航
import { Tabs, type TabsOptions, type TabsInstance } from '@kupola/components/navigation'
import { Pagination, type PaginationOptions, type PaginationInstance } from '@kupola/components/navigation'
import { Calendar, type CalendarOptions, type CalendarEvent } from '@kupola/components/navigation'

// 叠加层
import { Modal, type ModalOptions, type ModalInstance } from '@kupola/components/overlay'
import { Drawer, type DrawerOptions, type DrawerInstance } from '@kupola/components/overlay'
import { Dialog } from '@kupola/components/overlay'  // confirm / alert 返回 Promise

// 反馈
import { Alert, type AlertOptions } from '@kupola/components/feedback'
import { Progress, type ProgressOptions, type ProgressInstance } from '@kupola/components/feedback'

// 消息
import { Message, type MessageOptions } from '@kupola/components/messaging'
import { Notification } from '@kupola/components/overlay'
import { Validation, type ValidationOptions, type ValidationInstance } from '@kupola/components/messaging'

// 表单控件
import { Input, type InputOptions, type InputInstance } from '@kupola/components/form-controls'
import { Switch, type SwitchOptions, type SwitchInstance } from '@kupola/components/form-controls'
import { Checkbox, type CheckboxOptions } from '@kupola/components/form-controls'
import { Radio, type RadioOptions, type RadioInstance } from '@kupola/components/form-controls'
import { Slider, type SliderOptions, type SliderInstance } from '@kupola/components/form-controls'
import { NumberInput, type NumberInputOptions } from '@kupola/components/form-controls'
import { Textarea, type TextareaOptions } from '@kupola/components/form-controls'
import { Timepicker, type TimepickerOptions } from '@kupola/components/form-controls'

// 展示
import { Tag, type TagOptions } from '@kupola/components/display'
import { Badge, type BadgeOptions } from '@kupola/components/display'
import { Avatar, type AvatarOptions } from '@kupola/components/display'
import { Tree, type TreeNode, type TreeOptions } from '@kupola/components/display'
import { Panel, type PanelOptions, type PanelInstance } from '@kupola/components/display'
import { Collapse, type CollapseItem } from '@kupola/components/display'
import { Carousel, type CarouselOptions } from '@kupola/components/display'
import { Timeline, type TimelineItem } from '@kupola/components/display'
import { Statcard, type StatcardOptions } from '@kupola/components/display'

// 交互
import { FileUpload, type FileUploadOptions } from '@kupola/components/interactive'
import { DynamicTags, type DynamicTagsOptions } from '@kupola/components/interactive'
import { ImagePreview, type ImagePreviewOptions, type ImagePreviewItem } from '@kupola/components/interactive'
import { ColorPicker, type ColorPickerOptions } from '@kupola/components/interactive'
```

## 8. 最佳实践

### 为状态选择合适的类型

| 场景 | 推荐类型 | 原因 |
|---|---|---|
| 可变的基本状态 | `Signal<T>` | 轻量、trackable、赋值即生效 |
| 派生/计算值 | `ReadonlySignal<T>`（computed） | 自动缓存、惰性求值 |
| 深层嵌套对象 | `DeepReactive<T>`（reactive） | 深层属性自动响应式 |
| 组件 Props | `defineComponent<Props>` | IDE 自动补全 + 类型检查 |
| 表单校验 | `useForm<FormType>` | 校验与值的类型对齐 |
| API 响应 | `useQuery<ResponseType>` | 返回数据自动推导类型 |
| 模板插值 | `MaybeSignal<T>` | 兼容普通值和响应式值 |

### 类型推导优先

尽量让 TypeScript 自动推导，减少显式标注：

```ts
// ✅ 推荐：自动推导
const count = signal(0)                    // Signal<number>
const doubled = computed(() => count.value * 2) // ReadonlySignal<number>
const user = reactive({ name: 'Alice', age: 30 }) // DeepReactive<{ name: string; age: number }>

// ⚠️ 仅在必要时显式标注
const status: Signal<'idle' | 'loading' | 'error'> = signal('idle')
```

### 使用 keyof 约束校验错误

在 `useForm` 的校验函数中，使用 `keyof` 和 `Partial<Record<keyof T, string>>` 确保错误键名与表单字段一致：

```ts
interface ProfileForm {
  nickname: string
  bio: string
}

const form = useForm<ProfileForm>(
  { nickname: '', bio: '' },
  (values) => {
    const errors: Partial<Record<keyof ProfileForm, string>> = {}
    // errors 只接受 'nickname' | 'bio' 键名，拼写错误会报编译错误
    if (values.nickname.length < 2) errors.nickname = '至少 2 个字符'
    return errors
  },
)
```

### 正确处理 DeepReactive 中的 Map/Set

`Map` 和 `Set` 不会被深度代理，内部存储的对象修改不会触发更新：

```ts
// ❌ 不会触发响应式更新
const state = reactive({ items: new Map<string, { count: number }>() })
state.items.set('a', { count: 1 })
state.items.get('a')!.count = 2  // 不会触发

// ✅ 正确做法：先包装再存储
const state = reactive({ items: new Map<string, DeepReactive<{ count: number }>>() })
state.items.set('a', reactive({ count: 1 }))
state.items.get('a')!.count = 2  // 触发更新
```

### 为自定义组件导出类型

如果你的公共组件封装了 Table、Select 等，导出其 Options 和 Instance 类型：

```ts
import { type TableOptions, type TableInstance } from '@kupola/components/table'

interface User { id: number; name: string }

export type UserTableOptions = TableOptions<User>
export type UserTableInstance = TableInstance<User>

export function createUserTable(options: UserTableOptions): UserTableInstance {
  return Table<User>(options)
}
```

### 事件处理器的类型

模板中的事件处理器可直接使用事件类型：

```ts
import { type EventHandler } from '@kupola/platform'

const handleClick: EventHandler<MouseEvent> = (event) => {
  // event → MouseEvent
  console.log(event.clientX, event.clientY)
}

const MyButton = defineView<{ onClick: EventHandler<MouseEvent> }>((props) => {
  return html`<button onclick=${props.onClick}>点击</button>`
})
```