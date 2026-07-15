// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the ImagePreview component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { ImagePreview } from '../../src/components/imagepreview.js';

afterEach(() => {
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
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('ImagePreview destroy', () => {
  test('destroy cleans up', () => {
    const view = ImagePreview({ images: sampleImages });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
