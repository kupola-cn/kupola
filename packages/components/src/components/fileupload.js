// SPDX-License-Identifier: MIT
/**
 * @kupola/core — FileUpload component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-fileupload*` CSS classes for styling.
 *
 * ```js
 * import { FileUpload } from '@kupola/components/fileupload';
 *
 * const view = FileUpload({
 *   accept: '.png,.jpg',
 *   multiple: true,
 *   maxSize: 5 * 1024 * 1024,
 *   onChange: (files) => console.log(files),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/fileupload
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconHtml, getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';

/**
 * Create a FileUpload component instance.
 *
 * @param {Object}   [options]
 * @param {string}   [options.accept]     Accepted file types (e.g. '.png,.jpg')
 * @param {boolean}  [options.multiple]   Allow multiple files (default false)
 * @param {number}   [options.maxSize]    Max file size in bytes
 * @param {string}   [options.title]      Upload title text
 * @param {string}   [options.subtitle]   Upload subtitle/hint text
 * @param {boolean}  [options.disabled]   Disabled state
 * @param {Function} [options.onChange]    Callback when files change (file list array)
 * @param {Function} [options.onError]     Callback on error (error message string)
 * @returns {{ element: DocumentFragment, getFiles: Function, clear: Function, destroy: Function }}
 */
export function FileUpload(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const accept = typeof config.accept === 'string' ? config.accept : '';
  const multiple = config.multiple === true;
  const maxSize = Number.isFinite(Number(config.maxSize)) && Number(config.maxSize) >= 0
    ? Number(config.maxSize)
    : Infinity;
  const configuredMaxCount = Number.isFinite(Number(config.maxCount)) && Number(config.maxCount) >= 1
    ? Math.floor(Number(config.maxCount))
    : Infinity;
  const maxCount = multiple ? configuredMaxCount : 1;
  const title = config.title ?? 'Upload files';
  const subtitle = config.subtitle ?? 'Drag & drop or click to browse';
  const disabled = config.disabled === true;
  const onChange = typeof config.onChange === 'function' ? config.onChange : null;
  const onRemove = typeof config.onRemove === 'function' ? config.onRemove : null;
  const onError = typeof config.onError === 'function' ? config.onError : null;
  const acceptRules = accept.split(',').map(rule => rule.trim().toLowerCase()).filter(Boolean);

  let _files = [];
  let destroyed = false;
  const listeners = createListenerRegistry();

  // ── Public API ─────────────────────────────────────────────────────────────

  function getFiles() {
    return [ ..._files ];
  }

  function clear() {
    if (destroyed || _files.length === 0) {return;}
    const removedFiles = _files;
    _files = [];
    _renderFileList();
    if (onRemove) {removedFiles.forEach(file => onRemove(file));}
    _notifyChange();
  }

  function destroy() {
    if (destroyed) {return;}
    destroyed = true;
    _files = [];
    listeners.destroy();
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _formatSize(bytes) {
    if (bytes < 1024) {return bytes + ' B';}
    if (bytes < 1024 * 1024) {return (bytes / 1024).toFixed(1) + ' KB';}
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function _addFiles(fileList) {
    if (destroyed || disabled) {return;}
    const newFiles = Array.from(fileList);
    const acceptedFiles = [];
    const existingCount = multiple ? _files.length : 0;
    for (const file of newFiles) {
      if (!_acceptsFile(file)) {
        _reportError(`File "${file.name}" does not match accepted file types`);
        continue;
      }
      if (maxSize !== Infinity && file.size > maxSize) {
        _reportError(`File "${file.name}" exceeds max size of ${_formatSize(maxSize)}`);
        continue;
      }
      if ((existingCount + acceptedFiles.length) >= maxCount) {
        _reportError(`Maximum file count is ${maxCount}`);
        break;
      }
      acceptedFiles.push(file);
    }
    if (acceptedFiles.length === 0) {return;}
    _files = multiple ? [ ..._files, ...acceptedFiles ] : [ acceptedFiles[0] ];
    _renderFileList();
    _notifyChange();
  }

  function _acceptsFile(file) {
    if (acceptRules.length === 0) {return true;}
    const fileName = String(file?.name || '').toLowerCase();
    const fileType = String(file?.type || '').toLowerCase();
    return acceptRules.some(rule => {
      if (rule.startsWith('.')) {return fileName.endsWith(rule);}
      if (rule.endsWith('/*')) {return fileType.startsWith(rule.slice(0, -1));}
      return fileType === rule;
    });
  }

  function _reportError(message) {
    if (onError) {onError(message);}
  }

  function _notifyChange() {
    if (onChange) {onChange([ ..._files ]);}
  }

  function _onInputChange(e) {
    if (!disabled && e.target.files) {_addFiles(e.target.files);}
    e.target.value = '';
  }

  function _onDragOver(e) {
    e.preventDefault();
    if (disabled) {return;}
    dropzoneEl.classList.add('is-dragging');
  }

  function _onDragLeave() {
    dropzoneEl.classList.remove('is-dragging');
  }

  function _onDrop(e) {
    e.preventDefault();
    dropzoneEl.classList.remove('is-dragging');
    if (disabled) {return;}
    if (e.dataTransfer.files) {_addFiles(e.dataTransfer.files);}
  }

  function _onRemoveClick(e) {
    const button = e.target.closest('.ds-fileupload__remove');
    if (!button || !listEl?.contains(button)) {return;}
    e.stopPropagation();
    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= _files.length) {return;}
    const [ removedFile ] = _files.splice(index, 1);
    _renderFileList();
    if (onRemove) {onRemove(removedFile);}
    _notifyChange();
  }

  function _renderFileList() {
    if (!listEl) {return;}
    listEl.replaceChildren();
    _files.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'ds-fileupload__item';

      const nameEl = document.createElement('span');
      nameEl.className = 'ds-fileupload__filename';
      nameEl.textContent = file.name;
      item.appendChild(nameEl);

      const sizeEl = document.createElement('span');
      sizeEl.className = 'ds-fileupload__size';
      sizeEl.textContent = _formatSize(file.size);
      item.appendChild(sizeEl);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'ds-fileupload__remove';
      removeBtn.innerHTML = getIconHtml('x');
      removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
      removeBtn.dataset.index = String(idx);
      item.appendChild(removeBtn);

      listEl.appendChild(item);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-fileupload">
      <div class="ds-fileupload__dropzone">
        <div class="ds-fileupload__icon">${getIconTemplate('upload')}</div>
        <div class="ds-fileupload__text">
          <span class="ds-fileupload__title"></span>
          <span class="ds-fileupload__subtitle"></span>
        </div>
        <input class="ds-fileupload__input" type="file" />
      </div>
      <div class="ds-fileupload__list"></div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const wrapperEl = container.querySelector('.ds-fileupload');
  const dropzoneEl = container.querySelector('.ds-fileupload__dropzone');
  const inputEl = container.querySelector('.ds-fileupload__input');
  const listEl = container.querySelector('.ds-fileupload__list');
  const titleEl = container.querySelector('.ds-fileupload__title');
  const subtitleEl = container.querySelector('.ds-fileupload__subtitle');

  if (titleEl) {titleEl.textContent = title;}
  if (subtitleEl) {subtitleEl.textContent = subtitle;}
  if (inputEl) {
    if (accept) {inputEl.accept = accept;}
    if (multiple) {inputEl.multiple = true;}
    inputEl.disabled = disabled;
    listeners.on(inputEl, 'change', _onInputChange);
  }

  if (disabled) {
    wrapperEl.classList.add('ds-fileupload--disabled');
  }

  // Drag & drop events
  if (dropzoneEl) {
    listeners.on(dropzoneEl, 'dragover', _onDragOver);
    listeners.on(dropzoneEl, 'dragleave', _onDragLeave);
    listeners.on(dropzoneEl, 'drop', _onDrop);
  }
  if (listEl) {listeners.on(listEl, 'click', _onRemoveClick);}

  return {
    get element() { return container; },
    getFiles,
    clear,
    destroy,
  };
}
