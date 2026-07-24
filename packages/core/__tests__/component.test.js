// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for component API: defineComponent + register.
 * @jest-environment jsdom
 */

import { signal } from '../src/index.js';
import { html } from '../../platform/src/template.js';
import { flushJobs, resetScheduler } from '../src/scheduler.js';
import { defineComponent, register, getComponent, hasComponent, clearRegistry } from '../../platform/src/component.js';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
  clearRegistry();
});

// ─── defineComponent ─────────────────────────────────────────────────────────

describe('defineComponent', () => {
  test('returns a factory function', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
    });

    expect(typeof Comp).toBe('function');
    expect(Comp._isKupolaComponent).toBe(true);
  });

  test('factory returns element, destroy, and update', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
    });

    const view = Comp();
    expect(view.element).toBeDefined();
    expect(typeof view.destroy).toBe('function');
    expect(typeof view.update).toBe('function');
  });

  test('renders component with props', () => {
    const Greeting = defineComponent({
      props: [ 'name' ],
      setup(props) {
        return () => html`<span>Hello ${props.name}</span>`;
      },
    });

    const view = Greeting({ name: 'World' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('Hello World');
    view.destroy();
  });

  test('component internal signal is reactive', () => {
    const Counter = defineComponent({
      setup() {
        const count = signal(0);
        const inc = () => { count.value++; };
        return () => html`
          <span>${count}</span>
          <button onclick="${inc}">+</button>
        `;
      },
    });

    const view = Counter();
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('0');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('1');

    container.querySelector('button').click();
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('2');

    view.destroy();
  });

  test('renders children slot content', () => {
    const Wrapper = defineComponent({
      setup(props, children) {
        return () => html`<div class="wrapper">${children}</div>`;
      },
    });

    const childContent = html`<p>Slot content</p>`;
    const view = Wrapper({}, childContent);
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('.wrapper p').textContent).toBe('Slot content');
    view.destroy();
  });

  test('update changes props reactively', () => {
    const Label = defineComponent({
      props: [ 'text' ],
      setup(props) {
        return () => html`<span>${props.text}</span>`;
      },
    });

    const view = Label({ text: 'initial' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('initial');

    view.update({ text: 'updated' });
    flushJobs();
    expect(container.querySelector('span').textContent).toBe('updated');

    view.destroy();
  });

  test('destroy cleans up reactive effects', () => {
    const Label = defineComponent({
      props: [ 'text' ],
      setup(props) {
        return () => html`<span>${props.text}</span>`;
      },
    });

    const view = Label({ text: 'hello' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('span').textContent).toBe('hello');

    view.destroy();

    // After destroy, updating props should not affect DOM
    view.update({ text: 'after-destroy' });
    flushJobs();
    // The span may or may not exist after destroy, but textContent should not be 'after-destroy'
    const span = container.querySelector('span');
    if (span) {
      expect(span.textContent).not.toBe('after-destroy');
    }
  });

  test('component with no props', () => {
    const Static = defineComponent({
      setup() {
        return () => html`<div>Static content</div>`;
      },
    });

    const view = Static();
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('div').textContent).toBe('Static content');
    view.destroy();
  });

  test('component with multiple props', () => {
    const Card = defineComponent({
      props: [ 'title', 'body' ],
      setup(props) {
        return () => html`
          <div class="card">
            <h2>${props.title}</h2>
            <p>${props.body}</p>
          </div>
        `;
      },
    });

    const view = Card({ title: 'Hello', body: 'World' });
    const container = document.createElement('div');
    container.appendChild(view.element);

    expect(container.querySelector('h2').textContent).toBe('Hello');
    expect(container.querySelector('p').textContent).toBe('World');

    view.update({ title: 'Foo', body: 'Bar' });
    flushJobs();
    expect(container.querySelector('h2').textContent).toBe('Foo');
    expect(container.querySelector('p').textContent).toBe('Bar');

    view.destroy();
  });
});

// ─── register / getComponent ─────────────────────────────────────────────────

describe('component registry', () => {
  test('register and getComponent', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    register('TestComp', Comp);
    expect(getComponent('TestComp')).toBe(Comp);
  });

  test('hasComponent returns true for registered', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    expect(hasComponent('MyComp')).toBe(false);
    register('MyComp', Comp);
    expect(hasComponent('MyComp')).toBe(true);
  });

  test('getComponent returns undefined for unregistered', () => {
    expect(getComponent('NonExistent')).toBeUndefined();
  });

  test('clearRegistry removes all entries', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Test</div>`;
      },
    });

    register('A', Comp);
    register('B', Comp);
    expect(hasComponent('A')).toBe(true);
    expect(hasComponent('B')).toBe(true);

    clearRegistry();
    expect(hasComponent('A')).toBe(false);
    expect(hasComponent('B')).toBe(false);
  });

  test('register overwrites previous component with same name', () => {
    const Comp1 = defineComponent({
      setup() {
        return () => html`<div>One</div>`;
      },
    });
    const Comp2 = defineComponent({
      setup() {
        return () => html`<div>Two</div>`;
      },
    });

    register('Dup', Comp1);
    expect(getComponent('Dup')).toBe(Comp1);

    register('Dup', Comp2);
    expect(getComponent('Dup')).toBe(Comp2);
  });
});
