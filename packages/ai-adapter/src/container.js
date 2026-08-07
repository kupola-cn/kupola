// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Dependency Injection Container
 *
 * 轻量级 DI 容器，支持单例和工厂模式。
 * 提供依赖解析、生命周期管理和替换能力。
 *
 * 生命周期钩子：
 * - onCreate: 服务实例创建后调用
 * - onDestroy: 服务实例销毁前调用
 * - onContainerDestroy: 容器销毁时调用所有服务的 onDestroy
 */

export class Container {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
    this._onContainerDestroy = [];
  }

  register(name, Service, options = {}) {
    if (this.services.has(name)) {
      throw new Error(`Service already registered: ${name}`);
    }
    this.services.set(name, { Service, options });
  }

  registerInstance(name, instance) {
    this.instances.set(name, instance);
    this.services.set(name, { Service: () => instance, options: { singleton: true } });
  }

  onCreate(name, callback) {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }
    entry.options.onCreate = callback;
  }

  onDestroy(name, callback) {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }
    entry.options.onDestroy = callback;
  }

  onContainerDestroy(callback) {
    this._onContainerDestroy.push(callback);
    return () => {
      const idx = this._onContainerDestroy.indexOf(callback);
      if (idx >= 0) {this._onContainerDestroy.splice(idx, 1);}
    };
  }

  resolve(name, overrides = {}, _resolving = new Set()) {
    if (_resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${[ ..._resolving, name ].join(' → ')}`);
    }

    if (overrides[name]) {
      return overrides[name];
    }

    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Unknown service: ${name}`);
    }

    _resolving.add(name);

    const { Service, options } = entry;
    let instance;

    if (options.singleton) {
      instance = this._createInstance(Service, options, _resolving);
      this.instances.set(name, instance);
      this._invokeOnCreate(name, instance, options);
      return instance;
    }

    instance = this._createInstance(Service, options, _resolving);
    this._invokeOnCreate(name, instance, options);
    return instance;
  }

  _createInstance(Service, options, _resolving) {
    if (options.factory) {
      return options.factory(this);
    }

    if (options.dependencies) {
      const deps = options.dependencies.map(dep => this.resolve(dep, {}, _resolving));
      return new Service(...deps);
    }

    return new Service();
  }

  _invokeOnCreate(name, instance, options) {
    if (typeof options.onCreate === 'function') {
      try {
        options.onCreate(instance, name);
      } catch (err) {
        console.error(`Container: onCreate hook failed for ${name}:`, err);
      }
    }
  }

  _invokeOnDestroy(name, instance, options) {
    if (typeof options.onDestroy === 'function') {
      try {
        options.onDestroy(instance, name);
      } catch (err) {
        console.error(`Container: onDestroy hook failed for ${name}:`, err);
      }
    }
  }

  has(name) {
    return this.services.has(name);
  }

  clear() {
    for (const [ name, instance ] of this.instances) {
      const entry = this.services.get(name);
      if (entry && entry.options) {
        this._invokeOnDestroy(name, instance, entry.options);
      }
    }

    for (const callback of this._onContainerDestroy) {
      try {
        callback();
      } catch (err) {
        console.error('Container: onContainerDestroy hook failed:', err);
      }
    }

    this.services.clear();
    this.instances.clear();
    this._onContainerDestroy = [];
  }
}
