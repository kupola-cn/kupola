/**
 * @file Panel component stories.
 */
import { Panel } from '../packages/components/src/components/panel.js';
import { html } from '../packages/platform/src/template.js';
import '../packages/css/index.css';

export default {
  title: 'Layout/Panel',
  tags: [ 'autodocs' ],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    density: { control: 'select', options: [ 'compact', 'default', 'comfortable' ] },
    headerTone: { control: 'select', options: [ 'plain', 'muted' ] },
    bodyScrollable: { control: 'boolean' },
    fill: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    title: '角色配置',
    subtitle: '选择角色并管理权限',
    density: 'default',
    headerTone: 'plain',
    bodyScrollable: false,
    fill: false,
  },
  render: args => Panel({
    title: args.title,
    subtitle: args.subtitle,
    density: args.density,
    headerTone: args.headerTone,
    bodyScrollable: args.bodyScrollable,
    fill: args.fill,
    actions: html`<button class="ds-btn ds-btn--secondary" type="button">刷新</button>`,
    footer: html`<button class="ds-btn ds-btn--primary" type="button">保存</button>`,
  }, html`
    <div style="display: grid; gap: 8px;">
      <strong>权限列表</strong>
      <span>Panel 只负责承载内容和统一布局，业务状态由页面管理。</span>
      <span>通过 bodyScrollable 和 fill 可以构成长列表工作区。</span>
    </div>
  `),
};

export const Workbench = {
  render: () => html`
    <div style="display: grid; grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1fr); gap: 12px; height: 360px;">
      ${Panel({
    title: '角色',
    density: 'compact',
    headerTone: 'muted',
    bodyScrollable: true,
    fill: true,
    bodyPadding: 'compact',
  }, html`
        <div style="display: grid; gap: 6px;">
          <button class="ds-btn ds-btn--secondary" type="button">管理员</button>
          <button class="ds-btn ds-btn--secondary" type="button">护士长</button>
          <button class="ds-btn ds-btn--secondary" type="button">普通护士</button>
        </div>
      `)}
      ${Panel({
    title: '详情',
    subtitle: '当前选中角色',
    bodyScrollable: true,
    fill: true,
  }, html`<p>页面布局由业务层 Grid 管理，Panel 只提供每一栏的基础容器。</p>`)}
    </div>
  `,
};
