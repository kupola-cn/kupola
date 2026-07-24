// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the Carousel component.
 * @jest-environment jsdom
 */

import { resetScheduler } from '../../src/index.js';
import { Carousel } from '@kupola/components';

afterEach(() => {
  document.body.innerHTML = '';
  resetScheduler();
});

// ─── Basic rendering ─────────────────────────────────────────────────────────

describe('Carousel rendering', () => {
  test('renders a carousel wrapper', () => {
    const view = Carousel({ items: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    const wrapper = document.body.querySelector('.ds-carousel');
    expect(wrapper).not.toBeNull();
  });

  test('renders correct number of slides', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    const slides = document.body.querySelectorAll('.ds-carousel__item');
    expect(slides.length).toBe(3);
  });

  test('renders prev and next buttons', () => {
    const view = Carousel({ items: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-carousel__prev')).not.toBeNull();
    expect(document.body.querySelector('.ds-carousel__next')).not.toBeNull();
  });

  test('renders indicator dots', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    const dots = document.body.querySelectorAll('.ds-carousel__indicator');
    expect(dots.length).toBe(3);
  });

  test('first indicator is active by default', () => {
    const view = Carousel({ items: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    const firstDot = document.body.querySelector('.ds-carousel__indicator');
    expect(firstDot.classList.contains('is-active')).toBe(true);
  });

  test('track starts at position 0', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('');
  });
});

// ─── Navigation ──────────────────────────────────────────────────────────────

describe('Carousel navigation', () => {
  test('next() moves to next slide', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.next();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-100%)');
  });

  test('prev() wraps to last slide from first', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.prev();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-200%)');
  });

  test('goTo() navigates to specific slide', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.goTo(2);
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-200%)');
  });

  test('next() wraps from last to first', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.goTo(2);
    view.next();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('');
  });

  test('onChange fires on navigation', () => {
    const onChange = jest.fn();
    const view = Carousel({ items: [ 'A', 'B', 'C' ], onChange });
    document.body.appendChild(view.element);

    view.next();
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test('clicking next button advances slide', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    document.body.querySelector('.ds-carousel__next').click();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-100%)');
  });

  test('clicking prev button goes back', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.goTo(1);
    document.body.querySelector('.ds-carousel__prev').click();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('');
  });

  test('clicking indicator dot navigates to slide', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    const dots = document.body.querySelectorAll('.ds-carousel__indicator');
    dots[2].click();
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-200%)');
  });
});

// ─── Indicators ──────────────────────────────────────────────────────────────

describe('Carousel indicators', () => {
  test('indicators update on navigation', () => {
    const view = Carousel({ items: [ 'A', 'B', 'C' ] });
    document.body.appendChild(view.element);

    view.goTo(1);
    const dots = document.body.querySelectorAll('.ds-carousel__indicator');
    expect(dots[0].classList.contains('is-active')).toBe(false);
    expect(dots[1].classList.contains('is-active')).toBe(true);
  });

  test('indicators hidden when showIndicators=false', () => {
    const view = Carousel({ items: [ 'A', 'B' ], showIndicators: false });
    document.body.appendChild(view.element);

    const indicators = document.body.querySelector('.ds-carousel__indicators');
    expect(indicators.style.display).toBe('none');
  });
});

// ─── Arrows ──────────────────────────────────────────────────────────────────

describe('Carousel arrows', () => {
  test('arrows hidden when showArrows=false', () => {
    const view = Carousel({ items: [ 'A', 'B' ], showArrows: false });
    document.body.appendChild(view.element);

    expect(document.body.querySelector('.ds-carousel__prev').style.display).toBe('none');
    expect(document.body.querySelector('.ds-carousel__next').style.display).toBe('none');
  });
});

// ─── Auto-play ───────────────────────────────────────────────────────────────

describe('Carousel auto-play', () => {
  test('auto-play advances slide over time', () => {
    jest.useFakeTimers();
    const view = Carousel({ items: [ 'A', 'B', 'C' ], autoPlay: true, interval: 1000 });
    document.body.appendChild(view.element);

    jest.advanceTimersByTime(1000);
    const track = document.body.querySelector('.ds-carousel__track');
    expect(track.style.transform).toBe('translateX(-100%)');

    jest.advanceTimersByTime(1000);
    expect(track.style.transform).toBe('translateX(-200%)');

    jest.useRealTimers();
  });

  test('destroy stops auto-play', () => {
    jest.useFakeTimers();
    const view = Carousel({ items: [ 'A', 'B' ], autoPlay: true, interval: 1000 });
    document.body.appendChild(view.element);

    view.destroy();
    // Should not throw after destroy
    expect(() => jest.advanceTimersByTime(5000)).not.toThrow();

    jest.useRealTimers();
  });
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

describe('Carousel destroy', () => {
  test('destroy cleans up', () => {
    const view = Carousel({ items: [ 'A', 'B' ] });
    document.body.appendChild(view.element);

    expect(() => view.destroy()).not.toThrow();
  });
});
