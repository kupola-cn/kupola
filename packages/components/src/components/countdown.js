// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Countdown timer component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-countdown*` CSS classes for styling.
 *
 * ```js
 * import { Countdown } from '@kupola/components/countdown';
 *
 * const view = Countdown({
 *   target: Date.now() + 60000,  // 1 minute from now
 *   onComplete: () => console.log('Done!'),
 * });
 * container.appendChild(view.element);
 * ```
 *
 * @module components/countdown
 */

import { html } from '@kupola/platform/template';
import { render } from '@kupola/platform/render';

/**
 * Create a Countdown component instance.
 *
 * @param {Object}   [options]
 * @param {number}   [options.target]      Target timestamp in ms (Date.now() format)
 * @param {Function} [options.onComplete]  Callback when countdown reaches zero
 * @returns {{ element: DocumentFragment, start: Function, stop: Function, destroy: Function }}
 */
export function Countdown(options = {}) {
  const {
    target = 0,
    onComplete = null,
  } = options;

  let _timer = null;
  let _target = target;
  let _completed = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  function start(newTarget) {
    if (newTarget) {_target = newTarget;}
    stop();
    _completed = false;
    _tick();
    _timer = setInterval(_tick, 1000);
  }

  function stop() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  function destroy() {
    stop();
    instance.destroy();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  function _tick() {
    const now = Date.now();
    let diff = Math.max(0, _target - now);

    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000); diff %= 60000;
    const seconds = Math.floor(diff / 1000);

    _updateDisplay(days, hours, minutes, seconds);

    if (_target - now <= 0 && !_completed) {
      _completed = true;
      stop();
      if (onComplete) {onComplete();}
    }
  }

  function _updateDisplay(days, hours, minutes, seconds) {
    if (!valueEls) {return;}
    if (valueEls.days) {valueEls.days.textContent = _pad(days);}
    if (valueEls.hours) {valueEls.hours.textContent = _pad(hours);}
    if (valueEls.minutes) {valueEls.minutes.textContent = _pad(minutes);}
    if (valueEls.seconds) {valueEls.seconds.textContent = _pad(seconds);}
  }

  function _pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tpl = html`
    <div class="ds-countdown">
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__days">00</span>
        <span class="ds-countdown__label">Days</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__hours">00</span>
        <span class="ds-countdown__label">Hrs</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__minutes">00</span>
        <span class="ds-countdown__label">Min</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__seconds">00</span>
        <span class="ds-countdown__label">Sec</span>
      </div>
    </div>
  `;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const valueEls = {
    days: container.querySelector('.ds-countdown__days'),
    hours: container.querySelector('.ds-countdown__hours'),
    minutes: container.querySelector('.ds-countdown__minutes'),
    seconds: container.querySelector('.ds-countdown__seconds'),
  };

  // Auto-start if target is provided
  if (_target > 0) {
    start();
  }

  return {
    get element() { return container; },
    start,
    stop,
    destroy,
  };
}
