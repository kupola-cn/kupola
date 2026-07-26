// SPDX-License-Identifier: MIT

function parseTimeList(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const amount = Number.parseFloat(part);
      if (!Number.isFinite(amount)) {return 0;}
      return part.endsWith('ms') ? amount : amount * 1000;
    });
}

function parseIterationList(value) {
  const iterations = String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      if (part === 'infinite') {return 1;}
      const amount = Number.parseFloat(part);
      return Number.isFinite(amount) ? Math.max(0, amount) : 1;
    });
  return iterations.length > 0 ? iterations : [ 1 ];
}

function maxTimeline(durations, delays, iterations = [ 1 ]) {
  if (durations.length === 0) {return 0;}
  const safeDelays = delays.length > 0 ? delays : [ 0 ];
  const length = Math.max(durations.length, safeDelays.length, iterations.length);
  let maximum = 0;
  for (let index = 0; index < length; index += 1) {
    const duration = durations[index % durations.length];
    const delay = safeDelays[index % safeDelays.length];
    const iterationCount = iterations[index % iterations.length];
    maximum = Math.max(maximum, duration * iterationCount + delay);
  }
  return Math.max(0, maximum);
}

export function getMotionDuration(element) {
  if (!element || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }
  const styles = window.getComputedStyle(element);
  return Math.max(
    maxTimeline(
      parseTimeList(styles.animationDuration),
      parseTimeList(styles.animationDelay),
      parseIterationList(styles.animationIterationCount),
    ),
    maxTimeline(
      parseTimeList(styles.transitionDuration),
      parseTimeList(styles.transitionDelay),
    ),
  );
}
