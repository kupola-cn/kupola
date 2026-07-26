// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Tabs component.
 * @jest-environment jsdom
 */

import { html } from '../../../platform/src/template.js';
import { resetScheduler } from '../../src/scheduler.js';
import { Tabs } from '@kupola/components';

const TABS = [
  { key: 'a', label: 'Tab A' },
  { key: 'b', label: 'Tab B' },
  { key: 'c', label: 'Tab C' },
];

const PANELS = {
  a: html`<p>Panel A</p>`,
  b: html`<p>Panel B</p>`,
  c: html`<p>Panel C</p>`,
};

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Tabs rendering', () => {
  test('renders tab buttons and panels', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const tabBtns = container.querySelectorAll('.ds-tab');
    expect(tabBtns.length).toBe(3);
    expect(tabBtns[0].textContent).toBe('Tab A');
    expect(tabBtns[1].textContent).toBe('Tab B');
    expect(tabBtns[2].textContent).toBe('Tab C');

    const panels = container.querySelectorAll('.ds-tabs__panel');
    expect(panels.length).toBe(3);
    expect(panels[0].querySelector('p').textContent).toBe('Panel A');

    view.destroy();
  });

  test('first tab is active by default', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const tabBtns = container.querySelectorAll('.ds-tab');
    expect(tabBtns[0].classList.contains('is-active')).toBe(true);
    expect(tabBtns[1].classList.contains('is-active')).toBe(false);

    const panels = container.querySelectorAll('.ds-tabs__panel');
    expect(panels[0].style.display).toBe('');
    expect(panels[1].style.display).toBe('none');

    view.destroy();
  });

  test('activeKey sets initial active tab', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS, activeKey: 'b' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const tabBtns = container.querySelectorAll('.ds-tab');
    expect(tabBtns[0].classList.contains('is-active')).toBe(false);
    expect(tabBtns[1].classList.contains('is-active')).toBe(true);

    view.destroy();
  });

  test('filled variant applies correct class', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS, variant: 'filled' });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    expect(container.querySelector('.ds-tabs').classList.contains('ds-tabs--filled')).toBe(true);

    view.destroy();
  });

  test('supports typed title, content, and card aliases', () => {
    const view = Tabs({
      tabs: [ { key: 'typed', title: 'Typed tab', content: html`<strong>Typed panel</strong>` } ],
      type: 'card',
    });
    document.body.appendChild(view.element);

    expect(document.querySelector('.ds-tab').textContent).toBe('Typed tab');
    expect(document.querySelector('.ds-tabs__panel strong').textContent).toBe('Typed panel');
    expect(document.querySelector('.ds-tabs').classList.contains('ds-tabs--filled')).toBe(true);
    view.destroy();
  });

  test('adds tablist, tab, and tabpanel accessibility semantics', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    document.body.appendChild(view.element);
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    expect(document.querySelector('[role="tablist"]')).not.toBeNull();
    expect(tabs[0].getAttribute('aria-controls')).toBe(panels[0].id);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    view.destroy();
  });
});

// ─── Tab switching ───────────────────────────────────────────────────────────

describe('Tabs switching', () => {
  test('clicking a tab switches active tab', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const tabBtns = container.querySelectorAll('.ds-tab');
    tabBtns[1].click();

    expect(tabBtns[0].classList.contains('is-active')).toBe(false);
    expect(tabBtns[1].classList.contains('is-active')).toBe(true);

    const panels = container.querySelectorAll('.ds-tabs__panel');
    expect(panels[0].style.display).toBe('none');
    expect(panels[1].style.display).toBe('');

    view.destroy();
  });

  test('setActive() API switches tab', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.setActive('c');
    expect(view.getActive()).toBe('c');

    const tabBtns = container.querySelectorAll('.ds-tab');
    expect(tabBtns[2].classList.contains('is-active')).toBe(true);

    view.destroy();
  });

  test('setActive() with same key is no-op', () => {
    const onChange = jest.fn();
    const view = Tabs({ tabs: TABS, panels: PANELS, onChange });

    view.setActive('a'); // already active
    expect(onChange).not.toHaveBeenCalled();

    view.destroy();
  });

  test('getActive() returns current active key', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS, activeKey: 'b' });
    expect(view.getActive()).toBe('b');
    view.destroy();
  });

  test('ignores unknown and disabled active keys', () => {
    const view = Tabs({
      tabs: [ TABS[0], { ...TABS[1], disabled: true } ],
      activeKey: 'missing',
    });
    document.body.appendChild(view.element);

    expect(view.getActive()).toBe('a');
    view.setActive('b');
    view.setActive('missing');
    expect(view.getActive()).toBe('a');
    expect(document.querySelectorAll('.ds-tab')[1].disabled).toBe(true);
    view.destroy();
  });

  test('supports arrow, Home, and End keyboard navigation', () => {
    const view = Tabs({
      tabs: [ TABS[0], { ...TABS[1], disabled: true }, TABS[2] ],
      panels: PANELS,
    });
    document.body.appendChild(view.element);
    let tabs = document.querySelectorAll('.ds-tab');

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(view.getActive()).toBe('c');
    expect(document.activeElement).toBe(tabs[2]);
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(view.getActive()).toBe('a');
    tabs = document.querySelectorAll('.ds-tab');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(view.getActive()).toBe('c');
    view.destroy();
  });
});

describe('Tabs dynamic items', () => {
  test('addTab and removeTab update DOM and choose a valid fallback', () => {
    const onChange = jest.fn();
    const onClose = jest.fn();
    const view = Tabs({ tabs: TABS.slice(0, 2), panels: PANELS, onChange, onClose });
    document.body.appendChild(view.element);

    view.addTab({ key: 'c', title: 'Tab C', content: 'Panel C' });
    expect(document.querySelectorAll('.ds-tab')).toHaveLength(3);
    view.setActive('b');
    view.removeTab('b');

    expect(view.getActive()).toBe('c');
    expect(onClose).toHaveBeenCalledWith('b');
    expect(onChange).toHaveBeenLastCalledWith('c');
    expect(document.querySelectorAll('.ds-tab')).toHaveLength(2);
    view.destroy();
  });

  test('closable control removes the tab exactly once', () => {
    const onClose = jest.fn();
    const view = Tabs({ tabs: [ { key: 'a', label: 'A', closable: true } ], onClose });
    document.body.appendChild(view.element);
    const close = document.querySelector('.ds-tabs__close');

    close.click();
    close.click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('.ds-tab')).toHaveLength(0);
    view.destroy();
  });

  test('ignores duplicate and invalid additions', () => {
    const view = Tabs({ tabs: [ TABS[0], TABS[0], null ] });
    document.body.appendChild(view.element);
    view.addTab({ key: 'a', title: 'Duplicate' });
    view.addTab({ title: 'Missing key' });
    expect(document.querySelectorAll('.ds-tab')).toHaveLength(1);
    view.destroy();
  });
});

// ─── onChange callback ───────────────────────────────────────────────────────

describe('Tabs onChange', () => {
  test('calls onChange when tab is switched', () => {
    const onChange = jest.fn();
    const view = Tabs({ tabs: TABS, panels: PANELS, onChange });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    const tabBtns = container.querySelectorAll('.ds-tab');
    tabBtns[2].click();

    expect(onChange).toHaveBeenCalledWith('c');

    view.destroy();
  });

  test('does not call onChange on initial render', () => {
    const onChange = jest.fn();
    const view = Tabs({ tabs: TABS, panels: PANELS, onChange });

    expect(onChange).not.toHaveBeenCalled();

    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Tabs destroy', () => {
  test('destroy cleans up', () => {
    const view = Tabs({ tabs: TABS, panels: PANELS });
    const container = document.createElement('div');
    container.appendChild(view.element);
    document.body.appendChild(container);

    view.destroy();
    view.destroy();
    view.setActive('b');
    view.addTab({ key: 'd', title: 'D' });
    view.removeTab('a');
    expect(view.getActive()).toBe('a');
  });
});
