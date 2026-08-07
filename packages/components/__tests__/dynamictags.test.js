// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the DynamicTags component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../core/src/scheduler.js';
import { DynamicTags } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('DynamicTags rendering', () => {
  test('renders a dynamic-tags wrapper', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-dynamic-tags')).not.toBeNull();
  });

  test('renders an input field', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-dynamic-tags__input')).not.toBeNull();
  });

  test('renders an add button', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-dynamic-tags__add')).not.toBeNull();
  });

  test('sets placeholder on input', () => {
    const view = DynamicTags({ placeholder: 'Type here...' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-dynamic-tags__input');
    expect(input.placeholder).toBe('Type here...');
  });

  test('renders initial tags', () => {
    const view = DynamicTags({ tags: [ 'JS', 'TS', 'Python' ] });
    document.body.appendChild(view.element);

    const tags = document.body.querySelectorAll('.ds-dynamic-tags__tag');
    expect(tags.length).toBe(3);
  });

  test('normalizes, deduplicates, and limits initial tags', () => {
    const view = DynamicTags({
      tags: [ ' A ', '', 'A', 1, 'B', 'C' ],
      maxCount: 2,
    });
    document.body.appendChild(view.element);

    expect(view.getTags()).toEqual([ 'A', 'B' ]);
    expect(document.querySelectorAll('.ds-dynamic-tags__tag')).toHaveLength(2);
    expect(document.querySelector('.ds-dynamic-tags__input').disabled).toBe(true);
    view.destroy();
  });

  test('each tag has a remove button', () => {
    const view = DynamicTags({ tags: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    const removeButtons = document.body.querySelectorAll('.ds-dynamic-tags__remove');
    expect(removeButtons.length).toBe(2);
  });
});

// ─── Add tags ────────────────────────────────────────────────────────────────

describe('DynamicTags add', () => {
  test('addTag adds a new tag', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    view.addTag('NewTag');
    expect(view.getTags()).toContain('NewTag');
  });

  test('addTag renders the new tag in DOM', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    view.addTag('Hello');
    const tags = document.body.querySelectorAll('.ds-dynamic-tags__tag');
    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toContain('Hello');
  });

  test('addTag trims whitespace', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    view.addTag('  spaced  ');
    expect(view.getTags()).toEqual([ 'spaced' ]);
  });

  test('addTag rejects empty string', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    const result = view.addTag('');
    expect(result).toBe(false);
    expect(view.getTags()).toEqual([]);
  });

  test('addTag rejects duplicates', () => {
    const view = DynamicTags({ tags: [ 'A' ] });
    document.body.appendChild(view.element);

    const result = view.addTag('A');
    expect(result).toBe(false);
    expect(view.getTags()).toEqual([ 'A' ]);
  });

  test('addTag respects maxTags', () => {
    const view = DynamicTags({ maxTags: 2, tags: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    const result = view.addTag('C');
    expect(result).toBe(false);
    expect(view.getTags()).toEqual([ 'A', 'B' ]);
  });

  test('onChange fires when tag added', () => {
    const onChange = jest.fn();
    const view = DynamicTags({ onChange });
    document.body.appendChild(view.element);

    view.addTag('Test');
    expect(onChange).toHaveBeenCalledWith([ 'Test' ]);
  });

  test('onChange receives a defensive copy', () => {
    const onChange = jest.fn(value => value.push('mutated'));
    const view = DynamicTags({ onChange });
    view.addTag('Safe');

    expect(view.getTags()).toEqual([ 'Safe' ]);
    view.destroy();
  });

  test('setTags normalizes state and only notifies for changes', () => {
    const onChange = jest.fn();
    const view = DynamicTags({ tags: [ 'A' ], maxTags: 2, onChange });
    document.body.appendChild(view.element);

    expect(view.setTags([ ' B ', 'B', 'C', 'D' ])).toBe(true);
    expect(view.getTags()).toEqual([ 'B', 'C' ]);
    expect(view.setTags([ 'B', 'C' ])).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    view.destroy();
  });

  test('pressing Enter in input adds tag', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-dynamic-tags__input');
    input.value = 'EnterTag';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(view.getTags()).toContain('EnterTag');
  });

  test('clicking add button commits input', () => {
    const view = DynamicTags();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-dynamic-tags__input');
    input.value = 'BtnTag';
    document.body.querySelector('.ds-dynamic-tags__add').click();

    expect(view.getTags()).toContain('BtnTag');
  });
});

// ─── Remove tags ─────────────────────────────────────────────────────────────

describe('DynamicTags remove', () => {
  test('removeTag removes an existing tag', () => {
    const view = DynamicTags({ tags: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.removeTag('B');
    expect(view.getTags()).toEqual([ 'A', 'C' ]);
  });

  test('removeTag returns false for non-existent tag', () => {
    const view = DynamicTags({ tags: [ 'A' ] });
    document.body.appendChild(view.element);

    expect(view.removeTag('Z')).toBe(false);
    expect(view.getTags()).toEqual([ 'A' ]);
  });

  test('removeTag updates DOM', () => {
    const view = DynamicTags({ tags: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    view.removeTag('A');
    const tags = document.body.querySelectorAll('.ds-dynamic-tags__tag');
    expect(tags.length).toBe(1);
  });

  test('clicking remove button removes tag', () => {
    const view = DynamicTags({ tags: [ 'X', 'Y' ] });
    document.body.appendChild(view.element);

    const removeButtons = document.body.querySelectorAll('.ds-dynamic-tags__remove');
    removeButtons[0].click();

    expect(view.getTags()).toEqual([ 'Y' ]);
  });

  test('onChange fires when tag removed', () => {
    const onChange = jest.fn();
    const view = DynamicTags({ tags: [ 'A', 'B' ], onChange });
    document.body.appendChild(view.element);

    view.removeTag('A');
    expect(onChange).toHaveBeenCalledWith([ 'B' ]);
  });

  test('Backspace on empty input removes last tag', () => {
    const view = DynamicTags({ tags: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-dynamic-tags__input');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

    expect(view.getTags()).toEqual([ 'A' ]);
  });
});

// ─── Disabled ────────────────────────────────────────────────────────────────

describe('DynamicTags disabled', () => {
  test('input is disabled when disabled=true', () => {
    const view = DynamicTags({ disabled: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-dynamic-tags__input');
    expect(input.disabled).toBe(true);
  });

  test('disabled tags have no remove buttons', () => {
    const view = DynamicTags({ tags: [ 'A', 'B' ], disabled: true });
    document.body.appendChild(view.element);

    const removeButtons = document.body.querySelectorAll('.ds-dynamic-tags__remove');
    expect(removeButtons.length).toBe(0);
  });

  test('disabled state blocks all mutation APIs and disables add button', () => {
    const onChange = jest.fn();
    const view = DynamicTags({ tags: [ 'A' ], disabled: true, onChange });
    document.body.appendChild(view.element);

    expect(view.addTag('B')).toBe(false);
    expect(view.removeTag('A')).toBe(false);
    expect(view.setTags([ 'C' ])).toBe(false);
    expect(view.getTags()).toEqual([ 'A' ]);
    expect(document.querySelector('.ds-dynamic-tags__add').disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    view.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('DynamicTags destroy', () => {
  test('destroy cleans up', () => {
    const view = DynamicTags({ tags: [ 'A' ] });
    document.body.appendChild(view.element);

    const add = document.querySelector('.ds-dynamic-tags__add');
    expect(() => view.destroy()).not.toThrow();
    expect(() => view.destroy()).not.toThrow();
    expect(view.addTag('B')).toBe(false);
    expect(view.removeTag('A')).toBe(false);
    expect(view.setTags([ 'C' ])).toBe(false);
    add.click();
    expect(view.getTags()).toEqual([ 'A' ]);
  });
});
