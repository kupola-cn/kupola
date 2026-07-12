/**
 * Kupola Web Components — Custom Elements wrapper for core Kupola components.
 *
 * Usage:
 *   import { registerWebComponents } from '@kupola/kupola';
 *   registerWebComponents();
 *
 *   Then in HTML:
 *   <k-dropdown>
 *     <button slot="trigger">Open</button>
 *     <a slot="item">Option A</a>
 *     <a slot="item">Option B</a>
 *   </k-dropdown>
 *
 *   <k-tooltip title="Hello!">
 *     <button>Hover me</button>
 *   </k-tooltip>
 *
 *   <k-collapse>
 *     <k-collapse-item title="Section 1">Content 1</k-collapse-item>
 *     <k-collapse-item title="Section 2">Content 2</k-collapse-item>
 *   </k-collapse>
 */

let registered = false;

/**
 * <k-dropdown> — Wraps Kupola dropdown
 * Slots: trigger (button), item (menu items)
 */
class KupolaDropdownElement extends HTMLElement {
  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this._render();
  }

  _render() {
    const trigger = this.querySelector('[slot="trigger"]');
    const items = this.querySelectorAll('[slot="item"]');

    // Build dropdown DOM structure
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-dropdown';
    wrapper.setAttribute('data-dropdown', '');

    if (trigger) {
      trigger.setAttribute('class', (trigger.getAttribute('class') || '') + ' ds-dropdown__trigger');
      wrapper.appendChild(trigger);
    }

    const menu = document.createElement('div');
    menu.className = 'ds-dropdown__menu';
    items.forEach(item => {
      item.className = 'ds-dropdown__item';
      menu.appendChild(item);
    });
    wrapper.appendChild(menu);

    this.innerHTML = '';
    this.appendChild(wrapper);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'open') {
      const menu = this.querySelector('.ds-dropdown__menu');
      if (menu) menu.style.display = newVal !== null ? 'block' : '';
    }
  }
}

/**
 * <k-tooltip title="text"> — Wraps Kupola tooltip
 * Default slot: the trigger element
 */
class KupolaTooltipElement extends HTMLElement {
  static get observedAttributes() { return ['title', 'position']; }

  connectedCallback() {
    const trigger = this.firstElementChild;
    if (trigger) {
      trigger.setAttribute('data-title', this.getAttribute('title') || '');
      if (this.getAttribute('position')) {
        trigger.setAttribute('data-tooltip-position', this.getAttribute('position'));
      }
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'title') {
      const trigger = this.firstElementChild;
      if (trigger) trigger.setAttribute('data-title', newVal || '');
    }
  }
}

/**
 * <k-collapse> — Wraps Kupola collapse/accordion
 * Children: <k-collapse-item title="...">content</k-collapse-item>
 */
class KupolaCollapseElement extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-collapse';
    wrapper.setAttribute('data-collapse', '');

    const items = this.querySelectorAll('k-collapse-item');
    items.forEach(item => {
      const title = item.getAttribute('title') || '';
      const content = item.innerHTML;

      const collapseItem = document.createElement('div');
      collapseItem.className = 'ds-collapse__item';
      collapseItem.innerHTML = `
        <button class="ds-collapse__header">
          <span>${title}</span>
          <svg class="icon ds-collapse__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="ds-collapse__body"><div class="ds-collapse__content">${content}</div></div>
      `;
      wrapper.appendChild(collapseItem);
    });

    this.innerHTML = '';
    this.appendChild(wrapper);
  }
}

/**
 * <k-collapse-item title="..."> — Child of <k-collapse>
 * Not registered as a standalone custom element, just a data container.
 */
class KupolaCollapseItemElement extends HTMLElement {
  static get observedAttributes() { return ['title']; }
  // Content is read by parent <k-collapse> during its connectedCallback
}

/**
 * <k-drawer> — Wraps Kupola drawer
 * Attributes: position (left|right|top|bottom), open
 */
class KupolaDrawerElement extends HTMLElement {
  static get observedAttributes() { return ['position', 'open']; }

  connectedCallback() {
    this._render();
  }

  _render() {
    const position = this.getAttribute('position') || 'left';
    const wrapper = document.createElement('div');
    wrapper.className = `ds-drawer ds-drawer--${position}`;
    wrapper.setAttribute('data-drawer', '');
    wrapper.innerHTML = this.innerHTML;
    this.innerHTML = '';
    this.appendChild(wrapper);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'open') {
      const drawer = this.querySelector('.ds-drawer');
      if (drawer) {
        drawer.classList.toggle('is-open', newVal !== null);
      }
    }
  }
}

/**
 * <k-modal> — Wraps Kupola modal dialog
 * Attributes: title, open
 */
class KupolaModalElement extends HTMLElement {
  static get observedAttributes() { return ['title', 'open']; }

  connectedCallback() {
    this._render();
  }

  _render() {
    const title = this.getAttribute('title') || '';
    const wrapper = document.createElement('div');
    wrapper.className = 'ds-backdrop';
    wrapper.style.display = 'none';
    wrapper.innerHTML = `
      <div class="ds-dialog">
        <div class="ds-dialog__head">
          <span class="ds-dialog__title">${title}</span>
          <button class="ds-dialog__close" aria-label="Close">
            <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="ds-dialog__body"></div>
        <div class="ds-dialog__foot"></div>
      </div>
    `;

    // Move slotted content into dialog body
    const body = wrapper.querySelector('.ds-dialog__body');
    const content = this.querySelector('[slot="body"]');
    if (content) {
      body.appendChild(content);
    }

    // Move footer content
    const foot = wrapper.querySelector('.ds-dialog__foot');
    const footer = this.querySelector('[slot="footer"]');
    if (footer) {
      foot.appendChild(footer);
    }

    // Close button handler
    const closeBtn = wrapper.querySelector('.ds-dialog__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    // Backdrop click handler
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper) this.close();
    });

    this.innerHTML = '';
    this.appendChild(wrapper);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'open') {
      const backdrop = this.querySelector('.ds-backdrop');
      if (backdrop) {
        backdrop.style.display = newVal !== null ? 'flex' : 'none';
      }
    }
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }
}

/**
 * Register all Kupola Web Components.
 * Safe to call multiple times — will only register once.
 */
export function registerWebComponents() {
  if (registered || typeof customElements === 'undefined') return;
  registered = true;

  const components = [
    ['k-dropdown', KupolaDropdownElement],
    ['k-tooltip', KupolaTooltipElement],
    ['k-collapse', KupolaCollapseElement],
    ['k-collapse-item', KupolaCollapseItemElement],
    ['k-drawer', KupolaDrawerElement],
    ['k-modal', KupolaModalElement]
  ];

  for (const [tag, cls] of components) {
    if (!customElements.get(tag)) {
      customElements.define(tag, cls);
    }
  }
}

export {
  KupolaDropdownElement,
  KupolaTooltipElement,
  KupolaCollapseElement,
  KupolaCollapseItemElement,
  KupolaDrawerElement,
  KupolaModalElement
};
