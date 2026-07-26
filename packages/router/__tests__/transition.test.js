import { applyTransition, createTransitionManager } from '../src/transition.js';

describe('router transitions', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('switches from enter classes on the next frame and finishes on the element event', async () => {
    jest.useFakeTimers();
    const el = document.createElement('div');
    const transition = applyTransition(el, 'enter', { duration: 100 });

    expect(el.classList.contains('k-router-enter')).toBe(true);
    expect(el.classList.contains('k-router-enter-active')).toBe(true);

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(el.classList.contains('k-router-enter')).toBe(false);
    expect(el.classList.contains('k-router-enter-to')).toBe(true);

    el.dispatchEvent(new Event('transitionend'));
    await transition;

    expect(el.className).toBe('');
  });

  it('ignores completion events bubbled from descendants', async () => {
    jest.useFakeTimers();
    const el = document.createElement('div');
    const child = document.createElement('span');
    el.appendChild(child);
    let settled = false;
    const transition = applyTransition(el, 'leave', { duration: 100 })
      .then(() => {settled = true;});

    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    child.dispatchEvent(new Event('transitionend', { bubbles: true }));
    await Promise.resolve();
    expect(settled).toBe(false);

    el.dispatchEvent(new Event('transitionend'));
    await transition;
    expect(settled).toBe(true);
  });

  it('supports promise-based custom hooks without requiring done()', async () => {
    const hook = jest.fn(async el => {
      await Promise.resolve();
      el.dataset.entered = 'true';
    });
    const el = document.createElement('div');

    await expect(applyTransition(el, 'enter', { onEnter: hook })).resolves.toBe(true);
    expect(el.dataset.entered).toBe('true');
  });

  it('cancels pending work and removes classes on destroy', async () => {
    jest.useFakeTimers();
    const el = document.createElement('div');
    const manager = createTransitionManager(el, { modifiers: { duration: 100 } });
    const transition = manager.enter();

    expect(el.classList.contains('router-enter-active')).toBe(true);
    manager.destroy();
    await transition;

    expect(el.className).toBe('');
    expect(jest.getTimerCount()).toBe(0);
  });
});
