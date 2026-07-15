// SPDX-License-Identifier: MIT
/**
 * @kupola/core — FileUpload component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-fileupload*` CSS classes for styling.
 *
 * ```js
 * import { FileUpload } from '@kupola/core/components/fileupload';
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

import { html } from '../template.js';
import { render } from '../render.js';

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
  const {
    accept = '',
    multiple = false,
    maxSize = Infinity,
    title = 'Upload files',
    subtitle = 'Drag & drop or click to browse',
    disabled = false,
    onChange = null,
    onError = null,
  } = options;

  let _files = [];

  // ── Public API ─────────────────────────────────────────────────────────────

  function getFiles() {
    return [ ..._files ];
  }

  function clear() {
    _files = [];
    _renderFileList();
    if (onChange) {onChange(_files);}
  }

  function destroy() {
    if (dropzoneEl) {
      dropzoneEl.removeEventListener('dragover', _onDragOver);
      dropzoneEl.removeEventListener('dragleave', _onDragLeave);
      dropzoneEl.removeEventListener('drop', _onDrop);
    }
    if (inputEl) {inputEl.removeEventListener('change', _onInputChange);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _formatSize(bytes) {
    if (bytes < 1024) {return bytes + ' B';}
    if (bytes < 1024 * 1024) {return (bytes / 1024).toFixed(1) + ' KB';}
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function _addFiles(fileList) {
    const newFiles = Array.from(fileList);
    for (const file of newFiles) {
      if (maxSize !== Infinity && file.size > maxSize) {
        if (onError) {onError(`File "${file.name}" exceeds max size of ${_formatSize(maxSize)}`);}
        continue;
      }
      _files.push(file);
    }
    _renderFileList();
    if (onChange) {onChange(_files);}
  }

  function _onInputChange(e) {
    if (e.target.files) {_addFiles(e.target.files);}
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

  function _renderFileList() {
    if (!listEl) {return;}
    listEl.innerHTML = '';
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
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        _files.splice(idx, 1);
        _renderFileList();
        if (onChange) {onChange(_files);}
      });
      item.appendChild(removeBtn);

      listEl.appendChild(item);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-fileupload">
      <div class="ds-fileupload__dropzone">
        <div class="ds-fileupload__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
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
    inputEl.addEventListener('change', _onInputChange);
  }

  if (disabled) {
    wrapperEl.classList.add('ds-fileupload--disabled');
  }

  // Drag & drop events
  if (dropzoneEl) {
    dropzoneEl.addEventListener('dragover', _onDragOver);
    dropzoneEl.addEventListener('dragleave', _onDragLeave);
    dropzoneEl.addEventListener('drop', _onDrop);
  }

  return {
    get element() { return container; },
    getFiles,
    clear,
    destroy,
  };
}
