// SPDX-License-Identifier: MIT
import { Icons, svg, render, PATHS, registerIcons, registerGroup, registerAllGroups, iconGroups } from '@kupola/components';

describe('Icons', () => {
  // ── svg() ──
  describe('svg()', () => {
    test('returns SVG string for known icon', () => {
      const result = svg('check');
      expect(result).toContain('<svg');
      expect(result).toContain('polyline');
      expect(result).toContain('4 12 10 18 20 6');
    });

    test('returns empty string for unknown icon', () => {
      expect(svg('nonexistent')).toBe('');
    });

    test('uses default size 16', () => {
      const result = svg('check');
      expect(result).toContain('width="16"');
      expect(result).toContain('height="16"');
    });

    test('accepts custom size', () => {
      const result = svg('check', 24);
      expect(result).toContain('width="24"');
      expect(result).toContain('height="24"');
    });

    test('accepts custom viewBox', () => {
      const result = svg('check', 16, '0 0 48 48');
      expect(result).toContain('viewBox="0 0 48 48"');
    });

    test('uses default viewBox "0 0 24 24"', () => {
      const result = svg('check');
      expect(result).toContain('viewBox="0 0 24 24"');
    });
  });

  // ── PATHS ──
  describe('PATHS', () => {
    test('contains core icons by default', () => {
      expect(PATHS).toHaveProperty('check');
      expect(PATHS).toHaveProperty('x');
      expect(PATHS).toHaveProperty('plus');
      expect(PATHS).toHaveProperty('minus');
    });

    test('does not contain non-core icons by default', () => {
      expect(PATHS).not.toHaveProperty('search');
      expect(PATHS).not.toHaveProperty('home');
    });
  });

  // ── registerIcons() ──
  describe('registerIcons()', () => {
    test('adds custom icons to PATHS', () => {
      registerIcons({ 'my-icon': '<circle cx="12" cy="12" r="10"/>' });
      expect(PATHS['my-icon']).toBe('<circle cx="12" cy="12" r="10"/>');
      expect(svg('my-icon')).toContain('circle');
    });

    test('overwrites existing icon', () => {
      registerIcons({ 'check': '<rect x="0" y="0" width="24" height="24"/>' });
      expect(PATHS['check']).toContain('rect');
      // Restore
      registerIcons({ 'check': '<polyline points="4 12 10 18 20 6"/>' });
    });
  });

  // ── registerGroup() ──
  describe('registerGroup()', () => {
    test('registers a named group', () => {
      const result = registerGroup('interface');
      expect(result).toBe(true);
      expect(PATHS).toHaveProperty('search');
      expect(PATHS).toHaveProperty('bell');
    });

    test('returns false for unknown group', () => {
      expect(registerGroup('nonexistent')).toBe(false);
    });
  });

  // ── registerAllGroups() ──
  describe('registerAllGroups()', () => {
    test('registers all icon groups', () => {
      registerAllGroups();
      expect(PATHS).toHaveProperty('search');
      expect(PATHS).toHaveProperty('home');
      expect(PATHS).toHaveProperty('refresh');
      expect(PATHS).toHaveProperty('user');
      expect(PATHS).toHaveProperty('star');
    });
  });

  // ── iconGroups ──
  describe('iconGroups', () => {
    test('has all expected groups', () => {
      expect(iconGroups).toHaveProperty('core');
      expect(iconGroups).toHaveProperty('interface');
      expect(iconGroups).toHaveProperty('navigation');
      expect(iconGroups).toHaveProperty('action');
      expect(iconGroups).toHaveProperty('status');
      expect(iconGroups).toHaveProperty('user');
      expect(iconGroups).toHaveProperty('media');
      expect(iconGroups).toHaveProperty('data');
      expect(iconGroups).toHaveProperty('file');
      expect(iconGroups).toHaveProperty('time');
      expect(iconGroups).toHaveProperty('misc');
    });

    test('core group has expected icons', () => {
      expect(iconGroups.core).toHaveProperty('check');
      expect(iconGroups.core).toHaveProperty('x');
    });
  });

  // ── render() ──
  describe('render()', () => {
    test('renders data-icon elements', () => {
      document.body.innerHTML = '<span data-icon="check"></span>';
      render(document);
      const el = document.querySelector('[data-icon="check"]');
      expect(el.innerHTML).toContain('<svg');
      expect(el.classList.contains('icon')).toBe(true);
      document.body.innerHTML = '';
    });

    test('respects data-size attribute', () => {
      document.body.innerHTML = '<span data-icon="check" data-size="32"></span>';
      render(document);
      const el = document.querySelector('[data-icon="check"]');
      expect(el.innerHTML).toContain('width="32"');
      document.body.innerHTML = '';
    });

    test('handles unknown icon gracefully', () => {
      document.body.innerHTML = '<span data-icon="unknown-icon"></span>';
      render(document);
      const el = document.querySelector('[data-icon="unknown-icon"]');
      expect(el.innerHTML).toBe('');
      document.body.innerHTML = '';
    });

    test('does nothing when no data-icon elements exist', () => {
      document.body.innerHTML = '<span>no icons</span>';
      expect(() => render(document)).not.toThrow();
      document.body.innerHTML = '';
    });
  });

  // ── Icons object ──
  describe('Icons', () => {
    test('exposes all API methods', () => {
      expect(typeof Icons.svg).toBe('function');
      expect(typeof Icons.render).toBe('function');
      expect(typeof Icons.registerIcons).toBe('function');
      expect(typeof Icons.registerGroup).toBe('function');
      expect(typeof Icons.registerAllGroups).toBe('function');
      expect(Icons.PATHS).toBeDefined();
      expect(Icons.iconGroups).toBeDefined();
    });
  });
});
