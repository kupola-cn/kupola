// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Template renderer: parses html`` templates into DOM
 * and establishes fine-grained reactive bindings via per-Part effects.
 *
 * @module render
 */

import { effect } from './effect.js';
import { TemplateResult } from './template.js';

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Minimal HTML entity escaping for text content. */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Check if a value is a reactive signal-like (has a .value getter). */
export function isSignalLike(v) {
  if (v == null || typeof v !== 'object') return false;
  // Check own property first, then prototype chain
  const own = Object.getOwnPropertyDescriptor(v, 'value');
  if (own && typeof own.get === 'function') return true;
  const proto = Object.getPrototypeOf(v);
  if (proto) {
    const protoDesc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (protoDesc && typeof protoDesc.get === 'function') return true;
  }
  return false;
}

// ─── Marker ──────────────────────────────────────────────────────────────────

/** Unique marker prefix — extremely unlikely in real HTML. */
const M = '\u0EBF';
const marker = (i) => `${M}${i}${M}`;

// ─── HTML Serialization ──────────────────────────────────────────────────────

/**
 * Interleave template strings with markers to produce a single HTML string.
 * Static/primitive values are inlined; dynamic values become markers.
 *
 * @param {TemplateResult} tpl
 * @returns {string}
 */
function serialize(tpl) {
  const parts = [];
  for (let i = 0; i < tpl.strings.length; i++) {
    parts.push(tpl.strings[i]);
    if (i < tpl.values.length) {
      const v = tpl.values[i];
      if (v instanceof TemplateResult) {
        parts.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && v[0] instanceof TemplateResult) {
        parts.push(v.map(serializeNested).join(''));
      } else if (typeof v === 'function') {
        // Functions are always in on* attributes → marker
        parts.push(marker(i));
      } else if (isSignalLike(v)) {
        // Signal → marker (will be read reactively)
        parts.push(marker(i));
      } else {
        // Static primitive → inline escaped
        parts.push(escapeHtml(v ?? ''));
      }
    }
  }
  return parts.join('');
}

/** Render a nested TemplateResult to a static HTML string. */
function serializeNested(tpl) {
  const parts = [];
  for (let i = 0; i < tpl.strings.length; i++) {
    parts.push(tpl.strings[i]);
    if (i < tpl.values.length) {
      const v = tpl.values[i];
      if (v instanceof TemplateResult) {
        parts.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && v[0] instanceof TemplateResult) {
        parts.push(v.map(serializeNested).join(''));
      } else if (isSignalLike(v)) {
        parts.push(escapeHtml(v.value));
      } else if (typeof v !== 'function') {
        parts.push(escapeHtml(v ?? ''));
      }
    }
  }
  return parts.join('');
}

// ─── Value Classification ────────────────────────────────────────────────────

/**
 * Determine whether a marker sits inside an event attribute (on*),
 * a regular attribute, or text content.
 *
 * @param {string} htmlStr  The full HTML string.
 * @param {string} m        The marker to locate.
 * @returns {{ type: 'event'|'attr'|'text', attrName?: string }}
 */
function classifyPosition(htmlStr, m) {
  const idx = htmlStr.indexOf(m);
  if (idx === -1) return { type: 'text' };

  // Find the nearest '<' before the marker
  const before = htmlStr.substring(0, idx);
  const lastOpen = before.lastIndexOf('<');
  if (lastOpen === -1) return { type: 'text' };

  // If there's a '>' between '<' and the marker, the marker is in text content
  const between = htmlStr.substring(lastOpen, idx);
  if (between.includes('>')) return { type: 'text' };

  // Marker is inside a tag — find the attribute name
  // Look backwards from marker for `attrName=`
  const tagStart = htmlStr.substring(lastOpen + 1, idx);
  const attrMatch = tagStart.match(/([\w\-@:.]+)\s*=\s*(?:"[^"]*|'[^']*|[^\s>]*?)$/);
  if (!attrMatch) return { type: 'text' };

  const attrName = attrMatch[1];
  if (attrName.startsWith('on') && attrName.length > 2) {
    return { type: 'event', attrName };
  }
  return { type: 'attr', attrName };
}

// ─── DOM Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse an HTML string into a DocumentFragment using <template>.
 * @param {string} htmlStr
 * @returns {DocumentFragment}
 */
function parseHTML(htmlStr) {
  const tpl = document.createElement('template');
  tpl.innerHTML = htmlStr;
  return tpl.content;
}

// ─── Part Classes ────────────────────────────────────────────────────────────

/**
 * TextPart — manages a reactive text node.
 */
export class TextPart {
  /**
   * @param {Node} container  Parent node that will hold the text node.
   * @param {any} rawValue    Original template value (Signal, primitive, etc.)
   */
  constructor(container, rawValue) {
    this.container = container;
    this.rawValue = rawValue;
    /** @type {Text|null} */
    this.node = null;
    this._dispose = null;
  }

  /** Create the initial DOM and bind the reactive effect. */
  mount() {
    const placeholder = document.createTextNode('');
    if (this._insertBefore) {
      this.container.insertBefore(placeholder, this._insertBefore);
    } else {
      this.container.appendChild(placeholder);
    }
    this.node = placeholder;

    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => {
        this.node.textContent = raw.value != null ? String(raw.value) : '';
      });
    } else if (this.rawValue instanceof TemplateResult) {
      // Static nested template (non-reactive for now)
      this.node.textContent = serializeNested(this.rawValue);
    } else {
      this.node.textContent = this.rawValue != null ? String(this.rawValue) : '';
    }
  }

  destroy() {
    this._dispose?.();
    this.node?.remove();
  }
}

/**
 * AttrPart — manages a reactive element attribute.
 */
export class AttrPart {
  /**
   * @param {Element} element
   * @param {string} attrName
   * @param {any} rawValue
   */
  constructor(element, attrName, rawValue) {
    this.element = element;
    this.attrName = attrName;
    this.rawValue = rawValue;
    this._dispose = null;
  }

  mount() {
    if (isSignalLike(this.rawValue)) {
      const raw = this.rawValue;
      this._dispose = effect(() => {
        const v = raw.value;
        if (v == null || v === false) {
          this.element.removeAttribute(this.attrName);
        } else {
          this.element.setAttribute(this.attrName, String(v));
        }
      });
    } else {
      if (this.rawValue != null && this.rawValue !== false) {
        this.element.setAttribute(this.attrName, String(this.rawValue));
      }
    }
  }

  destroy() {
    this._dispose?.();
  }
}

/**
 * EventPart — manages an event listener bound via on* attribute.
 */
export class EventPart {
  /**
   * @param {Element} element
   * @param {string} attrName  e.g. "onclick"
   * @param {Function} handler
   */
  constructor(element, attrName, handler) {
    this.element = element;
    this.eventName = attrName.slice(2).toLowerCase(); // onclick → click
    this.handler = handler;
    this._bound = null;
  }

  mount() {
    if (typeof this.handler === 'function') {
      this._bound = (e) => this.handler(e);
      this.element.addEventListener(this.eventName, this._bound);
    }
  }

  destroy() {
    if (this._bound) {
      this.element.removeEventListener(this.eventName, this._bound);
      this._bound = null;
    }
  }
}

// ─── TemplateInstance ────────────────────────────────────────────────────────

/**
 * Manages all Parts created from a single template render.
 */
export class TemplateInstance {
  constructor() {
    /** @type {(TextPart|AttrPart|EventPart)[]} */
    this.parts = [];
    /** @type {DocumentFragment|null} */
    this.fragment = null;
  }

  /** Remove all reactive effects and event listeners. */
  destroy() {
    for (const part of this.parts) {
      part.destroy();
    }
    this.parts.length = 0;
  }
}

// ─── render() ────────────────────────────────────────────────────────────────

/**
 * Render a template into a DOM container with reactive bindings.
 *
 * ```js
 * const count = signal(0);
 * const tpl = html`<button onclick="${() => count.value++}">${count}</button>`;
 * const view = render(tpl, document.getElementById('app'));
 * // Later:
 * view.destroy();
 * ```
 *
 * @param {TemplateResult} tpl       Result of html``
 * @param {Element}        container DOM element to render into
 * @returns {TemplateInstance}       Call `.destroy()` to clean up
 */
export function render(tpl, container) {
  const instance = new TemplateInstance();

  // 1. Serialize template to HTML string with markers
  const htmlStr = serialize(tpl);

  // 2. Parse HTML into DOM
  const fragment = parseHTML(htmlStr);
  instance.fragment = fragment;

  // 3. Walk DOM to find markers and create Parts
  _processNode(fragment, tpl.values, htmlStr, instance);

  // 4. Mount all parts (establish reactive effects / event listeners)
  for (const part of instance.parts) {
    part.mount();
  }

  // 5. Append fragment to container
  container.appendChild(fragment);

  return instance;
}

/**
 * Recursively walk DOM nodes, finding markers and creating Parts.
 *
 * @param {Node}              node
 * @param {any[]}             values   Original template values
 * @param {string}            htmlStr  Full HTML string (for classification)
 * @param {TemplateInstance}  instance
 */
function _processNode(node, values, htmlStr, instance) {
  // Process child nodes (snapshot first — we mutate the list)
  const children = [...node.childNodes];
  for (const child of children) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      _processTextNode(child, values, htmlStr, instance, node);
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      _processElement(child, values, htmlStr, instance);
    }
  }
}

/**
 * Check a text node for markers. If found, replace with a TextPart.
 */
function _processTextNode(textNode, values, htmlStr, instance, parent) {
  const text = textNode.textContent || '';
  for (let i = 0; i < values.length; i++) {
    const m = marker(i);
    const idx = text.indexOf(m);
    if (idx === -1) continue;

    // Only create a Part if this marker is for TEXT content
    // (attribute markers are handled in _processElement)
    const cls = classifyPosition(htmlStr, m);
    if (cls.type !== 'text') continue;

    const before = text.substring(0, idx);
    const after = text.substring(idx + m.length);

    // Insert "before" text node (if any)
    if (before) {
      parent.insertBefore(document.createTextNode(before), textNode);
    }

    // Create TextPart
    const part = new TextPart(parent, values[i]);
    instance.parts.push(part);

    // Insert "after" text node (if any) — may contain more markers
    let afterNode = textNode;
    if (after) {
      afterNode = document.createTextNode(after);
      parent.insertBefore(afterNode, textNode);
    }

    // Remove original marker text node
    parent.removeChild(textNode);

    // The TextPart will create its own text node during mount().
    // We need to tell it where to insert (before afterNode, or at end).
    part._insertBefore = afterNode !== textNode ? afterNode : null;

    // Recursively check the "after" text for more markers
    if (after) {
      _processTextNode(afterNode, values, htmlStr, instance, parent);
    }
    return; // Only handle one marker per call; recursion handles the rest
  }
}

/**
 * Check an element's attributes for markers.
 */
function _processElement(element, values, htmlStr, instance) {
  const attrs = [...element.attributes];
  for (const attr of attrs) {
    for (let i = 0; i < values.length; i++) {
      const m = marker(i);
      if (!attr.value.includes(m)) continue;

      const cls = classifyPosition(htmlStr, m);

      if (cls.type === 'event' && cls.attrName === attr.name) {
        // Event handler
        element.removeAttribute(attr.name);
        const part = new EventPart(element, attr.name, values[i]);
        instance.parts.push(part);
      } else if (cls.type === 'attr' && cls.attrName === attr.name) {
        // Regular attribute with reactive value
        // Remove the marker from the attribute value
        const cleanVal = attr.value.replace(m, '');
        if (cleanVal) {
          element.setAttribute(attr.name, cleanVal);
        } else {
          element.removeAttribute(attr.name);
        }
        const part = new AttrPart(element, attr.name, values[i]);
        instance.parts.push(part);
      }
      // If classification doesn't match, skip (marker is literal text)
    }
  }

  // Recurse into children
  _processNode(element, values, htmlStr, instance);
}
