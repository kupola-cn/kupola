// SPDX-License-Identifier: MIT
/**
 * Declarative adapters for imperative component controllers.
 */

import { effect } from '@kupola/core';
import { defineComponent } from '@kupola/platform/component';
import { html } from '@kupola/platform/template';
import { Form } from './form.js';
import { Table } from './table.js';

function unwrap(value) {
  return value && typeof value === 'object' && 'value' in value ? value.value : value;
}

function sameShallowObject(left, right) {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every(key => Object.prototype.hasOwnProperty.call(right, key)
      && left[key] === right[key]);
}

function sameShallowArray(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => {
      if (value === right[index]) {return true;}
      return sameShallowObject(value, right[index]);
    });
}

export const TableView = defineComponent({
  props: [ 'data', 'columns', 'ariaLabel', 'className', 'options' ],
  setup({ props }) {
    return html`<div class=${props.className} aria-label=${props.ariaLabel}></div>`;
  },
  mounted({ element, onCleanup, props }) {
    let table = null;
    let previousOptions = null;
    let previousColumns = null;

    const stop = effect(() => {
      const options = unwrap(props.options.value) || {};
      const columns = unwrap(props.columns.value) || [];
      const data = unwrap(props.data.value);
      const ariaLabel = unwrap(props.ariaLabel.value);
      const className = unwrap(props.className.value);
      element.className = className || '';
      if (ariaLabel == null || ariaLabel === '') {element.removeAttribute('aria-label');}
      else {element.setAttribute('aria-label', String(ariaLabel));}

      if (!table || !sameShallowObject(options, previousOptions)
        || !sameShallowArray(columns, previousColumns)) {
        table?.destroy();
        table = Table({
          ...options,
          columns: Array.isArray(columns) ? columns : [],
          data: Array.isArray(data) ? data : [],
        });
        element.replaceChildren(table.element);
        previousOptions = { ...options };
        previousColumns = columns.map(column => ({ ...column }));
      } else {
        table.setData(Array.isArray(data) ? data : []);
      }
    });
    onCleanup(stop);
    onCleanup(() => table?.destroy());
  },
});

export const FormView = defineComponent({
  props: [ 'className', 'options', 'onSubmit' ],
  setup({ props, children }) {
    props._formInstance = null;
    const submit = event => {
      event.preventDefault();
      if (props._formInstance?.validate()) {
        props.onSubmit.value?.(props._formInstance.getData(), props._formInstance, event);
      }
    };

    return html`<form class=${props.className} onsubmit=${submit}>${children}</form>`;
  },
  mounted({ element, onCleanup, props }) {
    props._formInstance = Form({ element, ...(props.options.value || {}) });
    onCleanup(() => props._formInstance?.destroy());
  },
});
