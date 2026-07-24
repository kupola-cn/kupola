// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Avatar component built on the 2.0 reactive core.
 *
 * Reuses the existing `ds-avatar*` CSS classes for styling.
 *
 * ```js
 * import { Avatar } from '@kupola/components/avatar';
 *
 * const view = Avatar({ text: 'JD', size: 'lg', accent: true });
 * container.appendChild(view.element);
 *
 * // With image
 * const imgView = Avatar({ src: 'photo.jpg', alt: 'John Doe' });
 * container.appendChild(imgView.element);
 * ```
 *
 * @module components/avatar
 */

import { html } from '@kupola/core';
import { render } from '@kupola/core';

/**
 * Create an Avatar component instance.
 *
 * @param {Object} [options]
 * @param {string} [options.text]    Text to display (initials)
 * @param {string} [options.src]     Image source URL
 * @param {string} [options.alt]     Image alt text
 * @param {string} [options.size]    'sm'|'default'|'lg' (default 'default')
 * @param {string} [options.shape]   'circle'|'square' (default 'circle')
 * @param {boolean}[options.accent]  Use brand accent background
 * @returns {{ element: DocumentFragment, destroy: Function }}
 */
export function Avatar(options = {}) {
  const {
    text = '',
    src = '',
    alt = '',
    size = 'default',
    shape = 'circle',
    accent = false,
  } = options;

  // ── Public API ─────────────────────────────────────────────────────────────

  function destroy() {
    instance.destroy();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const classes = [ 'ds-avatar' ];
  if (size === 'sm') {classes.push('ds-avatar--sm');}
  if (size === 'lg') {classes.push('ds-avatar--lg');}
  if (shape === 'square') {classes.push('ds-avatar--square');}
  if (accent) {classes.push('ds-avatar--accent');}

  const classStr = classes.join(' ');

  const tpl = html`<div class="${classStr}"></div>`;

  const container = document.createDocumentFragment();
  const instance = render(tpl, container);

  const avatarEl = container.querySelector('.ds-avatar');

  // Set content: image or text
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || text || 'avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = 'inherit';
    avatarEl.appendChild(img);
  } else if (text) {
    avatarEl.textContent = text;
  }

  return {
    get element() { return container; },
    destroy,
  };
}
