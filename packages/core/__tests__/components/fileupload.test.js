// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the FileUpload component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { FileUpload } from '@kupola/components';

function setInputFiles(input, files) {
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event('change'));
}

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('FileUpload rendering', () => {
  test('renders a fileupload wrapper', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload')).not.toBeNull();
  });

  test('renders a dropzone', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload__dropzone')).not.toBeNull();
  });

  test('renders title and subtitle', () => {
    const view = FileUpload({ title: 'Upload here', subtitle: 'Max 5MB' });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload__title').textContent).toBe('Upload here');
    expect(document.body.querySelector('.ds-fileupload__subtitle').textContent).toBe('Max 5MB');
  });

  test('renders hidden file input', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-fileupload__input');
    expect(input).not.toBeNull();
    expect(input.type).toBe('file');
  });

  test('sets accept attribute', () => {
    const view = FileUpload({ accept: '.png,.jpg' });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-fileupload__input');
    expect(input.accept).toBe('.png,.jpg');
  });

  test('sets multiple attribute', () => {
    const view = FileUpload({ multiple: true });
    document.body.appendChild(view.element);

    const input = document.body.querySelector('.ds-fileupload__input');
    expect(input.multiple).toBe(true);
  });

  test('renders file list container', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload__list')).not.toBeNull();
  });

  test('renders accessible non-submit remove buttons with SVG icons', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);
    const input = document.querySelector('.ds-fileupload__input');
    setInputFiles(input, [ new File([ 'data' ], 'report.txt', { type: 'text/plain' }) ]);
    const remove = document.querySelector('.ds-fileupload__remove');
    expect(remove.type).toBe('button');
    expect(remove.getAttribute('aria-label')).toContain('report.txt');
    expect(remove.querySelector('svg')).not.toBeNull();
    view.destroy();
  });
});

// ─── Disabled state ──────────────────────────────────────────────────────────

describe('FileUpload disabled', () => {
  test('adds disabled class when disabled=true', () => {
    const view = FileUpload({ disabled: true });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload').classList.contains('ds-fileupload--disabled')).toBe(true);
    expect(document.body.querySelector('.ds-fileupload__input').disabled).toBe(true);
    view.destroy();
  });
});

// ─── File management ─────────────────────────────────────────────────────────

describe('FileUpload file management', () => {
  test('getFiles returns empty array initially', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    expect(view.getFiles()).toEqual([]);
  });

  test('clear empties the file list', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    view.clear();
    expect(view.getFiles()).toEqual([]);
  });

  test('single mode replaces the previous selection', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);
    const input = document.querySelector('.ds-fileupload__input');
    setInputFiles(input, [ new File([ 'a' ], 'first.txt') ]);
    setInputFiles(input, [ new File([ 'b' ], 'second.txt') ]);
    expect(view.getFiles().map(file => file.name)).toEqual([ 'second.txt' ]);
    view.destroy();
  });

  test('enforces accept, maxSize, and maxCount for selected files', () => {
    const onChange = jest.fn();
    const onError = jest.fn();
    const view = FileUpload({
      accept: '.png,image/jpeg',
      multiple: true,
      maxSize: 4,
      maxCount: 2,
      onChange,
      onError,
    });
    document.body.appendChild(view.element);
    const input = document.querySelector('.ds-fileupload__input');
    setInputFiles(input, [
      new File([ '1234' ], 'first.PNG', { type: 'image/png' }),
      new File([ '12345' ], 'large.jpg', { type: 'image/jpeg' }),
      new File([ '12' ], 'notes.txt', { type: 'text/plain' }),
      new File([ '12' ], 'second.jpg', { type: 'image/jpeg' }),
      new File([ '12' ], 'third.png', { type: 'image/png' }),
    ]);
    expect(view.getFiles().map(file => file.name)).toEqual([ 'first.PNG', 'second.jpg' ]);
    expect(onError.mock.calls.map(([ message ]) => message)).toEqual(expect.arrayContaining([
      expect.stringContaining('max size'),
      expect.stringContaining('accepted file types'),
      expect.stringContaining('Maximum file count'),
    ]));
    const callbackFiles = onChange.mock.calls[0][0];
    callbackFiles.length = 0;
    expect(view.getFiles()).toHaveLength(2);
    view.destroy();
  });

  test('calls onRemove for button removal and clear', () => {
    const onRemove = jest.fn();
    const onChange = jest.fn();
    const view = FileUpload({ multiple: true, onRemove, onChange });
    document.body.appendChild(view.element);
    const input = document.querySelector('.ds-fileupload__input');
    setInputFiles(input, [ new File([ 'a' ], 'a.txt'), new File([ 'b' ], 'b.txt') ]);
    document.querySelector('.ds-fileupload__remove').click();
    expect(onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'a.txt' }));
    view.clear();
    expect(onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'b.txt' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    view.destroy();
  });
});

// ─── Drag events ─────────────────────────────────────────────────────────────

describe('FileUpload drag & drop', () => {
  test('dragover adds is-dragging class', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    const dropzone = document.body.querySelector('.ds-fileupload__dropzone');
    const event = new Event('dragover', { cancelable: true });
    dropzone.dispatchEvent(event);

    expect(dropzone.classList.contains('is-dragging')).toBe(true);
  });

  test('dragleave removes is-dragging class', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    const dropzone = document.body.querySelector('.ds-fileupload__dropzone');
    dropzone.classList.add('is-dragging');
    dropzone.dispatchEvent(new Event('dragleave'));

    expect(dropzone.classList.contains('is-dragging')).toBe(false);
  });

  test('drop removes is-dragging class', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    const dropzone = document.body.querySelector('.ds-fileupload__dropzone');
    dropzone.classList.add('is-dragging');
    const event = new Event('drop', { cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files: [] } });
    dropzone.dispatchEvent(event);

    expect(dropzone.classList.contains('is-dragging')).toBe(false);
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('FileUpload destroy', () => {
  test('destroy cleans up', () => {
    const view = FileUpload();
    document.body.appendChild(view.element);

    const input = document.querySelector('.ds-fileupload__input');
    expect(() => view.destroy()).not.toThrow();
    expect(() => view.destroy()).not.toThrow();
    setInputFiles(input, [ new File([ 'a' ], 'ignored.txt') ]);
    expect(view.getFiles()).toEqual([]);
  });
});
