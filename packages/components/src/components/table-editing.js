// SPDX-License-Identifier: MIT
/**
 * Table inline editing state machine.
 *
 * Helpers for the Table's inline edit flow. The editing state lives in a
 * shared { cell, buffer } object so mutations made here are visible to the
 * Table component without restructuring its closure.
 *
 * @module TableEditing
 */

/**
 * Build the edit cell DOM.
 * @param {object} editing - Shared { cell, buffer } state object.
 * @param {HTMLElement} td
 * @param {object} row
 * @param {object} col
 * @param {*} key
 * @param {object} listeners
 * @param {Function} onSave
 * @param {Function} onCancel
 * @returns {HTMLElement}
 */
export function renderEditCell(editing, td, row, col, key, listeners, onSave, onCancel) {
  const wrap = document.createElement('div');
  wrap.className = 'ds-table-edit-cell';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'ds-table-edit-input';
  input.value = editing.buffer[col.key] ?? row[col.key] ?? '';
  listeners.on(input, 'input', () => { editing.buffer[col.key] = input.value; });

  const actions = document.createElement('div');
  actions.className = 'ds-table-edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'ds-table-edit-save';
  saveBtn.textContent = '\u2713';
  listeners.on(saveBtn, 'click', () => onSave(key, col.key));

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'ds-table-edit-cancel';
  cancelBtn.textContent = '\u2717';
  listeners.on(cancelBtn, 'click', onCancel);

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  wrap.appendChild(input);
  wrap.appendChild(actions);
  return wrap;
}

/**
 * Enter edit mode for a cell.
 * @param {object} editing - Shared { cell, buffer } state object.
 * @param {*} key
 * @param {string} colKey
 * @param {*} value
 * @param {Function} rerender
 */
export function startEdit(editing, key, colKey, value, rerender) {
  editing.cell = { rowKey: key, colKey };
  editing.buffer = { [colKey]: value != null ? String(value) : '' };
  rerender();
}

/**
 * Save the current edit buffer into the row.
 * @param {object} editing - Shared { cell, buffer } state object.
 * @param {Array} data
 * @param {string} rowKey
 * @param {*} rowKeyVal
 * @param {string} colKey
 * @param {Function} clearCaches
 * @param {Function} rerender
 * @param {Function} [onEditSave]
 */
export function saveEdit(editing, data, rowKey, rowKeyVal, colKey, clearCaches, rerender, onEditSave) {
  const row = data.find(r => r[rowKey] === rowKeyVal);
  if (row && editing.buffer[colKey] !== undefined) {
    row[colKey] = editing.buffer[colKey];
    clearCaches();
  }
  editing.cell = null;
  editing.buffer = {};
  if (onEditSave) {onEditSave(row, colKey);}
  rerender();
}

/**
 * Cancel the current edit.
 * @param {object} editing - Shared { cell, buffer } state object.
 * @param {Function} rerender
 * @param {Function} [onEditCancel]
 */
export function cancelEdit(editing, rerender, onEditCancel) {
  editing.cell = null;
  editing.buffer = {};
  if (onEditCancel) {onEditCancel();}
  rerender();
}
