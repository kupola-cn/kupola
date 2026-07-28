// Shared reference-counted body scroll lock for overlay components.
let lockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined' || !document.body) {
    return () => {};
  }

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0,
      (window.innerWidth || 0) - (document.documentElement?.clientWidth || 0));
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle?.(document.body)?.paddingRight)
        || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }
  lockCount++;
  document.body.style.overflow = 'hidden';

  let released = false;
  return () => {
    if (released) {return;}
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0 && document.body) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previousOverflow = '';
      previousPaddingRight = '';
    }
  };
}
