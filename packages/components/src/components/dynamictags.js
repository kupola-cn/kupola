// SPDX-License-Identifier: MIT
/**
 * @kupola/core — DynamicTags component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-dynamic-tags*` CSS classes for styling.
 *
 * ```js
 * import { DynamicTags } from '@kupola/components/dynamictags';
 *
 * const view = DynamicTags({
 *   tags: ['JavaScript', 'TypeScript'],
 *   onChange: (tags) => console.log(tags),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/dynamictags
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create a DynamicTags component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.tags]       Initial tags array
 * @param {string}   [options.placeholder] Input placeholder text
 * @param {number}   [options.maxTags]    Maximum number of tags
 * @param {boolean}  [options.disabled]   Disabled state
 * @param {Function} [options.onChange]   Callback when tags change
 * @returns {{ element: DocumentFragment, getTags: Function, addTag: Function, removeTag: Function, destroy: Function }}
 */
export function DynamicTags(options = {}) {
  const {
    tags: initialTags = [],
    placeholder = 'Add tag...',
    maxTags = Infinity,
    disabled = false,
    onChange = null,
  } = options;

  let _tags = [ ...initialTags ];

  // ── Public API ─────────────────────────────────────────────────────────────

  function getTags() {
    return [ ..._tags ];
  }

  function addTag(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) {return false;}
    if (_tags.includes(trimmed)) {return false;}
    if (_tags.length >= maxTags) {return false;}
    _tags.push(trimmed);
    _renderTags();
    if (onChange) {onChange(_tags);}
    return true;
  }

  function removeTag(text) {
    const idx = _tags.indexOf(text);
    if (idx === -1) {return false;}
    _tags.splice(idx, 1);
    _renderTags();
    if (onChange) {onChange(_tags);}
    return true;
  }

  function destroy() {
    if (inputEl) {
      inputEl.removeEventListener('keydown', _onKeydown);
      inputEl.removeEventListener('blur', _onBlur);
    }
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      _commitInput();
    } else if (e.key === 'Backspace' && inputEl.value === '' && _tags.length > 0) {
      removeTag(_tags[_tags.length - 1]);
    }
  }

  function _onBlur() {
    _commitInput();
  }

  function _commitInput() {
    if (inputEl && inputEl.value.trim()) {
      addTag(inputEl.value);
      inputEl.value = '';
    }
  }

  function _renderTags() {
    if (!tagsContainerEl) {return;}
    // Remove existing tag elements (keep input and add button)
    const existing = tagsContainerEl.querySelectorAll('.ds-dynamic-tags__tag');
    existing.forEach((el) => el.remove());

    // Insert tags before the input
    _tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'ds-dynamic-tags__tag';

      const labelEl = document.createElement('span');
      labelEl.textContent = tag;
      tagEl.appendChild(labelEl);

      if (!disabled) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ds-dynamic-tags__remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeTag(tag));
        tagEl.appendChild(removeBtn);
      }

      tagsContainerEl.insertBefore(tagEl, inputEl);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-dynamic-tags">
      <input class="ds-dynamic-tags__input" type="text" />
      <button class="ds-dynamic-tags__add" type="button" aria-label="Add tag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const tagsContainerEl = container.querySelector('.ds-dynamic-tags');
  const inputEl = container.querySelector('.ds-dynamic-tags__input');
  const addBtn = container.querySelector('.ds-dynamic-tags__add');

  if (inputEl) {
    inputEl.placeholder = placeholder;
    if (disabled) {inputEl.disabled = true;}
    inputEl.addEventListener('keydown', _onKeydown);
    inputEl.addEventListener('blur', _onBlur);
  }

  if (addBtn && !disabled) {
    addBtn.addEventListener('click', () => {
      if (inputEl) {
        _commitInput();
        inputEl.focus();
      }
    });
  }

  // Render initial tags
  _renderTags();

  return {
    get element() { return container; },
    getTags,
    addTag,
    removeTag,
    destroy,
  };
}
