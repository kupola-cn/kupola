import {
  PermissionDirective,
  registerPermissionDirective,
  processPermissionDirectives,
  clearCache,
} from '../src/directive.js';
import {
  registerPermissionHandler,
  clearPermissionHandler,
} from '../src/permission-handler.js';
import { createAuthContext, createAuthStore, setAuthContext } from '../src/auth-context.js';
import { registerDirective, walk } from '@kupola/platform/directives';

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

        expect(directive.permission).toEqual([ 'user:read', 'user:write' ]);
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
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(true);
      });

      it('should return false when user does not have permission', () => {
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');

        const directive = new PermissionDirective(el);
        directive.parse();
        const result = directive.check();

        expect(result).toBe(false);
      });

      it('should fail closed for an incomplete auth context', () => {
        setAuthContext({});
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');

        const directive = new PermissionDirective(el);
        directive.parse();

        expect(() => directive.check()).not.toThrow();
        expect(directive.check()).toBe(false);
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
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

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

      it('should fail closed when a custom permission check is async or throws', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        registerPermissionHandler({ check: () => Promise.resolve(true) });
        const asyncElement = document.createElement('button');
        asyncElement.setAttribute('k-permission', 'async');
        const asyncDirective = new PermissionDirective(asyncElement);
        asyncDirective.parse();

        expect(asyncDirective.check()).toBe(false);

        registerPermissionHandler({ check: () => { throw new Error('broken'); } });
        const throwingElement = document.createElement('button');
        throwingElement.setAttribute('k-permission', 'throwing');
        const throwingDirective = new PermissionDirective(throwingElement);
        throwingDirective.parse();

        expect(throwingDirective.check()).toBe(false);
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      });

      it('should use the explicitly bound auth store instead of the default store', () => {
        const store = createAuthStore();
        store.createAuthContext({ id: '1', permissions: [ 'store:read' ] });
        createAuthContext({ id: '2', permissions: [ 'default:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'store:read');

        const directive = new PermissionDirective(el, { authStore: store });
        directive.parse();

        expect(directive.check()).toBe(true);
      });
    });

    describe('apply', () => {
      it('should hide element when no permission (hide mode)', () => {
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.style.display).toBe('none');
      });

      it('should disable element when no permission (disabled mode)', () => {
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

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
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:write');
        el.setAttribute('k-permission-mode', 'fallback');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.innerHTML).toContain('无权限');
      });

      it('should restore element when has permission', () => {
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

        const el = document.createElement('button');
        el.setAttribute('k-permission', 'user:read');
        el.style.display = 'none';

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();

        expect(el.style.display).toBe('none');
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

      it('should not share cached results between same-tag elements', () => {
        const check = jest.fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
        registerPermissionHandler({ check });

        const first = document.createElement('button');
        const second = document.createElement('button');
        first.setAttribute('k-permission', 'same');
        second.setAttribute('k-permission', 'same');

        const firstDirective = new PermissionDirective(first);
        const secondDirective = new PermissionDirective(second);
        firstDirective.parse();
        secondDirective.parse();

        expect(firstDirective.check()).toBe(true);
        expect(secondDirective.check()).toBe(false);
        expect(check).toHaveBeenCalledTimes(2);
      });

      it('should preserve original state across repeated apply and mode changes', () => {
        createAuthContext({ id: '1', permissions: [] });
        const el = document.createElement('button');
        el.disabled = false;
        el.setAttribute('k-permission', 'write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.listen();
        directive.apply();
        directive.apply();
        expect(el.style.display).toBe('none');

        directive.mode = 'disabled';
        directive.apply();
        expect(el.style.display).toBe('');
        expect(el.disabled).toBe(true);

        createAuthContext({ id: '1', permissions: [ 'write' ] });
        directive.apply();
        expect(el.disabled).toBe(false);
        expect(el.style.display).toBe('');

        directive.stopListening();
      });

      it('should preserve original child nodes in fallback mode', () => {
        createAuthContext({ id: '1', permissions: [] });
        const el = document.createElement('div');
        const child = document.createElement('button');
        let clicks = 0;
        child.addEventListener('click', () => { clicks++; });
        el.appendChild(child);
        el.setAttribute('k-permission', 'write');
        el.setAttribute('k-permission-mode', 'fallback');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.listen();
        directive.apply();
        expect(el.contains(child)).toBe(false);

        createAuthContext({ id: '1', permissions: [ 'write' ] });
        directive.apply();
        expect(el.firstChild).toBe(child);
        child.click();
        expect(clicks).toBe(1);

        directive.stopListening();
      });

      it('should refresh when the auth context changes', () => {
        createAuthContext({ id: '1', permissions: [] });
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();
        directive.listen();
        expect(el.style.display).toBe('none');

        createAuthContext({ id: '1', permissions: [ 'write' ] });
        expect(el.style.display).toBe('');

        directive.destroy();
      });

      it('should tolerate a handler without an unsubscribe function', () => {
        registerPermissionHandler({
          check: () => false,
          onChange: () => undefined,
        });
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'write');
        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();
        directive.listen();

        expect(() => directive.destroy()).not.toThrow();
      });

      it('should refresh existing directives when the handler changes', () => {
        createAuthContext({ id: '1', permissions: [] });
        const el = document.createElement('button');
        el.setAttribute('k-permission', 'write');

        const directive = new PermissionDirective(el);
        directive.parse();
        directive.apply();
        directive.listen();
        expect(el.style.display).toBe('none');

        registerPermissionHandler({ check: () => true });
        expect(el.style.display).toBe('');

        clearPermissionHandler();
        expect(el.style.display).toBe('none');
        directive.destroy();
      });
    });

    describe('destroy', () => {
      it('should restore element and clear cache', () => {
        createAuthContext({ id: '1', permissions: [ 'user:read' ] });

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
      createAuthContext({ id: '1', permissions: [ 'user:read' ] });

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

  describe('platform integration', () => {
    it('should process k-permission during walk()', () => {
      registerPermissionDirective(registerDirective);
      createAuthContext({ id: '1', permissions: [] });

      const container = document.createElement('div');
      container.innerHTML = '<button k-permission="user:write">Write</button>';
      document.body.appendChild(container);

      const walkResult = walk(container);
      const button = container.querySelector('button');
      expect(button.style.display).toBe('none');

      const remounted = processPermissionDirectives(container);
      walkResult.destroy();
      expect(button.style.display).toBe('none');

      createAuthContext({ id: '1', permissions: [ 'user:write' ] });
      expect(button.style.display).toBe('');

      remounted[0].destroy();
    });
  });

  describe('clearCache', () => {
    it('should clear permission cache', () => {
      createAuthContext({ id: '1', permissions: [ 'user:read' ] });

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
