// SPDX-License-Identifier: MIT
/**
 * Cross-entry runtime contracts: entry points loaded in the same document
 * must share state through global symbols (regression class fixed in
 * 3.3.4/3.3.5). These source-level tests document the contract; the
 * built-bundle dual-load check lives in scripts/package-smoke.mjs.
 * @jest-environment jsdom
 */

import * as platform from '@kupola/platform';
import { defineComponent } from '@kupola/platform/component';
import { registerDirective } from '@kupola/platform/directives';
import { html } from '@kupola/platform/template';

describe('cross-entry runtime contracts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('directives registered through the /directives subpath are applied by root walk', () => {
    registerDirective('k-cross-entry-smoke', {
      mount(el) {
        el.textContent = 'shared';
      },
    });

    const container = document.createElement('div');
    container.innerHTML = '<span k-cross-entry-smoke></span>';
    document.body.appendChild(container);

    const view = platform.walk(container);
    expect(container.querySelector('span').textContent).toBe('shared');
    view.destroy();
  });

  test('component instances created via the /component subpath are recognized by the root entry', () => {
    const Comp = defineComponent({
      setup() {
        return () => html`<div>Hello</div>`;
      },
    });

    const instance = Comp();
    expect(platform.isComponentInstanceLike(instance)).toBe(true);
    instance.destroy();
  });
});
