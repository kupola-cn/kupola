// SPDX-License-Identifier: MIT
import {
  createIconResolver,
  createKupolaIconProvider,
  setupUi,
} from '@kupola/components';
import { createKupolaIconProvider as createUiKupolaIconProvider } from '../src/components/ui.js';
import { html } from '../../platform/src/template.js';
import { render, setIconResolver } from '../../platform/src/render.js';

afterEach(() => {
  document.body.innerHTML = '';
  setIconResolver(null);
});

describe('UI bootstrap', () => {
  test('resolves default and prefixed icon providers', () => {
    const resolver = createIconResolver({
      providers: [
        { prefix: 'local', resolve: (name, size) => `local:${name}:${size}` },
        { prefix: 'third', resolve: (name, size) => `third:${name}:${size}` },
      ],
      fallback: 'local',
    });

    expect(resolver('settings', 18)).toBe('local:settings:18');
    expect(resolver('third:circle', 24)).toBe('third:circle:24');
    expect(resolver('missing:circle', 24)).toBe('');
  });

  test('creates a Kupola provider from selected icon groups', () => {
    const provider = createKupolaIconProvider({ groups: [ 'misc' ] });
    const uiProvider = createUiKupolaIconProvider({ groups: [ 'misc' ] });

    expect(provider.prefix).toBe('kupola');
    expect(provider.resolve('star', 20)).toContain('width="20"');
    expect(uiProvider.resolve('star', 20)).toContain('width="20"');
  });

  test('installs the configured icon resolver for icon templates', async () => {
    setupUi({
      theme: false,
      icons: {
        providers: [
          { prefix: 'third', resolve: (name, size) => `<svg data-icon="${name}" width="${size}"></svg>` },
        ],
        fallback: 'third',
      },
    });
    const view = render(html`<icon name="settings" size="18"></icon>`, document.body);
    await Promise.resolve();

    expect(document.querySelector('icon').innerHTML).toContain('data-icon="settings"');
    view.destroy();
  });
});
