// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Tabs component.
 * @jest-environment jsdom
 */

import { html, resetScheduler } from '../../src/index.js';
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
    // Should not throw
  });
});
