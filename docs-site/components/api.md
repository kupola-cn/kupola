# 组件 API

Kupola 组件不是 Web Components，也不依赖 Vue/React。组件通常是一个工厂函数：

```js
const instance = Component(options, children)
```

组件实例可以直接插入 Kupola 模板，也可以手动挂载到 DOM。

## 安装和导入

```bash
npm install @kupola/core @kupola/platform @kupola/components
```

```js
import '@kupola/platform/css'

// 应用入口
import { Panel, Table } from '@kupola/components'

// 推荐的按需入口
import { Panel } from '@kupola/components/panel'
import { Table } from '@kupola/components/table'
```

主入口适合集中导入，子路径适合大型应用和页面级代码分割。所有组件的具体选项和
专属方法以对应组件页面为准。

## 在模板中使用

组件实例可以作为 `html` 模板的子内容：

```js
import { defineComponent, html } from '@kupola/platform'
import { Panel } from '@kupola/components/panel'

const Page = defineComponent({
  setup() {
    return html`
      <main>
        ${Panel({ title: '角色配置' }, html`
          <p>这里由页面负责业务状态和请求。</p>
        `)}
      </main>
    `
  },
})
```

这是 Vite 应用和 HIS-APP 页面工厂最常用的组合方式：页面返回模板，Panel、Table、
SchemaForm 等组件作为模板子节点插入。

## 手动挂载

```js
const panel = Panel({ title: '详情' }, html`<div>内容</div>`)
const container = document.querySelector('#content')

container.replaceChildren(panel.element)
```

组件实例的 `element` 通常是 `DocumentFragment`。挂载时使用 `appendChild`、
`replaceChildren` 或模板插值，不要通过 `innerHTML` 复制实例节点。

## 通用实例方法

```js
const panel = Panel({ title: '原始标题' }, html`<p>内容</p>`)

panel.update({ title: '新标题', bodyScrollable: true })
panel.destroy()
```

| API | 说明 |
| --- | --- |
| `element` | 可挂载的根节点或文档片段。 |
| `update(props)` | 更新组件属性并触发响应式视图刷新。是否支持某个属性由组件页面定义。 |
| `destroy()` | 清理事件、响应式副作用、定时器和嵌套组件。必须在动态组件不再使用时调用。 |
| `on(event, handler)` | 订阅组件事件，返回取消订阅函数；只有声明事件的组件会发出对应事件。 |

部分组件还提供领域方法，例如 Table 的数据操作、Modal 的打开关闭或表单组件的读写
方法。不要把这些方法假定为所有组件共有能力，请以具体 API 页面和类型声明为准。

## 应用挂载和销毁

Vite 应用推荐由 `createApp` 管理根视图：

```js
const app = createApp(Page)
await app.mountAsync('#app')

// 退出应用或替换根容器时
await app.destroyAsync()
```

注册了异步插件时必须使用 `mountAsync()`；只有同步插件才适合 `mount()`。插件需要
在挂载前通过 `.use()` 注册。

## 命名约定

主入口会提供常用的 JavaScript 命名形式：

| 主入口 | 子路径 |
| --- | --- |
| `DatePicker` | `@kupola/components/datepicker` |
| `StatCard` | `@kupola/components/statcard` |
| `TextArea` | `@kupola/components/textarea` |
| `TimePicker` | `@kupola/components/timepicker` |

其余组件通常保持组件名与子路径名称的首字母大小写对应关系。TypeScript 项目可以
直接使用包内公开类型；组件选项和实例类型集中在 `@kupola/components` 的类型入口。
