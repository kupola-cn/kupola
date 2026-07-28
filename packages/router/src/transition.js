function createAbortController() {
  return typeof AbortController === 'function' ? new AbortController() : null;
}

function getFrameFunctions() {
  if (typeof requestAnimationFrame === 'function') {
    return {
      request: requestAnimationFrame.bind(globalThis),
      cancel: typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame.bind(globalThis)
        : () => {},
    };
  }
  return { request: fn => setTimeout(fn, 0), cancel: clearTimeout };
}

function nextFrame(signal) {
  return new Promise(resolve => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const frame = getFrameFunctions();
    let firstId = null;
    let secondId = null;
    let settled = false;
    const finish = completed => {
      if (settled) {return;}
      settled = true;
      if (firstId !== null) {frame.cancel(firstId);}
      if (secondId !== null) {frame.cancel(secondId);}
      signal?.removeEventListener('abort', onAbort);
      resolve(completed);
    };
    const onAbort = () => finish(false);

    signal?.addEventListener('abort', onAbort, { once: true });
    firstId = frame.request(() => {
      firstId = null;
      if (signal?.aborted) {
        finish(false);
        return;
      }
      secondId = frame.request(() => {
        secondId = null;
        finish(!signal?.aborted);
      });
    });
  });
}

function parseTimeList(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      if (part.endsWith('ms')) {return parseFloat(part) || 0;}
      if (part.endsWith('s')) {return (parseFloat(part) || 0) * 1000;}
      return parseFloat(part) || 0;
    });
}

function getMaxTimeline(durations, delays) {
  if (durations.length === 0) {return 0;}
  const safeDelays = delays.length > 0 ? delays : [ 0 ];
  return durations.reduce((max, duration, index) => {
    return Math.max(max, duration + safeDelays[index % safeDelays.length]);
  }, 0);
}

function getTransitionTimeout(el, configuredDuration) {
  if (configuredDuration !== undefined && configuredDuration !== null) {
    const duration = Number(configuredDuration);
    return Number.isFinite(duration) && duration >= 0 ? duration : 0;
  }
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }

  const styles = window.getComputedStyle(el);
  return Math.max(
    getMaxTimeline(
      parseTimeList(styles.transitionDuration),
      parseTimeList(styles.transitionDelay),
    ),
    getMaxTimeline(
      parseTimeList(styles.animationDuration),
      parseTimeList(styles.animationDelay),
    ),
  );
}

function waitForTransition(el, timeout, signal) {
  return new Promise(resolve => {
    if (signal?.aborted || timeout <= 0) {
      resolve(false);
      return;
    }

    let settled = false;
    let timer = null;
    const finish = completed => {
      if (settled) {return;}
      settled = true;
      clearTimeout(timer);
      el.removeEventListener('transitionend', onEnd);
      el.removeEventListener('animationend', onEnd);
      signal?.removeEventListener('abort', onAbort);
      resolve(completed);
    };
    const onEnd = event => {
      if (event.target === el) {finish(true);}
    };
    const onAbort = () => finish(false);

    el.addEventListener('transitionend', onEnd);
    el.addEventListener('animationend', onEnd);
    signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => finish(true), timeout + 50);
  });
}

function runCustomTransition(hook, el, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (completed, error) => {
      if (settled) {return;}
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      if (error) {
        reject(error);
      } else {
        resolve(completed);
      }
    };
    const done = () => finish(true);
    const onAbort = () => finish(false);

    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const result = hook(el, done);
      if (result && typeof result.then === 'function') {
        Promise.resolve(result).then(done, error => finish(false, error));
      } else if (hook.length < 2) {
        done();
      }
    } catch (error) {
      finish(false, error);
    }
  });
}

function getTransitionClasses(type, config) {
  return type === 'enter'
    ? { from: config.enter, active: config.enterActive, to: config.enterTo }
    : { from: config.leave, active: config.leaveActive, to: config.leaveTo };
}

function removeTransitionClasses(el, classes) {
  el.classList?.remove(classes.from, classes.active, classes.to);
}

async function applyCssTransition(el, type, config, signal) {
  const classes = getTransitionClasses(type, config);
  const timeout = getTransitionTimeout(el, config.duration);
  if (timeout <= 0 || signal?.aborted) {return false;}

  removeTransitionClasses(el, classes);
  el.classList.add(classes.from, classes.active);
  try {
    if (!await nextFrame(signal)) {return false;}
    el.classList.remove(classes.from);
    el.classList.add(classes.to);
    return await waitForTransition(el, timeout, signal);
  } finally {
    removeTransitionClasses(el, classes);
  }
}

export class TransitionManager {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding || {};
    this.controller = null;
  }

  getConfig() {
    const modifiers = this.binding.modifiers || {};
    return {
      enter: modifiers.enterClass || 'router-enter',
      enterActive: modifiers.enterActiveClass || 'router-enter-active',
      enterTo: modifiers.enterToClass || 'router-enter-to',
      leave: modifiers.leaveClass || 'router-leave',
      leaveActive: modifiers.leaveActiveClass || 'router-leave-active',
      leaveTo: modifiers.leaveToClass || 'router-leave-to',
      duration: modifiers.duration,
    };
  }

  getOverrides() {
    const modifiers = this.binding.modifiers || {};
    const config = {};
    const names = {
      enterClass: 'enter',
      enterActiveClass: 'enterActive',
      enterToClass: 'enterTo',
      leaveClass: 'leave',
      leaveActiveClass: 'leaveActive',
      leaveToClass: 'leaveTo',
      duration: 'duration',
    };
    for (const [ modifier, property ] of Object.entries(names)) {
      if (modifiers[modifier] !== undefined) {config[property] = modifiers[modifier];}
    }
    return config;
  }

  async run(type, done) {
    this.controller?.abort();
    const controller = createAbortController();
    this.controller = controller;
    try {
      await applyCssTransition(this.el, type, this.getConfig(), controller?.signal);
      if (!controller?.signal.aborted) {done?.();}
    } finally {
      if (this.controller === controller) {this.controller = null;}
    }
  }

  enter(done) {
    return this.run('enter', done);
  }

  leave(done) {
    return this.run('leave', done);
  }

  destroy() {
    this.controller?.abort();
    this.controller = null;
    const config = this.getConfig();
    removeTransitionClasses(this.el, getTransitionClasses('enter', config));
    removeTransitionClasses(this.el, getTransitionClasses('leave', config));
  }
}

export function createTransitionManager(el, binding) {
  return new TransitionManager(el, binding);
}

export async function applyTransition(el, type, routeTransition = {}, signal) {
  if (!el || ![ 'enter', 'leave' ].includes(type) || signal?.aborted) {return false;}

  const transition = routeTransition || {};
  const hook = type === 'enter' ? transition.onEnter : transition.onLeave;
  if (typeof hook === 'function') {
    return runCustomTransition(hook, el, signal);
  }

  const config = {
    enter: transition.enterClass || 'k-router-enter',
    enterActive: transition.enterActiveClass || 'k-router-enter-active',
    enterTo: transition.enterToClass || 'k-router-enter-to',
    leave: transition.leaveClass || 'k-router-leave',
    leaveActive: transition.leaveActiveClass || 'k-router-leave-active',
    leaveTo: transition.leaveToClass || 'k-router-leave-to',
    duration: transition.duration,
  };
  return applyCssTransition(el, type, config, signal);
}
