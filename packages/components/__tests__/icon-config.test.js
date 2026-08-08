// SPDX-License-Identifier: MIT
import { clearIcons, getIcon, registerIcons } from '../src/components/icon-config.js';

afterEach(() => {
  clearIcons();
});

describe('icon-config', () => {
  test('registers and resolves custom icons', () => {
    expect(getIcon('close')).toBeUndefined();

    registerIcons({ close: '<svg data-icon="close"></svg>' });

    expect(getIcon('close')).toBe('<svg data-icon="close"></svg>');
  });

  test('overwrites registered icons and clears the registry', () => {
    registerIcons({ close: '<svg data-icon="first"></svg>', menu: '<svg></svg>' });
    registerIcons({ close: '<svg data-icon="second"></svg>' });

    expect(getIcon('close')).toBe('<svg data-icon="second"></svg>');
    expect(getIcon('menu')).toBe('<svg></svg>');

    clearIcons();

    expect(getIcon('close')).toBeUndefined();
    expect(getIcon('menu')).toBeUndefined();
  });
});
