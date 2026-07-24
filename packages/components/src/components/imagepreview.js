// SPDX-License-Identifier: MIT
/**
 * @kupola/core — ImagePreview component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-image-preview*` CSS classes for styling.
 *
 * ```js
 * import { ImagePreview } from '@kupola/components/imagepreview';
 *
 * const view = ImagePreview({
 *   images: [
 *     { src: 'photo1.jpg', title: 'Photo 1' },
 *     { src: 'photo2.jpg', title: 'Photo 2' },
 *   ],
 * });
 * container.appendChild(view.element);
 * view.open(0);
 * ```
 *
 * @module components/imagepreview
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create an ImagePreview component instance.
 *
 * @param {Object} [options]
 * @param {Array}  [options.images]   Array of { src, title?, meta?, alt? }
 * @returns {{ element: DocumentFragment, open: Function, close: Function, destroy: Function }}
 */
export function ImagePreview(options = {}) {
  const { images = [] } = options;

  let _current = 0;
  let _visible = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function open(index = 0) {
    _current = index;
    _visible = true;
    _updateImage();
    if (overlayEl) {overlayEl.classList.add('is-visible');}
    _updateNavButtons();
  }

  function close() {
    _visible = false;
    if (overlayEl) {overlayEl.classList.remove('is-visible');}
  }

  function destroy() {
    close();
    if (closeBtn) {closeBtn.removeEventListener('click', close);}
    if (prevBtn) {prevBtn.removeEventListener('click', _prev);}
    if (nextBtn) {nextBtn.removeEventListener('click', _next);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _prev() {
    if (_current > 0) { _current--; _updateImage(); _updateNavButtons(); }
  }

  function _next() {
    if (_current < images.length - 1) { _current++; _updateImage(); _updateNavButtons(); }
  }

  function _updateImage() {
    if (!imgEl || !images[_current]) {return;}
    const img = images[_current];
    imgEl.src = img.src;
    imgEl.alt = img.alt || img.title || '';
    if (titleEl) {titleEl.textContent = img.title || '';}
    if (metaEl) {metaEl.textContent = img.meta || '';}
    // Show/hide info section
    if (infoEl) {infoEl.style.display = (img.title || img.meta) ? 'block' : 'none';}
  }

  function _updateNavButtons() {
    if (prevBtn) {prevBtn.disabled = _current === 0;}
    if (nextBtn) {nextBtn.disabled = _current === images.length - 1;}
    // Hide nav if only one image
    const display = images.length <= 1 ? 'none' : 'flex';
    if (navEl) {navEl.style.display = display;}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-image-preview-overlay">
      <button class="ds-image-preview__close" type="button" aria-label="Close">×</button>
      <div class="ds-image-preview__content">
        <img src="" alt="" />
      </div>
      <div class="ds-image-preview__info">
        <div class="ds-image-preview__title"></div>
        <div class="ds-image-preview__meta"></div>
      </div>
      <div class="ds-image-preview__nav">
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-prev" type="button" aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-next" type="button" aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const overlayEl = container.querySelector('.ds-image-preview-overlay');
  const closeBtn = container.querySelector('.ds-image-preview__close');
  const imgEl = container.querySelector('.ds-image-preview__content img');
  const titleEl = container.querySelector('.ds-image-preview__title');
  const metaEl = container.querySelector('.ds-image-preview__meta');
  const infoEl = container.querySelector('.ds-image-preview__info');
  const navEl = container.querySelector('.ds-image-preview__nav');
  const prevBtn = container.querySelector('.ds-image-preview__nav-prev');
  const nextBtn = container.querySelector('.ds-image-preview__nav-next');

  if (closeBtn) {closeBtn.addEventListener('click', close);}
  if (prevBtn) {prevBtn.addEventListener('click', _prev);}
  if (nextBtn) {nextBtn.addEventListener('click', _next);}

  // Click overlay background to close
  if (overlayEl) {
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) {close();}
    });
  }

  _updateNavButtons();

  return {
    get element() { return container; },
    open,
    close,
    destroy,
  };
}
