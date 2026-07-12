import { kupolaInitializer } from './initializer.js';

function _escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

class FileUpload {
  constructor(element) {
    this.element = element;
    this.dropzone = element.querySelector('.ds-fileupload__dropzone');
    this.input = element.querySelector('.ds-fileupload__input');
    this.list = element.querySelector('.ds-fileupload__list');
    this.progress = element.querySelector('.ds-fileupload__preview');
    
    this.files = [];
    this.maxSize = parseInt(element.getAttribute('data-max-size')) || 0;
    this.maxCount = parseInt(element.getAttribute('data-max-count')) || 0;
    this._listeners = [];
    
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const clickHandler = (e) => {
      if (e.target === this.input || this.input.contains(e.target)) return;
      this.input.click();
    };

    const changeHandler = (e) => {
      const files = Array.from(e.target.files);
      this.addFiles(files);
      e.target.value = '';
    };

    const dragoverHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.add('is-dragging');
    };

    const dragleaveHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.remove('is-dragging');
    };

    const dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzone.classList.remove('is-dragging');
      
      const files = Array.from(e.dataTransfer.files);
      this.addFiles(files);
    };

    this.dropzone.addEventListener('click', clickHandler);
    this.input.addEventListener('change', changeHandler);
    this.dropzone.addEventListener('dragover', dragoverHandler);
    this.dropzone.addEventListener('dragleave', dragleaveHandler);
    this.dropzone.addEventListener('drop', dropHandler);

    this._listeners.push(
      { el: this.dropzone, event: 'click', handler: clickHandler },
      { el: this.input, event: 'change', handler: changeHandler },
      { el: this.dropzone, event: 'dragover', handler: dragoverHandler },
      { el: this.dropzone, event: 'dragleave', handler: dragleaveHandler },
      { el: this.dropzone, event: 'drop', handler: dropHandler }
    );
  }

  addFiles(files) {
    files.forEach(file => {
      if (this.maxCount > 0 && this.files.length >= this.maxCount) {
        this.showError(`Maximum ${this.maxCount} files allowed`);
        return;
      }
      if (this.isValidFile(file)) {
        this.files.push(file);
        this.renderFileItem(file);
        this.showPreview(file);
      }
    });
    
    this.dispatchChange();
  }

  isValidFile(file) {
    const accept = this.input.getAttribute('accept');
    if (accept && accept !== '') {
      const types = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      
      const isValidType = types.some(type => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        } else if (type.includes('/')) {
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.replace('/*', ''));
          }
          return fileType === type;
        }
        return true;
      });
      
      if (!isValidType) {
        this.showError(`File type not allowed: ${file.type}`);
        return false;
      }
    }
    
    if (this.maxSize > 0 && file.size > this.maxSize) {
      this.showError(`File size exceeds ${this.formatSize(this.maxSize)}`);
      return false;
    }
    
    return true;
  }

  renderFileItem(file) {
    const item = document.createElement('div');
    item.className = 'ds-fileupload__item';
    item.dataset.filename = file.name;
    
    const fileIcon = this.getFileIcon(file.type);
    
    item.innerHTML = `
      <div class="ds-fileupload__icon" style="width: 24px; height: 24px; border-radius: 4px;">
        ${fileIcon}
      </div>
      <span class="ds-fileupload__filename">${this.truncateFilename(_escapeHtml(file.name))}</span>
      <span class="ds-fileupload__size">${this.formatSize(file.size)}</span>
      <button class="ds-fileupload__remove" type="button" aria-label="Remove file">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
    `;
    
    const removeBtn = item.querySelector('.ds-fileupload__remove');
    const removeHandler = () => {
      this.removeFile(file, item);
    };
    removeBtn.addEventListener('click', removeHandler);
    
    this._listeners.push({ el: removeBtn, event: 'click', handler: removeHandler });
    
    if (!this.list) {
      this.list = document.createElement('div');
      this.list.className = 'ds-fileupload__list';
      this.element.appendChild(this.list);
    }
    
    this.list.appendChild(item);
  }

  getFileIcon(type) {
    if (type.startsWith('image/')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    }
    if (type.startsWith('video/')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
    }
    if (type.startsWith('audio/')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
    }
    if (type.includes('pdf')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    }
    if (type.includes('document') || type.includes('text')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    }
    if (type.includes('zip') || type.includes('archive')) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M16 11V7a4 4 0 0 0-8 0v4"/><polyline points="10 14 8 16 6 14"/></svg>';
    }
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  truncateFilename(name, maxLength = 20) {
    if (name.length <= maxLength) return name;
    const extension = name.substring(name.lastIndexOf('.'));
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
    return truncated + extension;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  removeFile(file, itemElement) {
    this.files = this.files.filter(f => f !== file);
    if (itemElement) {
      itemElement.remove();
    }
    if (this.files.length === 0 && this.list) {
      this.list.remove();
      this.list = null;
    }
    this.dispatchChange();
  }

  clearFiles() {
    this.files = [];
    if (this.list) {
      this.list.remove();
      this.list = null;
    }
    if (this.preview) {
      this.preview.innerHTML = '';
    }
    this.clearError();
    this.dispatchChange();
  }

  showError(message) {
    this.clearError();
    this.dropzone.classList.add('is-error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'ds-fileupload__error';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    this.dropzone.appendChild(errorElement);
    
    setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  clearError() {
    this.dropzone.classList.remove('is-error');
    const errorElement = this.dropzone.querySelector('.ds-fileupload__error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  showPreview(file) {
    if (!file.type.startsWith('image/')) return;
    
    if (!this.preview) {
      this.preview = document.createElement('div');
      this.preview.className = 'ds-fileupload__preview';
      this.element.insertBefore(this.preview, this.list || null);
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'ds-fileupload__preview-item';
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="${_escapeHtml(file.name)}">
        <button class="ds-fileupload__preview-remove" type="button" aria-label="Remove preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
        </button>
      `;
      
      const previewRemoveBtn = previewItem.querySelector('.ds-fileupload__preview-remove');
      const previewRemoveHandler = () => {
        this.removeFile(file, this.list?.querySelector(`[data-filename="${file.name}"]`));
        previewItem.remove();
        if (this.preview && this.preview.children.length === 0) {
          this.preview.remove();
          this.preview = null;
        }
      };
      previewRemoveBtn.addEventListener('click', previewRemoveHandler);
      this._listeners.push({ el: previewRemoveBtn, event: 'click', handler: previewRemoveHandler });
      
      this.preview.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  }

  updateProgress(percent) {
    if (!this.progress) {
      this.progress = document.createElement('div');
      this.progress.className = 'ds-fileupload__progress';
      this.element.insertBefore(this.progress, this.list || null);
    }
    
    this.progress.style.display = 'block';
    
    const bar = this.progress.querySelector('.ds-fileupload__progress-bar') || document.createElement('div');
    bar.className = 'ds-fileupload__progress-bar';
    bar.style.width = `${percent}%`;
    
    if (!this.progress.querySelector('.ds-fileupload__progress-bar')) {
      this.progress.appendChild(bar);
    }
    
    if (percent >= 100) {
      setTimeout(() => {
        if (this.progress) {
          this.progress.remove();
          this.progress = null;
        }
      }, 500);
    }
  }

  simulateUpload(file) {
    this.updateProgress(0);
    const totalChunks = 100;
    let currentChunk = 0;
    const chunkSize = Math.max(1, Math.floor(file.size / totalChunks));
    
    const uploadInterval = setInterval(() => {
      currentChunk++;
      const percent = Math.min(100, Math.floor((currentChunk / totalChunks) * 100));
      this.updateProgress(percent);
      
      if (currentChunk >= totalChunks) {
        clearInterval(uploadInterval);
        this.updateProgress(100);
      }
    }, Math.max(50, Math.floor(5000 / totalChunks)));
    
    return uploadInterval;
  }

  getFiles() {
    return [...this.files];
  }

  dispatchChange() {
    this.element.dispatchEvent(new CustomEvent('kupola:fileupload-change', {
      detail: {
        files: this.getFiles(),
        count: this.files.length
      }
    }));
  }

  destroy() {
    this._listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this._listeners = null;
    this.files = [];
    this.dropzone = null;
    this.input = null;
    this.list = null;
    this.progress = null;
    this.preview = null;
    this.element = null;
  }
}

function initFileUpload(element) {
  if (element.__kupolaInitialized) return;

  const instance = new FileUpload(element);
  element.__kupolaInstance = instance;
  element.__kupolaInitialized = true;
}

function cleanupFileUpload(element) {
  if (!element.__kupolaInitialized || !element.__kupolaInstance) return;

  const instance = element.__kupolaInstance;
  instance.destroy();

  element.__kupolaInstance = null;
  element.__kupolaInitialized = false;
}

function initFileUploads() {
  document.querySelectorAll('.ds-fileupload').forEach(el => {
    initFileUpload(el);
  });
}

export { FileUpload, initFileUploads, initFileUpload, cleanupFileUpload };

kupolaInitializer.register('fileupload', initFileUpload, cleanupFileUpload);