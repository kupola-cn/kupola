export interface OverlayHandle {
  readonly element: Element | null;
  close(): void;
  destroy(): void;
}

export interface OverlayService {
  openModal(options?: Record<string, any>, children?: any): OverlayHandle;
  destroy(): void;
}

export const OVERLAY_KEY: unique symbol;
export function createOverlay(): OverlayService;
export function createOverlayPlugin(): { install(): void; destroy(): void };
export function useOverlay(): OverlayService;
