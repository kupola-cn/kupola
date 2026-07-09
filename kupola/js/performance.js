class KupolaPerformance {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.observers = [];
    this.enabled = false;
    this.thresholds = {
      render: 16,
      mount: 100,
      update: 50,
      http: 3000
    };
  }

  init() {
    this.enabled = true;
    this._setupObservers();
    this._measureNavigation();
  }

  _setupObservers() {
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          this._recordMetric('paint', {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration
          });
        });
      });
      paintObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(paintObserver);

      const resourceObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          this._recordMetric('resource', {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
            startTime: entry.startTime
          });
        });
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.push(resourceObserver);

      const longTaskObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          this._recordMetric('longtask', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        });
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      this.observers.push(longTaskObserver);
    }
  }

  _measureNavigation() {
    if ('performance' in window) {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        this._recordMetric('navigation', {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
          load: nav.loadEventEnd - nav.fetchStart,
          firstByte: nav.responseStart - nav.requestStart,
          redirectCount: nav.redirectCount
        });
      }
    }
  }

  startTimer(name, context = {}) {
    if (!this.enabled) return;
    
    this.timers.set(name, {
      startTime: performance.now(),
      context
    });
  }

  stopTimer(name) {
    if (!this.enabled) return null;
    
    const timer = this.timers.get(name);
    if (!timer) return null;
    
    const duration = performance.now() - timer.startTime;
    this.timers.delete(name);
    
    this._recordMetric('timer', {
      name,
      duration,
      ...timer.context
    });

    return duration;
  }

  _recordMetric(type, data) {
    if (!this.enabled) return;
    
    const metric = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type).push(metric);
  }

  measure(fn, name, context = {}) {
    if (!this.enabled) return fn();
    
    this.startTimer(name, context);
    
    let result;
    let error;
    
    try {
      result = fn();
    } catch (e) {
      error = e;
    }
    
    const duration = this.stopTimer(name);
    
    if (error) {
      throw error;
    }
    
    return result;
  }

  measureAsync(fn, name, context = {}) {
    if (!this.enabled) return fn();
    
    this.startTimer(name, context);
    
    return fn().then(result => {
      this.stopTimer(name);
      return result;
    }).catch(error => {
      this.stopTimer(name);
      throw error;
    });
  }

  getMetrics(type) {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Array.from(this.metrics.entries());
  }

  getSummary() {
    const summary = {
      navigation: null,
      paint: null,
      timers: [],
      resources: [],
      longTasks: []
    };

    if (this.metrics.has('navigation')) {
      summary.navigation = this.metrics.get('navigation')[0];
    }
    
    if (this.metrics.has('paint')) {
      summary.paint = this.metrics.get('paint');
    }
    
    if (this.metrics.has('timer')) {
      summary.timers = this.metrics.get('timer');
    }
    
    if (this.metrics.has('resource')) {
      summary.resources = this.metrics.get('resource');
    }
    
    if (this.metrics.has('longtask')) {
      summary.longTasks = this.metrics.get('longtask');
    }

    return summary;
  }

  getPerformanceScore() {
    const summary = this.getSummary();
    let score = 100;
    
    if (summary.navigation) {
      if (summary.navigation.load > 3000) score -= 20;
      else if (summary.navigation.load > 2000) score -= 10;
      
      if (summary.navigation.domContentLoaded > 1500) score -= 15;
      else if (summary.navigation.domContentLoaded > 1000) score -= 5;
    }
    
    if (summary.paint) {
      const fcp = summary.paint.find(p => p.name === 'first-contentful-paint');
      if (fcp && fcp.startTime > 2000) score -= 20;
      else if (fcp && fcp.startTime > 1000) score -= 10;
    }
    
    if (summary.longTasks.length > 0) {
      score -= summary.longTasks.length * 10;
    }
    
    return Math.max(0, score);
  }

  logSummary() {
    const summary = this.getSummary();
    const score = this.getPerformanceScore();
    
    console.group('[KupolaPerformance] Summary');
    console.log('Score:', score);
    console.log('Navigation:', summary.navigation);
    console.log('Paint:', summary.paint);
    console.log('Long Tasks:', summary.longTasks.length);
    console.groupEnd();
  }

  clear() {
    this.metrics.clear();
    this.timers.clear();
  }

  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
    this.clear();
    this.enabled = false;
  }
}

const kupolaPerformance = new KupolaPerformance();
window.kupolaPerformance = kupolaPerformance;
window.KupolaPerformance = KupolaPerformance;

export default KupolaPerformance;