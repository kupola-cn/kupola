import {
  PermissionDirective,
  processPermissionDirectives,
  clearCache,
} from '../src/directive.js';
import {
  registerPermissionHandler,
  clearPermissionHandler,
} from '../src/permission-handler.js';
import { createAuthContext, setAuthContext } from '../src/auth-context.js';

describe('directive', () => {
  beforeEach(() => {
    clearPermissionHandler();
    clearCache();
    setAuthContext(null);
    document.body.innerHTML = '';
  });

  describe('PermissionDirective', () => {
    describe('parse', () => {
      it('should parse simple permission string', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');

        const directive = new PermissionDirective(el);
        const result = directive.parse();

        expect(result).toBe(true);
        expect(directive.permission).toBe('user:read');
        expect(directive.mode).toBe('hide');
      });

      it('should parse array permission', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', '["user:read", "user:write"]');

        const directive = new PermissionDirective(el);
        directive.parse();

        expect(directive.permission).toEqual(['user:read', 'user:write']);
      });

      it('should parse mode attribute', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.setAttribute('k-permission-mode', 'disabled');

        const directive = new PermissionDirective(el);
        directive.parse();

        expect(directive.mode).toBe('disabled');
      });

      it('should parse custom class attribute', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.setAttribute('k-permission-class', 'custom-class');

        const directive = new PermissionDirective(el);
        directive.parse();

        expect(directive.disabledClass).toBe('custom-class');
      });

      it('should parse fallback content attribute', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.setAttribute('k-permission-fallback', '无权限');

        const directive = new PermissionDirective(el);
        directive.parse();

        expect(directive.fallbackContent).toBe('无权限');
      });

      it('should return false for missing permission attribute', () => {
        const el = document.createElement('button');
        const directive = new PermissionDirective(el);
        const result = directive.parse();

        expect(result).toBe(false);
      });
    });

    describe('check', () => {
      it('should return true when user has permission', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(true);
      });

      it('should return false when user does not have permission', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(false);
      });

      it('should check role prefix', () => {
        createAuthContext({ id: '1', role: 'admin' });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'role:admin');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(true);
      });

      it('should check array permissions', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', '["user:read", "user:write"]');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(true);
      });

      it('should use custom permission handler', () => {
        registerPermissionHandler({
          check: (perm) => perm === 'custom:perm',
        });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'custom:perm');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(true);
      });
    });

    describe('apply', () => {
      it('should hide element when no permission (hide mode)', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.style.display).toBe('none');
      });

      it('should disable element when no permission (disabled mode)', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');
        el.setAttribute('k-permission-mode', 'disabled');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.disabled).toBe(true);
        expect(el.classList.contains('k-permission-disabled')).toBe(true);
      });

      it('should show fallback content when no permission (fallback mode)', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');
        el.setAttribute('k-permission-mode', 'fallback');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.innerHTML).toContain('无权限');
      });

      it('should restore element when has permission', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.style.display = 'none';

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.style.display).toBe('');
      });
    });

    describe('restore', () => {
      it('should restore hidden element', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.originalDisplay = 'block';
        el.style.display = 'none';

        directive.restore();

        expect(el.style.display).toBe('block');
      });

      it('should restore disabled element', () => {
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.setAttribute('k-permission-mode', 'disabled');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.originalDisabled = false;
        el.disabled = true;
        el.classList.add('k-permission-disabled');

        directive.restore();

        expect(el.disabled).toBe(false);
        expect(el.classList.contains('k-permission-disabled')).toBe(false);
      });
    });

    describe('destroy', () => {
      it('should restore element and clear cache', () => {
        createAuthContext({ id: '1', permissions: ['user:read'] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.style.display).toBe('none');

        directive.destroy();

        expect(el.style.display).toBe('');
      });
    });
  });

  describe('processPermissionDirectives', () => {
    it('should process all permission directives', () => {
      createAuthContext({ id: '1', permissions: ['user:read'] });

      const container = document.createElement('div');
      container.innerHTML = `
        <button k-permission="user:read">Read</button>
        <button k-permission="user:write">Write</button>
      `;
      document.body.appendChild(container);

      const instances = processPermissionDirectives(container);

      expect(instances.length).toBe(2);
      expect(container.querySelector('[k-permission="user:read"]').style.display).toBe('');
      expect(container.querySelector('[k-permission="user:write"]').style.display).toBe('none');
    });
  });

  describe('clearCache', () => {
    it('should clear permission cache', () => {
      createAuthContext({ id: '1', permissions: ['user:read'] });

      const el = document.createElement('button');
      el.setAttribute('k-permission', 'user:read');

      const directive = new PermissionDirective(el);
      directive.parse();
      directive.check();
      directive.check();

      clearCache();

      setAuthContext(null);

      const result = directive.check();
      expect(result).toBe(false);
    });
  });
});