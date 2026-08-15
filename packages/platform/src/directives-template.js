// SPDX-License-Identifier: MIT
/**
 * @kupola/platform — Template-level directive Parts (k-class, k-if, k-show, k-style).
 *
 * Unlike the walk()-based directive system which enhances existing DOM,
 * these Parts integrate directly with the html`` rendering pipeline.
 * They receive JavaScript values (not string expressions) and use
 * effect() subscriptions for fine-grained DOM updates.
 *
 * @module directives-template
 */

import { effect } from '@kupola/core';
import { isSignalLike } from './render.js';

// ── ClassDirectivePart ─────────────────────────────────────────────────────────

/**
 * Handles k-class directive: merges static class (from the class attribute)
 * with dynamic classes, applying only the difference on each update.
 *
 * Usage:
 *   html`<div class="card" k-class="${classMap({ 'is-active': active })}">`
 */
export class ClassDirectivePart {
  constructor(element, rawValue) {
    this.element = element;
    this.rawValue = rawValue;
    this._dispose = null;
    this._previous = new Set();
  }

  mount() {
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => this._apply(raw.value));
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => this._apply(fn()));
    } else {
      this._apply(this.rawValue);
    }
  }

  _apply(value) {
    const next = new Set();
    if (typeof value === 'string' && value) {
      for (const cls of value.split(/\s+/)) {
        if (cls) {next.add(cls);}
      }
    } else if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (value[key]) {next.add(key);}
      }
    }
    // falsy or non-string/non-object → remove all dynamic classes

    // Remove classes that were in _previous but not in next
    for (const cls of this._previous) {
      if (!next.has(cls)) {
        this.element.classList.remove(cls);
      }
    }
    // Add classes that are in next but not in _previous
    for (const cls of next) {
      if (!this._previous.has(cls)) {
        this.element.classList.add(cls);
      }
    }
    this._previous = next;
  }

  destroy() {
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }
  }
}

// ── IfDirectivePart ────────────────────────────────────────────────────────────

/**
 * Handles k-if directive: conditionally mounts/unmounts the element
 * by replacing it with a comment placeholder when the condition is falsy.
 *
 * Usage:
 *   html`<div k-if="${show}">content</div>`
 */
export class IfDirectivePart {
  constructor(element, rawValue) {
    this.element = element;
    this.rawValue = rawValue;
    this._dispose = null;
    this._placeholder = document.createComment('k-if');
  }

  mount() {
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => this._update(raw.value));
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => this._update(fn()));
    } else {
      this._update(this.rawValue);
    }
  }

  _update(condition) {
    if (condition) {
      if (this._placeholder.parentNode) {
        this._placeholder.parentNode.replaceChild(this.element, this._placeholder);
      }
    } else {
      if (this.element.parentNode) {
        this.element.parentNode.replaceChild(this._placeholder, this.element);
      }
    }
  }

  destroy() {
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }
    // Ensure element is in DOM and placeholder is removed
    if (this._placeholder.parentNode) {
      this._placeholder.parentNode.replaceChild(this.element, this._placeholder);
    }
  }
}

// ── ShowDirectivePart ──────────────────────────────────────────────────────────

/**
 * Handles k-show directive: toggles element visibility via display style.
 * Unlike k-if, the element is always in the DOM.
 *
 * Usage:
 *   html`<div k-show="${visible}">content</div>`
 */
export class ShowDirectivePart {
  constructor(element, rawValue) {
    this.element = element;
    this.rawValue = rawValue;
    this._dispose = null;
    this._originalDisplay = '';
  }

  mount() {
    this._originalDisplay = this.element.style.display || '';
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => this._update(raw.value));
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => this._update(fn()));
    } else {
      this._update(this.rawValue);
    }
  }

  _update(show) {
    if (show) {
      this.element.style.display = this._originalDisplay;
    } else {
      this.element.style.display = 'none';
    }
  }

  destroy() {
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }
  }
}

// ── StyleDirectivePart ─────────────────────────────────────────────────────────

/**
 * Handles k-style directive: applies dynamic inline styles.
 * Static styles from the style attribute are preserved.
 *
 * Usage:
 *   html`<div style="font-size: 14px" k-style="${styleMap({ color: themeColor })}">`
 */
export class StyleDirectivePart {
  constructor(element, rawValue) {
    this.element = element;
    this.rawValue = rawValue;
    this._dispose = null;
    this._previousKeys = new Set();
    this._lastStringValue = '';
  }

  mount() {
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => this._apply(raw.value));
    } else if (typeof this.rawValue === 'function') {
      const fn = this.rawValue;
      this._dispose = effect(() => this._apply(fn()));
    } else {
      this._apply(this.rawValue);
    }
  }

  _apply(value) {
    if (value && typeof value === 'object') {
      const nextKeys = new Set();
      for (const key of Object.keys(value)) {
        nextKeys.add(key);
        if (value[key] != null) {
          this.element.style.setProperty(key, String(value[key]));
        } else {
          this.element.style.removeProperty(key);
        }
      }
      // Remove properties that were in previous but not in next
      for (const key of this._previousKeys) {
        if (!nextKeys.has(key)) {
          this.element.style.removeProperty(key);
        }
      }
      this._previousKeys = nextKeys;
    } else if (typeof value === 'string') {
      // Replace the last string value instead of appending
      if (this._lastStringValue) {
        this.element.style.cssText = this.element.style.cssText.replace(this._lastStringValue, value);
      } else {
        this.element.style.cssText += (this.element.style.cssText ? '; ' : '') + value;
      }
      this._lastStringValue = value;
    }
  }

  destroy() {
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }
  }
}
