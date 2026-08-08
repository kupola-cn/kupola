// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Panel component.
 * @jest-environment jsdom
 */

import { html } from '../../platform/src/template.js';
import { resetScheduler } from '../../core/src/scheduler.js';
import { Panel } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

describe('Panel rendering', () => {
  test('renders the body without an empty header', () => {
    const view = Panel({}, html`<p>Body</p>`);
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-panel')).not.toBeNull();
    expect(document.body.querySelector('.ds-panel__header')).toBeNull();
    expect(document.body.querySelector('.ds-panel__body p').textContent).toBe('Body');

    view.destroy();
  });

  test('renders title, subtitle, actions, and footer', () => {
    const view = Panel({
      title: '角色',
      subtitle: '选择角色',
      actions: html`<button type="button">新增</button>`,
      footer: html`<button type="button">保存</button>`,
    }, html`<p>配置内容</p>`);
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-panel__title').textContent).toBe('角色');
    expect(document.body.querySelector('.ds-panel__subtitle').textContent).toBe('选择角色');
    expect(document.body.querySelector('.ds-panel__actions button').textContent).toBe('新增');
    expect(document.body.querySelector('.ds-panel__footer button').textContent).toBe('保存');
    expect(document.body.querySelector('.ds-panel__body p').textContent).toBe('配置内容');

    view.destroy();
  });

  test('supports a custom header and component interpolation', () => {
    const nested = Panel({ title: 'Nested' }, html`<span>Nested body</span>`);
    const view = Panel({
      header: html`<div class="custom-header">自定义标题</div>`,
      bodyPadding: 'none',
      bodyScrollable: true,
      fill: true,
    }, html`${nested}`);
    document.body.appendChild(view.element);

    const root = document.body.querySelector('.ds-panel');
    expect(root.querySelector('.custom-header').textContent).toBe('自定义标题');
    expect(root.querySelector('.ds-panel__header').querySelector('.ds-panel__title')).toBeNull();
    expect(root.classList.contains('ds-panel--fill')).toBe(true);
    expect(root.querySelector('.ds-panel__body').classList.contains('ds-panel__body--scrollable')).toBe(true);
    expect(root.querySelector('.ds-panel__body').classList.contains('ds-panel__body--padding-none')).toBe(true);
    expect(root.querySelector('.ds-panel__body .ds-panel__title').textContent).toBe('Nested');

    view.destroy();
  });
});

describe('Panel options and lifecycle', () => {
  test('applies density, header tone, custom classes, and accessibility attributes', () => {
    const view = Panel({
      title: '详情',
      density: 'compact',
      headerTone: 'muted',
      className: 'feature-panel',
      bodyClassName: 'feature-panel__content',
      role: 'region',
      ariaLabel: '详情面板',
    });
    document.body.appendChild(view.element);

    const root = document.body.querySelector('.ds-panel');
    const title = root.querySelector('.ds-panel__title');
    expect(root.classList.contains('ds-panel--density-compact')).toBe(true);
    expect(root.classList.contains('ds-panel--header-muted')).toBe(true);
    expect(root.classList.contains('feature-panel')).toBe(true);
    expect(root.querySelector('.ds-panel__body').classList.contains('feature-panel__content')).toBe(true);
    expect(root.getAttribute('role')).toBe('region');
    expect(root.getAttribute('aria-label')).toBe('详情面板');
    expect(root.getAttribute('aria-labelledby')).toBeNull();
    expect(title.id).toMatch(/^ds-panel-title-/);

    view.destroy();
  });

  test('updates reactive props and destroys nested content', () => {
    let nestedDestroyed = false;
    const nested = Panel({}, html`<span>Nested</span>`);
    const originalDestroy = nested.destroy;
    nested.destroy = () => {
      nestedDestroyed = true;
      originalDestroy();
    };
    const view = Panel({ title: 'Before' }, html`${nested}`);
    document.body.appendChild(view.element);

    view.update({ title: 'After', bodyScrollable: true });

    expect(document.body.querySelector('.ds-panel__title').textContent).toBe('After');
    expect(document.body.querySelector('.ds-panel__body').classList.contains('ds-panel__body--scrollable')).toBe(true);

    view.destroy();
    expect(nestedDestroyed).toBe(true);
  });
});
