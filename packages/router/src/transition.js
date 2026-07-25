export class TransitionManager {
  constructor(el, binding) {
    this.el = el;
    this.binding = binding;
    this.transitionClasses = {
      enter: binding.modifiers.enterClass || 'router-enter',
      enterActive: binding.modifiers.enterActiveClass || 'router-enter-active',
      enterTo: binding.modifiers.enterToClass || 'router-enter-to',
      leave: binding.modifiers.leaveClass || 'router-leave',
      leaveActive: binding.modifiers.leaveActiveClass || 'router-leave-active',
      leaveTo: binding.modifiers.leaveToClass || 'router-leave-to',
    };
  }
  
  async enter(done) {
    const { enter, enterActive, enterTo } = this.transitionClasses;
    
    this.el.classList.add(enter, enterActive);
    
    await this.awaitTransition();
    
    this.el.classList.remove(enter);
    this.el.classList.add(enterTo);
    
    await this.awaitTransition();
    
    this.el.classList.remove(enterActive, enterTo);
    
    if (done) done();
  }
  
  async leave(done) {
    const { leave, leaveActive, leaveTo } = this.transitionClasses;
    
    this.el.classList.add(leave, leaveActive);
    
    await this.awaitTransition();
    
    this.el.classList.remove(leave);
    this.el.classList.add(leaveTo);
    
    await this.awaitTransition();
    
    this.el.classList.remove(leaveActive, leaveTo);
    
    if (done) done();
  }
  
  awaitTransition() {
    return new Promise(resolve => {
      const duration = this.binding.modifiers.duration || 300;
      setTimeout(resolve, duration);
    });
  }
  
  destroy() {}
}

export function createTransitionManager(el, binding) {
  return new TransitionManager(el, binding);
}

export async function applyTransition(el, type, routeTransition = {}) {
  if (!el || !type) return;
  
  const defaultClasses = {
    enter: 'k-router-enter',
    enterActive: 'k-router-enter-active',
    enterTo: 'k-router-enter-to',
    leave: 'k-router-leave',
    leaveActive: 'k-router-leave-active',
    leaveTo: 'k-router-leave-to',
  };
  
  const classes = { ...defaultClasses, ...routeTransition };
  
  if (type === 'enter') {
    if (routeTransition.onEnter) {
      return new Promise(resolve => {
        routeTransition.onEnter(el, resolve);
      });
    }
    
    el.classList.add(classes.enter, classes.enterActive);
    
    await awaitTransition(el, routeTransition.duration);
    
    el.classList.remove(classes.enter);
    el.classList.add(classes.enterTo);
    
    await awaitTransition(el, routeTransition.duration);
    
    el.classList.remove(classes.enterActive, classes.enterTo);
  } else if (type === 'leave') {
    if (routeTransition.onLeave) {
      return new Promise(resolve => {
        routeTransition.onLeave(el, resolve);
      });
    }
    
    el.classList.add(classes.leave, classes.leaveActive);
    
    await awaitTransition(el, routeTransition.duration);
    
    el.classList.remove(classes.leave);
    el.classList.add(classes.leaveTo);
    
    await awaitTransition(el, routeTransition.duration);
    
    el.classList.remove(classes.leaveActive, classes.leaveTo);
  }
}

function awaitTransition(el, duration = 300) {
  return new Promise(resolve => {
    if (!el) {
      resolve();
      return;
    }
    
    const computedStyle = window.getComputedStyle(el);
    const transitionDuration = computedStyle.transitionDuration || computedStyle.animationDuration;
    
    let waitTime = duration;
    if (transitionDuration && transitionDuration !== '0s') {
      const match = transitionDuration.match(/([\d.]+)/);
      if (match) {
        waitTime = parseFloat(match[1]) * 1000;
      }
    }
    
    setTimeout(resolve, waitTime);
  });
}
