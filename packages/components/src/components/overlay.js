// SPDX-License-Identifier: MIT
/**
 * Own modal instances in one place so pages do not append or destroy overlays.
 */

import { Modal } from './modal.js';
import { inject, provide } from '@kupola/platform';

export const OVERLAY_KEY = Symbol('kupola.overlay');

export function createOverlay() {
  const handles = new Set();

  function openModal(options = {}, children = null) {
    let modal;
    let mask = null;
    let disposed = false;
    let handle;
    const userOnClose = options.onClose;

    const dispose = () => {
      if (disposed) {return;}
      disposed = true;
      handles.delete(handle);
      let firstError;
      try {
        modal.destroy();
      } catch (error) {
        firstError = error;
      } finally {
        mask?.remove();
      }
      if (firstError) {throw firstError;}
    };

    modal = Modal({
      ...options,
      onClose: () => {
        try {
          userOnClose?.();
        } finally {
          queueMicrotask(dispose);
        }
      },
    }, children);

    const fragment = modal.element;
    mask = fragment.querySelector('.ds-modal-mask');
    document.body.appendChild(fragment);
    handle = Object.freeze({
      get element() { return mask; },
      close: dispose,
      destroy: dispose,
    });
    handles.add(handle);
    modal.open();
    return handle;
  }

  return Object.freeze({
    openModal,
    destroy() {
      for (const handle of [ ...handles ]) {
        handle.destroy();
      }
    },
  });
}

export function createOverlayPlugin() {
  let overlay = null;

  return {
    install() {
      overlay = createOverlay();
      provide(OVERLAY_KEY, overlay);
    },
    destroy() {
      overlay?.destroy();
      overlay = null;
    },
  };
}

export function useOverlay() {
  const overlay = inject(OVERLAY_KEY, null);
  if (!overlay) {
    throw new Error('[kupola/components] No overlay plugin is installed. Call app.use(createOverlayPlugin()).');
  }
  return overlay;
}
