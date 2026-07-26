// SPDX-License-Identifier: MIT
/**
 * Editable string tags with bounded, normalized state.
 *
 * @module components/dynamictags
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml, getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

function normalizeLimit(value) {
  if (value === Infinity) {return Infinity;}
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : Infinity;
}

function normalizeTags(value, limit) {
  if (!Array.isArray(value) || limit === 0) {return [];}
  const seen = new Set();
  const tags = [];
  for (const item of value) {
    if (typeof item !== 'string') {continue;}
    const tag = item.trim();
    if (!tag || seen.has(tag)) {continue;}
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= limit) {break;}
  }
  return tags;
}

function sameTags(left, right) {
  return left.length === right.length && left.every((tag, index) => tag === right[index]);
}

export function DynamicTags(options = {}) {
  const maxTags = normalizeLimit(options.maxTags ?? options.maxCount ?? Infinity);
  const disabled = options.disabled === true;
  const placeholder = String(options.placeholder ?? 'Add tag...');
  const onChange = typeof options.onChange === 'function' ? options.onChange : null;
  const listeners = createListenerRegistry();
  let tags = normalizeTags(options.tags, maxTags);
  let destroyed = false;

  const container = document.createDocumentFragment();
  const instance = render(html`
    <div class="ds-dynamic-tags">
      <input class="ds-dynamic-tags__input" type="text" />
      <button class="ds-dynamic-tags__add" type="button" aria-label="Add tag">
        ${getIconTemplate('plus')}
      </button>
    </div>
  `, container);
  const root = container.querySelector('.ds-dynamic-tags');
  const input = root.querySelector('.ds-dynamic-tags__input');
  const addButton = root.querySelector('.ds-dynamic-tags__add');
  input.placeholder = placeholder;
  root.classList.toggle('ds-dynamic-tags--disabled', disabled);

  function getTags() {
    return [ ...tags ];
  }

  function notify() {
    onChange?.(getTags());
  }

  function syncControls() {
    const limitReached = tags.length >= maxTags;
    input.disabled = disabled || destroyed || limitReached;
    addButton.disabled = disabled || destroyed || limitReached;
  }

  function renderTags() {
    root.querySelectorAll('.ds-dynamic-tags__tag').forEach(element => element.remove());
    tags.forEach((tag, index) => {
      const tagElement = document.createElement('span');
      tagElement.className = 'ds-dynamic-tags__tag';

      const label = document.createElement('span');
      label.textContent = tag;
      tagElement.appendChild(label);

      if (!disabled) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'ds-dynamic-tags__remove';
        remove.dataset.tagIndex = String(index);
        remove.setAttribute('aria-label', `Remove ${tag}`);
        remove.innerHTML = getIconHtml('x');
        tagElement.appendChild(remove);
      }
      root.insertBefore(tagElement, input);
    });
    syncControls();
  }

  function addTag(value) {
    if (destroyed || disabled || tags.length >= maxTags || typeof value !== 'string') {
      return false;
    }
    const tag = value.trim();
    if (!tag || tags.includes(tag)) {return false;}
    tags.push(tag);
    renderTags();
    notify();
    return true;
  }

  function removeTag(value) {
    if (destroyed || disabled || typeof value !== 'string') {return false;}
    const index = tags.indexOf(value);
    if (index < 0) {return false;}
    tags.splice(index, 1);
    renderTags();
    notify();
    return true;
  }

  function setTags(value) {
    if (destroyed || disabled) {return false;}
    const nextTags = normalizeTags(value, maxTags);
    if (sameTags(tags, nextTags)) {return false;}
    tags = nextTags;
    renderTags();
    notify();
    return true;
  }

  function commitInput() {
    if (destroyed || input.disabled) {return;}
    if (addTag(input.value)) {input.value = '';}
  }

  listeners.on(input, 'keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitInput();
    } else if (event.key === 'Backspace' && input.value === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  });
  listeners.on(input, 'blur', commitInput);
  listeners.on(addButton, 'click', () => {
    commitInput();
    if (!input.disabled) {input.focus();}
  });
  listeners.on(root, 'click', event => {
    const button = event.target?.closest?.('[data-tag-index]');
    if (!button || !root.contains(button)) {return;}
    const index = Number(button.getAttribute('data-tag-index'));
    if (Number.isInteger(index) && index >= 0 && index < tags.length) {
      removeTag(tags[index]);
    }
  });

  renderTags();

  return {
    get element() { return container; },
    getTags,
    setTags,
    addTag,
    removeTag,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      syncControls();
      instance.destroy();
    },
  };
}
