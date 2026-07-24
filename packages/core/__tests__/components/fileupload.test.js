// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the FileUpload component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { FileUpload } from '@kupola/components';

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
});

// ─── Disabled state ──────────────────────────────────────────────────────────

describe('FileUpload disabled', () => {
  test('adds disabled class when disabled=true', () => {
    const view = FileUpload({ disabled: true });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-fileupload').classList.contains('ds-fileupload--disabled')).toBe(true);
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

    expect(() => view.destroy()).not.toThrow();
  });
});
