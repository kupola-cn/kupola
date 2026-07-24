// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Carousel component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-carousel*` CSS classes for styling.
 *
 * ```js
 * import { Carousel } from '@kupola/components/carousel';
 *
 * const view = Carousel({
 *   items: ['Slide 1', 'Slide 2', 'Slide 3'],
 *   autoPlay: true,
 *   interval: 3000,
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/carousel
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';
import { getIconHtml } from './icon-helper';

/**
 * Create a Carousel component instance.
 *
 * @param {Object}   [options]
 * @param {Array}    [options.items]      Array of slide content strings
 * @param {boolean}  [options.autoPlay]   Auto-play enabled (default false)
 * @param {number}   [options.interval]   Auto-play interval in ms (default 3000)
 * @param {boolean}  [options.showIndicators] Show dot indicators (default true)
 * @param {boolean}  [options.showArrows]     Show prev/next arrows (default true)
 * @param {Function} [options.onChange]   Callback when slide changes (index)
 * @returns {{ element: DocumentFragment, goTo: Function, next: Function, prev: Function, destroy: Function }}
 */
export function Carousel(options = {}) {
  const {
    items = [],
    autoPlay = false,
    interval = 3000,
    showIndicators = true,
    showArrows = true,
    onChange = null,
  } = options;

  let _current = 0;
  let _timer = null;

  // ── Public API ─────────────────────────────────────────────────────────────

  function goTo(index) {
    if (items.length === 0) {return;}
    _current = ((index % items.length) + items.length) % items.length;
    _updatePosition();
    _updateIndicators();
    if (onChange) {onChange(_current);}
  }

  function next() {
    goTo(_current + 1);
  }

  function prev() {
    goTo(_current - 1);
  }

  function destroy() {
    _stopAutoPlay();
    if (prevBtn) {prevBtn.removeEventListener('click', _onPrev);}
    if (nextBtn) {nextBtn.removeEventListener('click', _onNext);}
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _onPrev() { prev(); _restartAutoPlay(); }
  function _onNext() { next(); _restartAutoPlay(); }

  function _updatePosition() {
    if (trackEl) {
      trackEl.style.transform = _current === 0 ? '' : `translateX(-${_current * 100}%)`;
    }
  }

  function _updateIndicators() {
    if (!indicatorsEl) {return;}
    const dots = indicatorsEl.querySelectorAll('.ds-carousel__indicator');
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === _current);
    });
  }

  function _startAutoPlay() {
    if (_timer || !autoPlay || items.length <= 1) {return;}
    _timer = setInterval(() => next(), interval);
  }

  function _stopAutoPlay() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  function _restartAutoPlay() {
    _stopAutoPlay();
    _startAutoPlay();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-carousel">
      <div class="ds-carousel__track"></div>
      <button class="ds-carousel__prev" type="button" aria-label="Previous">
        ${getIconHtml('chevron-left')}
      </button>
      <button class="ds-carousel__next" type="button" aria-label="Next">
        ${getIconHtml('chevron-right')}
      </button>
      <div class="ds-carousel__indicators"></div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const trackEl = container.querySelector('.ds-carousel__track');
  const prevBtn = container.querySelector('.ds-carousel__prev');
  const nextBtn = container.querySelector('.ds-carousel__next');
  const indicatorsEl = container.querySelector('.ds-carousel__indicators');

  // Build slides
  items.forEach((content, i) => {
    const slide = document.createElement('div');
    slide.className = 'ds-carousel__item';
    slide.textContent = content;
    trackEl.appendChild(slide);
  });

  // Build indicators
  if (showIndicators) {
    items.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'ds-carousel__indicator' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => { goTo(i); _restartAutoPlay(); });
      indicatorsEl.appendChild(dot);
    });
  } else {
    indicatorsEl.style.display = 'none';
  }

  // Arrow visibility
  if (!showArrows) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  // Bind events
  if (prevBtn) {prevBtn.addEventListener('click', _onPrev);}
  if (nextBtn) {nextBtn.addEventListener('click', _onNext);}

  // Initial position
  _updatePosition();

  // Auto-play
  if (autoPlay) {_startAutoPlay();}

  return {
    get element() { return container; },
    goTo,
    next,
    prev,
    destroy,
  };
}
