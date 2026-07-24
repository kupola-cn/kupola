// SPDX-License-Identifier: MIT
/**
 * @kupola/core — SSR layer: renderToString + hydrate.
 *
 * renderToString: serializes a TemplateResult to an HTML string with
 *   lightweight hydration markers (<!----> after dynamic text, data-kp
 *   on elements with dynamic attributes).
 *
 * hydrate: walks existing DOM (produced by renderToString), replaces
 *   markers with reactive Parts, and returns a TemplateInstance.
 *
 * @module server
 */

import { effect } from '@kupola/core';
import {
  escapeHtml,
  isSignalLike,
  isTemplateResultLike,
  AttrPart,
  EventPart,
  TemplateInstance,
} from './render.js';

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Check if the current position is inside an HTML opening tag.
 * @param {string[]} parts  Accumulated output parts so far.
 * @returns {boolean}
 */
function isInTag(parts) {
  const s = parts.join('');
  const lo = s.lastIndexOf('<');
  if (lo === -1) {return false;}
  return !s.substring(lo).includes('>');
}

/**
 * Extract the attribute name for the value about to be inserted.
 * @param {string[]} parts
 * @returns {string|null}
 */
function attrNameAtCursor(parts) {
  const s = parts.join('');
  const lo = s.lastIndexOf('<');
  if (lo === -1) {return null;}
  const tag = s.substring(lo + 1);
  const m = tag.match(/([\w\-@:.]+)\s*=\s*(?:"[^"]*|'[^']*|[^\s>]*?)$/);
  return m ? m[1] : null;
}

/**
 * Serialize a nested TemplateResult to static HTML (no markers).
 */
function serializeNested(tpl) {
  const p = [];
  for (let i = 0; i < tpl.strings.length; i++) {
    p.push(tpl.strings[i]);
    if (i < tpl.values.length) {
      const v = tpl.values[i];
      if (isTemplateResultLike(v)) {
        p.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && isTemplateResultLike(v[0])) {
        p.push(v.map(t => serializeNested(t)).join(''));
      } else if (isSignalLike(v)) {
        p.push(escapeHtml(v.value));
      } else if (typeof v !== 'function') {
        p.push(escapeHtml(v ?? ''));
      }
    }
  }
  return p.join('');
}

// ─── SSR Serialization ───────────────────────────────────────────────────────

/**
 * Main SSR serialization. Builds the HTML string and injects:
 * - `<!---->` after dynamic text values (for hydrate to find)
 * - `data-kp="..."` on elements with dynamic attributes/events
 */
function serializeSSR(tpl) {
  const out = [];
  /** @type {string[]} Pending attr bindings for the current open tag. */
  let tagKp = [];
  /** Are we currently inside an opening tag (between < and >)? */
  let inTag = false;
  /** Are we inside a quoted attribute value? */
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < tpl.strings.length; i++) {
    let str = tpl.strings[i];

    // ── Process the string character-by-character to handle tag state ──
    const processed = processString(str, tagKp, inTag, inQuote, quoteChar);
    str = processed.result;
    inQuote = processed.inQuote;
    quoteChar = processed.quoteChar;

    out.push(str);

    // After pushing, update inTag state based on the new output
    inTag = checkInTag(out);

    // ── Process the value at this position ──
    if (i < tpl.values.length) {
      const v = tpl.values[i];

      if (isTemplateResultLike(v)) {
        out.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && isTemplateResultLike(v[0])) {
        out.push(v.map(t => serializeNested(t)).join(''));
      } else if (typeof v === 'function') {
        if (inTag) {
          const name = attrNameAtCursor(out);
          tagKp.push(`${i}:e:${name || ''}`);
        }
        // Functions produce no HTML on the server
      } else if (isSignalLike(v)) {
        if (inTag) {
          const name = attrNameAtCursor(out);
          tagKp.push(`${i}:a:${name || ''}`);
          // Output the signal's current value in the attribute
          const val = v.value;
          out.push(val != null ? escapeHtml(val) : '');
        } else {
          // Dynamic text: inline current value + hydration marker
          const val = v.value;
          out.push(val != null ? escapeHtml(val) : '');
          out.push('<!---->');
        }
      } else {
        // Static primitive
        out.push(escapeHtml(v ?? ''));
      }
    }
  }

  return out.join('');
}

/**
 * Process a template string, injecting data-kp when a tag closes.
 *
 * Scans for `>` characters. When found while inside a tag with pending
 * bindings, inserts ` data-kp="..."` before the `>`.
 */
function processString(str, tagKp, wasInTag, wasInQuote, wasQuoteChar) {
  let result = '';
  let inQuote = wasInQuote;
  let quoteChar = wasQuoteChar;
  let localInTag = wasInTag;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];

    if (inQuote) {
      result += c;
      if (c === quoteChar) {inQuote = false;}
      continue;
    }

    if (c === '"' || c === '\'') {
      result += c;
      inQuote = true;
      quoteChar = c;
      continue;
    }

    if (c === '>' && localInTag && !inQuote) {
      // Tag is closing — inject data-kp if there are pending bindings
      if (tagKp.length > 0) {
        result += ` data-kp="${tagKp.join(',')}"`;
        tagKp.length = 0;
      }
      localInTag = false;
    }

    result += c;
  }

  return { result, inQuote, quoteChar };
}

/**
 * Check if we're currently inside an open tag after appending to output.
 * Properly tracks quoted attribute values so that `>` inside quotes
 * (e.g. `<div title=">">`) does not falsely close the tag.
 */
function checkInTag(out) {
  const s = out.join('');
  let inQ = false;
  let qC = '';
  let lastOpen = -1;
  let closed = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === qC) {inQ = false;}
      continue; // skip < > tracking inside quotes
    }
    if (c === '"' || c === '\'') {
      inQ = true;
      qC = c;
    } else if (c === '<') {
      lastOpen = i;
      closed = false;
    } else if (c === '>' && lastOpen >= 0 && !inQ) {
      closed = true;
    }
  }

  return lastOpen >= 0 && !closed;
}

// ─── Hydrate Helpers ─────────────────────────────────────────────────────────

/**
 * Classify template values to determine which are attribute bindings.
 * Uses the same checkInTag logic as serializeSSR for consistency.
 */
function classifyValues(tpl) {
  const attrBindings = [];
  const out = [];

  for (let i = 0; i < tpl.strings.length; i++) {
    out.push(tpl.strings[i]);

    if (i < tpl.values.length) {
      const v = tpl.values[i];
      const inTag = checkInTag(out);

      if (typeof v === 'function') {
        if (inTag) {
          const name = attrNameAtCursor(out);
          attrBindings.push({ valueIndex: i, type: 'e', attrName: name || '' });
        }
      } else if (isSignalLike(v)) {
        if (inTag) {
          const name = attrNameAtCursor(out);
          attrBindings.push({ valueIndex: i, type: 'a', attrName: name || '' });
        } else {
          // Mirror serializeSSR: output signal value so subsequent
          // checkInTag calls see the correct HTML structure.
          const val = v.value;
          out.push(val != null ? escapeHtml(val) : '');
        }
      } else if (isTemplateResultLike(v)) {
        out.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && isTemplateResultLike(v[0])) {
        out.push(v.map(t => serializeNested(t)).join(''));
      } else {
        out.push(escapeHtml(v ?? ''));
      }
    }
  }

  return { attrBindings };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render a template to an HTML string (for server-side rendering).
 *
 * @param {TemplateResult} tpl
 * @returns {string} HTML with hydration markers
 */
export function renderToString(tpl) {
  return serializeSSR(tpl);
}

/**
 * Hydrate server-rendered DOM with reactive bindings.
 *
 * Walks the existing DOM inside `container`, finds hydration markers
 * (`<!---->` comments for text, `data-kp` attributes for element attrs),
 * and creates reactive Parts without modifying the DOM structure.
 *
 * @param {TemplateResult} tpl
 * @param {Element} container
 * @returns {TemplateInstance}
 */
export function hydrate(tpl, container) {
  const instance = new TemplateInstance();

  // Pre-compute which value index each text-marker comment maps to
  // by replaying the same serialization logic as serializeSSR.
  const commentToValueIdx = _computeTextMarkerIndices(tpl);

  // Walk existing DOM and bind reactive effects
  _hydrateChildren(container, tpl.values, instance, commentToValueIdx);

  return instance;
}

// ─── Hydration DOM Walker ────────────────────────────────────────────────────

/**
 * Walk child nodes of a parent, binding reactive effects.
 */
function _hydrateChildren(parent, values, instance, commentMap) {
  const children = [ ...parent.childNodes ];

  for (const child of children) {
    if (child.nodeType === 8 /* COMMENT_NODE */) {
      // <!----> hydration marker for a dynamic text value
      _hydrateComment(child, values, parent, instance, commentMap);
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      _hydrateElement(child, values, instance, commentMap);
    }
    // Text nodes (type 3) are left as-is (static content)
  }
}

/**
 * Replay template serialization to determine which value index each
 * text-marker comment (<!---->) corresponds to.
 *
 * Returns a Map: comment DOM node → value index.
 * The map is populated during hydration as comments are encountered.
 *
 * @param {TemplateResult} tpl
 * @returns {Map<Comment, number>}
 */
function _computeTextMarkerIndices(tpl) {
  // We return a special object that lazily computes indices.
  // Instead, pre-compute the list of value indices that produce
  // text markers (in template order), then assign them to DOM
  // comments in document order during hydration.
  const indices = [];
  const out = [];
  let inTag = false;

  for (let i = 0; i < tpl.strings.length; i++) {
    out.push(tpl.strings[i]);
    inTag = checkInTag(out);

    if (i < tpl.values.length) {
      const v = tpl.values[i];

      if (isTemplateResultLike(v)) {
        out.push(serializeNested(v));
      } else if (Array.isArray(v) && v.length > 0 && isTemplateResultLike(v[0])) {
        out.push(v.map(t => serializeNested(t)).join(''));
      } else if (typeof v === 'function') {
        // No marker
      } else if (isSignalLike(v)) {
        if (inTag) {
          // Attribute binding — no text marker
          const val = v.value;
          out.push(val != null ? escapeHtml(val) : '');
        } else {
          // Text binding — produces a <!----> marker
          indices.push(i);
          const val = v.value;
          out.push(val != null ? escapeHtml(val) : '');
        }
      } else {
        out.push(escapeHtml(v ?? ''));
      }
    }
  }

  return { indices, nextIdx: 0 };
}

/**
 * Hydrate a comment marker by making the preceding SSR text node reactive.
 *
 * SSR output pattern: `...<span>42<!----></span>...`
 * The text node "42" (rendered by SSR) sits right before the `<!---->`
 * comment.  We reuse that node and drive it with a reactive effect
 * instead of creating a duplicate text node.
 */
function _hydrateComment(comment, values, parent, instance, commentMap) {
  // Get the value index from the pre-computed mapping.
  // Comments are encountered in document order, which matches
  // the template serialization order.
  const valueIdx = commentMap.indices[commentMap.nextIdx++] ?? -1;

  // Reuse the SSR-rendered text node immediately before the comment.
  // If there is no preceding text node (e.g. signal was null/empty),
  // create a fresh one.
  const prev = comment.previousSibling;
  let node;
  if (prev && prev.nodeType === 3 /* TEXT_NODE */) {
    node = prev;
  } else {
    node = document.createTextNode('');
    parent.insertBefore(node, comment);
  }

  if (valueIdx >= 0 && valueIdx < values.length) {
    const raw = values[valueIdx];
    if (isSignalLike(raw)) {
      const dispose = effect(() => {
        node.textContent = raw.value != null ? String(raw.value) : '';
      });
      instance.parts.push({
        destroy() { dispose(); node.remove(); },
      });
    } else {
      node.textContent = raw != null ? String(raw) : '';
    }
  }

  // Remove the comment marker
  parent.removeChild(comment);
}

/**
 * Hydrate an element: check for data-kp, bind attrs/events, recurse.
 */
function _hydrateElement(element, values, instance, commentMap) {
  const kp = element.getAttribute('data-kp');
  if (kp) {
    const entries = kp.split(',');
    for (const entry of entries) {
      const c1 = entry.indexOf(':');
      const c2 = entry.indexOf(':', c1 + 1);
      const idx = parseInt(entry.substring(0, c1), 10);
      const type = entry.substring(c1 + 1, c2);
      const name = entry.substring(c2 + 1);

      if (idx >= 0 && idx < values.length) {
        if (type === 'e') {
          const part = new EventPart(element, name, values[idx]);
          part.mount();
          instance.parts.push(part);
        } else if (type === 'a') {
          const part = new AttrPart(element, name, values[idx]);
          part.mount();
          instance.parts.push(part);
        }
      }
    }
    element.removeAttribute('data-kp');
  }

  // Recurse into children
  _hydrateChildren(element, values, instance, commentMap);
}
