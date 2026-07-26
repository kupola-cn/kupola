// Shared reference-counted body scroll lock for overlay components.
let lockCount = 0;
let previousOverflow = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined' || !document.body) {
    return () => {};
  }

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
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
      previousOverflow = '';
    }
  };
}
