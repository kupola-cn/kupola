// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Unit tests for css() CSS Modules tagged template.
 */

import { css } from '../src/css.js';

afterEach(() => {
  // Clean up injected style tags between tests.
  if (typeof document !== 'undefined') {
    document.querySelectorAll('style[data-kupola-scope]').forEach((el) => el.remove());
  }
});

describe('css — class name mapping', () => {
  test('returns a mapping of original names to scoped names', () => {
    const styles = css`.root { color: red; } .item { padding: 8px; }`;
    expect(styles.root).toMatch(/^k\d+-root$/);
    expect(styles.item).toMatch(/^k\d+-item$/);
  });

  test('generates unique scope IDs across calls with different CSS', () => {
    const a = css`.a { }`;
    const b = css`.b { }`;
    expect(a.a).not.toBe(b.b);
  });

  test('ignores classes that do not start with a valid char', () => {
    const styles = css`.valid { color: red; } 0invalid { color: blue; }`;
    expect(styles.valid).toBeDefined();
    expect(styles['0invalid']).toBeUndefined();
  });

  test('handles hyphenated and underscore class names', () => {
    const styles = css`.my-class { } ._private { }`;
    expect(styles['my-class']).toMatch(/^k\d+-my-class$/);
    expect(styles._private).toMatch(/^k\d+-_private$/);
  });

  test('returns empty object when no classes are present', () => {
    const styles = css`div { color: red; }`;
    expect(styles.dispose).toBeDefined();
    expect(Object.keys(styles).filter((k) => k !== 'dispose').length).toBe(0);
  });
});

describe('css — style injection', () => {
  test('injects a <style> tag with the scoped CSS', () => {
    css`.root { color: red; }`;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    expect(tags.length).toBeGreaterThan(0);
    const last = tags[tags.length - 1];
    expect(last.textContent).toMatch(/\.k\d+-root\s*\{[^}]*color:\s*red/);
  });

  test('rewrites :scope to the scope class', () => {
    css`:scope { display: block; }`;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toMatch(/\.k\d+\s*\{[^}]*display:\s*block/);
  });

  test('interpolates values into the CSS text', () => {
    const color = 'blue';
    const styles = css`.root { color: ${color}; }`;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toContain('color: blue');
    expect(styles.root).toMatch(/^k\d+-root$/);
  });
});

describe('css — :global() handling', () => {
  test('class names inside :global() are not scoped', () => {
    const styles = css`.root { color: red; } :global(.external) { font-size: 14px; }`;
    // .root should be scoped, .external should NOT be in the mapping.
    expect(styles.root).toMatch(/^k\d+-root$/);
    expect(styles.external).toBeUndefined();
    // But the injected CSS should still contain .external (unscoped).
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toContain(':global(.external)');
  });

  test(':global() with nested selectors leaves class names unscoped', () => {
    const styles = css`
      .root { color: red; }
      :global(.parent .child) { font-size: 14px; }
      :global(:not(.excluded)) { margin: 0; }
    `;
    expect(styles.root).toBeDefined();
    expect(styles.parent).toBeUndefined();
    expect(styles.child).toBeUndefined();
    expect(styles.excluded).toBeUndefined();
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toContain(':global(.parent .child)');
    expect(last.textContent).toContain(':global(:not(.excluded))');
  });
});

describe('css — @keyframes scoping', () => {
  test('@keyframes animation names are scoped', () => {
    css`.root { animation: fadeIn 1s; } @keyframes fadeIn { from { opacity: 0; } }`;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    // The @keyframes definition name is scoped.
    expect(last.textContent).toMatch(/@keyframes k\d+-fadeIn/);
    // The animation reference is also scoped.
    expect(last.textContent).toMatch(/animation: k\d+-fadeIn/);
  });

  test('animation-name references are also scoped', () => {
    css`.root { animation-name: slideIn; } @keyframes slideIn { from { transform: translateX(0); } }`;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toMatch(/animation-name: k\d+-slideIn/);
  });

  test('multiple keyframe animations are all scoped', () => {
    css`
      @keyframes fadeIn { from { opacity: 0; } }
      @keyframes slideUp { from { transform: translateY(10px); } }
      .a { animation: fadeIn 1s; }
      .b { animation: slideUp 0.5s; }
    `;
    const tags = document.querySelectorAll('style[data-kupola-scope]');
    const last = tags[tags.length - 1];
    expect(last.textContent).toMatch(/animation: k\d+-fadeIn/);
    expect(last.textContent).toMatch(/animation: k\d+-slideUp/);
  });
});

describe('css — dispose', () => {
  test('dispose removes the style tag from the document', () => {
    const styles = css`.x { color: red; }`;
    const tagsBefore = document.querySelectorAll('style[data-kupola-scope]').length;
    styles.dispose();
    const tagsAfter = document.querySelectorAll('style[data-kupola-scope]').length;
    expect(tagsAfter).toBe(tagsBefore - 1);
  });

  test('dispose is idempotent', () => {
    const styles = css`.y { color: blue; }`;
    styles.dispose();
    styles.dispose(); // second call should not throw
    // No error = pass.
  });

  test('dispose with refCount only removes when last reference is disposed', () => {
    const a = css`.z { color: green; }`;
    const b = css`.z { color: green; }`; // same CSS, shares style tag
    const tagsBefore = document.querySelectorAll('style[data-kupola-scope]').length;
    a.dispose();
    // Style tag should still exist because b still references it.
    const tagsAfter = document.querySelectorAll('style[data-kupola-scope]').length;
    expect(tagsAfter).toBe(tagsBefore);
    b.dispose();
    const tagsFinal = document.querySelectorAll('style[data-kupola-scope]').length;
    expect(tagsFinal).toBe(tagsBefore - 1);
  });
});

describe('css — deduplication', () => {
  test('returns the same scope ID for identical CSS', () => {
    const a = css`.root { color: red; }`;
    const b = css`.root { color: red; }`;
    expect(a.root).toBe(b.root);
  });

  test('returns different scope IDs for different CSS', () => {
    const a = css`.root { color: red; }`;
    const b = css`.root { color: blue; }`;
    expect(a.root).not.toBe(b.root);
  });
});
