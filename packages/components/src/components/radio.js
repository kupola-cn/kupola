// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Radio component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-radio*` CSS classes for styling.
 *
 * ```js
 * import { Radio } from '@kupola/components/radio';
 *
 * const view = Radio({
 *   name: 'color',
 *   options: [
 *     { label: 'Red', value: 'red' },
 *     { label: 'Blue', value: 'blue' },
 *     { label: 'Green', value: 'green' },
 *   ],
 *   value: 'blue',
 *   onChange: (val) => console.log('selected:', val),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/radio
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { createListenerRegistry } from './listener-registry';

/**
 * Create a Radio component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.name]      Group name for radio inputs
 * @param {Array}    [options.options]   Array of { label, value, disabled }
 * @param {string}   [options.value]     Initially selected value
 * @param {Function} [options.onChange]  Callback when selection changes
 * @returns {{ element: DocumentFragment, getValue: Function, setValue: Function, destroy: Function }}
 */
export function Radio(options = {}) {
  const {
    name = '',
    options: radioOptions = [],
    value: initialValue = '',
    onChange = null,
  } = options;

  let _value = initialValue;
  const listeners = createListenerRegistry();
  let destroyed = false;

  const tpl = html`<div class="ds-radio-group" role="radiogroup"></div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const groupEl = container.querySelector('.ds-radio-group');

  radioOptions.forEach((opt, index) => {
    const labelEl = document.createElement('label');
    labelEl.className = 'ds-radio';
    labelEl.setAttribute('role', 'radio');
    labelEl.setAttribute('aria-checked', opt.value === _value);
    labelEl.setAttribute('aria-posinset', index + 1);
    labelEl.setAttribute('aria-setsize', radioOptions.length);
    if (opt.disabled) {labelEl.setAttribute('aria-disabled', true);}

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = opt.value;
    input.checked = opt.value === _value;
    if (opt.disabled) {input.disabled = true;}
    input.setAttribute('role', 'radio');
    input.setAttribute('aria-checked', opt.value === _value);

    const dotEl = document.createElement('span');
    dotEl.className = 'ds-radio__dot';

    labelEl.appendChild(input);
    labelEl.appendChild(dotEl);

    if (opt.label) {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'ds-radio__label';
      labelSpan.textContent = opt.label;
      labelEl.appendChild(labelSpan);
    }

    groupEl.appendChild(labelEl);

    listeners.on(input, 'change', _handleChange);
  });

  function _handleChange(e) {
    _value = e.target.value;
    onChange?.(_value);
  }

  function getValue() {
    return _value;
  }

  function setValue(val) {
    if (destroyed) {return;}
    _value = val;
    if (groupEl) {
      const inputs = groupEl.querySelectorAll('input');
      inputs.forEach((input) => {
        input.checked = input.value === _value;
      });
    }
    onChange?.(_value);
  }

  const api = {
    get element() { return container; },
    getValue,
    setValue,
    destroy() {
      if (destroyed) {return;}
      destroyed = true;
      listeners.destroy();
      instance.destroy();
      Object.freeze(api);
    },
  };

  return api;
}
