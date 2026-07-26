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

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';
import { getIconTemplate } from './icon-helper';
import { createListenerRegistry } from './listener-registry';
import { lockBodyScroll } from './body-scroll-lock';
import { registerOverlayKeydown } from './overlay-stack';

/**
 * Create an ImagePreview component instance.
 *
 * @param {Object} [options]
 * @param {Array}  [options.images]   Array of { src, title?, meta?, alt? }
 * @returns {{ element: DocumentFragment, open: Function, close: Function, destroy: Function }}
 */
export function ImagePreview(options = {}) {
  const config = options && typeof options === 'object' ? options : {};
  const images = (Array.isArray(config.images) ? config.images : [])
    .map(image => typeof image === 'string' ? { src: image } : image)
    .filter(image => image && typeof image.src === 'string' && image.src);
  const onClose = typeof config.onClose === 'function' ? config.onClose : null;

  let _current = _normalizeIndex(config.index ?? 0);
  let _visible = false;
  let destroyed = false;
  let releaseBodyScroll = null;
  let releaseKeydown = null;
  let previousFocus = null;
  const listeners = createListenerRegistry();

  // ── Public API ─────────────────────────────────────────────────────────────

  function open(index = 0) {
    if (destroyed || images.length === 0) {return;}
    _current = _normalizeIndex(index);
    if (_visible) {
      _updateImage();
      _updateNavButtons();
      return;
    }
    _visible = true;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    _updateImage();
    if (overlayEl) {overlayEl.classList.add('is-visible');}
    _updateNavButtons();
    releaseBodyScroll = lockBodyScroll();
    releaseKeydown = registerOverlayKeydown(_handleKeydown);
    closeBtn?.focus();
  }

  function close() {
    if (destroyed || !_visible) {return;}
    _visible = false;
    if (overlayEl) {overlayEl.classList.remove('is-visible');}
    releaseKeydown?.();
    releaseKeydown = null;
    releaseBodyScroll?.();
    releaseBodyScroll = null;
    if (previousFocus?.isConnected) {previousFocus.focus();}
    previousFocus = null;
    if (onClose) {onClose();}
  }

  function destroy() {
    if (destroyed) {return;}
    let closeError = null;
    try {close();} catch (error) {closeError = error;}
    destroyed = true;
    releaseKeydown?.();
    releaseKeydown = null;
    releaseBodyScroll?.();
    releaseBodyScroll = null;
    listeners.destroy();
    instance.destroy();
    if (closeError) {throw closeError;}
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _prev() {
    if (destroyed) {return;}
    if (_current > 0) { _current--; _updateImage(); _updateNavButtons(); }
  }

  function _next() {
    if (destroyed) {return;}
    if (_current < images.length - 1) { _current++; _updateImage(); _updateNavButtons(); }
  }

  function _normalizeIndex(index) {
    const numericIndex = Number(index);
    if (!Number.isFinite(numericIndex) || images.length === 0) {return 0;}
    return Math.min(images.length - 1, Math.max(0, Math.trunc(numericIndex)));
  }

  function _handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      _prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      _next();
    }
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
    if (prevBtn) {prevBtn.disabled = images.length === 0 || _current === 0;}
    if (nextBtn) {nextBtn.disabled = images.length === 0 || _current === images.length - 1;}
    // Hide nav if only one image
    const display = images.length <= 1 ? 'none' : 'flex';
    if (navEl) {navEl.style.display = display;}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-image-preview-overlay" role="dialog" aria-modal="true"
      aria-label="Image preview" tabindex="-1">
      <button class="ds-image-preview__close" type="button" aria-label="Close">
        ${getIconTemplate('x')}
      </button>
      <div class="ds-image-preview__content">
        <img src="" alt="" />
      </div>
      <div class="ds-image-preview__info">
        <div class="ds-image-preview__title"></div>
        <div class="ds-image-preview__meta"></div>
      </div>
      <div class="ds-image-preview__nav">
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-prev" type="button" aria-label="Previous">
          ${getIconTemplate('chevron-left')}
        </button>
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-next" type="button" aria-label="Next">
          ${getIconTemplate('chevron-right')}
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

  if (closeBtn) {listeners.on(closeBtn, 'click', close);}
  if (prevBtn) {listeners.on(prevBtn, 'click', _prev);}
  if (nextBtn) {listeners.on(nextBtn, 'click', _next);}

  // Click overlay background to close
  if (overlayEl) {
    listeners.on(overlayEl, 'click', (e) => {
      if (e.target === overlayEl) {close();}
    });
  }

  _updateNavButtons();

  return {
    get element() { return container; },
    open,
    close,
    show: open,
    hide: close,
    next: _next,
    prev: _prev,
    isOpen: () => _visible,
    getIndex: () => _current,
    destroy,
  };
}
