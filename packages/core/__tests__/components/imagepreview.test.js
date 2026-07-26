// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the ImagePreview component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/scheduler.js';
import { ImagePreview as createImagePreview } from '@kupola/components';

const previews = [];

function ImagePreview(options) {
  const preview = createImagePreview(options);
  previews.push(preview);
  return preview;
}

afterEach(() => {
  while (previews.length > 0) {previews.pop().destroy();}
  document.body.innerHTML = '';
  resetScheduler();
});

const sampleImages = [
  { src: 'img1.jpg', title: 'Photo 1', meta: '2024-01-01' },
  { src: 'img2.jpg', title: 'Photo 2', meta: '2024-01-02' },
  { src: 'img3.jpg', title: 'Photo 3' },
];

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('ImagePreview rendering', () => {
  test('renders an overlay element', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-image-preview-overlay')).not.toBeNull();
  });

  test('overlay is hidden by default', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-image-preview-overlay').classList.contains('is-visible')).toBe(false);
  });

  test('renders close button', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-image-preview__close')).not.toBeNull();
  });

  test('renders nav buttons', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-image-preview__nav-prev')).not.toBeNull();
    expect(document.body.querySelector('.ds-image-preview__nav-next')).not.toBeNull();
  });

  test('renders img element', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-image-preview__content img')).not.toBeNull();
  });

  test('renders an accessible dialog and SVG close icon', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);
    const overlay = document.querySelector('.ds-image-preview-overlay');
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.ds-image-preview__close svg')).not.toBeNull();
    view.destroy();
  });
});

// ─── Open / Close ────────────────────────────────────────────────────────────

describe('ImagePreview open/close', () => {
  test('open() shows the overlay', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(0);
    expect(document.body.querySelector('.ds-image-preview-overlay').classList.contains('is-visible')).toBe(true);
  });

  test('open() sets the image src', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(1);
    const img = document.body.querySelector('.ds-image-preview__content img');
    expect(img.src).toContain('img2.jpg');
  });

  test('open() sets the title', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(0);
    const title = document.body.querySelector('.ds-image-preview__title');
    expect(title.textContent).toBe('Photo 1');
  });

  test('close() hides the overlay', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open();
    view.close();
    expect(document.body.querySelector('.ds-image-preview-overlay').classList.contains('is-visible')).toBe(false);
  });

  test('clicking close button closes overlay', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open();
    document.body.querySelector('.ds-image-preview__close').click();
    expect(document.body.querySelector('.ds-image-preview-overlay').classList.contains('is-visible')).toBe(false);
  });

  test('supports string images, aliases, and clamps indexes', () => {
    const view = ImagePreview({ images: [ 'one.jpg', 'two.jpg' ], index: 1 });
    document.body.appendChild(view.element);
    view.show(99);
    expect(view.isOpen()).toBe(true);
    expect(view.getIndex()).toBe(1);
    expect(document.querySelector('img').src).toContain('two.jpg');
    view.prev();
    expect(view.getIndex()).toBe(0);
    view.hide();
    expect(view.isOpen()).toBe(false);
    view.destroy();
  });

  test('does not open without valid images', () => {
    const view = ImagePreview({ images: [ '', null, {} ] });
    document.body.appendChild(view.element);
    view.open();
    expect(view.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    view.destroy();
  });

  test('locks scrolling, restores focus, and calls onClose once', () => {
    const onClose = jest.fn();
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    const view = ImagePreview({ images: sampleImages, onClose });
    document.body.appendChild(view.element);
    view.open();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(document.querySelector('.ds-image-preview__close'));
    view.close();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(button);
    expect(onClose).toHaveBeenCalledTimes(1);
    view.close();
    expect(onClose).toHaveBeenCalledTimes(1);
    view.destroy();
  });
});

// ─── Navigation ──────────────────────────────────────────────────────────────

describe('ImagePreview navigation', () => {
  test('next button advances to next image', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(0);
    document.body.querySelector('.ds-image-preview__nav-next').click();
    const img = document.body.querySelector('.ds-image-preview__content img');
    expect(img.src).toContain('img2.jpg');
  });

  test('prev button goes to previous image', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(1);
    document.body.querySelector('.ds-image-preview__nav-prev').click();
    const img = document.body.querySelector('.ds-image-preview__content img');
    expect(img.src).toContain('img1.jpg');
  });

  test('prev button disabled at first image', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(0);
    expect(document.body.querySelector('.ds-image-preview__nav-prev').disabled).toBe(true);
  });

  test('next button disabled at last image', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open(2);
    expect(document.body.querySelector('.ds-image-preview__nav-next').disabled).toBe(true);
  });

  test('nav hidden for single image', () => {
    const view = ImagePreview({ images: [ { src: 'single.jpg' } ] });
    document.body.appendChild(view.element);

    view.open(0);
    expect(document.body.querySelector('.ds-image-preview__nav').style.display).toBe('none');
  });

  test('uses arrow keys and only the topmost preview handles Escape', () => {
    const first = ImagePreview({ images: sampleImages });
    const second = ImagePreview({ images: sampleImages });
    document.body.append(first.element, second.element);
    first.open(0);
    second.open(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(first.getIndex()).toBe(0);
    expect(second.getIndex()).toBe(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.isOpen()).toBe(true);
    expect(second.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    first.destroy();
    second.destroy();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('ImagePreview destroy', () => {
  test('destroy cleans up', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    view.open();
    expect(() => view.destroy()).not.toThrow();
    expect(view.isOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(() => view.destroy()).not.toThrow();
    view.open();
    expect(view.isOpen()).toBe(false);
  });
});
