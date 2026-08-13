# Modal 对话框

`Modal` 是一个可控的模态框工厂函数，返回实例后由调用方决定何时打开、关闭和销毁。

## 基础用法

```js
import { html } from '@kupola/platform'
import { Modal } from '@kupola/components/modal'

const modal = Modal({ title: '提示', width: '480px' }, html`<p>内容</p>`)
document.body.appendChild(modal.element)
modal.open()
```

## 配置项

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| title | `string` | 标题 |
| width | `string` | 最大宽度，例如 `480px` |
| closableOnMask | `boolean` | 是否允许点击遮罩关闭 |
| escClose | `boolean` | 是否允许 `Esc` 关闭 |

## 方法

- `open()` - 打开弹层
- `close()` - 关闭弹层
- `toggle()` - 切换开关状态
- `destroy()` - 解绑事件并销毁实例

## 说明

- 内置了遮罩点击、ESC 关闭和焦点管理。
- 子内容通过第二个参数传入，支持 `html` 模板或普通节点。

---

## 模态框尺寸

Modal 支持四种预设尺寸，也支持自定义宽度。

```js
import { html } from '@kupola/platform'
import { Modal } from '@kupola/components/modal'

// 小尺寸 — 适用于简单提示
const smallModal = Modal({
  title: '提示',
  size: 'small',       // 预设尺寸：320px
})

// 中等尺寸 — 默认尺寸，适用于普通表单
const mediumModal = Modal({
  title: '编辑用户',
  size: 'medium',      // 预设尺寸：520px
})

// 大尺寸 — 适用于复杂内容
const largeModal = Modal({
  title: '详细信息',
  size: 'large',       // 预设尺寸：720px
})

// 全屏 — 适用于大量内容展示
const fullscreenModal = Modal({
  title: '全屏预览',
  size: 'fullscreen',  // 占满整个视口
})

// 自定义宽度
const customModal = Modal({
  title: '自定义宽度',
  width: '640px',      // 自定义像素值
})

// 百分比宽度
const percentModal = Modal({
  title: '百分比宽度',
  width: '80%',
})
```

| 尺寸 | 宽度 | 适用场景 |
| --- | --- | --- |
| `small` | 320px | 简单确认、提示 |
| `medium` | 520px | 表单、详情（默认） |
| `large` | 720px | 复杂表单、表格 |
| `fullscreen` | 100vw × 100vh | 全屏编辑、预览 |
| 自定义 | `width` 属性值 | 任意宽度 |

---

## 事件回调

### onOpen / onClose

Modal 打开和关闭时触发回调。

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

const modal = Modal({
  title: '用户编辑',
  size: 'medium',
  // 打开时触发
  onOpen: () => {
    console.log('模态框已打开')
    // 打开时加载数据
    fetchUserData().then(data => {
      document.getElementById('userName').value = data.name
    })
  },
  // 关闭时触发
  onClose: () => {
    console.log('模态框已关闭')
    // 关闭时清理状态
    resetForm()
  },
}, html`<p>编辑内容</p>`)

modal.open()
```

### onBeforeOpen / onBeforeClose

在打开/关闭动画执行前触发，可返回 `false` 阻止操作。

```js
const modal = Modal({
  title: '编辑表单',
  onBeforeOpen: () => {
    // 检查权限
    if (!hasEditPermission()) {
      alert('没有编辑权限')
      return false  // 阻止打开
    }
    return true
  },
  onBeforeClose: () => {
    // 检查是否有未保存的更改
    if (hasUnsavedChanges()) {
      const confirmed = confirm('有未保存的更改，确定关闭吗？')
      return confirmed  // 用户确认后才关闭
    }
    return true
  },
}, html`<form>...</form>`)
```

---

## 关闭行为控制

### 点击遮罩关闭 — closeOnBackdrop

```js
const modal = Modal({
  title: '重要操作',
  // 禁止点击遮罩关闭（默认为 true）
  closeOnBackdrop: false,
}, html`<p>请完成此操作后再关闭</p>`)

// 也可以通过 closableOnMask 配置（别名）
const modal2 = Modal({
  title: '提示',
  closableOnMask: false,  // 等效于 closeOnBackdrop: false
}, html`<p>内容</p>`)
```

### ESC 键关闭 — closeOnEscape

```js
const modal = Modal({
  title: '表单填写',
  // 禁止 ESC 键关闭（默认为 true）
  closeOnEscape: false,
}, html`<p>请填写完整表单</p>`)

// 也可以通过 escClose 配置（别名）
const modal2 = Modal({
  title: '提示',
  escClose: false,  // 等效于 closeOnEscape: false
}, html`<p>内容</p>`)
```

### 同时禁用所有关闭方式

```js
const modal = Modal({
  title: '正在处理...',
  closeOnBackdrop: false,
  closeOnEscape: false,
  // 隐藏关闭按钮
  showClose: false,
}, html`
  <div style="text-align: center; padding: 40px;">
    <p>正在处理，请稍候...</p>
    <div class="loading-spinner"></div>
  </div>
`)

modal.open()
```

---

## 自定义底部按钮

Modal 支持自定义 footer，添加操作按钮。

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

const modal = Modal({
  title: '确认删除',
  size: 'small',
  closeOnBackdrop: false,
  // 自定义底部
  footer: html`
    <div style="display: flex; justify-content: flex-end; gap: 8px;">
      <button
        class="btn-cancel"
        onclick="this.closest('.kupola-modal').__modal.close()"
      >
        取消
      </button>
      <button
        class="btn-danger"
        style="background: #ff4d4f; color: white;"
        onclick="
          const modal = this.closest('.kupola-modal').__modal;
          // 执行删除操作
          console.log('删除中...');
          modal.close();
        "
      >
        确认删除
      </button>
    </div>
  `,
}, html`
  <div style="padding: 20px 0;">
    <p style="font-size: 14px; color: #666;">
      确定要删除此项目吗？此操作不可撤销。
    </p>
  </div>
`)

// 挂载到 DOM 并设置引用
document.body.appendChild(modal.element)
modal.element.__modal = modal
modal.open()
```

### 多种 footer 模式

```js
// 无 footer — 简洁模式
const noFooterModal = Modal({
  title: '通知',
  footer: null,
}, html`<p>这是一条通知消息</p>`)

// 单按钮 footer
const singleBtnModal = Modal({
  title: '操作成功',
  footer: html`
    <button onclick="this.closest('.kupola-modal').__modal.close()">知道了</button>
  `,
}, html`<p>操作已成功完成！</p>`)

// 三按钮 footer
const threeBtnModal = Modal({
  title: '保存更改',
  size: 'small',
  footer: html`
    <div style="display: flex; gap: 8px;">
      <button class="btn-text" onclick="...">不保存</button>
      <div style="flex: 1;"></div>
      <button class="btn-default" onclick="...">取消</button>
      <button class="btn-primary" onclick="...">保存</button>
    </div>
  `,
}, html`<p>内容有更改，是否保存？</p>`)
```

---

## 嵌套模板内容

Modal 支持通过 `html` 模板传入复杂的嵌套内容。

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

const modal = Modal({
  title: '用户详情',
  size: 'large',
  footer: html`
    <button onclick="this.closest('.kupola-modal').__modal.close()">关闭</button>
  `,
}, html`
  <div class="user-detail" style="padding: 16px;">
    <!-- 基本信息 -->
    <div class="section" style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 12px; font-size: 16px;">基本信息</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="color: #999; font-size: 12px;">姓名</label>
          <p>张三</p>
        </div>
        <div>
          <label style="color: #999; font-size: 12px;">邮箱</label>
          <p>zhangsan@example.com</p>
        </div>
        <div>
          <label style="color: #999; font-size: 12px;">部门</label>
          <p>技术部</p>
        </div>
        <div>
          <label style="color: #999; font-size: 12px;">职位</label>
          <p>高级工程师</p>
        </div>
      </div>
    </div>

    <!-- 表单编辑 -->
    <div class="section" style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 12px; font-size: 16px;">编辑信息</h3>
      <form id="userEditForm">
        <div style="margin-bottom: 12px;">
          <label>备注</label>
          <textarea name="remark" rows="3" style="width: 100%; margin-top: 4px;"
            placeholder="请输入备注"></textarea>
        </div>
        <div>
          <label>状态</label>
          <select name="status" style="width: 100%; margin-top: 4px;">
            <option value="active">启用</option>
            <option value="inactive">禁用</option>
          </select>
        </div>
      </form>
    </div>

    <!-- 操作日志 -->
    <div class="section">
      <h3 style="margin-bottom: 12px; font-size: 16px;">最近操作</h3>
      <ul style="list-style: none; padding: 0; color: #666; font-size: 13px;">
        <li style="padding: 4px 0;">2024-01-15 管理员修改了用户权限</li>
        <li style="padding: 4px 0;">2024-01-10 用户修改了密码</li>
        <li style="padding: 4px 0;">2024-01-05 用户首次登录</li>
      </ul>
    </div>
  </div>
`)
```

---

## Modal.open() / Modal.close() 静态方法

除了通过实例控制，Modal 还提供了便捷的静态方法用于快速创建和关闭对话框。

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

// 快捷打开 — 自动创建实例并挂载
const modalInstance = Modal.open({
  title: '提示',
  size: 'small',
}, html`<p>这是一条快捷消息</p>`)

// 2 秒后自动关闭
setTimeout(() => {
  Modal.close(modalInstance)
}, 2000)

// 或者直接调用实例方法
modalInstance.close()
```

### 快捷创建确认对话框

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

// 封装确认对话框
function confirmDialog(title, message, onConfirm) {
  const modal = Modal.open({
    title,
    size: 'small',
    closeOnBackdrop: false,
    footer: html`
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="cancelBtn">取消</button>
        <button id="confirmBtn" style="background: #1890ff; color: white;">确认</button>
      </div>
    `,
  }, html`<p style="padding: 16px 0;">${message}</p>`)

  // 绑定按钮事件
  modal.element.querySelector('#cancelBtn').addEventListener('click', () => {
    modal.close()
  })
  modal.element.querySelector('#confirmBtn').addEventListener('click', () => {
    onConfirm()
    modal.close()
  })

  return modal
}

// 使用
confirmDialog('确认删除', '确定要删除此用户吗？此操作不可撤销。', () => {
  console.log('执行删除操作')
  // 调用删除 API
})
```

---

## 完整示例：确认对话框

以下是一个完整的确认对话框示例，展示了自定义标题、内容、按钮和事件处理。

```js
import { Modal } from '@kupola/components/modal'
import { html } from '@kupola/platform'

// ==========================================
// 通用确认对话框工厂函数
// ==========================================
function createConfirmDialog({
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  type = 'default',       // 'default' | 'danger' | 'warning'
  onConfirm = () => {},
  onCancel = () => {},
  showIcon = true,
}) {
  // 图标映射
  const iconMap = {
    danger: '⚠️',
    warning: '⚠️',
    default: 'ℹ️',
  }

  // 按钮颜色映射
  const buttonColorMap = {
    danger: '#ff4d4f',
    warning: '#faad14',
    default: '#1890ff',
  }

  const modal = Modal({
    title,
    size: 'small',
    closeOnBackdrop: false,
    closeOnEscape: true,
    // 打开时回调
    onOpen: () => {
      console.log('确认对话框已打开:', title)
    },
    // 关闭时回调
    onClose: () => {
      onCancel()
    },
    // 自定义底部按钮
    footer: html`
      <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 12px 0;">
        <button
          id="cancelBtn"
          style="
            padding: 6px 16px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            background: white;
            cursor: pointer;
          "
        >
          ${cancelText}
        </button>
        <button
          id="confirmBtn"
          style="
            padding: 6px 16px;
            border: none;
            border-radius: 4px;
            background: ${buttonColorMap[type]};
            color: white;
            cursor: pointer;
          "
        >
          ${confirmText}
        </button>
      </div>
    `,
  }, html`
    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 20px 0;">
      ${showIcon ? html`
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: ${type === 'danger' ? '#fff2f0' : type === 'warning' ? '#fffbe6' : '#e6f7ff'};
          flex-shrink: 0;
        ">${iconMap[type]}</div>
      ` : ''}
      <div style="flex: 1;">
        <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${message}</p>
      </div>
    </div>
  `)

  // 挂载到 DOM
  document.body.appendChild(modal.element)

  // 绑定按钮事件
  const confirmBtn = modal.element.querySelector('#confirmBtn')
  const cancelBtn = modal.element.querySelector('#cancelBtn')

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = '处理中...'

    try {
      await onConfirm()
      modal.close()
    } catch (error) {
      console.error('确认操作失败:', error)
      confirmBtn.disabled = false
      confirmBtn.textContent = confirmText
    }
  })

  cancelBtn.addEventListener('click', () => {
    modal.close()
  })

  // 打开模态框
  modal.open()

  return modal
}

// ==========================================
// 使用示例
// ==========================================

// 1. 普通确认
document.getElementById('deleteBtn').addEventListener('click', () => {
  createConfirmDialog({
    title: '删除用户',
    message: '确定要删除用户"张三"吗？删除后数据将不可恢复。',
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
    onConfirm: async () => {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('用户已删除')
    },
    onCancel: () => {
      console.log('取消删除')
    },
  })
})

// 2. 警告确认
document.getElementById('logoutBtn').addEventListener('click', () => {
  createConfirmDialog({
    title: '退出登录',
    message: '确定要退出登录吗？',
    confirmText: '退出',
    type: 'warning',
    onConfirm: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    },
  })
})

// 3. 信息提示确认
document.getElementById('publishBtn').addEventListener('click', () => {
  createConfirmDialog({
    title: '发布文章',
    message: '确认发布此文章吗？发布后所有用户可见。',
    confirmText: '发布',
    showIcon: false,
    onConfirm: async () => {
      console.log('文章已发布')
    },
  })
})
```

---

## 配置项详解

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` | 模态框标题 |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | 预设尺寸 |
| `width` | `string` | - | 自定义宽度（优先级高于 size） |
| `closeOnBackdrop` | `boolean` | `true` | 点击遮罩是否关闭 |
| `closeOnEscape` | `boolean` | `true` | 按 ESC 是否关闭 |
| `showClose` | `boolean` | `true` | 是否显示关闭按钮 |
| `footer` | `Node \| null` | 默认 footer | 自定义底部内容 |
| `closableOnMask` | `boolean` | `true` | `closeOnBackdrop` 的别名 |
| `escClose` | `boolean` | `true` | `closeOnEscape` 的别名 |
| `onOpen` | `() => void` | - | 打开时回调 |
| `onClose` | `() => void` | - | 关闭时回调 |
| `onBeforeOpen` | `() => boolean` | - | 打开前回调，返回 false 阻止 |
| `onBeforeClose` | `() => boolean` | - | 关闭前回调，返回 false 阻止 |
| `zIndex` | `number` | `1000` | 层级 |
| `className` | `string` | - | 自定义 CSS 类名 |

---

## 说明

- 内置了遮罩点击、ESC 关闭和焦点管理。
- 子内容通过第二个参数传入，支持 `html` 模板或普通节点。
- 模态框打开时会自动管理 body 滚动（禁止背景滚动）。
- 多个模态框同时打开时，zIndex 会自动递增，确保层级正确。
- `footer` 设置为 `null` 可完全隐藏底部区域。
- `Modal.open()` 静态方法会自动将模态框挂载到 `document.body`。
- 使用 `destroy()` 方法彻底清理实例，包括 DOM 元素和事件绑定。