var P = { exports: {} }, pt;
function Ft() {
  return pt || (pt = 1, function(s) {
    class t {
      constructor(o) {
        this.element = o, this.isMounted = !1, this.isDestroyed = !1, this.props = this._parseProps(), this.state = {}, this.slots = this._parseSlots(), this._eventListeners = {}, this._appliedMixins = [], this.lifecycle = window.KupolaLifecycle ? new window.KupolaLifecycle() : {
          on: () => () => {
          },
          emit: () => {
          },
          bootstrap: () => {
          },
          mount: () => {
          },
          update: () => {
          },
          unmount: () => {
          },
          destroy: () => {
          },
          state: "created"
        }, this.setupContext = null;
      }
      _parseProps() {
        const o = {};
        for (const n of this.element.attributes)
          if (n.name.startsWith("data-prop-")) {
            const i = n.name.replace("data-prop-", "");
            let a = n.value;
            try {
              a = JSON.parse(a);
            } catch {
            }
            o[i] = a;
          }
        return o;
      }
      _parseSlots() {
        const o = {};
        return this.element.querySelectorAll("[data-slot]").forEach((i) => {
          const a = i.getAttribute("data-slot") || "default";
          o[a] = i.innerHTML.trim(), i.remove();
        }), !o.default && this.element.children.length > 0 && (o.default = this.element.innerHTML.trim()), o;
      }
      $slot(o = "default") {
        return this.slots[o] || "";
      }
      $emit(o, n) {
        if ((this._eventListeners[o] || []).forEach((a) => {
          try {
            a(n);
          } catch (l) {
            console.error(`Error in event handler for ${o}:`, l);
          }
        }), this.element) {
          const a = new CustomEvent(`kupola:${o}`, {
            detail: n,
            bubbles: !0,
            cancelable: !0
          });
          this.element.dispatchEvent(a);
        }
      }
      $on(o, n) {
        return this._eventListeners[o] || (this._eventListeners[o] = []), this._eventListeners[o].push(n), n;
      }
      $off(o, n) {
        this._eventListeners[o] && (this._eventListeners[o] = this._eventListeners[o].filter((i) => i !== n));
      }
      async setProps(o) {
        try {
          this.props = { ...this.props, ...o }, await this.lifecycle.update(), this.setupContext?._executeUpdated();
        } catch (n) {
          console.error(`[KupolaComponent] Error in setProps for "${this.constructor.name}":`, n), this.lifecycle && typeof this.lifecycle._handleError == "function" && await this.lifecycle._handleError({ phase: "update", hook: "setProps", error: n, args: [o] });
        }
      }
      async setState(o) {
        try {
          this.state = { ...this.state, ...o }, await this.lifecycle.update(), this.setupContext?._executeUpdated();
        } catch (n) {
          console.error(`[KupolaComponent] Error in setState for "${this.constructor.name}":`, n), this.lifecycle && typeof this.lifecycle._handleError == "function" && await this.lifecycle._handleError({ phase: "update", hook: "setState", error: n, args: [o] });
        }
      }
      async mount() {
        if (!(this.isMounted || this.isDestroyed))
          try {
            if (this._bindLifecycleHooks(), await this.lifecycle.bootstrap(), window._setCurrentSetupContext && window.SetupContext && (this.setupContext = new window.SetupContext(this), window._setCurrentSetupContext(this.setupContext), typeof this.setup == "function")) {
              const o = this.setup();
              o instanceof Promise && await o;
            }
            this.isMounted = !0, await this.lifecycle.mount(), this.setupContext?._executeMounted(), window._clearSetupContext && window._clearSetupContext();
          } catch (o) {
            if (console.error(`[KupolaComponent] Error mounting component "${this.constructor.name}":`, o), this.lifecycle && typeof this.lifecycle._handleError == "function" && await this.lifecycle._handleError({ phase: "mount", hook: "component", error: o, args: [] }), typeof this.renderError == "function")
              try {
                this.renderError(o);
              } catch (n) {
                console.error(`[KupolaComponent] Error in renderError for "${this.constructor.name}":`, n);
              }
            else
              this.element.innerHTML = `
          <div style="padding: 16px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <div style="font-weight: bold; margin-bottom: 8px;">Component Error</div>
            <div style="font-size: 12px; white-space: pre-wrap;">${o.message}</div>
          </div>
        `;
          }
      }
      _bindLifecycleHooks() {
        if (this._hooksBound) return;
        const o = {
          beforeMount: "beforeMount",
          render: ["mount", "update"],
          afterMount: "afterMount",
          updated: "afterUpdate",
          beforeUnmount: "beforeUnmount",
          afterUnmount: "afterUnmount",
          renderError: "errorBoundary"
        };
        let n = Object.getPrototypeOf(this);
        const i = /* @__PURE__ */ new Set();
        for (; n && n.constructor !== Object && n.constructor !== t; ) {
          for (const [a, l] of Object.entries(o))
            i.has(a) || n.hasOwnProperty(a) && (Array.isArray(l) ? l.forEach((c) => {
              a === "render" && this.lifecycle.on(c, () => this.render?.());
            }) : a === "renderError" ? this.lifecycle.on(l, (c) => (this.renderError(c.error), "handled")) : this.lifecycle.on(l, () => this[a]?.()), i.add(a));
          n = Object.getPrototypeOf(n);
        }
        this._hooksBound = !0;
      }
      async unmount() {
        if (!(!this.isMounted || this.isDestroyed))
          try {
            this.setupContext?._executeUnmounted(), await this.lifecycle.unmount(), this.isMounted = !1, this.isDestroyed = !0, await this.lifecycle.destroy();
          } catch (o) {
            console.error(`[KupolaComponent] Error unmounting component "${this.constructor.name}":`, o), this.lifecycle && typeof this.lifecycle._handleError == "function" && await this.lifecycle._handleError({ phase: "unmount", hook: "component", error: o, args: [] }), this.isMounted = !1, this.isDestroyed = !0;
          }
      }
      beforeMount() {
      }
      afterMount() {
      }
      beforeUnmount() {
      }
      afterUnmount() {
      }
      render() {
      }
      renderError(o) {
      }
      updated() {
      }
      setup() {
      }
    }
    function e(r, o) {
      Object.keys(o).forEach((n) => {
        if (n !== "constructor")
          if (typeof o[n] == "function") {
            const i = r.prototype[n];
            i ? r.prototype[n] = function(...a) {
              return o[n].apply(this, a), i.apply(this, a);
            } : r.prototype[n] = o[n];
          } else
            r.prototype[n] = o[n];
      });
    }
    s.exports ? s.exports = { KupolaComponent: t, applyMixin: e } : (window.KupolaComponent = t, window.applyMixin = e);
  }(P)), P.exports;
}
Ft();
var $ = { exports: {} }, ft;
function Ot() {
  return ft || (ft = 1, function(s) {
    class t {
      constructor() {
        this.components = /* @__PURE__ */ new Map(), this.lazyComponents = /* @__PURE__ */ new Map(), this.loadedComponents = /* @__PURE__ */ new Map(), this.instances = /* @__PURE__ */ new Map(), this.observer = null, this.mixins = /* @__PURE__ */ new Map(), this.loadingPromises = /* @__PURE__ */ new Map();
      }
      register(r, o) {
        if (!(o.prototype instanceof window.KupolaComponent))
          throw new Error(`Component ${r} must extend KupolaComponent`);
        this.components.set(r, o);
      }
      registerLazy(r, o) {
        this.lazyComponents.set(r, o);
      }
      unregister(r) {
        this.components.delete(r), this.lazyComponents.delete(r), this.loadedComponents.delete(r), this.loadingPromises.delete(r);
      }
      get(r) {
        return this.components.get(r) || this.loadedComponents.get(r);
      }
      async getAsync(r) {
        const o = this.components.get(r) || this.loadedComponents.get(r);
        if (o) return o;
        if (this.loadingPromises.has(r))
          return this.loadingPromises.get(r);
        const n = this.lazyComponents.get(r);
        if (!n)
          throw new Error(`Component ${r} not found`);
        const i = (async () => {
          try {
            const a = await n(), l = a.default || a;
            if (!(l.prototype instanceof window.KupolaComponent))
              throw new Error(`Component ${r} must extend KupolaComponent`);
            return this.loadedComponents.set(r, l), l;
          } catch (a) {
            throw this.loadingPromises.delete(r), a;
          }
        })();
        return this.loadingPromises.set(r, i), i;
      }
      defineMixin(r, o) {
        this.mixins.set(r, o);
      }
      useMixin(r, ...o) {
        o.forEach((n) => {
          const i = this.mixins.get(n);
          i && window.applyMixin && window.applyMixin(r, i);
        });
      }
      async bootstrap(r = document) {
        await this._upgradeElements(r), this._startObserver(r);
      }
      async _upgradeElements(r) {
        const o = r.querySelectorAll("[data-component]"), n = [];
        o.forEach((i) => {
          n.push(this._upgradeElement(i));
        }), await Promise.all(n);
      }
      async _upgradeElement(r) {
        if (!(r.__kupolaInstance || r.__kupolaUpgrading)) {
          r.__kupolaUpgrading = !0;
          try {
            const o = r.getAttribute("data-component");
            if (window.kupolaInitializer && o) {
              const c = window.kupolaInitializer.get(o);
              if (c)
                try {
                  await c(r);
                  return;
                } catch (h) {
                  console.warn(`[KupolaComponentRegistry] Initializer for "${o}" failed, trying component class:`, h);
                }
            }
            let n = this.components.get(o);
            if (!n) {
              try {
                n = await this.getAsync(o);
              } catch (c) {
                console.error(`Failed to load component ${o}:`, c);
                return;
              }
              if (!r.isConnected)
                return;
            }
            const i = r.getAttribute("data-mixins"), a = n;
            i && window.applyMixin && i.split(",").forEach((c) => {
              const h = this.mixins.get(c.trim());
              h && window.applyMixin(a, h);
            });
            const l = new a(r);
            r.__kupolaInstance = l, this.instances.set(r, l), l.mount();
          } finally {
            r.__kupolaUpgrading = !1;
          }
        }
      }
      _startObserver(r) {
        this.observer || (this.observer = new MutationObserver((o) => {
          o.forEach((n) => {
            n.addedNodes.forEach((i) => {
              i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute("data-component") && this._upgradeElement(i).catch((a) => console.error(a)), this._upgradeElements(i).catch((a) => console.error(a)));
            }), n.removedNodes.forEach((i) => {
              if (i.nodeType === Node.ELEMENT_NODE) {
                const a = this.instances.get(i);
                a && (a.unmount(), this.instances.delete(i)), i.querySelectorAll("[data-component]").forEach((l) => {
                  const c = this.instances.get(l);
                  c && (c.unmount(), this.instances.delete(l));
                });
              }
            });
          });
        }), this.observer.observe(r, {
          childList: !0,
          subtree: !0
        }));
      }
      destroy() {
        this.observer && (this.observer.disconnect(), this.observer = null), this.instances.forEach((r) => {
          r.unmount();
        }), this.instances.clear(), this.components.clear(), this.mixins.clear();
      }
    }
    s.exports ? s.exports = { KupolaComponentRegistry: t } : window.KupolaComponentRegistry = t;
  }($)), $.exports;
}
Ot();
var R = { exports: {} }, mt;
function Bt() {
  return mt || (mt = 1, function(s) {
    class t {
      constructor(o = {}) {
        this.mode = o.mode || "hash", this.routes = o.routes || [], this.base = o.base || "", this.currentRoute = null, this.beforeEachHandlers = [], this.afterEachHandlers = [], this.isStarted = !1, this.animationClass = "fade", this.componentCache = /* @__PURE__ */ new Map(), this._routeHandler = () => this._handleRoute(), this._setupRoutes(), this._bindEvents();
      }
      _setupRoutes() {
        this.routeMap = /* @__PURE__ */ new Map(), this._registerRoutes(this.routes, "");
      }
      _registerRoutes(o, n) {
        o.forEach((i) => {
          const a = i.path.startsWith("/") ? i.path : n + (n && !i.path.startsWith("/") ? "/" : "") + i.path, l = this._pathToRegex(a);
          this.routeMap.set(a, { ...i, regex: l, parentPath: n }), i.children && i.children.length > 0 && this._registerRoutes(i.children, a);
        });
      }
      _pathToRegex(o) {
        const n = o.replace(/:(\w+)/g, "([^/]+)").replace(/\*/g, ".*");
        return new RegExp(`^${n}$`);
      }
      _bindEvents() {
        this.mode === "hash" ? window.addEventListener("hashchange", this._routeHandler) : window.addEventListener("popstate", this._routeHandler);
      }
      _handleRoute() {
        const o = this._getCurrentPath();
        this.navigate(o);
      }
      _getCurrentPath() {
        return this.mode === "hash" ? location.hash.slice(1) || "/" : location.pathname.replace(this.base, "") || "/";
      }
      async navigate(o, n = !1) {
        const i = this._matchRoute(o);
        if (!i) return;
        const a = this.currentRoute;
        for (const l of this.beforeEachHandlers)
          if (await l(i, a) === !1) return;
        this.currentRoute = i, this._updateURL(o, n), await this._renderRoute(i);
        for (const l of this.afterEachHandlers)
          l(i);
      }
      _matchRoute(o) {
        for (const [, n] of this.routeMap) {
          const i = o.match(n.regex);
          if (i) {
            const a = {};
            (n.path.match(/:(\w+)/g) || []).forEach((h, u) => {
              a[h.slice(1)] = i[u + 1];
            });
            const c = this._parseQuery();
            return {
              ...n,
              params: a,
              query: c,
              fullPath: o
            };
          }
        }
        return null;
      }
      _parseQuery() {
        const o = location.search.slice(1), n = {};
        return o && o.split("&").forEach((i) => {
          const [a, l] = i.split("=");
          n[a] = decodeURIComponent(l || "");
        }), n;
      }
      _updateURL(o, n) {
        if (this.mode === "hash") {
          const i = `#${o}`;
          n ? location.replace(i) : location.hash = o;
        } else {
          const i = this.base + o + location.search;
          n ? history.replaceState({}, "", i) : history.pushState({}, "", i);
        }
      }
      async _renderRoute(o) {
        o.parentPath && o.parentPath !== "" ? await this._renderNestedRoute(o) : await this._renderRootRoute(o);
      }
      async _renderRootRoute(o) {
        const n = document.querySelector("[data-router-view]");
        if (!n || !o.component) return;
        this._cleanupContainerComponents(n), n.classList.add("router-view-leave"), n.classList.remove("router-view-enter"), await this._waitForAnimation(n);
        const i = await this._resolveComponent(o.component);
        if (!i) return;
        const a = document.createElement("div");
        a.setAttribute("data-component", i), a.classList.add("router-view-enter"), Object.keys(o.params).forEach((l) => {
          a.setAttribute(`data-prop-${l}`, o.params[l]);
        }), n.innerHTML = "", n.appendChild(a), window.kupolaRegistry && await window.kupolaRegistry.bootstrap(n), setTimeout(() => {
          n.classList.remove("router-view-leave"), a.classList.remove("router-view-enter");
        }, 10);
      }
      async _renderNestedRoute(o) {
        const n = this.routeMap.get(o.parentPath);
        if (!n) return;
        const i = document.querySelector("[data-router-view]");
        if (!i) return;
        if (document.querySelector(`[data-component="${n.component}"]`))
          await this._renderChildComponent(o);
        else {
          this._cleanupContainerComponents(i), i.classList.add("router-view-leave"), i.classList.remove("router-view-enter"), await this._waitForAnimation(i);
          const l = await this._resolveComponent(n.component);
          if (!l) return;
          const c = document.createElement("div");
          c.setAttribute("data-component", l), i.innerHTML = "", i.appendChild(c), window.kupolaRegistry && await window.kupolaRegistry.bootstrap(i), setTimeout(() => {
            i.classList.remove("router-view-leave");
          }, 50), await this._renderChildComponent(o);
        }
      }
      async _renderChildComponent(o) {
        const n = document.querySelector(`[data-component="${this._getParentComponent(o.parentPath)}"]`);
        if (!n) return;
        const i = n.querySelector("[data-router-view]");
        if (!i || !o.component) return;
        const a = await this._resolveComponent(o.component);
        if (!a) return;
        const l = document.createElement("div");
        l.setAttribute("data-component", a), l.classList.add("router-view-enter"), Object.keys(o.params).forEach((c) => {
          l.setAttribute(`data-prop-${c}`, o.params[c]);
        }), i.innerHTML = "", i.appendChild(l), window.kupolaRegistry && await window.kupolaRegistry.bootstrap(i), setTimeout(() => {
          l.classList.remove("router-view-enter");
        }, 10);
      }
      async _resolveComponent(o) {
        if (typeof o == "function") {
          const n = o.toString();
          if (this.componentCache.has(n))
            return this.componentCache.get(n);
          try {
            const i = await o(), a = i.default || i, l = `lazy-${Math.random().toString(36).substr(2, 9)}`;
            return window.kupolaRegistry && window.kupolaRegistry.register(l, a), this.componentCache.set(n, l), l;
          } catch (i) {
            return console.error("Failed to load lazy component:", i), null;
          }
        }
        if (typeof o == "string" && o.startsWith("lazy:")) {
          const n = o.slice(5);
          if (window.kupolaRegistry)
            try {
              await window.kupolaRegistry.getAsync(n);
            } catch (i) {
              return console.error(`Failed to load lazy component ${n}:`, i), null;
            }
          return n;
        }
        return o;
      }
      _getParentComponent(o) {
        for (const [n, i] of this.routeMap)
          if (n === o)
            return i.component;
        return null;
      }
      setAnimation(o) {
        this.animationClass = o;
      }
      push(o) {
        this.navigate(o, !1);
      }
      replace(o) {
        this.navigate(o, !0);
      }
      go(o) {
        history.go(o);
      }
      back() {
        history.back();
      }
      forward() {
        history.forward();
      }
      beforeEach(o) {
        this.beforeEachHandlers.push(o);
      }
      afterEach(o) {
        this.afterEachHandlers.push(o);
      }
      _waitForAnimation(o) {
        return new Promise((n) => {
          const i = this._getTransitionDuration(o);
          if (i > 0) {
            const a = () => {
              o.removeEventListener("transitionend", a), o.removeEventListener("animationend", a), n();
            };
            o.addEventListener("transitionend", a), o.addEventListener("animationend", a), setTimeout(a, i + 100);
          } else
            n();
        });
      }
      _getTransitionDuration(o) {
        const n = window.getComputedStyle(o), i = parseFloat(n.transitionDuration) || 0, a = parseFloat(n.animationDuration) || 0;
        return Math.max(i, a) * 1e3;
      }
      _cleanupContainerComponents(o) {
        o.querySelectorAll("[data-component]").forEach((i) => {
          const a = i.__kupolaInstance;
          a && typeof a.unmount == "function" && a.unmount().catch((l) => console.error("Error unmounting component:", l));
        }), window.kupolaInitializer && o.querySelectorAll("[data-component], [data-dropdown], [data-select], [data-datepicker], [data-timepicker], [data-slider], [data-carousel], [data-drawer], [data-modal], [data-dialog], [data-color-picker], [data-calendar], [data-slide-captcha], [data-heatmap]").forEach((a) => {
          window.kupolaInitializer.cleanup(a);
        });
      }
      destroy() {
        this.mode === "hash" ? window.removeEventListener("hashchange", this._routeHandler) : window.removeEventListener("popstate", this._routeHandler), this.routes = [], this.routeMap.clear(), this.beforeEachHandlers = [], this.afterEachHandlers = [];
      }
    }
    function e(r) {
      return new t(r);
    }
    s.exports ? s.exports = { KupolaRouter: t, createRouter: e } : (window.KupolaRouter = t, window.createRouter = e);
  }(R)), R.exports;
}
Bt();
var F = { exports: {} }, gt;
function Nt() {
  return gt || (gt = 1, function(s) {
    class t {
      constructor(o = {}) {
        this.baseURL = o.baseURL || "", this.timeout = o.timeout || 3e4, this.headers = o.headers || {}, this.cache = /* @__PURE__ */ new Map(), this.cacheTTL = o.cacheTTL || 6e4, this.maxRetries = o.maxRetries || 0, this.retryDelay = o.retryDelay || 1e3, this.activeRequests = /* @__PURE__ */ new Map(), this.withCredentials = o.withCredentials || !1, this._useAxios = typeof axios < "u", this._useAxios && this._initAxios(o), o.interceptors && (this.interceptors = o.interceptors);
      }
      _initAxios(o) {
        this.axios = axios.create({
          baseURL: this.baseURL,
          timeout: this.timeout,
          headers: this.headers
        }), this.axios.defaults.withCredentials = o.withCredentials || !1;
      }
      _generateCacheKey(o) {
        const { url: n, method: i = "GET", params: a = {}, data: l = null } = o, c = a ? new URLSearchParams(a).toString() : "", h = l ? JSON.stringify(l) : "";
        return `${i}:${n}:${c}:${h}`;
      }
      _getCache(o) {
        const n = this.cache.get(o);
        return n && Date.now() - n.timestamp < this.cacheTTL ? n.data : (this.cache.delete(o), null);
      }
      _setCache(o, n) {
        this.cache.set(o, { data: n, timestamp: Date.now() });
      }
      async _requestWithRetry(o, n = 0) {
        try {
          return await this._request(o);
        } catch (i) {
          if (n < this.maxRetries)
            return await new Promise((a) => setTimeout(a, this.retryDelay * Math.pow(2, n))), this._requestWithRetry(o, n + 1);
          throw i;
        }
      }
      async _request(o) {
        const {
          url: n,
          method: i = "GET",
          headers: a = {},
          params: l = {},
          data: c = null,
          timeout: h = this.timeout,
          cache: u = !1
        } = o, d = this._generateCacheKey({ url: n, method: i, params: l, data: c });
        if (u && i === "GET") {
          const m = this._getCache(d);
          if (m)
            return m;
        }
        const p = new AbortController();
        this.activeRequests.set(d, p);
        const g = { ...this.headers, ...a };
        !g["Content-Type"] && c && !(c instanceof FormData) && (g["Content-Type"] = "application/json");
        let f = {
          url: this.baseURL ? new URL(n, this.baseURL).toString() : n,
          method: i,
          headers: g,
          signal: p.signal,
          credentials: this.withCredentials ? "include" : "same-origin"
        };
        if (Object.keys(l).length > 0) {
          const m = new URL(f.url);
          Object.keys(l).forEach((v) => {
            m.searchParams.append(v, l[v]);
          }), f.url = m.toString();
        }
        if (c !== null && (f.body = c instanceof FormData ? c : JSON.stringify(c)), this.interceptors && this.interceptors.request)
          try {
            const m = await this.interceptors.request(f);
            m && (f = m);
          } catch (m) {
            if (this.activeRequests.delete(d), this.interceptors.requestError)
              return this.interceptors.requestError(m);
            throw m;
          }
        try {
          let m;
          if (this._useAxios) {
            const y = {
              url: f.url.replace(this.baseURL, ""),
              method: f.method,
              headers: f.headers,
              signal: f.signal,
              timeout: h
            };
            c !== null && (y.data = c), l && Object.keys(l).length > 0 && (y.params = l), m = await this.axios(y);
          } else if (m = await this._fetchWithTimeout(f, h), !m.ok) {
            const y = new Error(`HTTP error! status: ${m.status}`);
            throw y.status = m.status, y.statusText = m.statusText, y;
          }
          const v = {
            data: this._useAxios ? m.data : await this._parseResponse(m),
            status: (this._useAxios, m.status),
            statusText: (this._useAxios, m.statusText),
            headers: this._useAxios ? m.headers : this._parseHeaders(m.headers),
            config: f
          };
          return this.interceptors && this.interceptors.response ? this.interceptors.response(v) : (u && i === "GET" && this._setCache(d, v), v);
        } catch (m) {
          if (m.name === "AbortError" || this._useAxios && m.code === "ERR_CANCELED")
            return null;
          if (this.interceptors && this.interceptors.responseError)
            return this.interceptors.responseError(m);
          throw m;
        } finally {
          this.activeRequests.delete(d);
        }
      }
      async _fetchWithTimeout(o, n) {
        const i = new AbortController(), a = i.signal, l = new Promise((h, u) => {
          const d = setTimeout(() => {
            i.abort(), u(new Error("Request timeout"));
          }, n);
          a.addEventListener("abort", () => {
            clearTimeout(d);
          });
        }), c = fetch({ ...o, signal: a });
        return Promise.race([c, l]);
      }
      async _parseResponse(o) {
        const n = o.headers.get("content-type");
        return n && n.includes("application/json") ? o.json() : o.text();
      }
      _parseHeaders(o) {
        const n = {};
        return o.forEach((i, a) => {
          n[a] = i;
        }), n;
      }
      cancelRequest(o, n = {}, i = "GET", a = null) {
        const l = this._generateCacheKey({ url: o, method: i, params: n, data: a });
        return this.activeRequests.has(l) ? (this.activeRequests.get(l).abort(), this.activeRequests.delete(l), !0) : !1;
      }
      cancelAllRequests() {
        this.activeRequests.forEach((o) => {
          o.abort();
        }), this.activeRequests.clear();
      }
      clearCache() {
        this.cache.clear();
      }
      clearCacheByUrl(o) {
        this.cache.forEach((n, i) => {
          i.startsWith(`GET:${o}`) && this.cache.delete(i);
        });
      }
      get(o, n = {}) {
        const i = n.cache ?? !0, a = n.retry ?? this.maxRetries > 0, l = { ...n, url: o, method: "GET", cache: i };
        return a ? this._requestWithRetry(l) : this._request(l);
      }
      post(o, n = null, i = {}) {
        const a = i.retry ?? this.maxRetries > 0, l = { ...i, url: o, method: "POST", data: n, cache: !1 };
        return a ? this._requestWithRetry(l) : this._request(l);
      }
      async uploadFile(o, n, i = {}) {
        const {
          chunkSize: a = 2 * 1024 * 1024,
          onProgress: l,
          headers: c = {},
          parallel: h = !1
        } = i, u = Math.ceil(n.size / a);
        let d = 0, p = 0;
        const g = this._generateFileId(n);
        if (h) {
          const f = [];
          for (let m = 0; m < u; m++) {
            const v = this._uploadChunk(o, n, m, u, a, g, c).then(() => {
              d++, p = Math.round(d / u * 100), l && l({
                progress: p,
                uploaded: d * a,
                total: n.size,
                currentChunk: d,
                totalChunks: u
              });
            });
            f.push(v);
          }
          return await Promise.all(f), this._completeUpload(o, g, u, n.name);
        }
        for (let f = 0; f < u; f++)
          await this._uploadChunk(o, n, f, u, a, g, c), d++, p = Math.round(d / u * 100), l && l({
            progress: p,
            uploaded: d * a,
            total: n.size,
            currentChunk: f + 1,
            totalChunks: u
          });
        return this._completeUpload(o, g, u, n.name);
      }
      async _uploadChunk(o, n, i, a, l, c, h) {
        const u = i * l, d = Math.min(u + l, n.size), p = n.slice(u, d), g = new FormData();
        return g.append("chunk", p), g.append("chunkIndex", i), g.append("totalChunks", a), g.append("fileId", c), g.append("fileName", n.name), g.append("fileSize", n.size), this.post(`${o}/chunk`, g, { headers: h });
      }
      async _completeUpload(o, n, i, a) {
        return this.post(`${o}/complete`, { fileId: n, totalChunks: i, fileName: a });
      }
      _generateFileId(o) {
        const n = `${o.name}-${o.size}-${o.lastModified}`;
        let i = 0;
        for (let a = 0; a < n.length; a++)
          i = (i << 5) - i + n.charCodeAt(a), i |= 0;
        return Math.abs(i).toString(36) + Date.now().toString(36);
      }
      put(o, n = null, i = {}) {
        const a = i.retry ?? this.maxRetries > 0, l = { ...i, url: o, method: "PUT", data: n, cache: !1 };
        return a ? this._requestWithRetry(l) : this._request(l);
      }
      delete(o, n = {}) {
        const i = n.retry ?? this.maxRetries > 0, a = { ...n, url: o, method: "DELETE", cache: !1 };
        return i ? this._requestWithRetry(a) : this._request(a);
      }
      patch(o, n = null, i = {}) {
        const a = i.retry ?? this.maxRetries > 0, l = { ...i, url: o, method: "PATCH", data: n, cache: !1 };
        return a ? this._requestWithRetry(l) : this._request(l);
      }
      setHeader(o, n) {
        this.headers[o] = n, this.axios && (this.axios.defaults.headers.common[o] = n);
      }
      setToken(o, n = "Bearer") {
        this.headers.Authorization = `${n} ${o}`, this.axios && (this.axios.defaults.headers.common.Authorization = `${n} ${o}`);
      }
      setCacheTTL(o) {
        this.cacheTTL = o;
      }
      setMaxRetries(o) {
        this.maxRetries = o;
      }
    }
    function e(r) {
      return new t(r);
    }
    s.exports ? s.exports = { KupolaHttp: t, createHttp: e } : (window.KupolaHttp = t, window.createHttp = e);
  }(F)), F.exports;
}
Nt();
var O = { exports: {} }, yt;
function se() {
  return yt || (yt = 1, function(s) {
    class t {
      constructor() {
        this.initializers = /* @__PURE__ */ new Map(), this.cleanupFunctions = /* @__PURE__ */ new Map(), this.processedElements = /* @__PURE__ */ new WeakSet();
      }
      register(o, n, i = null) {
        this.initializers.set(o, n), i && this.cleanupFunctions.set(o, i);
      }
      unregister(o) {
        this.initializers.delete(o), this.cleanupFunctions.delete(o);
      }
      has(o) {
        return this.initializers.has(o);
      }
      get(o) {
        return this.initializers.get(o);
      }
      async initialize(o) {
        if (this.processedElements.has(o)) return;
        const n = [
          "data-component",
          "data-dropdown",
          "data-select",
          "data-datepicker",
          "data-timepicker",
          "data-slider",
          "data-carousel",
          "data-drawer",
          "data-modal",
          "data-dialog",
          "data-color-picker",
          "data-calendar",
          "data-slide-captcha",
          "data-heatmap"
        ];
        for (const l of n) {
          const c = o.getAttribute(l);
          if (c) {
            const h = c || l.replace("data-", ""), u = this.initializers.get(h) || this.initializers.get(l.replace("data-", ""));
            if (u) {
              try {
                await u(o), this.processedElements.add(o);
              } catch (d) {
                console.error(`[ComponentInitializerRegistry] Error initializing "${h}":`, d);
              }
              return;
            }
          }
        }
        const i = o.className, a = [
          ".ds-dropdown",
          ".ds-select",
          ".ds-datepicker",
          ".ds-timepicker",
          ".ds-slider",
          ".ds-carousel",
          ".ds-drawer",
          ".ds-modal",
          ".ds-dialog",
          ".ds-color-picker",
          ".ds-calendar",
          ".ds-slider-captcha",
          ".ds-heatmap",
          ".ds-tooltip",
          ".ds-tag",
          ".ds-statcard",
          ".ds-collapse",
          ".ds-fileupload",
          ".ds-notification",
          ".ds-message"
        ];
        for (const l of a) {
          const c = l.replace(".", "");
          if (i.includes(c)) {
            const h = c.replace("ds-", ""), u = this.initializers.get(h) || this.initializers.get(c);
            if (u) {
              try {
                await u(o), this.processedElements.add(o);
              } catch (d) {
                console.error(`[ComponentInitializerRegistry] Error initializing "${h}":`, d);
              }
              return;
            }
          }
        }
      }
      cleanup(o) {
        const n = [
          "data-component",
          "data-dropdown",
          "data-select",
          "data-datepicker",
          "data-timepicker",
          "data-slider",
          "data-carousel",
          "data-drawer",
          "data-modal",
          "data-dialog",
          "data-color-picker",
          "data-calendar",
          "data-slide-captcha",
          "data-heatmap"
        ];
        for (const l of n) {
          const c = o.getAttribute(l);
          if (c) {
            const h = c || l.replace("data-", ""), u = this.cleanupFunctions.get(h) || this.cleanupFunctions.get(l.replace("data-", ""));
            if (u) {
              try {
                u(o);
              } catch (d) {
                console.error(`[ComponentInitializerRegistry] Error cleaning up "${h}":`, d);
              }
              this.processedElements.delete(o);
              return;
            }
          }
        }
        const i = o.className, a = [
          ".ds-dropdown",
          ".ds-select",
          ".ds-datepicker",
          ".ds-timepicker",
          ".ds-slider",
          ".ds-carousel",
          ".ds-drawer",
          ".ds-modal",
          ".ds-dialog",
          ".ds-color-picker",
          ".ds-calendar",
          ".ds-slider-captcha",
          ".ds-heatmap",
          ".ds-tooltip",
          ".ds-tag",
          ".ds-statcard",
          ".ds-collapse",
          ".ds-fileupload",
          ".ds-notification",
          ".ds-message"
        ];
        for (const l of a) {
          const c = l.replace(".", "");
          if (i.includes(c)) {
            const h = c.replace("ds-", ""), u = this.cleanupFunctions.get(h) || this.cleanupFunctions.get(c);
            if (u) {
              try {
                u(o);
              } catch (d) {
                console.error(`[ComponentInitializerRegistry] Error cleaning up "${h}":`, d);
              }
              this.processedElements.delete(o);
              return;
            }
          }
        }
      }
      async initializeAll(o = document) {
        const n = o.querySelectorAll("[data-component], [data-dropdown], [data-select], [data-datepicker], [data-timepicker], [data-slider], [data-carousel], [data-drawer], [data-modal], [data-dialog], [data-color-picker], [data-calendar], [data-slide-captcha], [data-heatmap], .ds-dropdown, .ds-select, .ds-datepicker, .ds-timepicker, .ds-slider, .ds-carousel, .ds-drawer, .ds-modal, .ds-dialog, .ds-color-picker, .ds-calendar, .ds-slider-captcha, .ds-heatmap, .ds-tooltip, .ds-tag, .ds-statcard, .ds-collapse, .ds-fileupload, .ds-notification, .ds-message"), i = [];
        n.forEach((a) => {
          this.processedElements.has(a) || i.push(this.initialize(a));
        }), await Promise.all(i);
      }
    }
    const e = new t();
    s.exports ? s.exports = { ComponentInitializerRegistry: t, kupolaInitializer: e } : (window.ComponentInitializerRegistry = t, window.kupolaInitializer = e);
  }(O)), O.exports;
}
se();
var B = { exports: {} }, vt;
function ie() {
  if (vt) return B.exports;
  if (vt = 1, typeof window > "u") {
    const { KupolaComponent: t, applyMixin: e } = Ft(), { KupolaComponentRegistry: r } = Ot(), { KupolaRouter: o, createRouter: n } = Bt(), { KupolaHttp: i, createHttp: a } = Nt();
    B.exports = {
      KupolaComponent: t,
      applyMixin: e,
      KupolaComponentRegistry: r,
      KupolaRouter: o,
      KupolaHttp: i,
      createRouter: n,
      createHttp: a
    };
  }
  window.KupolaComponentRegistry && (window.kupolaRegistry = new window.KupolaComponentRegistry());
  async function s() {
    window.kupolaData && window.kupolaData.loadPersisted(), window.kupolaRegistry && await window.kupolaRegistry.bootstrap();
  }
  return document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", s) : setTimeout(s, 0), window.registerComponent = function(t, e) {
    window.kupolaRegistry && window.kupolaRegistry.register(t, e);
  }, window.registerLazyComponent = function(t, e) {
    window.kupolaRegistry && window.kupolaRegistry.registerLazy(t, e);
  }, window.bootstrapComponents = function(t) {
    return window.kupolaRegistry ? window.kupolaRegistry.bootstrap(t) : Promise.resolve();
  }, window.defineMixin = function(t, e) {
    window.kupolaRegistry && window.kupolaRegistry.defineMixin(t, e);
  }, window.useMixin = function(t, ...e) {
    window.kupolaRegistry && window.kupolaRegistry.useMixin(t, ...e);
  }, B.exports;
}
ie();
let q = class {
  constructor(t = "app") {
    this.scope = t, this.hooks = /* @__PURE__ */ new Map(), this.state = "created", this.stateHistory = ["created"], this.transitions = /* @__PURE__ */ new Map([
      ["created", ["bootstrapped", "destroyed"]],
      ["bootstrapped", ["mounted", "destroyed"]],
      ["mounted", ["updated", "unmounted", "destroyed"]],
      ["updated", ["updated", "unmounted", "destroyed"]],
      ["unmounted", ["mounted", "destroyed"]],
      ["destroyed", []]
    ]), this.phaseStateMap = {
      bootstrap: { from: "created", to: "bootstrapped" },
      mount: { from: ["bootstrapped", "unmounted"], to: "mounted" },
      update: { from: ["mounted", "updated"], to: "updated" },
      unmount: { from: ["mounted", "updated"], to: "unmounted" },
      destroy: { from: ["bootstrapped", "mounted", "updated", "unmounted"], to: "destroyed" }
    }, this.basePhases = ["bootstrap", "mount", "update", "unmount", "destroy"], this.allPhases = ["error", "errorBoundary"], this.basePhases.forEach((e) => {
      this.allPhases.push(`before${e.charAt(0).toUpperCase() + e.slice(1)}`), this.allPhases.push(e), this.allPhases.push(`after${e.charAt(0).toUpperCase() + e.slice(1)}`);
    }), this.allPhases.forEach((e) => {
      this.hooks.set(e, []);
    }), this.pendingHooks = /* @__PURE__ */ new Set(), this.trace = [], this.errorHandler = null, this.errorBoundary = null, this.lastError = null, this.errorCount = 0, this.maxErrors = 10, this._onErrorCallback = null;
  }
  _validateTransition(t) {
    const e = this.transitions.get(this.state);
    if (!e || !e.includes(t))
      throw new Error(`Invalid state transition: ${this.state} -> ${t}`);
    return !0;
  }
  _updateState(t) {
    this._validateTransition(t), this.state = t, this.stateHistory.push(t);
  }
  _resetResolved(t) {
    const e = this.hooks.get(t);
    e && e.forEach((r) => {
      r.resolved = !1;
    });
  }
  on(t, e, r = {}) {
    if (!this.allPhases.includes(t))
      throw new Error(`Unknown lifecycle phase: ${t}`);
    const o = this.hooks.get(t);
    return o.push({
      handler: e,
      priority: r.priority || 0,
      depends: r.depends || [],
      name: r.name || e.name || `anonymous_${o.length}`
    }), o.sort((n, i) => i.priority - n.priority), () => {
      const n = o.findIndex((i) => i.handler === e);
      n > -1 && o.splice(n, 1);
    };
  }
  async _resolveDepends(t, e) {
    if (!(!t || t.length === 0))
      for (const r of t) {
        const n = this.hooks.get(e).find((i) => i.name === r);
        n && !n.resolved && (await n.handler(), n.resolved = !0);
      }
  }
  async emit(t, ...e) {
    if (this.state === "destroyed" && t !== "error") return;
    const r = this.hooks.get(t);
    if (!r || r.length === 0) return;
    const o = `${t}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.pendingHooks.add(o);
    const n = performance.now();
    try {
      for (const a of r) {
        await this._resolveDepends(a.depends, t);
        const l = performance.now();
        let c, h;
        try {
          c = a.handler(...e), c instanceof Promise && await c, a.resolved = !0;
        } catch (d) {
          h = d, console.error(`[KupolaLifecycle] Error in ${t} hook "${a.name}":`, d), t !== "error" && await this._handleError({ phase: t, hook: a.name, error: d, args: e });
        }
        const u = performance.now() - l;
        this.trace.push({
          emitId: o,
          phase: t,
          hookName: a.name,
          duration: u,
          status: h ? "error" : "success",
          error: h ? h.message : null,
          timestamp: Date.now()
        });
      }
      const i = performance.now() - n;
      console.debug(`[KupolaLifecycle] ${t} completed in ${i.toFixed(2)}ms (${this.scope})`);
    } finally {
      this.pendingHooks.delete(o);
    }
  }
  async runPhase(t, ...e) {
    if (!this.basePhases.includes(t))
      throw new Error(`Unknown base phase: ${t}`);
    const r = this.phaseStateMap[t];
    if (r) {
      if (Array.isArray(r.from)) {
        if (!r.from.includes(this.state))
          throw new Error(`Cannot ${t} from state ${this.state}, expected one of: ${r.from.join(", ")}`);
      } else if (this.state !== r.from)
        throw new Error(`Cannot ${t} from state ${this.state}, expected ${r.from}`);
    }
    const o = `before${t.charAt(0).toUpperCase() + t.slice(1)}`, n = `after${t.charAt(0).toUpperCase() + t.slice(1)}`;
    this._resetResolved(o), this._resetResolved(t), this._resetResolved(n), this.allPhases.includes(o) && await this.emit(o, ...e), await this.emit(t, ...e), r && this._updateState(r.to), this.allPhases.includes(n) && await this.emit(n, ...e);
  }
  async bootstrap(...t) {
    await this.runPhase("bootstrap", ...t);
  }
  async _waitForDOMReady() {
    return new Promise((t) => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        t();
        return;
      }
      const e = () => {
        document.removeEventListener("DOMContentLoaded", e), window.removeEventListener("load", e), t();
      };
      document.addEventListener("DOMContentLoaded", e), window.addEventListener("load", e);
    });
  }
  async mount(...t) {
    await this.runPhase("mount", ...t);
  }
  async mountWithDOMReady(...t) {
    await this._waitForDOMReady(), await this.runPhase("mount", ...t);
  }
  async update(...t) {
    await this.runPhase("update", ...t);
  }
  async unmount(...t) {
    await this.runPhase("unmount", ...t);
  }
  async destroy(...t) {
    await this.runPhase("destroy", ...t), this.hooks.forEach((e) => {
      e.length = 0;
    });
  }
  getPhaseHandlers(t) {
    return this.hooks.get(t) || [];
  }
  hasHandlers(t) {
    const e = this.hooks.get(t);
    return e && e.length > 0;
  }
  getTrace() {
    return [...this.trace];
  }
  clearTrace() {
    this.trace = [];
  }
  getState() {
    return this.state;
  }
  getStateHistory() {
    return [...this.stateHistory];
  }
  isInState(t) {
    return this.state === t;
  }
  onError(t) {
    return this._onErrorCallback = t, this.on("error", t);
  }
  setErrorBoundary(t) {
    return this.errorBoundary = t, this.on("errorBoundary", (e) => typeof t == "function" ? t(e) : null);
  }
  setMaxErrors(t) {
    this.maxErrors = t;
  }
  getErrorCount() {
    return this.errorCount;
  }
  getLastError() {
    return this.lastError;
  }
  resetErrorCount() {
    this.errorCount = 0, this.lastError = null;
  }
  async _handleError(t) {
    if (this.errorCount++, this.lastError = t.error, this.errorCount >= this.maxErrors) {
      console.error(`[KupolaLifecycle] Error limit reached (${this.maxErrors}), stopping error handling`);
      return;
    }
    if (await this.emit("error", t), typeof this._onErrorCallback == "function")
      try {
        await this._onErrorCallback(t);
      } catch (r) {
        console.error("[KupolaLifecycle] Error in onError callback:", r);
      }
    const e = this.hooks.get("errorBoundary");
    if (e && e.length > 0)
      for (const r of e)
        try {
          const o = r.handler(t);
          if (o instanceof Promise && await o, o === "handled") {
            console.debug(`[KupolaLifecycle] Error handled by errorBoundary hook "${r.name}"`);
            return;
          }
        } catch (o) {
          console.error(`[KupolaLifecycle] Error in errorBoundary hook "${r.name}":`, o);
        }
    console.error(`[KupolaLifecycle] Unhandled error in ${t.phase}:`, t.error);
  }
}, Kt = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Map(), this.enabledPlugins = /* @__PURE__ */ new Set(), this.pluginHooks = /* @__PURE__ */ new Map();
  }
  register(t, e) {
    this.plugins.has(t) && console.warn(`Plugin ${t} already registered, overriding`), this.plugins.set(t, {
      ...e,
      name: t,
      enabled: !1,
      instance: null,
      lifecycle: new q(`plugin:${t}`)
    });
  }
  async enable(t) {
    const e = this.plugins.get(t);
    if (!e)
      throw new Error(`Plugin ${t} not found`);
    if (!e.enabled)
      try {
        await e.lifecycle.bootstrap(), e.install && (e.instance = await e.install()), e.enabled = !0, this.enabledPlugins.add(t), await e.lifecycle.mount(), e.hooks && this._registerPluginHooks(t, e.hooks), console.log(`Plugin ${t} enabled`);
      } catch (r) {
        throw console.error(`Failed to enable plugin ${t}:`, r), r;
      }
  }
  async disable(t) {
    const e = this.plugins.get(t);
    if (!(!e || !e.enabled))
      try {
        await e.lifecycle.unmount(), e.uninstall && await e.uninstall(e.instance), e.hooks && this._unregisterPluginHooks(t), e.enabled = !1, this.enabledPlugins.delete(t), e.instance = null, await e.lifecycle.destroy(), console.log(`Plugin ${t} disabled`);
      } catch (r) {
        throw console.error(`Failed to disable plugin ${t}:`, r), r;
      }
  }
  get(t) {
    return this.plugins.get(t)?.instance || null;
  }
  getAll() {
    const t = {};
    return this.plugins.forEach((e, r) => {
      t[r] = {
        name: e.name,
        enabled: e.enabled,
        instance: e.instance,
        state: e.lifecycle.getState()
      };
    }), t;
  }
  getEnabled() {
    const t = {};
    return this.enabledPlugins.forEach((e) => {
      const r = this.plugins.get(e);
      r && (t[e] = r.instance);
    }), t;
  }
  async enableAll() {
    const t = [];
    this.plugins.forEach((e, r) => {
      t.push(this.enable(r));
    }), await Promise.all(t);
  }
  async disableAll() {
    const t = [];
    this.enabledPlugins.forEach((e) => {
      t.push(this.disable(e));
    }), await Promise.all(t);
  }
  _registerPluginHooks(t, e) {
    this.pluginHooks.has(t) || this.pluginHooks.set(t, []);
    const r = this.pluginHooks.get(t);
    Object.keys(e).forEach((o) => {
      const n = window.kupolaLifecycle?.on(o, e[o], { name: `${t}:${o}` });
      n && r.push({ phase: o, unsubscribe: n });
    });
  }
  _unregisterPluginHooks(t) {
    const e = this.pluginHooks.get(t);
    e && (e.forEach(({ unsubscribe: r }) => {
      r && r();
    }), this.pluginHooks.delete(t));
  }
};
const ne = new q("app"), re = new Kt();
function oe(s = "app") {
  return new q(s);
}
window.KupolaLifecycle = q;
window.KupolaPluginManager = Kt;
window.kupolaLifecycle = ne;
window.kupolaPluginManager = re;
window.createLifecycle = oe;
const Vt = {
  string: {
    trim(s) {
      return s ? s.trim() : "";
    },
    trimLeft(s) {
      return s ? s.replace(/^\s+/, "") : "";
    },
    trimRight(s) {
      return s ? s.replace(/\s+$/, "") : "";
    },
    toUpperCase(s) {
      return s ? s.toUpperCase() : "";
    },
    toLowerCase(s) {
      return s ? s.toLowerCase() : "";
    },
    capitalize(s) {
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    },
    camelize(s) {
      return s ? s.replace(/-(\w)/g, (t, e) => e ? e.toUpperCase() : "") : "";
    },
    hyphenate(s) {
      return s ? s.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "") : "";
    },
    padStart(s, t, e = " ") {
      return (String(s) || "").padStart(t, e);
    },
    padEnd(s, t, e = " ") {
      return (String(s) || "").padEnd(t, e);
    },
    truncate(s, t, e = "...") {
      return !s || s.length <= t ? s || "" : s.slice(0, t) + e;
    },
    replaceAll(s, t, e) {
      return s ? s.split(t).join(e) : "";
    },
    format(s, t) {
      return s ? s.replace(/\{\{(\w+)\}\}/g, (e, r) => t[r] !== void 0 ? t[r] : `{{${r}}}`) : "";
    },
    startsWith(s, t) {
      return (s || "").startsWith(t);
    },
    endsWith(s, t) {
      return (s || "").endsWith(t);
    },
    includes(s, t) {
      return (s || "").includes(t);
    },
    repeat(s, t) {
      return (s || "").repeat(t);
    },
    reverse(s) {
      return (s || "").split("").reverse().join("");
    },
    countOccurrences(s, t) {
      return !s || !t ? 0 : s.split(t).length - 1;
    },
    escapeHtml(s) {
      if (!s) return "";
      const t = document.createElement("div");
      return t.textContent = s, t.innerHTML;
    },
    unescapeHtml(s) {
      if (!s) return "";
      const t = document.createElement("div");
      return t.innerHTML = s, t.textContent;
    },
    generateRandom(s = 8) {
      const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let e = "";
      for (let r = 0; r < s; r++)
        e += t.charAt(Math.floor(Math.random() * t.length));
      return e;
    },
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
        const t = Math.random() * 16 | 0;
        return (s === "x" ? t : t & 3 | 8).toString(16);
      });
    }
  },
  array: {
    isArray(s) {
      return Array.isArray(s);
    },
    isEmpty(s) {
      return !s || s.length === 0;
    },
    size(s) {
      return s ? s.length : 0;
    },
    first(s, t) {
      return s && s.length > 0 ? s[0] : t;
    },
    last(s, t) {
      return s && s.length > 0 ? s[s.length - 1] : t;
    },
    get(s, t, e) {
      return s && s[t] !== void 0 ? s[t] : e;
    },
    slice(s, t, e) {
      return s ? s.slice(t, e) : [];
    },
    concat(...s) {
      return s.reduce((t, e) => t.concat(e || []), []);
    },
    join(s, t = ",") {
      return s ? s.join(t) : "";
    },
    indexOf(s, t, e = 0) {
      return s ? s.indexOf(t, e) : -1;
    },
    lastIndexOf(s, t, e) {
      return s ? s.lastIndexOf(t, e) : -1;
    },
    includes(s, t) {
      return s ? s.includes(t) : !1;
    },
    push(s, ...t) {
      return s && s.push(...t), s;
    },
    pop(s) {
      return s ? s.pop() : void 0;
    },
    shift(s) {
      return s ? s.shift() : void 0;
    },
    unshift(s, ...t) {
      return s && s.unshift(...t), s;
    },
    remove(s, t) {
      if (!s) return s;
      const e = s.indexOf(t);
      return e > -1 && s.splice(e, 1), s;
    },
    removeAt(s, t) {
      return !s || t < 0 || t >= s.length || s.splice(t, 1), s;
    },
    insert(s, t, e) {
      return s && (s.splice(t, 0, e), s);
    },
    reverse(s) {
      return s ? s.slice().reverse() : [];
    },
    sort(s, t) {
      return s ? s.slice().sort(t) : [];
    },
    sortBy(s, t, e = "asc") {
      return s ? s.slice().sort((r, o) => {
        const n = typeof r == "object" ? r[t] : r, i = typeof o == "object" ? o[t] : o;
        return n < i ? e === "asc" ? -1 : 1 : n > i ? e === "asc" ? 1 : -1 : 0;
      }) : [];
    },
    filter(s, t) {
      return s ? s.filter(t) : [];
    },
    map(s, t) {
      return s ? s.map(t) : [];
    },
    reduce(s, t, e) {
      return s ? s.reduce(t, e) : e;
    },
    forEach(s, t) {
      s && s.forEach(t);
    },
    every(s, t) {
      return s ? s.every(t) : !0;
    },
    some(s, t) {
      return s ? s.some(t) : !1;
    },
    find(s, t) {
      return s ? s.find(t) : void 0;
    },
    findIndex(s, t) {
      return s ? s.findIndex(t) : -1;
    },
    flat(s, t = 1) {
      return s ? s.flat(t) : [];
    },
    flattenDeep(s) {
      return s ? s.reduce((t, e) => Array.isArray(e) ? t.concat(this.flattenDeep(e)) : t.concat(e), []) : [];
    },
    unique(s) {
      return s ? [...new Set(s)] : [];
    },
    uniqueBy(s, t) {
      if (!s) return [];
      const e = /* @__PURE__ */ new Set();
      return s.filter((r) => {
        const o = typeof r == "object" ? r[t] : r;
        return e.has(o) ? !1 : (e.add(o), !0);
      });
    },
    chunk(s, t) {
      if (!s || t <= 0) return [];
      const e = [];
      for (let r = 0; r < s.length; r += t)
        e.push(s.slice(r, r + t));
      return e;
    },
    shuffle(s) {
      if (!s) return [];
      const t = s.slice();
      for (let e = t.length - 1; e > 0; e--) {
        const r = Math.floor(Math.random() * (e + 1));
        [t[e], t[r]] = [t[r], t[e]];
      }
      return t;
    },
    sum(s) {
      return s ? s.reduce((t, e) => t + (Number(e) || 0), 0) : 0;
    },
    average(s) {
      return !s || s.length === 0 ? 0 : this.sum(s) / s.length;
    },
    max(s) {
      return s && s.length > 0 ? Math.max(...s) : -1 / 0;
    },
    min(s) {
      return s && s.length > 0 ? Math.min(...s) : 1 / 0;
    },
    intersection(...s) {
      return s.length === 0 ? [] : s.reduce((t, e) => t.filter((r) => e && e.includes(r)));
    },
    union(...s) {
      return [...new Set(s.flat().filter(Boolean))];
    },
    difference(s, t) {
      return s ? s.filter((e) => !t || !t.includes(e)) : [];
    },
    zip(...s) {
      if (s.length === 0) return [];
      const t = Math.max(...s.map((e) => e ? e.length : 0));
      return Array.from({ length: t }, (e, r) => s.map((o) => o && o[r]));
    }
  },
  object: {
    isObject(s) {
      return s !== null && typeof s == "object" && !Array.isArray(s);
    },
    isEmpty(s) {
      return !s || typeof s != "object" ? !0 : Object.keys(s).length === 0;
    },
    keys(s) {
      return s ? Object.keys(s) : [];
    },
    values(s) {
      return s ? Object.values(s) : [];
    },
    entries(s) {
      return s ? Object.entries(s) : [];
    },
    has(s, t) {
      return s ? Object.prototype.hasOwnProperty.call(s, t) : !1;
    },
    get(s, t, e) {
      return s && t.split(".").reduce((o, n) => o && o[n], s) || e;
    },
    set(s, t, e) {
      if (!s || typeof s != "object") return s;
      const r = t.split("."), o = r.pop();
      let n = s;
      return r.forEach((i) => {
        n[i] || (n[i] = {}), n = n[i];
      }), n[o] = e, s;
    },
    pick(s, t) {
      return s ? t.reduce((e, r) => (s[r] !== void 0 && (e[r] = s[r]), e), {}) : {};
    },
    omit(s, t) {
      return s ? Object.keys(s).reduce((e, r) => (t.includes(r) || (e[r] = s[r]), e), {}) : {};
    },
    merge(...s) {
      return s.reduce((t, e) => (e && typeof e == "object" && Object.keys(e).forEach((r) => {
        this.isObject(e[r]) && this.isObject(t[r]) ? t[r] = this.merge(t[r], e[r]) : t[r] = e[r];
      }), t), {});
    },
    clone(s) {
      return s && JSON.parse(JSON.stringify(s));
    },
    deepClone(s, t = /* @__PURE__ */ new WeakMap()) {
      if (!s || typeof s != "object") return s;
      if (t.has(s)) return t.get(s);
      if (s instanceof Date) return new Date(s);
      if (s instanceof RegExp) return new RegExp(s);
      if (s instanceof Map) {
        const r = /* @__PURE__ */ new Map();
        return t.set(s, r), s.forEach((o, n) => r.set(n, this.deepClone(o, t))), r;
      }
      if (s instanceof Set) {
        const r = /* @__PURE__ */ new Set();
        return t.set(s, r), s.forEach((o) => r.add(this.deepClone(o, t))), r;
      }
      if (Array.isArray(s)) {
        const r = [];
        return t.set(s, r), s.forEach((o) => r.push(this.deepClone(o, t))), r;
      }
      const e = {};
      return t.set(s, e), Object.keys(s).forEach((r) => {
        e[r] = this.deepClone(s[r], t);
      }), e;
    },
    forEach(s, t) {
      s && Object.keys(s).forEach((e) => t(s[e], e, s));
    },
    map(s, t) {
      if (!s) return {};
      const e = {};
      return Object.keys(s).forEach((r) => {
        e[r] = t(s[r], r, s);
      }), e;
    },
    filter(s, t) {
      if (!s) return {};
      const e = {};
      return Object.keys(s).forEach((r) => {
        t(s[r], r, s) && (e[r] = s[r]);
      }), e;
    },
    reduce(s, t, e) {
      return s ? Object.keys(s).reduce((r, o) => t(r, s[o], o, s), e) : e;
    },
    toArray(s) {
      return s ? Object.keys(s).map((t) => ({ key: t, value: s[t] })) : [];
    },
    fromArray(s, t, e) {
      return s ? s.reduce((r, o) => {
        const n = typeof o == "object" ? o[t] : o, i = e ? o[e] : o;
        return n !== void 0 && (r[n] = i), r;
      }, {}) : {};
    },
    size(s) {
      return s ? Object.keys(s).length : 0;
    },
    invert(s) {
      if (!s) return {};
      const t = {};
      return Object.keys(s).forEach((e) => {
        t[s[e]] = e;
      }), t;
    },
    isEqual(s, t) {
      if (s === t) return !0;
      if (!s || !t || typeof s != "object" || typeof t != "object") return !1;
      const e = Object.keys(s), r = Object.keys(t);
      return e.length !== r.length ? !1 : e.every((o) => this.isEqual(s[o], t[o]));
    },
    freeze(s) {
      return s && (Object.freeze(s), Object.keys(s).forEach((t) => {
        typeof s[t] == "object" && this.freeze(s[t]);
      }), s);
    },
    seal(s) {
      return s && Object.seal(s);
    }
  },
  number: {
    isNumber(s) {
      return typeof s == "number" && !isNaN(s);
    },
    isInteger(s) {
      return Number.isInteger(s);
    },
    isFloat(s) {
      return this.isNumber(s) && !Number.isInteger(s);
    },
    isPositive(s) {
      return this.isNumber(s) && s > 0;
    },
    isNegative(s) {
      return this.isNumber(s) && s < 0;
    },
    isZero(s) {
      return this.isNumber(s) && s === 0;
    },
    clamp(s, t, e) {
      return this.isNumber(s) ? Math.min(Math.max(s, t), e) : s;
    },
    round(s, t = 0) {
      if (!this.isNumber(s)) return s;
      const e = Math.pow(10, t);
      return Math.round(s * e) / e;
    },
    floor(s) {
      return this.isNumber(s) ? Math.floor(s) : s;
    },
    ceil(s) {
      return this.isNumber(s) ? Math.ceil(s) : s;
    },
    abs(s) {
      return this.isNumber(s) ? Math.abs(s) : s;
    },
    min(...s) {
      const t = s.filter(this.isNumber);
      return t.length > 0 ? Math.min(...t) : void 0;
    },
    max(...s) {
      const t = s.filter(this.isNumber);
      return t.length > 0 ? Math.max(...t) : void 0;
    },
    sum(...s) {
      return s.flat().filter(this.isNumber).reduce((e, r) => e + r, 0);
    },
    average(...s) {
      const t = s.flat().filter(this.isNumber);
      return t.length > 0 ? this.sum(t) / t.length : 0;
    },
    random(s = 0, t = 1) {
      return Math.random() * (t - s) + s;
    },
    randomInt(s, t) {
      return Math.floor(this.random(s, t + 1));
    },
    format(s, t = 2) {
      return this.isNumber(s) ? s.toFixed(t) : String(s);
    },
    formatCurrency(s, t = "CNY", e = 2) {
      return this.isNumber(s) ? new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: t,
        minimumFractionDigits: e,
        maximumFractionDigits: e
      }).format(s) : String(s);
    },
    formatPercent(s, t = 0) {
      return this.isNumber(s) ? `${(s * 100).toFixed(t)}%` : String(s);
    },
    toFixed(s, t = 0) {
      return this.isNumber(s) ? s.toFixed(t) : String(s);
    },
    toPrecision(s, t = 6) {
      return this.isNumber(s) ? s.toPrecision(t) : String(s);
    },
    isNaN(s) {
      return Number.isNaN(s);
    },
    isFinite(s) {
      return Number.isFinite(s);
    },
    parseInt(s, t = 10) {
      return Number.parseInt(s, t);
    },
    parseFloat(s) {
      return Number.parseFloat(s);
    },
    toNumber(s, t = 0) {
      const e = Number(s);
      return isNaN(e) ? t : e;
    },
    safeDivide(s, t, e = 0) {
      return !this.isNumber(s) || !this.isNumber(t) || t === 0 ? e : s / t;
    },
    safeMultiply(...s) {
      return s.reduce((t, e) => !this.isNumber(t) || !this.isNumber(e) ? 0 : t * e, 1);
    }
  },
  date: {
    now() {
      return Date.now();
    },
    today() {
      const s = /* @__PURE__ */ new Date();
      return s.setHours(0, 0, 0, 0), s;
    },
    tomorrow() {
      const s = this.today();
      return s.setDate(s.getDate() + 1), s;
    },
    yesterday() {
      const s = this.today();
      return s.setDate(s.getDate() - 1), s;
    },
    isDate(s) {
      return s instanceof Date && !isNaN(s.getTime());
    },
    isValid(s) {
      return this.isDate(s);
    },
    parse(s) {
      const t = new Date(s);
      return this.isValid(t) ? t : null;
    },
    format(s, t = "YYYY-MM-DD HH:mm:ss") {
      if (!this.isDate(s)) return "";
      const e = s.getFullYear(), r = String(s.getMonth() + 1).padStart(2, "0"), o = String(s.getDate()).padStart(2, "0"), n = String(s.getHours()).padStart(2, "0"), i = String(s.getMinutes()).padStart(2, "0"), a = String(s.getSeconds()).padStart(2, "0"), l = String(s.getMilliseconds()).padStart(3, "0"), h = ["日", "一", "二", "三", "四", "五", "六"][s.getDay()];
      return t.replace("YYYY", e).replace("MM", r).replace("DD", o).replace("HH", n).replace("mm", i).replace("ss", a).replace("SSS", l).replace("D", s.getDate()).replace("M", s.getMonth() + 1).replace("H", s.getHours()).replace("m", s.getMinutes()).replace("s", s.getSeconds()).replace("W", h);
    },
    toISO(s) {
      return this.isDate(s) ? s.toISOString() : "";
    },
    toUTC(s) {
      return this.isDate(s) ? new Date(s.toUTCString()) : null;
    },
    addDays(s, t) {
      if (!this.isDate(s)) return s;
      const e = new Date(s);
      return e.setDate(e.getDate() + t), e;
    },
    addHours(s, t) {
      if (!this.isDate(s)) return s;
      const e = new Date(s);
      return e.setHours(e.getHours() + t), e;
    },
    addMinutes(s, t) {
      if (!this.isDate(s)) return s;
      const e = new Date(s);
      return e.setMinutes(e.getMinutes() + t), e;
    },
    addSeconds(s, t) {
      if (!this.isDate(s)) return s;
      const e = new Date(s);
      return e.setSeconds(e.getSeconds() + t), e;
    },
    diffDays(s, t) {
      if (!this.isDate(s) || !this.isDate(t)) return 0;
      const e = this.today(), r = this.today();
      return e.setTime(s.getTime()), r.setTime(t.getTime()), Math.floor((e.getTime() - r.getTime()) / (1e3 * 60 * 60 * 24));
    },
    diffHours(s, t) {
      return !this.isDate(s) || !this.isDate(t) ? 0 : Math.floor((s.getTime() - t.getTime()) / (1e3 * 60 * 60));
    },
    diffMinutes(s, t) {
      return !this.isDate(s) || !this.isDate(t) ? 0 : Math.floor((s.getTime() - t.getTime()) / (1e3 * 60));
    },
    diffSeconds(s, t) {
      return !this.isDate(s) || !this.isDate(t) ? 0 : Math.floor((s.getTime() - t.getTime()) / 1e3);
    },
    isToday(s) {
      return this.isDate(s) ? this.diffDays(s, this.today()) === 0 : !1;
    },
    isYesterday(s) {
      return this.isDate(s) ? this.diffDays(s, this.today()) === -1 : !1;
    },
    isTomorrow(s) {
      return this.isDate(s) ? this.diffDays(s, this.today()) === 1 : !1;
    },
    isFuture(s) {
      return this.isDate(s) ? s.getTime() > this.now() : !1;
    },
    isPast(s) {
      return this.isDate(s) ? s.getTime() < this.now() : !1;
    },
    isLeapYear(s) {
      if (!this.isDate(s)) return !1;
      const t = s.getFullYear();
      return t % 4 === 0 && (t % 100 !== 0 || t % 400 === 0);
    },
    getDaysInMonth(s) {
      if (!this.isDate(s)) return 0;
      const t = s.getFullYear(), e = s.getMonth();
      return new Date(t, e + 1, 0).getDate();
    },
    getWeekOfYear(s) {
      if (!this.isDate(s)) return 0;
      const t = new Date(s.getFullYear(), 0, 1), e = s.getTime() - t.getTime();
      return Math.ceil(e / (1e3 * 60 * 60 * 24 * 7));
    },
    getQuarter(s) {
      return this.isDate(s) ? Math.ceil((s.getMonth() + 1) / 3) : 0;
    },
    startOfDay(s) {
      if (!this.isDate(s)) return s;
      const t = new Date(s);
      return t.setHours(0, 0, 0, 0), t;
    },
    endOfDay(s) {
      if (!this.isDate(s)) return s;
      const t = new Date(s);
      return t.setHours(23, 59, 59, 999), t;
    },
    startOfMonth(s) {
      return this.isDate(s) ? new Date(s.getFullYear(), s.getMonth(), 1) : s;
    },
    endOfMonth(s) {
      return this.isDate(s) ? new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59, 999) : s;
    },
    startOfWeek(s, t = 1) {
      if (!this.isDate(s)) return s;
      const e = new Date(s), r = e.getDay(), o = r >= t ? r - t : r + (7 - t);
      return e.setDate(e.getDate() - o), e.setHours(0, 0, 0, 0), e;
    },
    endOfWeek(s, t = 1) {
      if (!this.isDate(s)) return s;
      const e = this.startOfWeek(s, t), r = new Date(e);
      return r.setDate(r.getDate() + 6), r.setHours(23, 59, 59, 999), r;
    },
    getAge(s) {
      if (!this.isDate(s)) return 0;
      const t = /* @__PURE__ */ new Date();
      let e = t.getFullYear() - s.getFullYear();
      return (t.getMonth() < s.getMonth() || t.getMonth() === s.getMonth() && t.getDate() < s.getDate()) && e--, Math.max(0, e);
    },
    fromNow(s) {
      if (!this.isDate(s)) return "";
      const e = this.now() - s.getTime(), r = 60 * 1e3, o = 60 * r, n = 24 * o, i = 7 * n, a = 30 * n, l = 365 * n;
      return e < r ? "刚刚" : e < o ? `${Math.floor(e / r)}分钟前` : e < n ? `${Math.floor(e / o)}小时前` : e < i ? `${Math.floor(e / n)}天前` : e < a ? `${Math.floor(e / i)}周前` : e < l ? `${Math.floor(e / a)}个月前` : `${Math.floor(e / l)}年前`;
    }
  },
  debounce(s, t, e = {}) {
    let r = null, o = null, n = null, i = 0;
    const a = e.leading || !1, l = e.trailing !== !1;
    function c() {
      s.apply(n, o);
    }
    function h() {
      i = Date.now(), a ? (r = setTimeout(u, t), c()) : r = setTimeout(u, t);
    }
    function u() {
      r = null, l && o && c(), o = null, n = null;
    }
    function d() {
      const p = Date.now() - i;
      return Math.max(0, t - p);
    }
    return function(...p) {
      o = p, n = this, i = Date.now(), r ? (clearTimeout(r), r = setTimeout(u, d())) : h();
    };
  },
  throttle(s, t, e = {}) {
    let r = !1;
    const o = e.trailing || !1;
    let n = null, i = null;
    function a() {
      s.apply(i, n), n = null, i = null;
    }
    return function(...l) {
      r ? o && (n = l, i = this) : (r = !0, n = l, i = this, a(), setTimeout(() => {
        r = !1, o && n && a();
      }, t));
    };
  },
  validator: {
    isEmail(s) {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s || "");
    },
    isPhone(s) {
      return /^1[3-9]\d{9}$/.test(s || "");
    },
    isURL(s) {
      return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(s || "");
    },
    isIPv4(s) {
      return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(s || "");
    },
    isIPv6(s) {
      return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(s || "");
    },
    isIP(s) {
      return this.isIPv4(s) || this.isIPv6(s);
    },
    isIDCard(s) {
      return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(s || "");
    },
    isPassport(s) {
      return /^[A-Z][0-9]{8}$|^[A-Z]{2}[0-9]{7}$/.test(s || "");
    },
    isCreditCard(s) {
      const t = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13})$/, e = s.replace(/\s/g, "");
      if (!t.test(e)) return !1;
      let r = 0, o = !1;
      for (let n = e.length - 1; n >= 0; n--) {
        let i = parseInt(e[n], 10);
        o && (i *= 2, i > 9 && (i -= 9)), r += i, o = !o;
      }
      return r % 10 === 0;
    },
    isHexColor(s) {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(s || "");
    },
    isRGB(s) {
      const e = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.exec(s || "");
      return e ? e.slice(1).every((r) => parseInt(r) >= 0 && parseInt(r) <= 255) : !1;
    },
    isRGBA(s) {
      const e = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([01]|0\.\d+)\)$/.exec(s || "");
      if (!e) return !1;
      const [, r, o, n, i] = e;
      return parseInt(r) >= 0 && parseInt(r) <= 255 && parseInt(o) >= 0 && parseInt(o) <= 255 && parseInt(n) >= 0 && parseInt(n) <= 255 && parseFloat(i) >= 0 && parseFloat(i) <= 1;
    },
    isColor(s) {
      return this.isHexColor(s) || this.isRGB(s) || this.isRGBA(s);
    },
    isDate(s) {
      return !isNaN(new Date(s).getTime());
    },
    isJSON(s) {
      try {
        return JSON.parse(s), !0;
      } catch {
        return !1;
      }
    },
    isEmpty(s) {
      return !s || s.trim() === "";
    },
    isWhitespace(s) {
      return /^\s+$/.test(s || "");
    },
    isNumber(s) {
      return !isNaN(parseFloat(s)) && isFinite(s);
    },
    isInteger(s) {
      return /^-?\d+$/.test(s || "");
    },
    isFloat(s) {
      return /^-?\d+\.\d+$/.test(s || "");
    },
    isPositive(s) {
      const t = parseFloat(s);
      return !isNaN(t) && t > 0;
    },
    isNegative(s) {
      const t = parseFloat(s);
      return !isNaN(t) && t < 0;
    },
    isAlpha(s) {
      return /^[a-zA-Z]+$/.test(s || "");
    },
    isAlphaNumeric(s) {
      return /^[a-zA-Z0-9]+$/.test(s || "");
    },
    isChinese(s) {
      return /^[\u4e00-\u9fa5]+$/.test(s || "");
    },
    isLength(s, t, e) {
      const r = (s || "").length;
      return r >= t && (e === void 0 || r <= e);
    },
    minLength(s, t) {
      return (s || "").length >= t;
    },
    maxLength(s, t) {
      return (s || "").length <= t;
    },
    matches(s, t) {
      return t instanceof RegExp ? t.test(s || "") : !1;
    },
    equals(s, t) {
      return String(s) === String(t);
    },
    contains(s, t) {
      return (s || "").includes(t);
    },
    notContains(s, t) {
      return !this.contains(s, t);
    },
    isArray(s) {
      return Array.isArray(s);
    },
    arrayLength(s, t, e) {
      const r = s ? s.length : 0;
      return r >= t && (e === void 0 || r <= e);
    },
    arrayMinLength(s, t) {
      return s ? s.length >= t : !1;
    },
    arrayMaxLength(s, t) {
      return s ? s.length <= t : !1;
    },
    isObject(s) {
      return s !== null && typeof s == "object" && !Array.isArray(s);
    },
    hasKeys(s, t) {
      return !s || !t || !Array.isArray(t) ? !1 : t.every((e) => Object.prototype.hasOwnProperty.call(s, e));
    },
    validate(s, t) {
      const e = {};
      return Object.keys(t).forEach((r) => {
        const o = s[r], n = t[r], i = [];
        n.forEach((a) => {
          if (typeof a == "string") {
            const [l, ...c] = a.split(":");
            this[l](o, ...c) || i.push(l);
          } else if (typeof a == "function") {
            const l = a(o, s);
            l !== !0 && i.push(l || "validation_failed");
          }
        }), i.length > 0 && (e[r] = i);
      }), {
        valid: Object.keys(e).length === 0,
        errors: e
      };
    }
  },
  crypto: {
    md5(s) {
      const t = s ? String(s) : "", e = [
        1732584193,
        4023233417,
        2562383102,
        271733878
      ], r = [
        3614090360,
        3905402710,
        606105819,
        3250441966,
        4118548399,
        1200080426,
        2821735955,
        4249261313,
        1770035416,
        2336552879,
        4294925233,
        2304563134,
        1804603682,
        4254626195,
        2792965006,
        1236535329,
        4129170786,
        3225465664,
        643717713,
        3921069994,
        3593408605,
        38016083,
        3634488961,
        3889429448,
        568446438,
        3275163606,
        4107603335,
        1163531501,
        2850285829,
        4243563512,
        1735328473,
        2368359562,
        4294588738,
        2272392833,
        1839030562,
        4259657740,
        2763975236,
        1272893353,
        4139469664,
        3200236656,
        681279174,
        3936430074,
        3572445317,
        76029189,
        3654602809,
        3873151461,
        530742520,
        3299628645,
        4096336452,
        1126891415,
        2878612391,
        4237533241,
        1700485571,
        2399980690,
        4293915773,
        2240044497,
        1873313359,
        4264355552,
        2734768916,
        1309151649,
        4149444226,
        3174756917,
        718787259,
        3951481745
      ], o = [
        [7, 12, 17, 22],
        [5, 9, 14, 20],
        [4, 11, 16, 23],
        [6, 10, 15, 21]
      ];
      function n(u, d) {
        return u << d | u >>> 32 - d;
      }
      function i(u) {
        const d = u.length * 8;
        for (u += ""; u.length % 64 !== 56; )
          u += "\0";
        const p = d & 4294967295, g = d >>> 32 & 4294967295;
        for (let f = 0; f < 4; f++)
          u += String.fromCharCode(p >>> 8 * f & 255);
        for (let f = 0; f < 4; f++)
          u += String.fromCharCode(g >>> 8 * f & 255);
        return u;
      }
      function a(u, d) {
        const [p, g, f, m] = d, v = [];
        for (let k = 0; k < 16; k++)
          v[k] = u.charCodeAt(k * 4) & 255 | (u.charCodeAt(k * 4 + 1) & 255) << 8 | (u.charCodeAt(k * 4 + 2) & 255) << 16 | (u.charCodeAt(k * 4 + 3) & 255) << 24;
        let y = p, w = g, _ = f, b = m;
        for (let k = 0; k < 64; k++) {
          let S, E;
          const C = Math.floor(k / 16), L = k % 16;
          C === 0 ? (S = w & _ | ~w & b, E = L) : C === 1 ? (S = b & w | ~b & _, E = (5 * L + 1) % 16) : C === 2 ? (S = w ^ _ ^ b, E = (3 * L + 5) % 16) : (S = _ ^ (w | ~b), E = 7 * L % 16);
          const D = b;
          b = _, _ = w, w = w + n(y + S + r[k] + v[E] & 4294967295, o[C][k % 4]), y = D;
        }
        return [
          p + y & 4294967295,
          g + w & 4294967295,
          f + _ & 4294967295,
          m + b & 4294967295
        ];
      }
      const l = i(t);
      let c = [...e];
      for (let u = 0; u < l.length; u += 64)
        c = a(l.substring(u, u + 64), c);
      let h = "";
      return c.forEach((u) => {
        for (let d = 0; d < 4; d++)
          h += (u >>> 8 * d & 255).toString(16).padStart(2, "0");
      }), h;
    },
    sha256(s) {
      const t = s ? String(s) : "", e = [
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ];
      function r(c, h) {
        return c >>> h | c << 32 - h;
      }
      function o(c) {
        const h = c.length * 8;
        for (c += ""; c.length % 64 !== 56; )
          c += "\0";
        const u = h & 4294967295, d = h >>> 32 & 4294967295;
        for (let p = 0; p < 4; p++)
          c += String.fromCharCode(d >>> 8 * p & 255);
        for (let p = 0; p < 4; p++)
          c += String.fromCharCode(u >>> 8 * p & 255);
        return c;
      }
      function n(c, h) {
        const u = [];
        for (let _ = 0; _ < 16; _++)
          u[_] = c.charCodeAt(_ * 4) & 255 | (c.charCodeAt(_ * 4 + 1) & 255) << 8 | (c.charCodeAt(_ * 4 + 2) & 255) << 16 | (c.charCodeAt(_ * 4 + 3) & 255) << 24;
        for (let _ = 16; _ < 64; _++) {
          const b = r(u[_ - 15], 7) ^ r(u[_ - 15], 18) ^ u[_ - 15] >>> 3, k = r(u[_ - 2], 17) ^ r(u[_ - 2], 19) ^ u[_ - 2] >>> 10;
          u[_] = u[_ - 16] + b + u[_ - 7] + k & 4294967295;
        }
        let [d, p, g, f, m, v, y, w] = h;
        for (let _ = 0; _ < 64; _++) {
          const b = r(m, 6) ^ r(m, 11) ^ r(m, 25), k = m & v ^ ~m & y, S = w + b + k + e[_] + u[_] & 4294967295, E = r(d, 2) ^ r(d, 13) ^ r(d, 22), C = d & p ^ d & g ^ p & g, L = E + C & 4294967295;
          w = y, y = v, v = m, m = f + S & 4294967295, f = g, g = p, p = d, d = S + L & 4294967295;
        }
        return [
          h[0] + d & 4294967295,
          h[1] + p & 4294967295,
          h[2] + g & 4294967295,
          h[3] + f & 4294967295,
          h[4] + m & 4294967295,
          h[5] + v & 4294967295,
          h[6] + y & 4294967295,
          h[7] + w & 4294967295
        ];
      }
      const i = o(t);
      let a = [
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ];
      for (let c = 0; c < i.length; c += 64)
        a = n(i.substring(c, c + 64), a);
      let l = "";
      return a.forEach((c) => {
        for (let h = 3; h >= 0; h--)
          l += (c >>> 8 * h & 255).toString(16).padStart(2, "0");
      }), l;
    },
    base64Encode(s) {
      const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let e = "", r = 0;
      const o = s ? s.split("").map((n) => n.charCodeAt(0)) : [];
      for (; r < o.length; ) {
        const n = o[r++], i = o[r++] || 0, a = o[r++] || 0, l = n >> 2, c = (n & 3) << 4 | i >> 4, h = (i & 15) << 2 | a >> 6, u = a & 63;
        e += t[l] + t[c] + (r > o.length + 1 ? "=" : t[h]) + (r > o.length ? "=" : t[u]);
      }
      return e;
    },
    base64Decode(s) {
      const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let e = "", r = 0;
      for (s = s.replace(/[^A-Za-z0-9+/=]/g, ""); r < s.length; ) {
        const o = t.indexOf(s.charAt(r++)), n = t.indexOf(s.charAt(r++)), i = t.indexOf(s.charAt(r++)), a = t.indexOf(s.charAt(r++)), l = o << 2 | n >> 4, c = (n & 15) << 4 | i >> 2, h = (i & 3) << 6 | a;
        e += String.fromCharCode(l), i !== 64 && (e += String.fromCharCode(c)), a !== 64 && (e += String.fromCharCode(h));
      }
      return e;
    },
    uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
        const t = Math.random() * 16 | 0;
        return (s === "x" ? t : t & 3 | 8).toString(16);
      });
    }
  },
  preload: {
    cache: /* @__PURE__ */ new Map(),
    async loadImage(s, t = {}) {
      const { crossOrigin: e = "anonymous" } = t;
      return this.cache.has(s) ? this.cache.get(s) : new Promise((r, o) => {
        const n = new Image();
        n.crossOrigin = e, n.onload = () => {
          this.cache.set(s, n), r(n);
        }, n.onerror = () => {
          o(new Error(`Failed to load image: ${s}`));
        }, n.src = s;
      });
    },
    async loadImages(s, t = {}) {
      const { parallel: e = !0 } = t;
      if (e)
        return Promise.all(s.map((o) => this.loadImage(o, t)));
      const r = [];
      for (const o of s)
        r.push(await this.loadImage(o, t));
      return r;
    },
    async loadScript(s, t = {}) {
      const { type: e = "text/javascript", async: r = !0, defer: o = !1 } = t;
      return this.cache.has(s) ? this.cache.get(s) : new Promise((n, i) => {
        const a = document.createElement("script");
        a.type = e, a.async = r, a.defer = o, a.onload = () => {
          this.cache.set(s, a), n(a);
        }, a.onerror = () => {
          a.remove(), i(new Error(`Failed to load script: ${s}`));
        }, a.src = s, document.head.appendChild(a);
      });
    },
    async loadStylesheet(s, t = {}) {
      const { media: e = "all" } = t;
      return this.cache.has(s) ? this.cache.get(s) : new Promise((r, o) => {
        const n = document.createElement("link");
        n.rel = "stylesheet", n.href = s, n.media = e, n.onload = () => {
          this.cache.set(s, n), r(n);
        }, n.onerror = () => {
          n.remove(), o(new Error(`Failed to load stylesheet: ${s}`));
        }, document.head.appendChild(n);
      });
    },
    async loadFont(s, t, e = {}) {
      const { weight: r = "normal", style: o = "normal" } = e, n = new FontFace(s, `url(${t})`, { weight: r, style: o });
      try {
        return await n.load(), document.fonts.add(n), n;
      } catch {
        throw new Error(`Failed to load font: ${s}`);
      }
    },
    async preload(s, t = "image") {
      switch (t) {
        case "image":
          return this.loadImage(s);
        case "script":
          return this.loadScript(s);
        case "stylesheet":
        case "style":
          return this.loadStylesheet(s);
        default:
          throw new Error(`Unsupported preload type: ${t}`);
      }
    },
    isLoaded(s) {
      return this.cache.has(s);
    },
    clearCache() {
      this.cache.clear();
    },
    clearCacheByUrl(s) {
      this.cache.delete(s);
    }
  }
};
window.KupolaUtils = Vt;
window.kupolaUtils = Vt;
class _t {
  constructor() {
    this.children = {}, this.keys = [];
  }
}
class N {
  constructor() {
    this.root = new _t();
  }
  insert(t) {
    let e = this.root;
    const r = t.split(".");
    r.forEach((o, n) => {
      e.children[o] || (e.children[o] = new _t()), e = e.children[o], n === r.length - 1 && e.keys.push(t);
    });
  }
  getSubKeys(t) {
    let e = this.root;
    const r = t.split("."), o = [];
    for (let n = 0; n < r.length; n++) {
      const i = r[n];
      if (!e.children[i])
        break;
      e = e.children[i];
      const a = (l) => {
        l.keys.length > 0 && o.push(...l.keys), Object.values(l.children).forEach((c) => a(c));
      };
      a(e);
    }
    return [...new Set(o)];
  }
  getParentKeys(t) {
    const e = t.split("."), r = [];
    for (let o = 1; o <= e.length; o++) {
      const n = e.slice(0, o).join(".");
      r.push(n);
    }
    return r;
  }
}
const x = {
  parent: Symbol("reactive_parent"),
  path: Symbol("reactive_path"),
  isReactive: Symbol("reactive_is_reactive")
};
class Ut {
  constructor() {
    this.rawData = {}, this.data = null, this.observers = {}, this.elements = {}, this.computedProperties = {}, this.pathTrie = new N(), this.updateQueue = /* @__PURE__ */ new Map(), this.isProcessing = !1, this.pendingComputed = /* @__PURE__ */ new Set(), this.persistedKeys = /* @__PURE__ */ new Map(), this.snapshots = [], this.snapshotLimit = 10, this._proxyCache = /* @__PURE__ */ new WeakMap(), this.createReactiveData();
  }
  createReactiveData() {
    const t = {
      get: (e, r, o) => {
        if (r === "__raw__") return e;
        const n = Reflect.get(e, r, o);
        return n && typeof n == "object" && !Array.isArray(n) ? this.wrapReactive(n, r) : n;
      },
      set: (e, r, o, n) => {
        const i = Reflect.get(e, r, n), a = Reflect.set(e, r, o, n), l = this.resolvePath(e, r);
        return this.notify(l, o, i), this.queueUpdate(l, o), a;
      },
      deleteProperty: (e, r) => {
        const o = Reflect.get(e, r, receiver), n = Reflect.deleteProperty(e, r), i = this.resolvePath(e, r);
        return this.notify(i, void 0, o), this.queueUpdate(i, void 0), n;
      }
    };
    this.data = new Proxy(this.rawData, t), this.data.__parent__ = null, this.data.__path__ = "";
  }
  wrapReactive(t, e) {
    if (t[x.isReactive]) return t;
    if (this._proxyCache.has(t))
      return this._proxyCache.get(t);
    const r = {
      get: (n, i, a) => {
        if (i === "__raw__") return n;
        if (i === x.parent || i === "__parent__") return n[x.parent];
        if (i === x.path || i === "__path__") return n[x.path];
        if (i === x.isReactive || i === "__isReactive__") return !0;
        const l = Reflect.get(n, i, a);
        return l && typeof l == "object" && !Array.isArray(l) ? this.wrapReactive(l, `${n[x.path]}${n[x.path] ? "." : ""}${i}`) : l;
      },
      set: (n, i, a, l) => {
        if (i === x.parent || i === x.path || i === x.isReactive || i === "__parent__" || i === "__path__" || i === "__isReactive__")
          return !0;
        const c = Reflect.get(n, i, l), h = Reflect.set(n, i, a, l), u = `${n[x.path]}${n[x.path] ? "." : ""}${i}`;
        return this.notify(u, a, c), this.queueUpdate(u, a), h;
      },
      deleteProperty: (n, i) => {
        if (i === x.parent || i === x.path || i === x.isReactive)
          return !1;
        const a = Reflect.get(n, i), l = Reflect.deleteProperty(n, i), c = `${n[x.path]}${n[x.path] ? "." : ""}${i}`;
        return this.notify(c, void 0, a), this.queueUpdate(c, void 0), l;
      },
      has: (n, i) => i === "__raw__" || i === x.parent || i === x.path || i === x.isReactive || i === "__parent__" || i === "__path__" || i === "__isReactive__" ? !0 : i in n,
      ownKeys: (n) => Reflect.ownKeys(n).filter(
        (i) => i !== x.parent && i !== x.path && i !== x.isReactive
      ),
      getOwnPropertyDescriptor: (n, i) => i === x.parent || i === x.path || i === x.isReactive ? {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: n[i]
      } : Reflect.getOwnPropertyDescriptor(n, i)
    }, o = new Proxy(t, r);
    return t[x.parent] = t, t[x.path] = e, t[x.isReactive] = !0, this._proxyCache.set(t, o), Object.keys(t).forEach((n) => {
      t[n] && typeof t[n] == "object" && !Array.isArray(t[n]) && (t[n] = this.wrapReactive(t[n], `${e}${e ? "." : ""}${n}`));
    }), o;
  }
  resolvePath(t, e) {
    return t[x.path] ? `${t[x.path]}.${e}` : e;
  }
  queueUpdate(t, e) {
    this.updateQueue.set(t, e), this.isProcessing || (this.isProcessing = !0, requestAnimationFrame(() => {
      this.processQueue();
    }));
  }
  processQueue() {
    const t = /* @__PURE__ */ new Set();
    this.updateQueue.forEach((e, r) => {
      t.add(r), this.updateElementsDirect(r, e), this.pathTrie.getSubKeys(r).forEach((n) => {
        if (!t.has(n)) {
          const i = this.get(n);
          this.updateElementsDirect(n, i), t.add(n);
        }
      });
    }), this.updateQueue.clear(), this.processComputed(), this.isProcessing = !1;
  }
  updateElementsDirect(t, e) {
    this.elements[t] && this.elements[t].forEach((r) => {
      this.updateElement(r, e);
    });
  }
  processComputed() {
    Object.keys(this.computedProperties).forEach((e) => {
      this.computedProperties[e].deps.some((n) => this.updateQueue.has(n) || this.pathTrie.getSubKeys(n).some((i) => this.updateQueue.has(i))) && this.updateComputedProperty(e);
    });
  }
  set(t, e, r = !1) {
    const o = this.get(t);
    typeof t == "object" ? (Object.assign(this.rawData, t), Object.keys(t).forEach((n) => {
      r || (this.notify(n, t[n], o?.[n]), this.queueUpdate(n, t[n]));
    })) : (t.includes(".") ? this.setNested(t, e) : this.rawData[t] = e, r || (this.notify(t, e, o), this.queueUpdate(t, e))), r || this.processComputed();
  }
  get(t) {
    if (t)
      return t.includes(".") ? this.getNested(t) : this.rawData[t];
  }
  getNested(t) {
    if (t)
      return t.split(".").reduce((e, r) => e?.[r], this.rawData);
  }
  setNested(t, e) {
    const r = t.split("."), o = r.pop(), n = r.reduce((a, l) => (a[l] || (a[l] = {}), a[l]), this.rawData), i = n[o];
    n[o] = e, this.notify(t, e, i), this.queueUpdate(t, e);
  }
  observe(t, e) {
    this.observers[t] || (this.observers[t] = []), this.observers[t].push(e);
  }
  unobserve(t, e) {
    this.observers[t] && (this.observers[t] = this.observers[t].filter((r) => r !== e));
  }
  notify(t, e, r) {
    this.observers[t] && this.observers[t].forEach((o) => {
      try {
        o(e, r);
      } catch (n) {
        console.error(`Observer error for ${t}:`, n);
      }
    }), this.observers["*"]?.forEach((o) => {
      try {
        o(t, e, r);
      } catch (n) {
        console.error("Wildcard observer error:", n);
      }
    });
  }
  updateElement(t, e) {
    const r = t.getAttribute("data-bind");
    if (!r) return;
    r.split("|").forEach((n) => {
      const i = n.split(":"), a = i[0].trim(), l = i[1]?.trim();
      switch (a) {
        case "text":
          t.textContent !== String(e ?? "") && (t.textContent = e ?? "");
          break;
        case "html":
          t.innerHTML !== String(e ?? "") && (t.innerHTML = e ?? "");
          break;
        case "value":
          t.type === "checkbox" ? t.checked !== !!e && (t.checked = !!e) : t.value !== String(e ?? "") && (t.value = e ?? "");
          break;
        case "checked":
          t.checked !== !!e && (t.checked = !!e);
          break;
        case "disabled":
          t.disabled !== !!e && (t.disabled = !!e);
          break;
        case "hidden":
          const c = e ? "none" : "";
          t.style.display !== c && (t.style.display = c);
          break;
        case "class":
          l && (e ? t.classList.add(l) : t.classList.remove(l));
          break;
        case "style":
          l && t.style[l] !== String(e ?? "") && (t.style[l] = e ?? "");
          break;
        case "attr":
          l && t.getAttribute(l) !== String(e ?? "") && t.setAttribute(l, e ?? "");
          break;
        case "src":
          t.src !== String(e ?? "") && (t.src = e ?? "");
          break;
        case "href":
          t.href !== String(e ?? "") && (t.href = e ?? "");
          break;
        case "placeholder":
          t.placeholder !== String(e ?? "") && (t.placeholder = e ?? "");
          break;
      }
    });
  }
  computed(t, e, r) {
    this.computedProperties[t] = { deps: e, callback: r }, e.forEach((o) => {
      this.pathTrie.insert(o);
    }), this.updateComputedProperty(t);
  }
  updateComputedProperty(t) {
    const e = this.computedProperties[t];
    if (e)
      try {
        const r = e.deps.map((n) => this.get(n)), o = e.callback(...r);
        this.set(t, o, !0);
      } catch (r) {
        console.error(`Computed error for ${t}:`, r);
      }
  }
  load(t) {
    Object.keys(t).forEach((e) => {
      t[e] && typeof t[e] == "object" && !Array.isArray(t[e]) ? this.rawData[e] = this.wrapReactive(t[e], e) : this.rawData[e] = t[e], this.queueUpdate(e, this.rawData[e]);
    }), this.processComputed();
  }
  reset() {
    this.rawData = {}, this.observers = {}, this.elements = {}, this.computedProperties = {}, this.pathTrie = new N(), this.updateQueue.clear(), this.snapshots = [], this.createReactiveData(), this.bind();
  }
  persist(t, e = {}) {
    const {
      storage: r = "local",
      debounce: o = 0,
      version: n = 1,
      encrypt: i = !1,
      encryptionKey: a = null
    } = e, l = r === "session" ? sessionStorage : localStorage;
    this.persistedKeys.set(t, {
      storage: l,
      debounce: o,
      timeout: null,
      version: n,
      encrypt: i,
      encryptionKey: a
    });
    const c = this.get(t);
    c !== void 0 && this._persistSave(t, c, l, { version: n, encrypt: i, encryptionKey: a }), this.observe(t, (h) => {
      const u = this.persistedKeys.get(t);
      u && (u.debounce > 0 ? (u.timeout && clearTimeout(u.timeout), u.timeout = setTimeout(() => {
        this._persistSave(t, h, u.storage, {
          version: u.version,
          encrypt: u.encrypt,
          encryptionKey: u.encryptionKey
        });
      }, u.debounce)) : this._persistSave(t, h, u.storage, {
        version: u.version,
        encrypt: u.encrypt,
        encryptionKey: u.encryptionKey
      }));
    });
  }
  _persistSave(t, e, r, o = {}) {
    try {
      const { version: n = 1, encrypt: i = !1, encryptionKey: a = null } = o, l = {
        value: e,
        version: n,
        timestamp: Date.now()
      };
      let c = JSON.stringify(l);
      i && a && (c = this._encrypt(c, a)), this._ensureStorageCapacity(r), r.setItem(`kupola:${t}`, c);
    } catch (n) {
      if (console.warn(`Failed to persist key ${t}:`, n), n.name === "QuotaExceededError" && r === localStorage) {
        console.warn(`localStorage quota exceeded, trying sessionStorage for key ${t}`);
        try {
          sessionStorage.setItem(`kupola:${t}`, JSON.stringify({ value: e, version: 1 }));
        } catch (i) {
          console.warn(`sessionStorage also failed for key ${t}:`, i);
        }
      }
    }
  }
  _ensureStorageCapacity(t) {
    try {
      const e = "kupola:__storage_test__";
      t.setItem(e, "test"), t.removeItem(e);
    } catch (e) {
      e.name === "QuotaExceededError" && this._cleanupOldStorage(t);
    }
  }
  _cleanupOldStorage(t) {
    const e = Date.now(), r = 30 * 24 * 60 * 60 * 1e3;
    for (let o = 0; o < t.length; o++) {
      const n = t.key(o);
      if (n?.startsWith("kupola:"))
        try {
          const i = JSON.parse(t.getItem(n));
          i.timestamp && e - i.timestamp > r && t.removeItem(n);
        } catch {
          t.removeItem(n);
        }
    }
  }
  _encrypt(t, e) {
    return window.CryptoJS ? window.CryptoJS.AES.encrypt(t, e).toString() : (console.warn("CryptoJS not available, encryption skipped"), t);
  }
  _decrypt(t, e) {
    if (!window.CryptoJS)
      return console.warn("CryptoJS not available, decryption skipped"), t;
    try {
      return window.CryptoJS.AES.decrypt(t, e).toString(window.CryptoJS.enc.Utf8);
    } catch (r) {
      return console.warn("Decryption failed:", r), t;
    }
  }
  unpersist(t) {
    const e = this.persistedKeys.get(t);
    e && (e.timeout && clearTimeout(e.timeout), e.storage.removeItem(`kupola:${t}`), this.persistedKeys.delete(t));
  }
  loadPersisted(t = {}) {
    const e = {}, { encryptionKey: r = null } = t;
    for (let o = 0; o < localStorage.length; o++) {
      const n = localStorage.key(o);
      if (n?.startsWith("kupola:")) {
        const i = n.replace("kupola:", "");
        try {
          const a = localStorage.getItem(n);
          let l;
          if (r) {
            const c = this._decrypt(a, r);
            l = JSON.parse(c);
          } else
            l = JSON.parse(a);
          if (l.version !== void 0 && l.version !== t.version) {
            console.debug(`Skipping outdated data for ${i} (version ${l.version})`);
            continue;
          }
          e[i] = l.value !== void 0 ? l.value : l;
        } catch (a) {
          console.warn(`Failed to load persisted key ${i}:`, a);
        }
      }
    }
    for (let o = 0; o < sessionStorage.length; o++) {
      const n = sessionStorage.key(o);
      if (n?.startsWith("kupola:")) {
        const i = n.replace("kupola:", "");
        try {
          const a = sessionStorage.getItem(n);
          let l;
          if (r) {
            const c = this._decrypt(a, r);
            l = JSON.parse(c);
          } else
            l = JSON.parse(a);
          if (l.version !== void 0 && l.version !== t.version) {
            console.debug(`Skipping outdated data for ${i} (version ${l.version})`);
            continue;
          }
          e[i] = l.value !== void 0 ? l.value : l;
        } catch {
        }
      }
    }
    return Object.keys(e).length > 0 && this.load(e), e;
  }
  _clone(t) {
    if (typeof structuredClone == "function")
      try {
        return structuredClone(t);
      } catch (e) {
        console.warn("structuredClone failed, falling back to JSON:", e);
      }
    return JSON.parse(JSON.stringify(t));
  }
  snapshot() {
    const t = this._clone(this.rawData);
    return this.snapshots.push(t), this.snapshots.length > this.snapshotLimit && this.snapshots.shift(), this.snapshots.length - 1;
  }
  rollback(t = -1) {
    if (this.snapshots.length === 0) return !1;
    const e = t >= 0 ? t : this.snapshots.length - 1, r = this.snapshots[e];
    return r ? (this.rawData = this._clone(r), this.createReactiveData(), Object.keys(this.rawData).forEach((o) => {
      this.queueUpdate(o, this.rawData[o]);
    }), this.processComputed(), !0) : !1;
  }
  getSnapshotCount() {
    return this.snapshots.length;
  }
  clearSnapshots() {
    this.snapshots = [];
  }
  serializeForm(t) {
    const e = {};
    return t.querySelectorAll("input, select, textarea").forEach((r) => {
      const o = r.getAttribute("data-bind");
      if (!o) return;
      const i = o.split(":")[1]?.trim();
      i && (r.type === "checkbox" ? (e[i] || (e[i] = []), r.checked && e[i].push(r.value)) : r.type === "radio" ? r.checked && (e[i] = r.value) : e[i] = r.value);
    }), e;
  }
  fillForm(t, e) {
    Object.keys(e).forEach((r) => {
      t.querySelectorAll('[data-bind*=":' + r + '"]').forEach((o) => {
        o.type === "checkbox" ? o.checked = Array.isArray(e[r]) ? e[r].includes(o.value) : !!e[r] : o.type === "radio" ? o.checked = o.value === e[r] : o.value = e[r] ?? "";
      });
    });
  }
  createReactive(t, e = "") {
    if (t[x.isReactive]) return t;
    if (this._proxyCache.has(t))
      return this._proxyCache.get(t);
    const r = {
      get: (n, i, a) => {
        if (i === "__raw__") return n;
        if (i === x.parent || i === "__parent__") return n[x.parent];
        if (i === x.path || i === "__path__") return n[x.path];
        if (i === x.isReactive || i === "__isReactive__") return !0;
        const l = Reflect.get(n, i, a);
        return l && typeof l == "object" && !Array.isArray(l) ? this.wrapReactive(l, `${n[x.path]}${n[x.path] ? "." : ""}${i}`) : l;
      },
      set: (n, i, a, l) => {
        if (i === x.parent || i === x.path || i === x.isReactive || i === "__parent__" || i === "__path__" || i === "__isReactive__")
          return !0;
        const c = Reflect.get(n, i, l), h = Reflect.set(n, i, a, l), u = `${n[x.path]}${n[x.path] ? "." : ""}${i}`;
        return this.notify(u, a, c), this.queueUpdate(u, a), h;
      },
      deleteProperty: (n, i) => {
        if (i === x.parent || i === x.path || i === x.isReactive)
          return !1;
        const a = Reflect.get(n, i), l = Reflect.deleteProperty(n, i), c = `${n[x.path]}${n[x.path] ? "." : ""}${i}`;
        return this.notify(c, void 0, a), this.queueUpdate(c, void 0), l;
      },
      has: (n, i) => i === "__raw__" || i === x.parent || i === x.path || i === x.isReactive || i === "__parent__" || i === "__path__" || i === "__isReactive__" ? !0 : i in n,
      ownKeys: (n) => Reflect.ownKeys(n).filter(
        (i) => i !== x.parent && i !== x.path && i !== x.isReactive
      ),
      getOwnPropertyDescriptor: (n, i) => i === x.parent || i === x.path || i === x.isReactive ? {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: n[i]
      } : Reflect.getOwnPropertyDescriptor(n, i)
    }, o = new Proxy(t, r);
    return t[x.parent] = t, t[x.path] = e, t[x.isReactive] = !0, this._proxyCache.set(t, o), Object.keys(t).forEach((n) => {
      t[n] && typeof t[n] == "object" && !Array.isArray(t[n]) && (t[n] = this.wrapReactive(t[n], `${e}${e ? "." : ""}${n}`));
    }), o;
  }
  bind() {
    document.querySelectorAll("[data-bind]").forEach((t) => {
      this._bindElement(t);
    }), this._mutationObserver || (this._mutationObserver = new MutationObserver((t) => {
      t.forEach((e) => {
        e.addedNodes.forEach((r) => {
          r.nodeType === Node.ELEMENT_NODE && (r.querySelectorAll("[data-bind]").forEach((n) => this._bindElement(n)), r.hasAttribute && r.hasAttribute("data-bind") && this._bindElement(r));
        });
      });
    }), this._mutationObserver.observe(document.body, {
      childList: !0,
      subtree: !0
    }));
  }
  _bindElement(t) {
    const r = t.getAttribute("data-bind").split(":");
    r[0].split("|")[0].trim();
    const o = r[1]?.trim();
    if (o) {
      if (this.pathTrie.insert(o), this.elements[o] || (this.elements[o] = []), this.elements[o].includes(t) || this.elements[o].push(t), t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
        const n = t.__kupolaBindHandler;
        n && t.removeEventListener("input", n);
        const i = () => {
          const a = t.type === "checkbox" ? t.checked : t.value;
          o.includes(".") ? this.setNested(o, a) : this.set(o, a);
        };
        t.__kupolaBindHandler = i, t.addEventListener("input", i);
      }
      this.rawData[o] !== void 0 && this.updateElement(t, this.rawData[o]);
    }
  }
  destroy() {
    this._mutationObserver && (this._mutationObserver.disconnect(), this._mutationObserver = null), Object.values(this.elements).forEach((t) => {
      t.forEach((e) => {
        const r = e.__kupolaBindHandler;
        r && (e.removeEventListener("input", r), delete e.__kupolaBindHandler);
      });
    }), this.persistedKeys.forEach((t, e) => {
      t.timeout && clearTimeout(t.timeout);
    }), this.persistedKeys.clear(), this.rawData = {}, this.observers = {}, this.elements = {}, this.computedProperties = {}, this.pathTrie = new N(), this.updateQueue.clear(), this.snapshots = [];
  }
}
class rt {
  constructor(t, e = {}) {
    this.name = t, this._stateKey = `__store_${t}__`;
    const r = e.state ? e.state() : {};
    this.getters = e.getters || {}, this.actions = e.actions || {}, this.mutations = e.mutations || {}, this.observers = {}, window.kupolaData ? (window.kupolaData.set(this._stateKey, r), this.state = window.kupolaData.data?.[this._stateKey] || window.kupolaData.createReactive(r, this._stateKey), window.kupolaData.observe(this._stateKey, (o) => {
      this.notify(o);
    })) : this.state = r, this._bindGetters(), this._bindActions();
  }
  _bindGetters() {
    Object.keys(this.getters).forEach((t) => {
      Object.defineProperty(this, t, {
        get: () => this.getters[t](this.state),
        enumerable: !0
      });
    });
  }
  _bindActions() {
    Object.keys(this.actions).forEach((t) => {
      this[t] = (...e) => this.actions[t]({
        state: this.state,
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this),
        getters: this
      }, ...e);
    });
  }
  commit(t, e) {
    const r = this.mutations[t];
    if (!r) {
      console.warn(`Mutation ${t} not found in store ${this.name}`);
      return;
    }
    r(this.state, e);
  }
  dispatch(t, e) {
    const r = this.actions[t];
    if (!r) {
      console.warn(`Action ${t} not found in store ${this.name}`);
      return;
    }
    return r({
      state: this.state,
      commit: this.commit.bind(this),
      dispatch: this.dispatch.bind(this),
      getters: this
    }, e);
  }
  observe(t) {
    return this.observers["*"] || (this.observers["*"] = []), this.observers["*"].push(t), t;
  }
  unobserve(t) {
    this.observers["*"] && (this.observers["*"] = this.observers["*"].filter((e) => e !== t));
  }
  notify(t) {
    this.observers["*"] && this.observers["*"].forEach((e) => {
      try {
        e(t);
      } catch (r) {
        console.error(`Observer error for store ${this.name}:`, r);
      }
    }), window.kupolaData && window.kupolaData.set(this.name, t);
  }
  toJSON() {
    return {
      name: this.name,
      state: this.state,
      getters: Object.keys(this.getters).reduce((t, e) => (t[e] = this[e], t), {})
    };
  }
}
class Wt {
  constructor() {
    this.stores = /* @__PURE__ */ new Map();
  }
  createStore(t, e) {
    const r = new rt(t, e);
    return this.stores.set(t, r), r;
  }
  getStore(t) {
    return this.stores.get(t);
  }
  registerStore(t) {
    t instanceof rt && this.stores.set(t.name, t);
  }
  dispose() {
    this.stores.clear();
  }
}
class Yt {
  constructor() {
    this.events = {}, this.delegatedEvents = {}, this.eventListeners = {};
  }
  on(t, e) {
    return this.events[t] || (this.events[t] = []), this.events[t].push(e), e;
  }
  off(t, e) {
    this.events[t] && (this.events[t] = this.events[t].filter((r) => r !== e));
  }
  emit(t, e) {
    this.events[t] && this.events[t].forEach((r) => {
      try {
        r(e);
      } catch (o) {
        console.error(`Error in event handler for ${t}:`, o);
      }
    }), this.events["*"]?.forEach((r) => {
      try {
        r(t, e);
      } catch (o) {
        console.error("Error in wildcard event handler:", o);
      }
    });
  }
  once(t, e) {
    const r = (o) => {
      e(o), this.off(t, r);
    };
    return this.on(t, r), r;
  }
  delegate(t, e, r) {
    if (!this.delegatedEvents[e]) {
      this.delegatedEvents[e] = [];
      const o = (n) => {
        this.delegatedEvents[e].forEach(({ selector: i, cb: a }) => {
          (n.target.matches(i) || n.target.closest(i)) && a(n);
        });
      };
      document.addEventListener(e, o), this.eventListeners[e] = o;
    }
    return this.delegatedEvents[e].push({ selector: t, cb: r }), r;
  }
  undelegate(t, e) {
    if (this.delegatedEvents[e] && (this.delegatedEvents[e] = this.delegatedEvents[e].filter(
      (r) => r.selector !== t
    ), this.delegatedEvents[e].length === 0)) {
      const r = this.eventListeners[e];
      r && (document.removeEventListener(e, r), delete this.eventListeners[e]), delete this.delegatedEvents[e];
    }
  }
  destroy() {
    Object.entries(this.eventListeners).forEach(([t, e]) => {
      document.removeEventListener(t, e);
    }), this.events = {}, this.delegatedEvents = {}, this.eventListeners = {};
  }
}
const ot = new Ut(), ae = new Yt(), lt = new Wt();
function le(s, t) {
  return lt.createStore(s, t);
}
function ce(s) {
  return lt.getStore(s);
}
document.addEventListener("DOMContentLoaded", () => {
  ot.loadPersisted(), ot.bind();
});
window.KupolaDataBind = Ut;
window.KupolaEventBus = Yt;
window.KupolaStore = rt;
window.KupolaStoreManager = Wt;
window.kupolaData = ot;
window.kupolaEvents = ae;
window.kupolaStoreManager = lt;
window.createStore = le;
window.getStore = ce;
var K = { exports: {} }, wt;
function de() {
  return wt || (wt = 1, function(s) {
    const t = "kupola-theme", e = "kupola-brand", r = [
      { id: "green", name: "翠绿", color: "#32F08C" },
      { id: "xionghuang", name: "雄黄", color: "#FF9900" },
      { id: "jianghuang", name: "姜黄", color: "#E2C027" },
      { id: "lanlv", name: "蓝绿", color: "#12A182" },
      { id: "kongquelan", name: "孔雀蓝", color: "#0EB0C9" },
      { id: "meiguizi", name: "玫瑰紫", color: "#BA2F7B" },
      { id: "shihong", name: "柿红", color: "#F2481B" },
      { id: "quhong", name: "紫云", color: "#B1A6CC" },
      { id: "shanchahong", name: "山茶红", color: "#F05A46" },
      { id: "zengqing", name: "曾青", color: "#535164" },
      { id: "roulan", name: "柔蓝", color: "#106898" }
    ];
    function o() {
      return localStorage.getItem(t) || "dark";
    }
    function n(d) {
      if (d !== "dark" && d !== "light") return;
      document.documentElement.setAttribute("data-theme", d), localStorage.setItem(t, d);
      const p = document.querySelector("[data-theme-toggle]");
      if (p) {
        p.setAttribute("data-current-theme", d);
        const g = p.querySelector(".theme-icon");
        if (g) {
          const f = g.src.substring(0, g.src.lastIndexOf("/") + 1);
          g.src = d === "dark" ? f + "sun.svg" : f + "moon.svg";
        }
      }
    }
    function i() {
      return localStorage.getItem(e) || "zengqing";
    }
    function a(d) {
      const p = r.find((m) => m.id === d);
      if (!p) return;
      document.documentElement.setAttribute("data-brand", d), localStorage.setItem(e, d);
      const g = document.querySelector("[data-brand-toggle]");
      if (g) {
        g.setAttribute("data-current-brand", d);
        const m = g.querySelector(".brand-icon");
        m && (m.style.backgroundColor = p.color);
        const v = g.querySelector(".brand-name");
        v && (v.textContent = p.name);
      }
      document.querySelectorAll("[data-brand-btn]").forEach((m) => {
        m.getAttribute("data-brand-btn") === d ? m.classList.add("is-active") : m.classList.remove("is-active");
      });
    }
    function l() {
      const d = o();
      n(d);
      const p = i();
      a(p);
      const g = document.querySelector("[data-theme-toggle]");
      g && g.addEventListener("click", () => {
        const _ = o() === "dark" ? "light" : "dark";
        n(_);
      });
      let f = document.getElementById("brand-picker");
      f || (f = document.createElement("div"), f.id = "brand-picker", f.style.position = "fixed", f.style.top = "64px", f.style.right = "16px", f.style.zIndex = "9998", f.style.display = "none", f.style.padding = "12px", f.style.width = "200px", f.style.gridTemplateColumns = "repeat(3, 1fr)", f.style.gap = "6px", f.style.backgroundColor = "var(--bg-base-secondary)", f.style.border = "1px solid var(--border-neutral-l1)", f.style.borderRadius = "8px", f.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)", f.style.overflow = "hidden", r.forEach((w) => {
        const _ = document.createElement("button");
        _.setAttribute("data-brand-btn", w.id), _.style.display = "flex", _.style.justifyContent = "center", _.style.alignItems = "center", _.style.height = "60px", _.style.backgroundColor = w.color, _.style.color = ["#32F08C", "#FF9900", "#E2C027", "#0EB0C9", "#B1A6CC"].includes(w.color) ? "#0C0C0D" : "#FFFFFF", _.style.fontWeight = "500", _.style.borderRadius = "4px", _.style.border = "none", _.style.cursor = "pointer", _.style.margin = "0", _.style.padding = "0", _.textContent = w.name, f.appendChild(_);
      }), document.body.appendChild(f));
      const m = document.querySelector("[data-brand-toggle]");
      m && f && (m.onclick = function(w) {
        w.stopPropagation(), w.preventDefault();
        const _ = f.style.display === "none";
        f.style.display = _ ? "grid" : "none", _ ? setTimeout(() => {
          document.addEventListener("click", v, !0);
        }, 0) : document.removeEventListener("click", v, !0);
      }, f.onclick = function(w) {
        w.stopPropagation();
      });
      function v(w) {
        f && m && !f.contains(w.target) && !m.contains(w.target) && (f.style.display = "none", document.removeEventListener("click", v, !0));
      }
      document.querySelectorAll("[data-brand-btn]").forEach((w) => {
        w.addEventListener("click", (_) => {
          _.stopPropagation();
          const b = w.getAttribute("data-brand-btn");
          a(b), f && (f.style.display = "none");
        });
      });
    }
    function c() {
      const d = document.createElement("button");
      d.setAttribute("data-theme-toggle", ""), d.setAttribute("data-current-theme", o()), d.className = "ds-btn ds-btn--ghost ds-btn--sm ds-btn--icon", d.style.position = "fixed", d.style.top = "16px", d.style.right = "16px", d.style.zIndex = "9999";
      const p = document.createElement("img");
      p.className = "theme-icon";
      const g = document.getElementsByTagName("script"), f = g[g.length - 1], m = f.src.substring(0, f.src.lastIndexOf("/") + 1);
      return p.src = o() === "dark" ? m + "../icons/sun.svg" : m + "../icons/moon.svg", p.width = 14, p.height = 14, p.alt = "Toggle theme", d.appendChild(p), document.body.appendChild(d), d.addEventListener("click", () => {
        const y = o() === "dark" ? "light" : "dark";
        n(y);
      }), d;
    }
    function h() {
      const d = document.createElement("div");
      d.id = "brand-picker-auto", d.style.position = "fixed", d.style.top = "56px", d.style.right = "16px", d.style.zIndex = "9998", d.style.display = "none", d.style.padding = "12px", d.style.width = "200px", d.style.gridTemplateColumns = "repeat(3, 1fr)", d.style.gap = "6px", d.style.backgroundColor = "var(--bg-base-secondary)", d.style.border = "1px solid var(--border-neutral-l1)", d.style.borderRadius = "8px", d.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)", d.style.overflow = "hidden", r.forEach((y) => {
        const w = document.createElement("button");
        w.setAttribute("data-brand-btn", y.id), w.style.display = "flex", w.style.justifyContent = "center", w.style.alignItems = "center", w.style.height = "60px", w.style.backgroundColor = y.color, w.style.color = ["#32F08C", "#FF9900", "#E2C027", "#0EB0C9", "#B1A6CC"].includes(y.color) ? "#0C0C0D" : "#FFFFFF", w.style.fontWeight = "500", w.style.borderRadius = "4px", w.style.border = "none", w.style.cursor = "pointer", w.style.margin = "0", w.style.padding = "0", w.textContent = y.name, d.appendChild(w);
      }), document.body.appendChild(d);
      const p = document.createElement("button");
      p.setAttribute("data-brand-toggle", ""), p.setAttribute("data-current-brand", i()), p.className = "ds-btn ds-btn--ghost ds-btn--sm", p.style.position = "fixed", p.style.top = "16px", p.style.right = "56px", p.style.zIndex = "9999", p.style.display = "flex", p.style.alignItems = "center", p.style.gap = "6px";
      const g = document.createElement("span");
      g.className = "brand-icon", g.style.width = "12px", g.style.height = "12px", g.style.borderRadius = "50%", g.style.backgroundColor = r.find((y) => y.id === i()).color;
      const f = document.createElement("span");
      f.className = "brand-name", f.style.fontSize = "11px", f.textContent = r.find((y) => y.id === i()).name, p.appendChild(g), p.appendChild(f), document.body.appendChild(p), p.onclick = function(y) {
        y.stopPropagation(), y.preventDefault();
        const w = d.style.display === "none";
        d.style.display = w ? "grid" : "none", w ? setTimeout(() => {
          document.addEventListener("click", m, !0);
        }, 0) : document.removeEventListener("click", m, !0);
      }, d.onclick = function(y) {
        y.stopPropagation();
      };
      function m(y) {
        !d.contains(y.target) && !p.contains(y.target) && (d.style.display = "none", document.removeEventListener("click", m, !0));
      }
      return d.querySelectorAll("[data-brand-btn]").forEach((y) => {
        y.addEventListener("click", (w) => {
          w.stopPropagation();
          const _ = y.getAttribute("data-brand-btn");
          a(_), d.style.display = "none";
        });
      }), { toggleBtn: p, container: d };
    }
    function u() {
      const d = new URLSearchParams(window.location.search);
      if (!(d.has("dev") || d.has("debug"))) return;
      const g = document.querySelector('script[src*="theme.js"]');
      if (!g || !g.src) return;
      const f = g.src.substring(0, g.src.lastIndexOf("/") + 1), m = document.createElement("script");
      m.src = f + "kupola-devtools.js?v=15", m.async = !0, document.head.appendChild(m);
    }
    if (s.exports)
      s.exports = {
        getTheme: o,
        setTheme: n,
        initTheme: l,
        createThemeToggle: c,
        getBrand: i,
        setBrand: a,
        BRAND_OPTIONS: r,
        createBrandPicker: h,
        loadDevTools: u
      };
    else if (!window.__kupolaThemeInitialized) {
      let d = function() {
        l(), u();
      };
      window.__kupolaThemeInitialized = !0, document.readyState === "loading" ? document.addEventListener("readystatechange", function p() {
        document.readyState !== "loading" && (document.removeEventListener("readystatechange", p), d());
      }) : setTimeout(d, 0);
    }
  }(K)), K.exports;
}
de();
class he {
  constructor(t) {
    this.element = t, this.trigger = t.querySelector(".ds-dropdown__trigger"), this.menu = t.querySelector(".ds-dropdown__menu"), this.triggerText = this.trigger ? this.trigger.querySelector("span") : null, this.scope = `dropdown-${Math.random().toString(36).substr(2, 9)}`, this._triggerClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._itemClickHandler = null;
  }
  init() {
    !this.trigger || !this.menu || this.element.__kupolaInitialized || (this._itemClickHandler = (t) => {
      const e = t.currentTarget;
      this.triggerText && (this.triggerText.textContent = e.textContent.trim()), this.hideMenu();
    }, this.menu.querySelectorAll(".ds-dropdown__item").forEach((t) => {
      t.addEventListener("click", this._itemClickHandler), t._dropdownItemClickHandler = this._itemClickHandler;
    }), this._triggerClickHandler = (t) => {
      t.stopPropagation(), this.toggleMenu();
    }, this.trigger.addEventListener("click", this._triggerClickHandler), this._documentClickHandler = (t) => {
      this.element.contains(t.target) || this.hideMenu();
    }, window.globalEvents ? this._documentClickListener = window.globalEvents.on(document, "click", this._documentClickHandler, { scope: this.scope }) : document.addEventListener("click", this._documentClickHandler), this.menu.style.display = "none", this.element.__kupolaInitialized = !0);
  }
  toggleMenu() {
    const t = this.menu.style.display === "block";
    this.menu.style.display = t ? "none" : "block", this.element.classList.toggle("is-open", !t);
  }
  hideMenu() {
    this.menu.style.display = "none", this.element.classList.remove("is-open");
  }
  destroy() {
    this.element.__kupolaInitialized && (this.trigger && this._triggerClickHandler && this.trigger.removeEventListener("click", this._triggerClickHandler), this.menu && this.menu.querySelectorAll(".ds-dropdown__item").forEach((t) => {
      t._dropdownItemClickHandler && t.removeEventListener("click", t._dropdownItemClickHandler);
    }), this._documentClickListener && this._documentClickListener.unsubscribe ? this._documentClickListener.unsubscribe() : this._documentClickHandler && document.removeEventListener("click", this._documentClickHandler), this._documentClickHandler = null, this._documentClickListener = null, this._triggerClickHandler = null, this._itemClickHandler = null, this.element.__kupolaInitialized = !1);
  }
}
function ue(s) {
  const t = new he(s);
  t.init(), s._kupolaDropdown = t;
}
function pe(s) {
  s._kupolaDropdown && (s._kupolaDropdown.destroy(), s._kupolaDropdown = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("dropdown", ue, pe);
class fe {
  constructor(t) {
    this.element = t, this.trigger = t.querySelector(".ds-select__trigger"), this.valueEl = t.querySelector(".ds-select__value") || t.querySelector(".ds-select__trigger span"), this.optionsEl = t.querySelector(".ds-select__options") || t.querySelector(".ds-select__menu"), this.nativeSelect = t.querySelector("select"), this.icon = t.querySelector(".ds-select__icon"), this.scope = `select-${Math.random().toString(36).substr(2, 9)}`, this._triggerClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._optionClickHandler = null;
  }
  init() {
    !this.trigger || !this.optionsEl || this.element.__kupolaInitialized || (this._optionClickHandler = (t) => {
      const e = t.currentTarget, r = e.getAttribute("data-value");
      this.nativeSelect && (this.nativeSelect.value = r), this.optionsEl.querySelectorAll(".ds-select__option, .ds-select__item").forEach((o) => o.classList.remove("is-selected")), e.classList.add("is-selected"), this.updateValue(e.textContent.trim()), this.hideOptions(), this.nativeSelect && this.nativeSelect.dispatchEvent(new Event("change"));
    }, this.optionsEl.querySelectorAll(".ds-select__option, .ds-select__item").forEach((t) => {
      t.addEventListener("click", this._optionClickHandler), t._selectOptionClickHandler = this._optionClickHandler;
    }), this._triggerClickHandler = (t) => {
      t.stopPropagation(), this.showOptions();
    }, this.trigger.addEventListener("click", this._triggerClickHandler), this._documentClickHandler = (t) => {
      this.element.contains(t.target) || this.hideOptions();
    }, window.globalEvents ? this._documentClickListener = window.globalEvents.on(document, "click", this._documentClickHandler, { scope: this.scope }) : document.addEventListener("click", this._documentClickHandler), this.optionsEl.style.display = "none", this.element.__kupolaInitialized = !0);
  }
  updateValue(t) {
    this.valueEl && (this.valueEl.textContent = t || this.valueEl.textContent);
  }
  showOptions() {
    const t = this.optionsEl.style.display === "block";
    this.optionsEl.style.display = t ? "none" : "block", this.icon && (this.icon.style.transform = t ? "rotate(0deg)" : "rotate(180deg)"), this.element.classList.toggle("is-open", !t);
  }
  hideOptions() {
    this.optionsEl.style.display = "none", this.icon && (this.icon.style.transform = "rotate(0deg)"), this.element.classList.remove("is-open");
  }
  destroy() {
    this.element.__kupolaInitialized && (this.trigger && this._triggerClickHandler && this.trigger.removeEventListener("click", this._triggerClickHandler), this.optionsEl && this.optionsEl.querySelectorAll(".ds-select__option, .ds-select__item").forEach((t) => {
      t._selectOptionClickHandler && t.removeEventListener("click", t._selectOptionClickHandler);
    }), this._documentClickListener && this._documentClickListener.unsubscribe ? this._documentClickListener.unsubscribe() : this._documentClickHandler && document.removeEventListener("click", this._documentClickHandler), this._documentClickHandler = null, this._documentClickListener = null, this._triggerClickHandler = null, this._optionClickHandler = null, this.element.__kupolaInitialized = !1);
  }
}
function me(s) {
  const t = new fe(s);
  t.init(), s._kupolaSelect = t;
}
function ge(s) {
  s._kupolaSelect && (s._kupolaSelect.destroy(), s._kupolaSelect = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("select", me, ge);
class ye {
  constructor(t) {
    this.element = t, this.input = t.querySelector("input"), this.icon = t.querySelector(".ds-datepicker__icon"), this.calendarEl = t.querySelector(".ds-datepicker__calendar"), this.scope = `datepicker-${Math.random().toString(36).substr(2, 9)}`, this._iconClickHandler = null, this._inputClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._resizeHandler = null, this._resizeListener = null;
  }
  init() {
    this.calendarEl && (this.element.__kupolaInitialized || (this._iconClickHandler = (t) => this.toggleCalendar(t), this._inputClickHandler = (t) => this.toggleCalendar(t), this.icon && this.icon.addEventListener("click", this._iconClickHandler), this.input.addEventListener("click", this._inputClickHandler), window.globalEvents ? (this._documentClickListener = window.globalEvents.on(document, "click", (t) => this.hideCalendar(t), { scope: this.scope }), this._resizeListener = window.globalEvents.on(window, "resize", () => this.resizeHandler(), { scope: this.scope })) : (document.addEventListener("click", (t) => this.hideCalendar(t)), window.addEventListener("resize", () => this.resizeHandler()), this._documentClickHandler = (t) => this.hideCalendar(t), this._resizeHandler = () => this.resizeHandler()), this.element.__kupolaInitialized = !0, this.initCalendar()));
  }
  calculatePosition() {
    const t = this.element.getBoundingClientRect(), e = this.calendarEl.getBoundingClientRect(), o = window.innerHeight - t.bottom, n = t.top, i = e.height || 280;
    o >= i ? (this.calendarEl.style.top = "calc(100% + 4px)", this.calendarEl.style.bottom = "auto") : n >= i ? (this.calendarEl.style.top = "auto", this.calendarEl.style.bottom = "calc(100% + 4px)") : (this.calendarEl.style.top = "calc(100% + 4px)", this.calendarEl.style.bottom = "auto");
  }
  toggleCalendar(t) {
    t.preventDefault(), t.stopPropagation();
    const e = this.calendarEl.style.display === "block";
    document.querySelectorAll(".ds-datepicker__calendar").forEach((r) => {
      r.style.display = "none", r.setAttribute("hidden", "");
    }), e || (this.calendarEl.style.display = "block", this.calendarEl.removeAttribute("hidden"), this.calculatePosition());
  }
  hideCalendar(t) {
    this.element.contains(t.target) || (this.calendarEl.style.display = "none", this.calendarEl.setAttribute("hidden", ""));
  }
  resizeHandler() {
    this.calendarEl.style.display === "block" && this.calculatePosition();
  }
  initCalendar() {
    const t = this.calendarEl, e = this.input, r = t.querySelector(".ds-datepicker__title"), o = t.querySelector(".ds-datepicker__days"), n = t.querySelector(".ds-datepicker__nav--prev"), i = t.querySelector(".ds-datepicker__nav--next");
    let a = /* @__PURE__ */ new Date();
    if (e.value) {
      const u = e.value.split("-");
      u.length === 3 && (a = new Date(u[0], u[1] - 1, u[2]));
    }
    function l() {
      o.querySelectorAll(".ds-datepicker__day").forEach((f) => {
        f._dayClickHandler && f.removeEventListener("click", f._dayClickHandler);
      }), o.innerHTML = "";
      const u = a.getFullYear(), d = a.getMonth();
      r.textContent = `${u} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d]}`;
      const p = new Date(u, d, 1).getDay(), g = new Date(u, d + 1, 0).getDate();
      for (let f = 0; f < p; f++) {
        const m = document.createElement("span");
        m.className = "ds-datepicker__day--empty", o.appendChild(m);
      }
      for (let f = 1; f <= g; f++) {
        const m = document.createElement("button");
        m.className = "ds-datepicker__day", m.textContent = f;
        const v = `${u}-${String(d + 1).padStart(2, "0")}-${String(f).padStart(2, "0")}`;
        e.value === v && m.classList.add("is-selected");
        const y = /* @__PURE__ */ new Date(), w = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
        v === w && m.classList.add("is-today");
        const _ = () => {
          e.value = v, t.style.display = "none", t.setAttribute("hidden", ""), e.dispatchEvent(new Event("change"));
        };
        m.addEventListener("click", _), m._dayClickHandler = _, o.appendChild(m);
      }
    }
    const c = (u) => {
      u.stopPropagation(), a.setMonth(a.getMonth() - 1), l();
    }, h = (u) => {
      u.stopPropagation(), a.setMonth(a.getMonth() + 1), l();
    };
    n && (n.addEventListener("click", c), n._prevClickHandler = c), i && (i.addEventListener("click", h), i._nextClickHandler = h), t._calendarInitialized = !0, l();
  }
  destroy() {
    if (this.element.__kupolaInitialized) {
      if (this.icon && this._iconClickHandler && this.icon.removeEventListener("click", this._iconClickHandler), this.input && this._inputClickHandler && this.input.removeEventListener("click", this._inputClickHandler), this._documentClickListener && this._documentClickListener.unsubscribe ? this._documentClickListener.unsubscribe() : this._documentClickHandler && document.removeEventListener("click", this._documentClickHandler), this._resizeListener && this._resizeListener.unsubscribe ? this._resizeListener.unsubscribe() : this._resizeHandler && window.removeEventListener("resize", this._resizeHandler), this.calendarEl) {
        const t = this.calendarEl.querySelector(".ds-datepicker__days");
        t && t.querySelectorAll(".ds-datepicker__day").forEach((o) => {
          o._dayClickHandler && o.removeEventListener("click", o._dayClickHandler);
        });
        const e = this.calendarEl.querySelector(".ds-datepicker__nav--prev"), r = this.calendarEl.querySelector(".ds-datepicker__nav--next");
        e && e._prevClickHandler && e.removeEventListener("click", e._prevClickHandler), r && r._nextClickHandler && r.removeEventListener("click", r._nextClickHandler);
      }
      this._documentClickHandler = null, this._resizeHandler = null, this._documentClickListener = null, this._resizeListener = null, this._iconClickHandler = null, this._inputClickHandler = null, this.element.__kupolaInitialized = !1;
    }
  }
}
function ve(s) {
  const t = new ye(s);
  t.init(), s._kupolaDatepicker = t;
}
function _e(s) {
  s._kupolaDatepicker && (s._kupolaDatepicker.destroy(), s._kupolaDatepicker = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("datepicker", ve, _e);
class we {
  constructor(t) {
    this.element = t, this.input = t.querySelector("input"), this.inputWrap = t.querySelector(".ds-timepicker__input-wrap"), this.panelEl = null, this.scope = `timepicker-${Math.random().toString(36).substr(2, 9)}`, this._inputWrapClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._resizeHandler = null, this._resizeListener = null, this.selectedHour = 12, this.selectedMinute = 0;
  }
  init() {
    this.element.__kupolaInitialized || (this._inputWrapClickHandler = (t) => {
      t.stopPropagation(), this.panelEl && this.panelEl.style.display === "block" ? this.panelEl.style.display = "none" : this.showTimepicker();
    }, this.inputWrap.addEventListener("click", this._inputWrapClickHandler), window.globalEvents ? (this._documentClickListener = window.globalEvents.on(document, "click", (t) => this.hideTimepicker(t), { scope: this.scope }), this._resizeListener = window.globalEvents.on(window, "resize", () => this.resizeHandler(), { scope: this.scope })) : (document.addEventListener("click", (t) => this.hideTimepicker(t)), window.addEventListener("resize", () => this.resizeHandler()), this._documentClickHandler = (t) => this.hideTimepicker(t), this._resizeHandler = () => this.resizeHandler()), this.element.__kupolaInitialized = !0);
  }
  calculatePosition() {
    if (!this.panelEl) return;
    const t = this.element.getBoundingClientRect(), e = this.panelEl.getBoundingClientRect(), o = window.innerHeight - t.bottom, n = t.top, i = e.height || 320;
    o >= i ? (this.panelEl.style.top = "calc(100% + 4px)", this.panelEl.style.bottom = "auto") : n >= i ? (this.panelEl.style.top = "auto", this.panelEl.style.bottom = "calc(100% + 4px)") : (this.panelEl.style.top = "calc(100% + 4px)", this.panelEl.style.bottom = "auto");
  }
  showTimepicker() {
    if (this.panelEl) {
      this.panelEl.style.display = "block", this.calculatePosition();
      return;
    }
    if (this.panelEl = document.createElement("div"), this.panelEl.className = "ds-timepicker__panel", this.panelEl.innerHTML = `
      <div class="ds-timepicker__header">
        <div class="ds-timepicker__display">
          <span class="ds-timepicker__display-hour">12</span>
          <span class="ds-timepicker__separator">:</span>
          <span class="ds-timepicker__display-minute">00</span>
        </div>
      </div>
      <div class="ds-timepicker__body">
        <div class="ds-timepicker__section">
          <div class="ds-timepicker__section-label">Hour</div>
          <div class="ds-timepicker__grid ds-timepicker__grid--hour" data-type="hour"></div>
        </div>
        <div class="ds-timepicker__section">
          <div class="ds-timepicker__section-label">Minute</div>
          <div class="ds-timepicker__grid ds-timepicker__grid--minute" data-type="minute"></div>
        </div>
      </div>
    `, this.element.appendChild(this.panelEl), this.input.value) {
      const l = this.input.value.split(":");
      l.length >= 2 && (this.selectedHour = parseInt(l[0]) || 0, this.selectedMinute = parseInt(l[1]) || 0);
    }
    const t = this.panelEl.querySelector(".ds-timepicker__display-hour"), e = this.panelEl.querySelector(".ds-timepicker__display-minute");
    function r() {
      t.textContent = String(this.selectedHour).padStart(2, "0"), e.textContent = String(this.selectedMinute).padStart(2, "0");
    }
    function o() {
      this.input.value = `${String(this.selectedHour).padStart(2, "0")}:${String(this.selectedMinute).padStart(2, "0")}`;
    }
    function n() {
      o.call(this), this.panelEl.style.display = "none", this.input.dispatchEvent(new Event("change"));
    }
    const i = this.panelEl.querySelector('[data-type="hour"]'), a = this.panelEl.querySelector('[data-type="minute"]');
    for (let l = 0; l < 24; l++) {
      const c = document.createElement("button");
      c.className = "ds-timepicker__item", c.textContent = String(l).padStart(2, "0"), l === this.selectedHour && c.classList.add("is-selected"), c.addEventListener("click", () => {
        i.querySelectorAll(".ds-timepicker__item").forEach((h) => h.classList.remove("is-selected")), c.classList.add("is-selected"), this.selectedHour = l, r.call(this), n.call(this);
      }), i.appendChild(c);
    }
    for (let l = 0; l < 60; l += 5) {
      const c = document.createElement("button");
      c.className = "ds-timepicker__item", c.textContent = String(l).padStart(2, "0"), l === this.selectedMinute && c.classList.add("is-selected"), c.addEventListener("click", () => {
        a.querySelectorAll(".ds-timepicker__item").forEach((h) => h.classList.remove("is-selected")), c.classList.add("is-selected"), this.selectedMinute = l, r.call(this), n.call(this);
      }), a.appendChild(c);
    }
    this.panelEl.addEventListener("click", (l) => {
      l.stopPropagation();
    }), r.call(this), o.call(this), setTimeout(() => {
      this.calculatePosition();
    }, 0);
  }
  hideTimepicker(t) {
    this.panelEl && this.panelEl.style.display === "block" && (this.element.contains(t.target) || (this.panelEl.style.display = "none"));
  }
  resizeHandler() {
    this.panelEl && this.panelEl.style.display === "block" && this.calculatePosition();
  }
  destroy() {
    this.element.__kupolaInitialized && (this.inputWrap && this._inputWrapClickHandler && this.inputWrap.removeEventListener("click", this._inputWrapClickHandler), this._documentClickListener && this._documentClickListener.unsubscribe ? this._documentClickListener.unsubscribe() : this._documentClickHandler && document.removeEventListener("click", this._documentClickHandler), this._resizeListener && this._resizeListener.unsubscribe ? this._resizeListener.unsubscribe() : this._resizeHandler && window.removeEventListener("resize", this._resizeHandler), this.panelEl && (this.panelEl.remove(), this.panelEl = null), this._inputWrapClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._resizeHandler = null, this._resizeListener = null, this.element.__kupolaInitialized = !1);
  }
}
function xe(s) {
  const t = new we(s);
  t.init(), s._kupolaTimepicker = t;
}
function be(s) {
  s._kupolaTimepicker && (s._kupolaTimepicker.destroy(), s._kupolaTimepicker = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("timepicker", xe, be);
class ke {
  constructor(t) {
    if (this.element = t, this.track = t.querySelector(".ds-slider__track"), this.fill = t.querySelector(".ds-slider__fill"), this.input = t.querySelector(".ds-slider__input"), this.valueEl = t.querySelector(".ds-slider__value"), !this.track || !this.fill || !this.input)
      throw new Error("Slider: Missing required elements");
    this._bindEvents(), this.updateSlider();
  }
  _bindEvents() {
    this.updateSlider = () => {
      const t = this.input.value, e = this.input.min || 0, r = this.input.max || 100, o = (t - e) / (r - e) * 100;
      this.fill.style.width = `${o}%`, this.valueEl && (this.valueEl.textContent = t), this.element.setAttribute("aria-valuenow", t);
    }, this.input.addEventListener("input", this.updateSlider), this.input.addEventListener("change", this.updateSlider), this._listeners = [
      { el: this.input, event: "input", handler: this.updateSlider },
      { el: this.input, event: "change", handler: this.updateSlider }
    ];
  }
  destroy() {
    this._listeners?.forEach(({ el: t, event: e, handler: r }) => {
      t.removeEventListener(e, r);
    }), this._listeners = null, this.track = null, this.fill = null, this.input = null, this.valueEl = null, this.element = null;
  }
  setValue(t) {
    this.input && (this.input.value = t, this.updateSlider());
  }
  getValue() {
    return this.input?.value;
  }
}
function Ee(s) {
  if (!s.__kupolaInitialized)
    try {
      const t = new ke(s);
      s.__kupolaInstance = t, s.__kupolaInitialized = !0;
    } catch (t) {
      console.error("[Slider] Error initializing:", t);
    }
}
function Ce(s) {
  if (!s.__kupolaInitialized || !s.__kupolaInstance) return;
  s.__kupolaInstance.destroy(), s.__kupolaInstance = null, s.__kupolaInitialized = !1;
}
window.kupolaInitializer && window.kupolaInitializer.register("slider", Ee, Ce);
var V = { exports: {} }, xt;
function Se() {
  return xt || (xt = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.track = i.querySelector(".ds-carousel__track"), this.items = i.querySelectorAll(".ds-carousel__item"), this.prevBtn = i.querySelector(".ds-carousel__prev"), this.nextBtn = i.querySelector(".ds-carousel__next"), this.indicators = i.querySelectorAll(".ds-carousel__indicator"), this.autoBtn = i.querySelector(".ds-carousel__auto"), this.currentIndex = 0, this.totalItems = this.items.length, this.autoPlayTimer = null, this.isAutoPlaying = !1, this._mouseEnterHandler = () => this.stopAutoPlay(), this._mouseLeaveHandler = () => {
          this.isAutoPlaying && this.startAutoPlay();
        }, this.init();
      }
      init() {
        this._prevClickHandler = () => this.prev(), this._nextClickHandler = () => this.next(), this._autoClickHandler = () => this.toggleAutoPlay(), this._indicatorClickHandlers = [], this.prevBtn && this.prevBtn.addEventListener("click", this._prevClickHandler), this.nextBtn && this.nextBtn.addEventListener("click", this._nextClickHandler), this.indicators.forEach((i, a) => {
          const l = () => this.goTo(a);
          this._indicatorClickHandlers.push(l), i.addEventListener("click", l);
        }), this.autoBtn && this.autoBtn.addEventListener("click", this._autoClickHandler), this.updateIndicators(), this.startAutoPlay(), this.element.addEventListener("mouseenter", this._mouseEnterHandler), this.element.addEventListener("mouseleave", this._mouseLeaveHandler);
      }
      goTo(i) {
        if (i < 0 || i >= this.totalItems) return;
        this.currentIndex = i;
        const a = -i * 100;
        this.track.style.transform = `translateX(${a}%)`, this.updateIndicators();
      }
      prev() {
        const i = this.currentIndex > 0 ? this.currentIndex - 1 : this.totalItems - 1;
        this.goTo(i);
      }
      next() {
        const i = this.currentIndex < this.totalItems - 1 ? this.currentIndex + 1 : 0;
        this.goTo(i);
      }
      updateIndicators() {
        this.indicators.forEach((i, a) => {
          a === this.currentIndex ? i.classList.add("is-active") : i.classList.remove("is-active");
        });
      }
      startAutoPlay() {
        this.totalItems <= 1 || (this.stopAutoPlay(), this.isAutoPlaying = !0, this.autoBtn && this.autoBtn.classList.add("is-active"), this.autoPlayTimer = setInterval(() => this.next(), 3e3));
      }
      stopAutoPlay() {
        this.autoPlayTimer && (clearInterval(this.autoPlayTimer), this.autoPlayTimer = null), this.autoBtn && this.autoBtn.classList.remove("is-active");
      }
      toggleAutoPlay() {
        this.isAutoPlaying ? (this.isAutoPlaying = !1, this.stopAutoPlay()) : this.startAutoPlay();
      }
      destroy() {
        this.stopAutoPlay(), this.element.removeEventListener("mouseenter", this._mouseEnterHandler), this.element.removeEventListener("mouseleave", this._mouseLeaveHandler), this.prevBtn && this._prevClickHandler && this.prevBtn.removeEventListener("click", this._prevClickHandler), this.nextBtn && this._nextClickHandler && this.nextBtn.removeEventListener("click", this._nextClickHandler), this.autoBtn && this._autoClickHandler && this.autoBtn.removeEventListener("click", this._autoClickHandler), this.indicators.forEach((i, a) => {
          const l = this._indicatorClickHandlers[a];
          l && i.removeEventListener("click", l);
        }), this._prevClickHandler = null, this._nextClickHandler = null, this._autoClickHandler = null, this._indicatorClickHandlers = null;
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n = document) {
      n.querySelectorAll(".ds-carousel").forEach((i) => {
        e(i);
      });
    }
    function o(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    s.exports ? s.exports = { Carousel: t, initCarousel: e, initCarousels: r, cleanupCarousel: o } : (window.Carousel = t, window.initCarousel = e, window.initCarousels = r, window.kupolaInitializer && window.kupolaInitializer.register("carousel", e, o));
  }(V)), V.exports;
}
Se();
class Le {
  constructor(t) {
    this.element = t, this.mask = t.querySelector(".ds-drawer-mask"), this.drawerEl = t.querySelector(".ds-drawer"), this._bindEvents();
  }
  _bindEvents() {
    const t = this.mask?.querySelector(".ds-drawer__close"), e = this.mask?.querySelector(".ds-drawer__footer .ds-btn--ghost"), r = this.mask?.querySelector(".ds-drawer__footer .ds-btn--brand");
    this.closeDrawer = () => {
      this.mask && this.mask.classList.remove("is-visible"), this.drawerEl && this.drawerEl.classList.remove("is-visible");
    }, this.handleMaskClick = (o) => {
      o.target === this.mask && this.closeDrawer();
    }, this.mask && this.mask.addEventListener("click", this.handleMaskClick), t && t.addEventListener("click", this.closeDrawer), e && e.addEventListener("click", this.closeDrawer), r && r.addEventListener("click", this.closeDrawer), this._listeners = [
      { el: this.mask, event: "click", handler: this.handleMaskClick },
      { el: t, event: "click", handler: this.closeDrawer },
      { el: e, event: "click", handler: this.closeDrawer },
      { el: r, event: "click", handler: this.closeDrawer }
    ].filter((o) => o.el);
  }
  destroy() {
    this._listeners?.forEach(({ el: t, event: e, handler: r }) => {
      t.removeEventListener(e, r);
    }), this._listeners = null, this.mask = null, this.drawerEl = null, this.element = null;
  }
  open() {
    this.mask && this.mask.classList.add("is-visible"), this.drawerEl && this.drawerEl.classList.add("is-visible");
  }
  close() {
    this.closeDrawer();
  }
}
function He(s) {
  if (s.__kupolaInitialized) return;
  const t = new Le(s);
  s.__kupolaInstance = t, s.__kupolaInitialized = !0;
}
function De(s) {
  if (!s.__kupolaInitialized || !s.__kupolaInstance) return;
  s.__kupolaInstance.destroy(), s.__kupolaInstance = null, s.__kupolaInitialized = !1;
}
window.kupolaInitializer && window.kupolaInitializer.register("drawer", He, De);
var U = { exports: {} }, bt;
function Me() {
  return bt || (bt = 1, function(s) {
    class t {
      constructor(a) {
        this.element = a, this.mask = a.querySelector(".ds-modal-mask"), this.modal = a.querySelector(".ds-modal"), this.closeBtn = a.querySelector(".ds-modal__close"), this._keydownHandler = (l) => {
          l.key === "Escape" && this.isVisible() && this.close();
        }, this._closeBtnClickHandler = () => this.close(), this._maskClickHandler = (l) => {
          l.target === this.mask && this.close();
        }, this.init();
      }
      init() {
        this.closeBtn && this.closeBtn.addEventListener("click", this._closeBtnClickHandler), this.mask && this.mask.addEventListener("click", this._maskClickHandler), document.addEventListener("keydown", this._keydownHandler);
      }
      open() {
        this.mask.classList.add("is-visible"), t._openCount = (t._openCount || 0) + 1, document.body.style.overflow = "hidden";
      }
      close() {
        this.mask.classList.remove("is-visible"), t._openCount = Math.max(0, (t._openCount || 0) - 1), t._openCount === 0 && (document.body.style.overflow = "");
      }
      isVisible() {
        return this.mask.classList.contains("is-visible");
      }
      destroy() {
        document.removeEventListener("keydown", this._keydownHandler), this.closeBtn && this.closeBtn.removeEventListener("click", this._closeBtnClickHandler), this.mask && this.mask.removeEventListener("click", this._maskClickHandler), this.isVisible() && this.close();
      }
    }
    t._openCount = 0;
    function e(i = {}) {
      const {
        title: a = "",
        content: l = "",
        width: c = "480px",
        onConfirm: h,
        onCancel: u
      } = i, d = document.createElement("div");
      d.className = "ds-modal-container", d.innerHTML = `
    <div class="ds-modal-mask">
      <div class="ds-modal" style="max-width: ${c}">
        <div class="ds-modal__header">
          <span class="ds-modal__title"></span>
          <button class="ds-modal__close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="ds-modal__body"></div>
        ${h || u ? `
        <div class="ds-modal__footer">
          ${u ? '<button class="ds-btn ds-btn--ghost" data-modal-cancel>Cancel</button>' : ""}
          ${h ? '<button class="ds-btn ds-btn--brand" data-modal-confirm>OK</button>' : ""}
        </div>
        ` : ""}
      </div>
    </div>
  `, document.body.appendChild(d);
      const p = new t(d), g = d.querySelector(".ds-modal__title");
      g && (g.textContent = a);
      const f = d.querySelector(".ds-modal__body");
      f && (f.textContent = l);
      const m = d.querySelector("[data-modal-confirm]"), v = d.querySelector("[data-modal-cancel]"), y = () => {
        h && h(), p.close();
      }, w = () => {
        u && u(), p.close();
      };
      m && m.addEventListener("click", y), v && v.addEventListener("click", w);
      const _ = () => {
        setTimeout(() => {
          m && m.removeEventListener("click", y), v && v.removeEventListener("click", w), p.destroy(), d.remove();
        }, 300);
      }, b = p.close.bind(p);
      return p.close = () => {
        b(), _();
      }, p.open(), p;
    }
    function r(i) {
      if (i.__kupolaInitialized) return;
      const a = new t(i);
      i.__kupolaInstance = a, i.__kupolaInitialized = !0;
    }
    function o(i) {
      if (!i.__kupolaInitialized || !i.__kupolaInstance) return;
      i.__kupolaInstance.destroy(), i.__kupolaInstance = null, i.__kupolaInitialized = !1;
    }
    function n() {
      document.querySelectorAll(".ds-modal-container").forEach((i) => {
        r(i);
      });
    }
    s.exports ? s.exports = { Modal: t, initModals: n, initModal: r, cleanupModal: o, createModal: e } : (window.initModal = r, window.cleanupModal = o), window.kupolaInitializer && window.kupolaInitializer.register("modal", r, o);
  }(U)), U.exports;
}
Me();
var W = { exports: {} }, kt;
function Ie() {
  return kt || (kt = 1, function(s) {
    class t {
      static normal(r = {}) {
        return this._create({ type: "normal", ...r });
      }
      static success(r = {}) {
        return this._create({ type: "success", ...r });
      }
      static warning(r = {}) {
        return this._create({ type: "warning", ...r });
      }
      static error(r = {}) {
        return this._create({ type: "error", ...r });
      }
      static info(r = {}) {
        return this._create({ type: "info", ...r });
      }
      static confirm(r = {}) {
        return this._create({ type: "confirm", ...r });
      }
      static _create(r) {
        const {
          type: o = "normal",
          title: n = "",
          content: i = "",
          onConfirm: a,
          onCancel: l
        } = r, c = {
          normal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
          success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
          warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
          error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
          info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
          confirm: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
        }, h = document.createElement("div");
        h.className = "ds-modal-container", h.innerHTML = `
      <div class="ds-modal-mask">
        <div class="ds-modal" style="max-width: 360px">
          <div class="ds-modal__body" style="text-align: center; padding: 24px 16px;">
            <div class="ds-dialog__icon ds-dialog__icon--${o}">${c[o]}</div>
            ${n ? '<div class="ds-dialog__title"></div>' : ""}
            <div class="ds-dialog__content"></div>
            <div class="ds-dialog__actions">
              ${o === "confirm" || l ? '<button class="ds-btn ds-btn--ghost" data-dialog-cancel>Cancel</button>' : ""}
              <button class="ds-btn ${o === "confirm" ? "ds-btn--brand" : "ds-btn--ghost"}" data-dialog-confirm>
                ${o === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `, document.body.appendChild(h), n && (h.querySelector(".ds-dialog__title").textContent = n), h.querySelector(".ds-dialog__content").textContent = i;
        const u = h.querySelector(".ds-modal-mask"), d = h.querySelector("[data-dialog-confirm]"), p = h.querySelector("[data-dialog-cancel]"), g = function(w) {
          w.key === "Escape" && (l && l(), y());
        }, f = function(w) {
          w.target === u && (l && l(), y());
        }, m = function() {
          a && a(), y();
        }, v = function() {
          l && l(), y();
        }, y = () => {
          u.classList.remove("is-visible"), document.body.style.overflow = "", document.removeEventListener("keydown", g), u.removeEventListener("click", f), d && d.removeEventListener("click", m), p && p.removeEventListener("click", v), setTimeout(() => h.remove(), 300);
        };
        return u.classList.add("is-visible"), document.body.style.overflow = "hidden", d && d.addEventListener("click", m), p && p.addEventListener("click", v), u.addEventListener("click", f), document.addEventListener("keydown", g), { close: y };
      }
    }
    s.exports && (s.exports = t);
  }(W)), W.exports;
}
Ie();
var Y = { exports: {} }, Et;
function Te() {
  return Et || (Et = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.dropzone = i.querySelector(".ds-fileupload__dropzone"), this.input = i.querySelector(".ds-fileupload__input"), this.list = i.querySelector(".ds-fileupload__list"), this.progress = i.querySelector(".ds-fileupload__preview"), this.files = [], this.maxSize = parseInt(i.getAttribute("data-max-size")) || 0, this.maxCount = parseInt(i.getAttribute("data-max-count")) || 0, this._listeners = [], this.init();
      }
      init() {
        this.bindEvents();
      }
      bindEvents() {
        const i = (u) => {
          u.target === this.input || this.input.contains(u.target) || this.input.click();
        }, a = (u) => {
          const d = Array.from(u.target.files);
          this.addFiles(d), u.target.value = "";
        }, l = (u) => {
          u.preventDefault(), u.stopPropagation(), this.dropzone.classList.add("is-dragging");
        }, c = (u) => {
          u.preventDefault(), u.stopPropagation(), this.dropzone.classList.remove("is-dragging");
        }, h = (u) => {
          u.preventDefault(), u.stopPropagation(), this.dropzone.classList.remove("is-dragging");
          const d = Array.from(u.dataTransfer.files);
          this.addFiles(d);
        };
        this.dropzone.addEventListener("click", i), this.input.addEventListener("change", a), this.dropzone.addEventListener("dragover", l), this.dropzone.addEventListener("dragleave", c), this.dropzone.addEventListener("drop", h), this._listeners.push(
          { el: this.dropzone, event: "click", handler: i },
          { el: this.input, event: "change", handler: a },
          { el: this.dropzone, event: "dragover", handler: l },
          { el: this.dropzone, event: "dragleave", handler: c },
          { el: this.dropzone, event: "drop", handler: h }
        );
      }
      addFiles(i) {
        i.forEach((a) => {
          if (this.maxCount > 0 && this.files.length >= this.maxCount) {
            this.showError(`Maximum ${this.maxCount} files allowed`);
            return;
          }
          this.isValidFile(a) && (this.files.push(a), this.renderFileItem(a), this.showPreview(a));
        }), this.dispatchChange();
      }
      isValidFile(i) {
        const a = this.input.getAttribute("accept");
        if (a && a !== "") {
          const l = a.split(",").map((d) => d.trim()), c = i.type, h = i.name.toLowerCase();
          if (!l.some((d) => d.startsWith(".") ? h.endsWith(d) : d.includes("/") ? d.endsWith("/*") ? c.startsWith(d.replace("/*", "")) : c === d : !0))
            return this.showError(`File type not allowed: ${i.type}`), !1;
        }
        return this.maxSize > 0 && i.size > this.maxSize ? (this.showError(`File size exceeds ${this.formatSize(this.maxSize)}`), !1) : !0;
      }
      renderFileItem(i) {
        const a = document.createElement("div");
        a.className = "ds-fileupload__item", a.dataset.filename = i.name;
        const l = this.getFileIcon(i.type);
        a.innerHTML = `
      <div class="ds-fileupload__icon" style="width: 24px; height: 24px; border-radius: 4px;">
        ${l}
      </div>
      <span class="ds-fileupload__filename">${this.truncateFilename(i.name)}</span>
      <span class="ds-fileupload__size">${this.formatSize(i.size)}</span>
      <button class="ds-fileupload__remove" type="button" aria-label="Remove file">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
    `;
        const c = a.querySelector(".ds-fileupload__remove"), h = () => {
          this.removeFile(i, a);
        };
        c.addEventListener("click", h), this._listeners.push({ el: c, event: "click", handler: h }), this.list || (this.list = document.createElement("div"), this.list.className = "ds-fileupload__list", this.element.appendChild(this.list)), this.list.appendChild(a);
      }
      getFileIcon(i) {
        return i.startsWith("image/") ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : i.startsWith("video/") ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' : i.startsWith("audio/") ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' : i.includes("pdf") || i.includes("document") || i.includes("text") ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' : i.includes("zip") || i.includes("archive") ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M16 11V7a4 4 0 0 0-8 0v4"/><polyline points="10 14 8 16 6 14"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      }
      truncateFilename(i, a = 20) {
        if (i.length <= a) return i;
        const l = i.substring(i.lastIndexOf("."));
        return i.substring(0, i.lastIndexOf(".")).substring(0, a - l.length - 3) + "..." + l;
      }
      formatSize(i) {
        if (i === 0) return "0 B";
        const a = 1024, l = ["B", "KB", "MB", "GB"], c = Math.floor(Math.log(i) / Math.log(a));
        return parseFloat((i / Math.pow(a, c)).toFixed(1)) + " " + l[c];
      }
      removeFile(i, a) {
        this.files = this.files.filter((l) => l !== i), a && a.remove(), this.files.length === 0 && this.list && (this.list.remove(), this.list = null), this.dispatchChange();
      }
      clearFiles() {
        this.files = [], this.list && (this.list.remove(), this.list = null), this.preview && (this.preview.innerHTML = ""), this.clearError(), this.dispatchChange();
      }
      showError(i) {
        this.clearError(), this.dropzone.classList.add("is-error");
        const a = document.createElement("div");
        a.className = "ds-fileupload__error", a.textContent = i, a.setAttribute("role", "alert"), a.setAttribute("aria-live", "polite"), this.dropzone.appendChild(a), setTimeout(() => {
          this.clearError();
        }, 5e3);
      }
      clearError() {
        this.dropzone.classList.remove("is-error");
        const i = this.dropzone.querySelector(".ds-fileupload__error");
        i && i.remove();
      }
      showPreview(i) {
        if (!i.type.startsWith("image/")) return;
        this.preview || (this.preview = document.createElement("div"), this.preview.className = "ds-fileupload__preview", this.element.insertBefore(this.preview, this.list || null));
        const a = new FileReader();
        a.onload = (l) => {
          const c = document.createElement("div");
          c.className = "ds-fileupload__preview-item", c.innerHTML = `
        <img src="${l.target.result}" alt="${i.name}">
        <button class="ds-fileupload__preview-remove" type="button" aria-label="Remove preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
        </button>
      `;
          const h = c.querySelector(".ds-fileupload__preview-remove"), u = () => {
            this.removeFile(i, this.list?.querySelector(`[data-filename="${i.name}"]`)), c.remove(), this.preview && this.preview.children.length === 0 && (this.preview.remove(), this.preview = null);
          };
          h.addEventListener("click", u), this._listeners.push({ el: h, event: "click", handler: u }), this.preview.appendChild(c);
        }, a.readAsDataURL(i);
      }
      updateProgress(i) {
        this.progress || (this.progress = document.createElement("div"), this.progress.className = "ds-fileupload__progress", this.element.insertBefore(this.progress, this.list || null)), this.progress.style.display = "block";
        const a = this.progress.querySelector(".ds-fileupload__progress-bar") || document.createElement("div");
        a.className = "ds-fileupload__progress-bar", a.style.width = `${i}%`, this.progress.querySelector(".ds-fileupload__progress-bar") || this.progress.appendChild(a), i >= 100 && setTimeout(() => {
          this.progress && (this.progress.remove(), this.progress = null);
        }, 500);
      }
      simulateUpload(i) {
        this.updateProgress(0);
        const a = 100;
        let l = 0;
        Math.max(1, Math.floor(i.size / a));
        const c = setInterval(() => {
          l++;
          const h = Math.min(100, Math.floor(l / a * 100));
          this.updateProgress(h), l >= a && (clearInterval(c), this.updateProgress(100));
        }, Math.max(50, Math.floor(5e3 / a)));
        return c;
      }
      getFiles() {
        return [...this.files];
      }
      dispatchChange() {
        this.element.dispatchEvent(new CustomEvent("ds-fileupload-change", {
          detail: {
            files: this.getFiles(),
            count: this.files.length
          }
        }));
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.files = [], this.dropzone = null, this.input = null, this.list = null, this.progress = null, this.preview = null, this.element = null;
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-fileupload").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { FileUpload: t, initFileUploads: o, initFileUpload: e, cleanupFileUpload: r } : (window.FileUpload = t, window.initFileUpload = e, window.cleanupFileUpload = r), window.kupolaInitializer && window.kupolaInitializer.register("fileupload", e, r);
  }(Y)), Y.exports;
}
Te();
var X = { exports: {} }, Ct;
function Ae() {
  return Ct || (Ct = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.headers = [], this._listeners = [], this._init();
      }
      _init() {
        this.element.querySelectorAll(".ds-collapse__header").forEach((a) => {
          const l = a.closest(".ds-collapse__item"), c = a.nextElementSibling;
          if (!l || !c || !c.classList.contains("ds-collapse__content")) return;
          const h = l.classList.contains("is-active");
          c.style.height = h ? c.scrollHeight + "px" : "0";
          const u = () => {
            if (c.style.height !== "0px")
              c.style.height = "0", l.classList.remove("is-active");
            else {
              c.style.height = c.scrollHeight + "px", l.classList.add("is-active");
              const p = function() {
                c.removeEventListener("transitionend", p), c.style.height = "";
              };
              c.addEventListener("transitionend", p), this._listeners.push({ el: c, event: "transitionend", handler: p });
            }
          };
          a.addEventListener("click", u), this.headers.push({ header: a, item: l, content: c, clickHandler: u }), this._listeners.push({ el: a, event: "click", handler: u });
        });
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.headers = null, this.element = null;
      }
      toggle(i) {
        const a = this.headers[i];
        a && a.clickHandler();
      }
      expand(i) {
        const a = this.headers[i];
        a && !a.item.classList.contains("is-active") && a.clickHandler();
      }
      collapse(i) {
        const a = this.headers[i];
        a && a.item.classList.contains("is-active") && a.clickHandler();
      }
      expandAll() {
        this.headers.forEach((i, a) => {
          i.item.classList.contains("is-active") || this.toggle(a);
        });
      }
      collapseAll() {
        this.headers.forEach((i, a) => {
          i.item.classList.contains("is-active") && this.toggle(a);
        });
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-collapse").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { Collapse: t, initCollapses: o, initCollapse: e, cleanupCollapse: r } : (window.Collapse = t, window.initCollapse = e, window.cleanupCollapse = r), window.kupolaInitializer && window.kupolaInitializer.register("collapse", e, r);
  }(X)), X.exports;
}
Ae();
class qe {
  constructor(t) {
    this.element = t, this.trigger = t.querySelector(".ds-color-picker__trigger"), this.panel = t.querySelector(".ds-color-picker__panel"), this.valueSpan = t.querySelector(".ds-color-picker__value"), this.customInput = t.querySelector(".ds-color-picker__input"), this.scope = `colorpicker-${Math.random().toString(36).substr(2, 9)}`, this._triggerClickHandler = null, this._documentClickHandler = null, this._documentClickListener = null, this._colorClickHandler = null, this._inputInputHandler = null;
  }
  init() {
    !this.trigger || !this.panel || this.element.__kupolaInitialized || (this._triggerClickHandler = (t) => {
      t.stopPropagation(), this.togglePanel();
    }, this._colorClickHandler = (t) => {
      const r = t.currentTarget.getAttribute("data-color");
      this.updateColor(r), this.hidePanel();
    }, this._inputInputHandler = (t) => {
      this.updateColor(t.target.value);
    }, this._documentClickHandler = (t) => {
      this.element.contains(t.target) || this.hidePanel();
    }, this.trigger.addEventListener("click", this._triggerClickHandler), this.panel.querySelectorAll(".ds-color-picker__color").forEach((t) => {
      t.addEventListener("click", this._colorClickHandler), t._colorPickerColorHandler = this._colorClickHandler;
    }), this.customInput && (this.customInput.addEventListener("input", this._inputInputHandler), this.customInput._colorPickerInputHandler = this._inputInputHandler), window.globalEvents ? this._documentClickListener = window.globalEvents.on(document, "click", this._documentClickHandler, { scope: this.scope }) : document.addEventListener("click", this._documentClickHandler), this.element.__kupolaInitialized = !0);
  }
  togglePanel() {
    this.panel.classList.toggle("is-visible");
  }
  hidePanel() {
    this.panel.classList.remove("is-visible");
  }
  updateColor(t) {
    this.trigger.style.backgroundColor = t, this.valueSpan && (this.valueSpan.textContent = t.toUpperCase()), this.customInput && (this.customInput.value = t), this.element.dispatchEvent(new CustomEvent("colorchange", { detail: { color: t } }));
  }
  destroy() {
    this.element.__kupolaInitialized && (this.trigger && this._triggerClickHandler && this.trigger.removeEventListener("click", this._triggerClickHandler), this.panel && this.panel.querySelectorAll(".ds-color-picker__color").forEach((t) => {
      t._colorPickerColorHandler && t.removeEventListener("click", t._colorPickerColorHandler);
    }), this.customInput && this._inputInputHandler && this.customInput.removeEventListener("input", this._inputInputHandler), this._documentClickListener && this._documentClickListener.unsubscribe ? this._documentClickListener.unsubscribe() : this._documentClickHandler && document.removeEventListener("click", this._documentClickHandler), this._documentClickHandler = null, this._documentClickListener = null, this._triggerClickHandler = null, this._colorClickHandler = null, this._inputInputHandler = null, this.element.__kupolaInitialized = !1);
  }
}
function ze(s) {
  const t = new qe(s);
  t.init(), s._kupolaColorPicker = t;
}
function Pe(s) {
  s._kupolaColorPicker && (s._kupolaColorPicker.destroy(), s._kupolaColorPicker = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("color-picker", ze, Pe);
var J = { exports: {} }, St;
function $e() {
  return St || (St = 1, function(s) {
    class t {
      constructor(i) {
        if (this.element = i, this.titleEl = i.querySelector(".ds-calendar__title"), this.daysEl = i.querySelector(".ds-calendar__days"), this.prevBtn = i.querySelector(".ds-calendar__nav--prev"), this.nextBtn = i.querySelector(".ds-calendar__nav--next"), this.todayBtn = i.querySelector(".ds-calendar__nav--today"), this._listeners = [], !this.titleEl || !this.daysEl)
          throw new Error("Calendar: Missing required elements");
        this.currentDate = /* @__PURE__ */ new Date(), this._init();
      }
      _init() {
        this.render();
        const i = () => {
          this.currentDate.setMonth(this.currentDate.getMonth() - 1), this.render();
        }, a = () => {
          this.currentDate.setMonth(this.currentDate.getMonth() + 1), this.render();
        }, l = () => {
          this.currentDate = /* @__PURE__ */ new Date(), this.render();
        };
        this.prevBtn && (this.prevBtn.addEventListener("click", i), this._listeners.push({ el: this.prevBtn, event: "click", handler: i })), this.nextBtn && (this.nextBtn.addEventListener("click", a), this._listeners.push({ el: this.nextBtn, event: "click", handler: a })), this.todayBtn && (this.todayBtn.addEventListener("click", l), this._listeners.push({ el: this.todayBtn, event: "click", handler: l }));
      }
      render() {
        const i = this.currentDate.getFullYear(), a = this.currentDate.getMonth();
        this.titleEl.textContent = `${i} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][a]}`;
        const l = new Date(i, a, 1).getDay(), c = new Date(i, a + 1, 0).getDate();
        this.daysEl.innerHTML = "";
        for (let d = 0; d < l; d++) {
          const p = document.createElement("span");
          p.className = "ds-calendar__day ds-calendar__day--empty", this.daysEl.appendChild(p);
        }
        const h = /* @__PURE__ */ new Date(), u = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
        for (let d = 1; d <= c; d++) {
          const p = document.createElement("button");
          p.className = "ds-calendar__day", p.textContent = d;
          const g = `${i}-${String(a + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          g === u && p.classList.add("is-today");
          const f = () => {
            this.element.querySelectorAll(".ds-calendar__day").forEach((m) => m.classList.remove("is-selected")), p.classList.add("is-selected"), this.$emit("select", { date: new Date(i, a, d), dateStr: g });
          };
          p.addEventListener("click", f), this._listeners.push({ el: p, event: "click", handler: f }), this.daysEl.appendChild(p);
        }
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.titleEl = null, this.daysEl = null, this.prevBtn = null, this.nextBtn = null, this.todayBtn = null, this.element = null;
      }
      setDate(i) {
        this.currentDate = new Date(i), this.render();
      }
      getDate() {
        return this.currentDate;
      }
      prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1), this.render();
      }
      nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1), this.render();
      }
      goToToday() {
        this.currentDate = /* @__PURE__ */ new Date(), this.render();
      }
      $emit(i, a) {
        if (this.element) {
          const l = new CustomEvent(`kupola:calendar:${i}`, {
            detail: a,
            bubbles: !0,
            cancelable: !0
          });
          this.element.dispatchEvent(l);
        }
      }
    }
    function e(n) {
      if (!n.__kupolaInitialized)
        try {
          const i = new t(n);
          n.__kupolaInstance = i, n.__kupolaInitialized = !0;
        } catch (i) {
          console.error("[Calendar] Error initializing:", i);
        }
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-calendar").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { Calendar: t, initCalendars: o, initCalendar: e, cleanupCalendar: r } : (window.Calendar = t, window.initCalendar = e, window.cleanupCalendar = r), window.kupolaInitializer && window.kupolaInitializer.register("calendar", e, r);
  }(J)), J.exports;
}
$e();
var j = { exports: {} }, Lt;
function Re() {
  return Lt || (Lt = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.input = i.querySelector(".ds-dynamic-tags__input"), this._listeners = [], this.init();
      }
      init() {
        this.bindEvents();
      }
      bindEvents() {
        if (this.element.querySelectorAll(".ds-dynamic-tags__remove").forEach((i) => {
          const a = (l) => {
            l.stopPropagation();
            const c = i.closest(".ds-dynamic-tags__tag");
            c && (c.remove(), this.dispatchChange());
          };
          i.addEventListener("click", a), this._listeners.push({ el: i, event: "click", handler: a });
        }), this.input) {
          const i = () => {
            const c = this.input.value.trim();
            if (!c) return;
            const h = document.createElement("span");
            h.className = "ds-dynamic-tags__tag";
            const u = document.createTextNode(c);
            h.appendChild(u);
            const d = document.createElement("button");
            d.className = "ds-dynamic-tags__remove", d.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', h.appendChild(d);
            const p = (g) => {
              g.stopPropagation(), h.remove(), this.dispatchChange();
            };
            d.addEventListener("click", p), this._listeners.push({ el: d, event: "click", handler: p }), this.element.insertBefore(h, this.input), this.input.value = "", this.input.focus(), this.dispatchChange();
          }, a = (c) => {
            c.key === "Enter" && (c.preventDefault(), c.stopPropagation(), i());
          };
          this.input.addEventListener("keydown", a), this._listeners.push({ el: this.input, event: "keydown", handler: a });
          const l = () => {
            this.input.focus();
          };
          this.element.addEventListener("click", l), this._listeners.push({ el: this.element, event: "click", handler: l });
        }
      }
      addTag(i) {
        !i || !this.input || (this.input.value = i, this.input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
      }
      removeTag(i) {
        const l = this.element.querySelectorAll(".ds-dynamic-tags__tag")[i];
        l && (l.remove(), this.dispatchChange());
      }
      getTags() {
        const i = [];
        return this.element.querySelectorAll(".ds-dynamic-tags__tag").forEach((a) => {
          i.push(a.textContent);
        }), i;
      }
      clearTags() {
        this.element.querySelectorAll(".ds-dynamic-tags__tag").forEach((i) => {
          i.remove();
        }), this.dispatchChange();
      }
      dispatchChange() {
        this.element.dispatchEvent(new CustomEvent("ds-dynamic-tags-change", {
          detail: {
            tags: this.getTags(),
            count: this.getTags().length
          }
        }));
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.input = null, this.element = null;
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-dynamic-tags").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { DynamicTags: t, initDynamicTagsAll: o, initDynamicTags: e, cleanupDynamicTags: r } : (window.DynamicTags = t, window.initDynamicTags = e, window.cleanupDynamicTags = r), window.kupolaInitializer && window.kupolaInitializer.register("dynamic-tags", e, r);
  }(j)), j.exports;
}
Re();
var G = { exports: {} }, Ht;
function Fe() {
  return Ht || (Ht = 1, function(s) {
    class t {
      constructor(i = {}) {
        this.images = i.images || [], this.currentIndex = i.currentIndex || 0, this.overlay = null, this.closeHandler = this.close.bind(this), this.keyHandler = this.handleKeydown.bind(this), this.clickHandler = this.handleOverlayClick.bind(this), this.init();
      }
      init() {
        this.createOverlay();
      }
      createOverlay() {
        this.overlay = document.createElement("div"), this.overlay.className = "ds-image-preview-overlay", this.overlay.innerHTML = `
      <button class="ds-image-preview__close" type="button" aria-label="Close preview">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>
      <div class="ds-image-preview__nav">
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-btn--prev" type="button" aria-label="Previous image">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button class="ds-image-preview__nav-btn ds-image-preview__nav-btn--next" type="button" aria-label="Next image">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <div class="ds-image-preview__content">
        <img src="" alt="" />
      </div>
      <div class="ds-image-preview__info">
        <div class="ds-image-preview__title"></div>
        <div class="ds-image-preview__meta"></div>
      </div>
      <div class="ds-image-preview__indicators"></div>
    `, document.body.appendChild(this.overlay), this.bindEvents();
      }
      bindEvents() {
        const i = this.overlay.querySelector(".ds-image-preview__close"), a = this.overlay.querySelector(".ds-image-preview__nav-btn--prev"), l = this.overlay.querySelector(".ds-image-preview__nav-btn--next");
        this._prevHandler = () => this.prev(), this._nextHandler = () => this.next(), i.addEventListener("click", this.closeHandler), a.addEventListener("click", this._prevHandler), l.addEventListener("click", this._nextHandler);
      }
      handleKeydown(i) {
        if (this.overlay.classList.contains("is-visible"))
          switch (i.key) {
            case "Escape":
              this.close();
              break;
            case "ArrowLeft":
              this.prev();
              break;
            case "ArrowRight":
              this.next();
              break;
          }
      }
      handleOverlayClick(i) {
        i.target === this.overlay && this.close();
      }
      show(i, a = 0) {
        this.images = i, this.currentIndex = Math.min(Math.max(a, 0), i.length - 1), this.render(), this.overlay.classList.add("is-visible"), document.addEventListener("keydown", this.keyHandler), this.overlay.addEventListener("click", this.clickHandler), document.body.style.overflow = "hidden";
      }
      close() {
        this.overlay.classList.remove("is-visible"), document.removeEventListener("keydown", this.keyHandler), this.overlay.removeEventListener("click", this.clickHandler), document.body.style.overflow = "";
      }
      prev() {
        this.currentIndex > 0 && (this.currentIndex--, this.render());
      }
      next() {
        this.currentIndex < this.images.length - 1 && (this.currentIndex++, this.render());
      }
      goTo(i) {
        i >= 0 && i < this.images.length && (this.currentIndex = i, this.render());
      }
      render() {
        const i = this.overlay.querySelector(".ds-image-preview__content img"), a = this.overlay.querySelector(".ds-image-preview__title"), l = this.overlay.querySelector(".ds-image-preview__meta"), c = this.overlay.querySelector(".ds-image-preview__indicators"), h = this.overlay.querySelector(".ds-image-preview__nav-btn--prev"), u = this.overlay.querySelector(".ds-image-preview__nav-btn--next"), d = this.images[this.currentIndex];
        i.src = d.src, i.alt = d.alt || "", a.textContent = d.title || "", l.textContent = d.meta || `${this.currentIndex + 1} / ${this.images.length}`, h.disabled = this.currentIndex === 0, u.disabled = this.currentIndex === this.images.length - 1, c.innerHTML = this.images.map((p, g) => `
      <button class="ds-image-preview__indicator${g === this.currentIndex ? " is-active" : ""}" type="button" data-index="${g}" aria-label="Go to image ${g + 1}"></button>
    `).join(""), c.querySelectorAll(".ds-image-preview__indicator").forEach((p) => {
          const g = () => {
            this.goTo(parseInt(p.dataset.index));
          };
          p.addEventListener("click", g), p._clickHandler = g;
        });
      }
      destroy() {
        this.close();
        const i = this.overlay?.querySelector(".ds-image-preview__indicators");
        i && i.querySelectorAll(".ds-image-preview__indicator").forEach((h) => {
          h._clickHandler && h.removeEventListener("click", h._clickHandler);
        });
        const a = this.overlay?.querySelector(".ds-image-preview__close"), l = this.overlay?.querySelector(".ds-image-preview__nav-btn--prev"), c = this.overlay?.querySelector(".ds-image-preview__nav-btn--next");
        a && a.removeEventListener("click", this.closeHandler), l && this._prevHandler && l.removeEventListener("click", this._prevHandler), c && this._nextHandler && c.removeEventListener("click", this._nextHandler), this.overlay && this.overlay.parentNode && this.overlay.parentNode.removeChild(this.overlay);
      }
    }
    let e = null;
    function r() {
      e || (e = new t()), document.querySelectorAll("[data-image-preview]").forEach((n) => {
        n.addEventListener("click", () => {
          const i = JSON.parse(n.getAttribute("data-image-preview")), a = parseInt(n.getAttribute("data-image-index")) || 0;
          e.show(i, a);
        });
      });
    }
    function o(n, i = 0) {
      e || (e = new t()), e.show(n, i);
    }
    s.exports && (s.exports = { ImagePreview: t, initImagePreview: r, showImagePreview: o });
  }(G)), G.exports;
}
Fe();
var Q = { exports: {} }, Dt;
function Oe() {
  return Dt || (Dt = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.closeBtn = i.querySelector(".ds-tag__close"), this._listeners = [], this.init();
      }
      init() {
        if (this.closeBtn) {
          const i = (a) => {
            a.stopPropagation(), this.element.dispatchEvent(new CustomEvent("ds-tag-remove", {
              detail: { tag: this.element },
              bubbles: !0
            })), this.element.remove();
          };
          this.closeBtn.addEventListener("click", i), this._listeners.push({ el: this.closeBtn, event: "click", handler: i });
        }
      }
      setContent(i) {
        const a = [];
        this.element.childNodes.forEach((l) => {
          l.nodeType === Node.TEXT_NODE && a.push(l);
        }), a.forEach((l) => l.remove()), this.element.insertBefore(document.createTextNode(i), this.closeBtn || null);
      }
      getContent() {
        return this.element.textContent.trim();
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.closeBtn = null, this.element = null;
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-tag").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { Tag: t, initTags: o, initTag: e, cleanupTag: r } : (window.Tag = t, window.initTag = e, window.cleanupTag = r), window.kupolaInitializer && window.kupolaInitializer.register("tag", e, r);
  }(Q)), Q.exports;
}
Oe();
var Z = { exports: {} }, Mt;
function Be() {
  return Mt || (Mt = 1, function(s) {
    class t {
      constructor(a) {
        this.element = a, this.valueElement = a.querySelector(".ds-statcard__value"), this.progressFill = a.querySelector(".ds-statcard__progress-fill"), this.animated = !1, this._observer = null, this.init();
      }
      init() {
        this.animateValue(), this.animateProgress(), this._observer = new IntersectionObserver((a) => {
          a.forEach((l) => {
            l.isIntersecting && !this.animated && (this.animateValue(), this.animateProgress(), this.animated = !0);
          });
        }, { threshold: 0.3 }), this._observer.observe(this.element);
      }
      animateValue() {
        if (!this.valueElement) return;
        const a = this.valueElement.textContent, l = a.match(/[\d.,]+/);
        if (!l) return;
        const c = parseFloat(l[0].replace(",", "")), h = a.substring(0, l.index), u = a.substring(l.index + l[0].length), d = 1500, p = performance.now(), g = 0, f = (m) => {
          const v = m - p, y = Math.min(v / d, 1), w = 1 - Math.pow(1 - y, 3), _ = g + (c - g) * w;
          let b;
          c >= 1e6 ? b = (_ / 1e6).toFixed(1) + "M" : c >= 1e3 ? b = (_ / 1e3).toFixed(1) + "K" : Number.isInteger(c) ? b = Math.floor(_).toLocaleString() : b = _.toFixed(2), this.valueElement.textContent = h + b + u, y < 1 && requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }
      animateProgress() {
        if (!this.progressFill) return;
        const a = this.progressFill.getAttribute("data-width") || "0%";
        this.progressFill.style.width = a;
      }
      updateValue(a, l = {}) {
        if (!this.valueElement) return;
        const c = l.duration || 800, h = this.valueElement.textContent, u = h.match(/[\d.,]+/);
        if (!u) {
          this.valueElement.textContent = a;
          return;
        }
        const d = h.substring(0, u.index), p = h.substring(u.index + u[0].length), g = parseFloat(u[0].replace(",", "")), f = parseFloat(a), m = performance.now(), v = (y) => {
          const w = y - m, _ = Math.min(w / c, 1), b = 1 - Math.pow(1 - _, 3), k = g + (f - g) * b;
          let S;
          f >= 1e6 ? S = (k / 1e6).toFixed(1) + "M" : f >= 1e3 ? S = (k / 1e3).toFixed(1) + "K" : Number.isInteger(f) ? S = Math.floor(k).toLocaleString() : S = k.toFixed(2), this.valueElement.textContent = d + S + p, _ < 1 && requestAnimationFrame(v);
        };
        requestAnimationFrame(v);
      }
      updateProgress(a, l = {}) {
        if (!this.progressFill) return;
        const c = l.duration || 600, h = parseFloat(this.progressFill.style.width || "0"), u = Math.min(Math.max(a, 0), 100), d = performance.now(), p = (g) => {
          const f = g - d, m = Math.min(f / c, 1), v = 1 - Math.pow(1 - m, 3), y = h + (u - h) * v;
          this.progressFill.style.width = y + "%", m < 1 && requestAnimationFrame(p);
        };
        requestAnimationFrame(p);
      }
      setTrend(a, l) {
        const c = this.element.querySelector(".ds-statcard__trend");
        if (!c) return;
        c.className = `ds-statcard__trend ds-statcard__trend--${a}`;
        const h = a === "up" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>' : a === "down" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 18 10.5 8.5 15.5 13.5 23 6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 19 18 13 12 7 6 13"/></svg>';
        c.innerHTML = h + l;
      }
      destroy() {
        this._observer && (this._observer.disconnect(), this._observer = null), this.animated = !1, this.valueElement = null, this.progressFill = null, this.element = null;
      }
    }
    function e(i) {
      if (i.__kupolaInitialized) return;
      const a = new t(i);
      i.__kupolaInstance = a, i.__kupolaInitialized = !0;
    }
    function r(i) {
      if (!i.__kupolaInitialized || !i.__kupolaInstance) return;
      i.__kupolaInstance.destroy(), i.__kupolaInstance = null, i.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-statcard").forEach((i) => {
        e(i);
      });
    }
    function n(i, a) {
      const l = document.querySelector(i);
      l && l.__kupolaInstance && l.__kupolaInstance.updateValue(a);
    }
    s.exports ? s.exports = { StatCard: t, initStatCards: o, initStatCard: e, cleanupStatCard: r, updateStatCard: n } : (window.StatCard = t, window.initStatCard = e, window.cleanupStatCard = r), window.kupolaInitializer && window.kupolaInitializer.register("statcard", e, r);
  }(Z)), Z.exports;
}
Be();
var tt = { exports: {} }, It;
function Ne() {
  return It || (It = 1, function(s) {
    class t {
      constructor(l, c = {}) {
        this.element = l, this.data = c.data || [], this.startDate = c.startDate || this.getOneYearAgo(), this.endDate = c.endDate || /* @__PURE__ */ new Date(), this.cellSize = c.cellSize || 14, this.onCellClick = c.onCellClick || null, this.tooltip = null, this.baseColor = c.color || l.getAttribute("data-color") || "#22c55e", this._listeners = [], this.init();
      }
      getOneYearAgo() {
        const l = /* @__PURE__ */ new Date();
        return l.setFullYear(l.getFullYear() - 1), l;
      }
      init() {
        this.render(), this.createTooltip();
      }
      getDataByDate(l) {
        const c = this.formatDate(l), h = this.data.find((u) => u.date === c);
        return h ? h.value : 0;
      }
      formatDate(l) {
        const c = l.getFullYear(), h = String(l.getMonth() + 1).padStart(2, "0"), u = String(l.getDate()).padStart(2, "0");
        return `${c}-${h}-${u}`;
      }
      getLevel(l, c) {
        if (l === 0) return 0;
        (!c || c === 0) && (c = Math.max(...this.data.map((u) => u.value), 1));
        const h = l / c;
        return h < 0.2 ? 1 : h < 0.4 ? 2 : h < 0.6 ? 3 : h < 0.8 ? 4 : 5;
      }
      hexToRgb(l) {
        const c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(l);
        return c ? {
          r: parseInt(c[1], 16),
          g: parseInt(c[2], 16),
          b: parseInt(c[3], 16)
        } : { r: 34, g: 197, b: 94 };
      }
      getCellColor(l) {
        const c = this.hexToRgb(this.baseColor);
        if (l === 0) return "rgba(0, 0, 0, 0.1)";
        const h = [0.2, 0.4, 0.6, 0.8, 1][l - 1];
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${h})`;
      }
      getWeekdayLabels() {
        return ["", "一", "", "三", "", "五", ""];
      }
      getMonthLabels() {
        const l = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], c = [];
        let h = -1;
        for (let u = new Date(this.startDate); u <= this.endDate; u.setDate(u.getDate() + 1)) {
          const d = u.getMonth(), p = u.getDate();
          d !== h && p === 1 && (c.push({ month: d, label: l[d], offset: Math.floor((u - this.startDate) / (1e3 * 60 * 60 * 24)) }), h = d);
        }
        return c;
      }
      getWeekCount() {
        let l = 0;
        const h = new Date(this.startDate).getDay();
        for (let u = new Date(this.startDate); u <= this.endDate; u.setDate(u.getDate() + 1))
          u.getDay() === 0 && l++;
        return h !== 0 && l++, l;
      }
      render() {
        const l = this.element.querySelector(".ds-heatmap__body");
        if (!l) return;
        l.innerHTML = "";
        const c = [];
        let h = [];
        const d = new Date(this.startDate).getDay();
        for (let E = 1; E < d; E++)
          h.push(null);
        for (let E = new Date(this.startDate); E <= this.endDate; E.setDate(E.getDate() + 1))
          h.push(new Date(E)), (E.getDay() === 6 || E.getTime() === this.endDate.getTime()) && (c.push(h), h = []);
        const p = c.length, g = this.element.classList.contains("ds-heatmap--compact") ? 12 : 16, f = p * g, m = document.createElement("div");
        m.className = "ds-heatmap__container";
        const v = document.createElement("div");
        v.className = "ds-heatmap__labels-and-grid";
        const y = document.createElement("div");
        y.className = "ds-heatmap__weekday-labels";
        const w = this.element.classList.contains("ds-heatmap--compact") ? 12 : 16;
        this.getWeekdayLabels().forEach((E) => {
          const C = document.createElement("div");
          C.className = "ds-heatmap__weekday-label", C.textContent = E, C.style.height = w + "px", C.style.lineHeight = w + "px", y.appendChild(C);
        }), v.appendChild(y);
        const _ = document.createElement("div");
        _.className = "ds-heatmap__grid-container";
        const b = document.createElement("div");
        b.className = "ds-heatmap__month-labels", b.style.width = f + "px";
        const k = this.getMonthLabels();
        k.forEach((E, C) => {
          const L = document.createElement("div");
          L.className = "ds-heatmap__month-label", L.textContent = E.label;
          const D = k[C + 1];
          let T;
          D ? T = Math.ceil((D.offset - E.offset) / 7) : T = p - Math.floor(E.offset / 7), L.style.width = T * g + "px", b.appendChild(L);
        }), _.appendChild(b);
        const S = document.createElement("div");
        S.className = "ds-heatmap__grid", c.forEach((E) => {
          const C = document.createElement("div");
          C.className = "ds-heatmap__week-column", E.forEach((L) => {
            if (L === null) {
              const D = document.createElement("div");
              D.className = "ds-heatmap__cell", D.style.visibility = "hidden", C.appendChild(D);
            } else {
              const D = this.getDataByDate(L), T = Math.max(...this.data.map((z) => z.value), 1), ee = this.getLevel(D, T), M = document.createElement("div");
              M.className = "ds-heatmap__cell", M.dataset.date = this.formatDate(L), M.dataset.value = D, M.style.backgroundColor = this.getCellColor(ee);
              const dt = (z) => this.showTooltip(z, L, D), ht = () => this.hideTooltip(), ut = () => {
                this.onCellClick && this.onCellClick({ date: this.formatDate(L), value: D });
              };
              M.addEventListener("mouseenter", dt), M.addEventListener("mouseleave", ht), M.addEventListener("click", ut), this._listeners.push(
                { el: M, event: "mouseenter", handler: dt },
                { el: M, event: "mouseleave", handler: ht },
                { el: M, event: "click", handler: ut }
              ), C.appendChild(M);
            }
          }), S.appendChild(C);
        }), _.appendChild(S), v.appendChild(_), m.appendChild(v), l.appendChild(m), this.renderLegend(l);
      }
      renderLegend(l) {
        const c = document.createElement("div");
        c.className = "ds-heatmap__legend";
        const h = document.createElement("span");
        h.className = "ds-heatmap__legend-label", h.textContent = "少";
        const u = document.createElement("div");
        u.className = "ds-heatmap__legend-cells";
        for (let p = 0; p <= 5; p++) {
          const g = document.createElement("div");
          g.className = "ds-heatmap__legend-cell", g.style.backgroundColor = this.getCellColor(p), u.appendChild(g);
        }
        const d = document.createElement("span");
        d.className = "ds-heatmap__legend-label", d.textContent = "多", c.appendChild(h), c.appendChild(u), c.appendChild(d), l.appendChild(c);
      }
      createTooltip() {
        this.tooltip = document.createElement("div"), this.tooltip.className = "ds-heatmap__tooltip", document.body.appendChild(this.tooltip);
      }
      showTooltip(l, c, h) {
        const u = l.target.getBoundingClientRect(), d = 150;
        this.tooltip.innerHTML = `
      <div class="ds-heatmap__tooltip-date">${c.getFullYear()}年${c.getMonth() + 1}月${c.getDate()}日</div>
      <div class="ds-heatmap__tooltip-value">${h} contributions</div>
    `, this.tooltip.style.left = Math.min(u.left + u.width / 2 - d / 2, window.innerWidth - d - 16) + "px", this.tooltip.style.top = u.top - 50 + "px", this.tooltip.classList.add("is-visible");
      }
      hideTooltip() {
        this.tooltip.classList.remove("is-visible");
      }
      updateData(l) {
        this._listeners.forEach(({ el: c, event: h, handler: u }) => {
          c.removeEventListener(h, u);
        }), this._listeners = [], this.data = l, this.render();
      }
      setDateRange(l, c) {
        this.startDate = l, this.endDate = c, this.render();
      }
      destroy() {
        this._listeners.forEach(({ el: l, event: c, handler: h }) => {
          l.removeEventListener(c, h);
        }), this._listeners = null, this.tooltip && this.tooltip.parentNode && this.tooltip.parentNode.removeChild(this.tooltip), this.tooltip = null, this.data = [], this.element = null;
      }
    }
    function e(a) {
      if (a.__kupolaInitialized) return;
      const l = a.getAttribute("data-heatmap-data");
      let c = [];
      if (l)
        try {
          c = JSON.parse(l);
        } catch {
          c = n();
        }
      else
        c = n();
      const h = new t(a, {
        data: c,
        onCellClick: (u) => {
        }
      });
      a.__kupolaInstance = h, a.__kupolaInitialized = !0;
    }
    function r(a) {
      if (!a.__kupolaInitialized || !a.__kupolaInstance) return;
      a.__kupolaInstance.destroy(), a.__kupolaInstance = null, a.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-heatmap").forEach((a) => {
        e(a);
      });
    }
    function n() {
      const a = [], l = /* @__PURE__ */ new Date(), c = /* @__PURE__ */ new Date();
      c.setFullYear(c.getFullYear() - 1);
      for (let h = new Date(c); h <= l; h.setDate(h.getDate() + 1)) {
        const u = h.getFullYear(), d = String(h.getMonth() + 1).padStart(2, "0"), p = String(h.getDate()).padStart(2, "0"), f = h.getDay() === 0 || h.getDay() === 6 ? Math.random() * 20 : Math.random() * 50, m = Math.floor(f);
        a.push({
          date: `${u}-${d}-${p}`,
          value: m > 0 ? m : Math.floor(Math.random() * 30) + 1
        });
      }
      return a;
    }
    function i(a, l = {}) {
      const c = document.querySelector(a);
      if (c) {
        const h = l.data || n();
        return new t(c, {
          data: h,
          ...l
        });
      }
      return null;
    }
    s.exports ? s.exports = { Heatmap: t, initHeatmaps: o, initHeatmap: e, cleanupHeatmap: r, createHeatmap: i, generateMockHeatmapData: n } : (window.Heatmap = t, window.initHeatmap = e, window.cleanupHeatmap = r), window.kupolaInitializer && window.kupolaInitializer.register("heatmap", e, r);
  }(tt)), tt.exports;
}
Ne();
class Ke {
  constructor(t) {
    this.element = t, this.tooltipEl = null, this._showTooltip = null, this._hideTooltip = null;
  }
  init() {
    this.element.__kupolaInitialized || (this._showTooltip = () => {
      const t = this.element.getAttribute("data-tooltip"), e = this.element.getAttribute("data-tooltip-position") || "top";
      t && (this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "ds-tooltip is-visible", this.tooltipEl.textContent = t, document.body.appendChild(this.tooltipEl), requestAnimationFrame(() => {
        const r = this.element.getBoundingClientRect(), o = this.tooltipEl.getBoundingClientRect(), n = window.innerWidth, i = window.innerHeight;
        let a, l;
        switch (e) {
          case "bottom":
            a = r.left + r.width / 2 - o.width / 2, l = r.bottom + 8;
            break;
          case "right":
            a = r.right + 8, l = r.top + r.height / 2 - o.height / 2;
            break;
          case "left":
            a = r.left - o.width - 8, l = r.top + r.height / 2 - o.height / 2;
            break;
          case "top":
          default:
            a = r.left + r.width / 2 - o.width / 2, l = r.top - o.height - 8;
            break;
        }
        a < 8 && (a = 8), a + o.width > n && (a = n - o.width - 8), l < 8 && (l = 8), l + o.height > i && (l = i - o.height - 8), this.tooltipEl.style.left = `${a}px`, this.tooltipEl.style.top = `${l}px`, this.tooltipEl.style.position = "fixed";
      }));
    }, this._hideTooltip = () => {
      this.tooltipEl && (this.tooltipEl.remove(), this.tooltipEl = null);
    }, this.element.addEventListener("mouseenter", this._showTooltip), this.element.addEventListener("mouseleave", this._hideTooltip), this.element.addEventListener("focus", this._showTooltip), this.element.addEventListener("blur", this._hideTooltip), this.element.__kupolaInitialized = !0);
  }
  destroy() {
    this.element.__kupolaInitialized && (this._showTooltip && (this.element.removeEventListener("mouseenter", this._showTooltip), this.element.removeEventListener("focus", this._showTooltip)), this._hideTooltip && (this.element.removeEventListener("mouseleave", this._hideTooltip), this.element.removeEventListener("blur", this._hideTooltip)), this._showTooltip && this._hideTooltip && this._hideTooltip(), this._showTooltip = null, this._hideTooltip = null, this.element.__kupolaInitialized = !1);
  }
}
function Ve(s) {
  const t = new Ke(s);
  t.init(), s._kupolaTooltip = t;
}
function Ue(s) {
  s._kupolaTooltip && (s._kupolaTooltip.destroy(), s._kupolaTooltip = null);
}
window.kupolaInitializer && window.kupolaInitializer.register("tooltip", Ve, Ue);
class Xt {
  constructor() {
    this.validators = {
      required: this.validateRequired,
      email: this.validateEmail,
      url: this.validateUrl,
      minLength: this.validateMinLength,
      maxLength: this.validateMaxLength,
      pattern: this.validatePattern,
      min: this.validateMin,
      max: this.validateMax,
      equalTo: this.validateEqualTo,
      phone: this.validatePhone,
      date: this.validateDate,
      number: this.validateNumber
    }, this.customValidators = {}, this.asyncValidators = {}, this.customAsyncValidators = {}, this.formStates = {}, this.submitting = /* @__PURE__ */ new Set();
  }
  addValidator(t, e) {
    this.customValidators[t] = e;
  }
  addAsyncValidator(t, e) {
    this.customAsyncValidators[t] = e;
  }
  validate(t) {
    const e = t.id || `form-${Math.random().toString(36).substr(2, 9)}`, r = {}, o = t.querySelectorAll("[data-validate]");
    let n = !1;
    return o.forEach((i) => {
      const a = i.name || i.id, l = this.parseRules(i.getAttribute("data-validate")), c = this.getValue(i);
      for (const [h, u] of Object.entries(l))
        if ((this.customValidators[h] || this.validators[h])?.(c, u))
          this.clearError(i);
        else {
          r[a] = this.getErrorMessage(h, u, i), this.showError(i, r[a]), n = !0;
          break;
        }
    }), this.formStates[e] = {
      valid: !n,
      errors: r,
      errorCount: Object.keys(r).length
    }, this.updateFormState(t), !n;
  }
  getValue(t) {
    if (t.classList.contains("ds-datepicker__input") || t.classList.contains("ds-timepicker__input"))
      return t.value.trim();
    if (t.closest(".ds-select")) {
      const e = t.closest(".ds-select"), r = e.querySelector(".ds-select__value") || e.querySelector(".ds-select__trigger span");
      return r ? r.textContent.trim() : "";
    }
    if (t.closest(".ds-fileupload")) {
      const r = t.closest(".ds-fileupload").__fileUploadInstance;
      return r && r.getFiles().length > 0 ? "has-files" : "";
    }
    return t.value.trim();
  }
  validateInput(t) {
    const e = this.parseRules(t.getAttribute("data-validate")), r = this.getValue(t);
    for (const [o, n] of Object.entries(e))
      if (!(this.customValidators[o] || this.validators[o])?.(r, n))
        return this.showError(t, this.getErrorMessage(o, n, t)), !1;
    return this.clearError(t), !0;
  }
  validateAll() {
    const t = document.querySelectorAll("form[data-validation]");
    let e = !0;
    return t.forEach((r) => {
      this.validate(r) || (e = !1);
    }), e;
  }
  async validateAsync(t, e = {}) {
    const r = t.id || `form-${Math.random().toString(36).substr(2, 9)}`, o = e.group, n = o ? t.querySelectorAll(`[data-validate][data-validate-group="${o}"]`) : t.querySelectorAll("[data-validate]");
    let i = !1;
    for (const l of n)
      await this.validateInputAsync(l) || (i = !0);
    const a = {};
    return n.forEach((l) => {
      const c = l.name || l.id, h = l.parentElement.querySelector(".ds-input__error");
      h && (a[c] = h.textContent);
    }), this.formStates[r] = {
      valid: !i,
      errors: a,
      errorCount: Object.keys(a).length
    }, this.updateFormState(t), !i;
  }
  async validateInputAsync(t) {
    const e = this.parseRules(t.getAttribute("data-validate")), r = this.parseRules(t.getAttribute("data-validate-async") || ""), o = this.getValue(t);
    for (const [n, i] of Object.entries(e))
      if (!(this.customValidators[n] || this.validators[n])?.(o, i))
        return this.showError(t, this.getErrorMessage(n, i, t)), !1;
    for (const [n, i] of Object.entries(r)) {
      const a = this.customAsyncValidators[n] || this.asyncValidators[n];
      if (a)
        try {
          if (!await a(o, i, t))
            return this.showError(t, this.getErrorMessage(n, i, t)), !1;
        } catch (l) {
          return this.showError(t, l.message || "Validation error"), !1;
        }
    }
    return this.clearError(t), !0;
  }
  async validateGroup(t, e) {
    const r = t.querySelectorAll(`[data-validate][data-validate-group="${e}"]`);
    let o = !1;
    for (const n of r)
      await this.validateInputAsync(n) || (o = !0);
    return !o;
  }
  getGroups(t) {
    const e = /* @__PURE__ */ new Set();
    return t.querySelectorAll("[data-validate-group]").forEach((r) => {
      e.add(r.getAttribute("data-validate-group"));
    }), Array.from(e);
  }
  getFormState(t) {
    const e = t.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    return this.formStates[e] || { valid: !0, errors: {}, errorCount: 0, loading: !1, submitting: !1, disabled: !1 };
  }
  updateFormState(t) {
    const e = this.getFormState(t);
    e.valid ? (t.classList.remove("ds-form--invalid"), t.classList.add("ds-form--valid")) : (t.classList.remove("ds-form--valid"), t.classList.add("ds-form--invalid")), e.loading ? t.classList.add("ds-form--loading") : t.classList.remove("ds-form--loading"), e.submitting ? t.classList.add("ds-form--submitting") : t.classList.remove("ds-form--submitting"), e.disabled ? (t.classList.add("ds-form--disabled"), t.querySelectorAll("input, select, textarea, button").forEach((o) => o.disabled = !0)) : (t.classList.remove("ds-form--disabled"), t.querySelectorAll("input, select, textarea, button").forEach((o) => {
      o.hasAttribute("data-permanent-disabled") || (o.disabled = !1);
    }));
    const r = t.querySelector(".ds-form__status");
    r && (e.errorCount > 0 ? (r.textContent = `${e.errorCount} ${e.errorCount === 1 ? "error" : "errors"} found`, r.classList.add("ds-form__status--error")) : (r.textContent = "All fields are valid", r.classList.remove("ds-form__status--error")));
  }
  setFormLoading(t, e) {
    const r = t.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    this.formStates[r] || (this.formStates[r] = { valid: !0, errors: {}, errorCount: 0, loading: !1, submitting: !1, disabled: !1 }), this.formStates[r].loading = e, this.updateFormState(t);
  }
  setFormSubmitting(t, e) {
    const r = t.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    this.formStates[r] || (this.formStates[r] = { valid: !0, errors: {}, errorCount: 0, loading: !1, submitting: !1, disabled: !1 }), this.formStates[r].submitting = e, this.updateFormState(t);
  }
  setFormDisabled(t, e) {
    const r = t.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    this.formStates[r] || (this.formStates[r] = { valid: !0, errors: {}, errorCount: 0, loading: !1, submitting: !1, disabled: !1 }), this.formStates[r].disabled = e, this.updateFormState(t);
  }
  resetForm(t) {
    const e = t.id || `form-${Math.random().toString(36).substr(2, 9)}`;
    this.formStates[e] = { valid: !0, errors: {}, errorCount: 0, loading: !1, submitting: !1, disabled: !1 }, t.reset(), t.querySelectorAll(".ds-input--error").forEach((r) => {
      r.classList.remove("ds-input--error");
      const o = r.parentElement?.querySelector(".ds-input__error");
      o && (o.textContent = "");
    }), this.updateFormState(t);
  }
  parseRules(t) {
    const e = {};
    return t.split("|").forEach((o) => {
      const [n, i] = o.split(":");
      e[n] = i ? i.split(",") : [];
    }), e;
  }
  validateRequired(t) {
    return t !== "";
  }
  validateEmail(t) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }
  validateUrl(t) {
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(t);
  }
  validateMinLength(t, [e]) {
    return t.length >= parseInt(e);
  }
  validateMaxLength(t, [e]) {
    return t.length <= parseInt(e);
  }
  validatePattern(t, [e]) {
    return new RegExp(e).test(t);
  }
  validateMin(t, [e]) {
    return parseFloat(t) >= parseFloat(e);
  }
  validateMax(t, [e]) {
    return parseFloat(t) <= parseFloat(e);
  }
  validateEqualTo(t, [e]) {
    const r = document.getElementById(e);
    return r && t === r.value;
  }
  validatePhone(t) {
    return /^[\d\s\-\+\(\)]{7,20}$/.test(t);
  }
  validateDate(t) {
    return /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(t) && !isNaN(Date.parse(t));
  }
  validateNumber(t) {
    return !isNaN(parseFloat(t)) && isFinite(t);
  }
  showError(t, e) {
    t.classList.add("ds-input--error"), t.classList.remove("ds-input--success"), t.setAttribute("aria-invalid", "true");
    let r = t.parentElement.querySelector(".ds-input__error");
    r || (r = document.createElement("span"), r.className = "ds-input__error", r.setAttribute("role", "alert"), r.setAttribute("aria-live", "polite"), t.parentElement.appendChild(r)), r.textContent = e, this.removeStatusIcon(t), t.dispatchEvent(new CustomEvent("validation-error", { detail: { message: e } }));
  }
  clearError(t) {
    t.classList.remove("ds-input--error"), t.setAttribute("aria-invalid", "false");
    const e = t.parentElement.querySelector(".ds-input__error");
    e && e.remove(), t.dispatchEvent(new CustomEvent("validation-success"));
  }
  showSuccess(t) {
    t.classList.add("ds-input--success"), t.classList.remove("ds-input--error"), t.setAttribute("aria-invalid", "false"), this.removeStatusIcon(t);
    const e = document.createElement("span");
    e.className = "ds-input__status-icon ds-input__status-icon--success", e.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', t.parentElement.appendChild(e);
  }
  removeStatusIcon(t) {
    const e = t.parentElement.querySelector(".ds-input__status-icon");
    e && e.remove();
  }
  getErrorMessage(t, e, r) {
    const o = r.getAttribute(`data-message-${t}`);
    return o || {
      required: "This field is required",
      email: "Please enter a valid email address",
      url: "Please enter a valid URL",
      minLength: `Minimum length is ${e[0]} characters`,
      maxLength: `Maximum length is ${e[0]} characters`,
      pattern: "Please enter a valid value",
      min: `Minimum value is ${e[0]}`,
      max: `Maximum value is ${e[0]}`,
      equalTo: "Values do not match",
      phone: "Please enter a valid phone number",
      date: "Please enter a valid date (YYYY-MM-DD)",
      number: "Please enter a valid number"
    }[t] || "Invalid input";
  }
}
const H = new Xt();
window.__kupolaValidationInitialized || (window.__kupolaValidationInitialized = !0, document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form[data-validation]").forEach((s) => {
    s.addEventListener("submit", async (t) => {
      const e = s.id || `form-${Math.random().toString(36).substr(2, 9)}`;
      if (H.submitting.has(e)) {
        t.preventDefault();
        return;
      }
      t.preventDefault();
      const r = s.querySelector("[data-validate-async]") !== null;
      let o;
      if (r ? o = await H.validateAsync(s) : o = H.validate(s), o) {
        H.submitting.add(e);
        const n = s.querySelector('button[type="submit"]');
        if (n) {
          const i = n.textContent;
          n.setAttribute("data-original-text", i), n.textContent = "Submitting...", n.disabled = !0;
        }
        try {
          const i = s.getAttribute("data-on-submit");
          i && window[i] ? await window[i](s) : s.submit();
        } finally {
          H.submitting.delete(e), n && (n.textContent = n.getAttribute("data-original-text") || "Submit", n.disabled = !1);
        }
      } else {
        const n = s.querySelector(".ds-input--error");
        n && n.focus();
      }
    }), s.querySelectorAll("[data-validate]").forEach((t) => {
      t.addEventListener("blur", () => {
        setTimeout(() => {
          const o = document.activeElement;
          if (o && o.closest(".ds-select"))
            return;
          H.validateInput(t) && t.value.trim() && H.showSuccess(t);
        }, 50);
      });
      const r = ((o, n) => {
        let i;
        return (...a) => {
          clearTimeout(i), i = setTimeout(() => o.apply(void 0, a), n);
        };
      })(() => {
        const o = H.getValue(t);
        o.length > 0 || t.classList.contains("ds-input--error") ? H.validateInput(t) && o && H.showSuccess(t) : H.removeStatusIcon(t);
      }, 300);
      t.addEventListener("input", r), t.addEventListener("keyup", (o) => {
        o.key === "Enter" && H.validateInput(t) && t.value.trim() && H.showSuccess(t);
      });
    });
  });
}));
window.KupolaValidator = Xt;
window.kupolaValidator = H;
var et = { exports: {} }, Tt;
function We() {
  return Tt || (Tt = 1, function(s) {
    class t {
      constructor(l, c = {}) {
        this.element = l, this.data = c.data || [], this.itemHeight = c.itemHeight || 48, this.itemWidth = c.itemWidth || 200, this.bufferSize = c.bufferSize || 5, this.renderItem = c.renderItem || this.defaultRenderItem, this.onItemClick = c.onItemClick || null, this.onItemSelect = c.onItemSelect || null, this.onScroll = c.onScroll || null, this.onScrollEnd = c.onScrollEnd || null, this.selectedKey = c.selectedKey || null, this.keyField = c.keyField || "id", this.useDynamicHeight = c.useDynamicHeight || !1, this.dynamicHeightCache = /* @__PURE__ */ new Map(), this.estimatedHeight = c.estimatedHeight || 48, this.container = null, this.scrollbarTrack = null, this.scrollbarThumb = null, this.totalHeight = 0, this.startIndex = 0, this.endIndex = 0, this.isScrolling = !1, this.scrollTimeout = null, this.lastScrollTop = 0, this.lastScrollLeft = 0, this.init();
      }
      defaultRenderItem(l, c) {
        return `
      <div class="ds-virtual-list__item-content">
        <div class="ds-virtual-list__item-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <div class="ds-virtual-list__item-title">${l.title || l.name || `Item ${c + 1}`}</div>
          <div class="ds-virtual-list__item-subtitle">${l.subtitle || "Subtitle"}</div>
        </div>
      </div>
    `;
      }
      init() {
        this.createStructure(), this.update(), this.bindEvents();
      }
      createStructure() {
        this.element.innerHTML = `
      <div class="ds-virtual-list__scrollbar">
        <div class="ds-virtual-list__scrollbar-track">
          <div class="ds-virtual-list__scrollbar-thumb"></div>
        </div>
      </div>
      <div class="ds-virtual-list__container"></div>
    `, this.container = this.element.querySelector(".ds-virtual-list__container"), this.scrollbarThumb = this.element.querySelector(".ds-virtual-list__scrollbar-thumb");
      }
      bindEvents() {
        this._scrollHandler = (l) => this.handleScroll(l), this._thumbDragStartHandler = (l) => this.handleThumbDragStart(l), this._thumbDragMoveHandler = (l) => this.handleThumbDragMove(l), this._thumbDragEndHandler = () => this.handleThumbDragEnd(), this._wheelHandler = (l) => {
          l.preventDefault(), this.element.classList.contains("ds-virtual-list--horizontal") ? this.element.scrollLeft += l.deltaX + l.deltaY : this.element.scrollTop += l.deltaY + l.deltaX;
        }, this.element.addEventListener("scroll", this._scrollHandler), this.scrollbarThumb.addEventListener("mousedown", this._thumbDragStartHandler), document.addEventListener("mousemove", this._thumbDragMoveHandler), document.addEventListener("mouseup", this._thumbDragEndHandler), this.element.addEventListener("wheel", this._wheelHandler, { passive: !1 }), this._listeners = [
          { el: this.element, event: "scroll", handler: this._scrollHandler },
          { el: this.scrollbarThumb, event: "mousedown", handler: this._thumbDragStartHandler },
          { el: document, event: "mousemove", handler: this._thumbDragMoveHandler },
          { el: document, event: "mouseup", handler: this._thumbDragEndHandler },
          { el: this.element, event: "wheel", handler: this._wheelHandler }
        ];
      }
      handleScroll(l) {
        const c = this.element.classList.contains("ds-virtual-list--horizontal"), h = c ? this.element.scrollLeft : this.element.scrollTop;
        this.onScroll && this.onScroll({
          scrollOffset: h,
          isHorizontal: c,
          dataLength: this.data.length,
          startIndex: this.startIndex,
          endIndex: this.endIndex
        }), this.updateScrollState(), this.renderVisibleItems(), this.updateScrollbar();
      }
      updateScrollState() {
        this.isScrolling = !0, this.element.classList.add("ds-virtual-list--scrolling"), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
          if (this.isScrolling = !1, this.element.classList.remove("ds-virtual-list--scrolling"), this.onScrollEnd) {
            const l = this.element.classList.contains("ds-virtual-list--horizontal"), c = l ? this.element.scrollLeft : this.element.scrollTop;
            this.onScrollEnd({
              scrollOffset: c,
              isHorizontal: l,
              dataLength: this.data.length,
              startIndex: this.startIndex,
              endIndex: this.endIndex
            });
          }
        }, 200);
      }
      getItemSize(l) {
        const c = this.element.classList.contains("ds-virtual-list--horizontal");
        if (this.useDynamicHeight) {
          const h = this.data[l][this.keyField] || l;
          if (this.dynamicHeightCache.has(h))
            return this.dynamicHeightCache.get(h);
        }
        return c ? this.itemWidth : this.itemHeight;
      }
      getItemPositions() {
        const l = [];
        let c = 0;
        return this.data.forEach((h, u) => {
          const d = this.getItemSize(u);
          l.push({
            start: c,
            end: c + d,
            size: d
          }), c += d;
        }), l;
      }
      getTotalSize() {
        if (this.useDynamicHeight)
          return this.data.reduce((h, u, d) => h + this.getItemSize(d), 0);
        const c = this.element.classList.contains("ds-virtual-list--horizontal") ? this.itemWidth : this.itemHeight;
        return this.data.length * c;
      }
      getIndexAtOffset(l) {
        if (this.useDynamicHeight) {
          const u = this.getItemPositions();
          for (let d = 0; d < u.length; d++)
            if (l >= u[d].start && l < u[d].end)
              return d;
          return this.data.length - 1;
        }
        const h = this.element.classList.contains("ds-virtual-list--horizontal") ? this.itemWidth : this.itemHeight;
        return Math.floor(l / h);
      }
      renderVisibleItems() {
        const l = this.element.classList.contains("ds-virtual-list--horizontal"), c = l ? this.element.scrollLeft : this.element.scrollTop, h = l ? this.element.clientWidth : this.element.clientHeight, u = Math.max(0, this.getIndexAtOffset(c) - this.bufferSize);
        let d = Math.min(
          this.data.length - 1,
          this.getIndexAtOffset(c + h) + this.bufferSize
        );
        d < u && (d = u), this.startIndex = u, this.endIndex = d;
        const p = this.data.slice(u, d + 1);
        let g = "", f = 0;
        if (this.useDynamicHeight)
          f = this.getItemPositions()[u]?.start || 0;
        else {
          const m = l ? this.itemWidth : this.itemHeight;
          f = u * m;
        }
        p.forEach((m, v) => {
          const y = u + v, w = m[this.keyField] || y, _ = this.selectedKey === w, b = this.getItemSize(y), k = f;
          l ? g += `
          <div 
            class="ds-virtual-list__item${_ ? " is-selected" : ""}" 
            style="position: absolute; top: 0; left: ${k}px; width: ${b}px; height: 100%;"
            data-index="${y}"
            data-key="${w}"
          >
            ${this.renderItem(m, y)}
          </div>
        ` : g += `
          <div 
            class="ds-virtual-list__item${_ ? " is-selected" : ""}" 
            style="position: absolute; top: ${k}px; left: 0; right: 0; height: ${b}px;"
            data-index="${y}"
            data-key="${w}"
          >
            ${this.renderItem(m, y)}
          </div>
        `, f += b;
        }), this.container.innerHTML = g, this.useDynamicHeight && this.updateDynamicHeights(), this.container.querySelectorAll(".ds-virtual-list__item").forEach((m) => {
          m.addEventListener("click", () => this.handleItemClick(m));
        });
      }
      updateDynamicHeights() {
        if (this.isUpdating) return;
        let l = !1;
        this.container.querySelectorAll(".ds-virtual-list__item").forEach((c) => {
          const h = parseInt(c.dataset.index), u = this.data[h][this.keyField] || h, d = c.offsetHeight;
          d !== this.getItemSize(h) && (this.dynamicHeightCache.set(u, d), l = !0);
        }), l && (this.isUpdating = !0, this.update(), this.isUpdating = !1);
      }
      handleItemClick(l) {
        const c = parseInt(l.dataset.index), h = l.dataset.key, u = this.data[c];
        this.onItemClick && this.onItemClick({ item: u, index: c, key: h }), this.onItemSelect && this.select(h);
      }
      select(l) {
        if (this.selectedKey = l, this.onItemSelect) {
          const c = this.data.findIndex((h) => h[this.keyField] === l);
          c !== -1 && this.onItemSelect({ item: this.data[c], index: c, key: l });
        }
        this.renderVisibleItems();
      }
      updateScrollbar() {
        const l = this.element.classList.contains("ds-virtual-list--horizontal"), c = this.getTotalSize(), h = l ? this.element.clientWidth : this.element.clientHeight, u = l ? this.element.scrollLeft : this.element.scrollTop;
        if (l) {
          this.scrollbarThumb.style.display = "none";
          return;
        }
        const d = Math.max(20, h / c * h), p = h - d, g = u / (c - h || 1) * p;
        this.scrollbarThumb.style.height = d + "px", this.scrollbarThumb.style.top = g + "px";
      }
      handleThumbDragStart(l) {
        l.preventDefault(), this.isDragging = !0, this.dragStartY = l.clientY, this.dragStartTop = parseFloat(this.scrollbarThumb.style.top) || 0;
      }
      handleThumbDragMove(l) {
        if (!this.isDragging) return;
        const c = this.element.clientHeight, h = this.getTotalSize(), u = parseFloat(this.scrollbarThumb.style.height) || c, d = c - u, p = l.clientY - this.dragStartY;
        let g = this.dragStartTop + p;
        g = Math.max(0, Math.min(g, d)), this.scrollbarThumb.style.top = g + "px";
        const f = g / d * (h - c || 0);
        this.element.scrollTop = f;
      }
      handleThumbDragEnd() {
        this.isDragging = !1;
      }
      update() {
        const l = this.element.classList.contains("ds-virtual-list--horizontal"), c = this.getTotalSize();
        l ? (this.container.style.width = c + "px", this.container.style.height = "100%") : (this.container.style.height = c + "px", this.container.style.width = "100%"), this.renderVisibleItems(), this.updateScrollbar();
      }
      setData(l) {
        this.data = l, this.useDynamicHeight && this.dynamicHeightCache.clear(), this.update();
      }
      addItem(l) {
        this.data.push(l), this.update();
      }
      removeItem(l) {
        this.data.splice(l, 1), this.useDynamicHeight && this.dynamicHeightCache.clear(), this.update();
      }
      insertItem(l, c) {
        this.data.splice(l, 0, c), this.useDynamicHeight && this.dynamicHeightCache.clear(), this.update();
      }
      scrollTo(l, c = "smooth") {
        const h = this.element.classList.contains("ds-virtual-list--horizontal");
        let u = 0;
        if (this.useDynamicHeight)
          u = this.getItemPositions()[l]?.start || 0;
        else {
          const d = h ? this.itemWidth : this.itemHeight;
          u = l * d;
        }
        h ? this.element.scrollTo({ left: u, behavior: c }) : this.element.scrollTo({ top: u, behavior: c });
      }
      scrollToKey(l, c = "smooth") {
        const h = this.data.findIndex((u) => u[this.keyField] === l);
        h !== -1 && this.scrollTo(h, c);
      }
      scrollToTop(l = "smooth") {
        const c = this.element.classList.contains("ds-virtual-list--horizontal");
        this.element.scrollTo({ [c ? "left" : "top"]: 0, behavior: l });
      }
      scrollToBottom(l = "smooth") {
        const c = this.element.classList.contains("ds-virtual-list--horizontal"), h = this.getTotalSize(), u = c ? this.element.clientWidth : this.element.clientHeight;
        this.element.scrollTo({ [c ? "left" : "top"]: h - u, behavior: l });
      }
      getVisibleItems() {
        return this.data.slice(this.startIndex, this.endIndex + 1).map((l, c) => ({
          item: l,
          index: this.startIndex + c,
          key: l[this.keyField] || this.startIndex + c
        }));
      }
      getItemIndex(l) {
        return this.data.findIndex((c) => c[this.keyField] === l);
      }
      getItem(l) {
        const c = this.getItemIndex(l);
        return c !== -1 ? this.data[c] : null;
      }
      refreshCache() {
        this.dynamicHeightCache.clear(), this.update();
      }
      destroy() {
        this.scrollTimeout && clearTimeout(this.scrollTimeout), this._listeners?.forEach(({ el: l, event: c, handler: h }) => {
          l.removeEventListener(c, h);
        }), this.data = [], this.dynamicHeightCache.clear(), this.container.innerHTML = "", this._listeners = null, this._scrollHandler = null, this._thumbDragStartHandler = null, this._thumbDragMoveHandler = null, this._thumbDragEndHandler = null, this._wheelHandler = null, this.container = null, this.scrollbarThumb = null, this.element = null;
      }
    }
    function e(a = 1e3) {
      const l = [], c = ["Document", "Image", "Video", "Folder", "Archive", "Spreadsheet", "Presentation", "Code"];
      for (let h = 1; h <= a; h++) {
        const u = Math.floor(Math.random() * c.length), d = Math.floor(Math.random() * 1e4);
        l.push({
          id: h,
          title: `${c[u]} ${d}`,
          subtitle: `Last modified ${Math.floor(Math.random() * 30)} days ago`,
          type: c[u].toLowerCase()
        });
      }
      return l;
    }
    function r(a, l = {}) {
      const c = document.querySelector(a);
      if (c) {
        const h = l.data || e(l.count || 1e3);
        return new t(c, {
          data: h,
          ...l
        });
      }
      return null;
    }
    function o(a) {
      if (a.__kupolaInitialized) return;
      const l = a.getAttribute("data-virtual-list");
      let c = [];
      if (l)
        try {
          c = JSON.parse(l);
        } catch {
          c = e(1e3);
        }
      else
        c = e(1e3);
      const h = new t(a, {
        data: c,
        onItemClick: (u) => {
        },
        onItemSelect: (u) => {
        }
      });
      a.__kupolaInstance = h, a.__kupolaInitialized = !0;
    }
    function n(a) {
      if (!a.__kupolaInitialized || !a.__kupolaInstance) return;
      a.__kupolaInstance.destroy(), a.__kupolaInstance = null, a.__kupolaInitialized = !1;
    }
    function i() {
      document.querySelectorAll(".ds-virtual-list").forEach((a) => {
        o(a);
      });
    }
    s.exports ? s.exports = { VirtualList: t, initVirtualLists: i, initVirtualList: o, cleanupVirtualList: n, createVirtualList: r, generateMockVirtualListData: e } : (window.initVirtualList = o, window.cleanupVirtualList = n), window.kupolaInitializer && window.kupolaInitializer.register("virtual-list", o, n);
  }(et)), et.exports;
}
We();
let Jt = class {
  constructor(t = {}) {
    this.enabled = t.enabled ?? !1, this.panel = null, this.isOpen = !1, this.activeTab = "storage", this.activeStorageType = "cookies", this.requestHistory = [], this.maxHistorySize = 50;
  }
  init() {
    if (this.enabled)
      try {
        this.createToggleButton(), this.createPanel(), this.setupNetworkInterceptor();
      } catch (t) {
        console.error("Error in init:", t);
      }
  }
  createToggleButton() {
    const t = document.createElement("button");
    t.className = "kupola-devtools__toggle", t.textContent = "🛠️", t.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #535164;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 9999;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    `, t.addEventListener("click", () => this.togglePanel()), document.body.appendChild(t), this.toggleButton = t;
  }
  createPanel() {
    const t = document.createElement("div");
    t.className = "kupola-devtools__panel", t.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 28px;
      width: 550px;
      max-height: 650px;
      background: #1e1e1e;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 9998;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #333;
    `, t.innerHTML = `
      <div class="kupola-devtools__header">
        <span class="kupola-devtools__title">DevTools</span>
        <button class="kupola-devtools__close">✕</button>
      </div>
      <div class="kupola-devtools__tabs">
        <button data-tab="storage" class="kupola-devtools__tab active">Storage</button>
        <button data-tab="network" class="kupola-devtools__tab">Network</button>
      </div>
      <div class="kupola-devtools__sub-tabs" id="storage-sub-tabs">
        <button class="kupola-devtools__sub-tab active" data-storage="cookies">Cookies</button>
        <button class="kupola-devtools__sub-tab" data-storage="localStorage">LocalStorage</button>
        <button class="kupola-devtools__sub-tab" data-storage="sessionStorage">SessionStorage</button>
      </div>
      <div class="kupola-devtools__sub-tabs" id="network-sub-tabs" style="display:none;">
        <button class="kupola-devtools__network-action" data-action="clear">Clear</button>
      </div>
      <div class="kupola-devtools__content">
        ${this.getStorageContent("cookies")}
      </div>
    `, document.body.appendChild(t), this.panel = t, t.querySelector(".kupola-devtools__close").addEventListener("click", () => this.togglePanel()), t.querySelectorAll(".kupola-devtools__tab").forEach((e) => {
      e.addEventListener("click", () => this.switchTab(e.dataset.tab));
    }), this.setupStorageListener(), this.makeDraggable(), this.injectStyles();
  }
  switchTab(t) {
    this.activeTab = t, this.panel.querySelectorAll(".kupola-devtools__tab").forEach((o) => {
      o.classList.toggle("active", o.dataset.tab === t);
    });
    const e = this.panel.querySelector("#storage-sub-tabs"), r = this.panel.querySelector("#network-sub-tabs");
    t === "storage" ? (e.style.display = "flex", r.style.display = "none", this.renderStorageContent()) : (e.style.display = "none", r.style.display = "flex", this.renderNetworkContent());
  }
  renderStorageContent() {
    const t = this.panel.querySelector(".kupola-devtools__content");
    t && (t.innerHTML = this.getStorageContent(this.activeStorageType));
  }
  renderNetworkContent() {
    const t = this.panel.querySelector(".kupola-devtools__content");
    if (!t) return;
    if (this.requestHistory.length === 0) {
      t.innerHTML = '<div class="kupola-devtools__loading">No network requests captured</div>';
      return;
    }
    let e = "";
    this.requestHistory.forEach((o, n) => {
      const i = o.status >= 200 && o.status < 300 ? "success" : o.status >= 400 ? "error" : "warning", a = o.duration ? `${o.duration}ms` : "-";
      e += `
        <div class="kupola-devtools__network-item" data-index="${n}">
          <div class="kupola-devtools__network-header">
            <span class="kupola-devtools__network-method">${o.method}</span>
            <span class="kupola-devtools__network-url">${o.url}</span>
            <span class="kupola-devtools__network-status ${i}">${o.status}</span>
            <span class="kupola-devtools__network-duration">${a}</span>
          </div>
          <div class="kupola-devtools__network-details" style="display:none;">
            ${o.params ? `<div class="kupola-devtools__network-detail"><strong>Params:</strong><pre>${this.truncateContent(JSON.stringify(o.params, null, 2), 1e3)}</pre></div>` : ""}
            ${o.requestBody ? `<div class="kupola-devtools__network-detail"><strong>Request Body:</strong><pre>${this.truncateContent(o.requestBody, 1e3)}</pre></div>` : ""}
            ${o.response ? `<div class="kupola-devtools__network-detail"><strong>Response:</strong><pre>${this.truncateContent(o.response, 1500)}</pre></div>` : ""}
          </div>
        </div>
      `;
    }), t.innerHTML = e, t.querySelectorAll(".kupola-devtools__network-item").forEach((o) => {
      o.addEventListener("click", () => {
        const n = o.querySelector(".kupola-devtools__network-details");
        n.style.display = n.style.display === "none" ? "block" : "none";
      });
    });
    const r = this.panel.querySelector('[data-action="clear"]');
    r && r.addEventListener("click", (o) => {
      o.stopPropagation(), this.clearNetworkHistory();
    });
  }
  clearNetworkHistory() {
    this.requestHistory = [], this.renderNetworkContent();
  }
  truncateContent(t, e) {
    if (!t) return "-";
    const r = typeof t == "string" ? t : JSON.stringify(t);
    return r.length <= e ? r : r.substring(0, e) + `... (truncated, ${r.length} chars)`;
  }
  setupNetworkInterceptor() {
    const t = this, e = window.fetch;
    window.fetch = async function(i, a = {}) {
      const l = Date.now(), c = Date.now() + Math.random();
      let h = null;
      if (a.body)
        if (typeof a.body == "string")
          h = a.body;
        else if (a.body instanceof FormData)
          try {
            h = JSON.stringify(Object.fromEntries(a.body));
          } catch {
          }
        else
          try {
            h = JSON.stringify(a.body);
          } catch {
          }
      let u = null;
      try {
        const p = new URL(typeof i == "string" ? i : i.href);
        p.search && (u = Object.fromEntries(p.searchParams));
      } catch {
      }
      const d = {
        id: c,
        method: a.method || "GET",
        url: typeof i == "string" ? i : i.href,
        params: u,
        requestBody: h,
        status: 0,
        response: null,
        duration: null
      };
      t.addRequest(d);
      try {
        const p = await e.apply(this, arguments);
        d.status = p.status, d.duration = Date.now() - l;
        try {
          const f = await p.clone().text();
          try {
            d.response = JSON.parse(f);
          } catch {
            d.response = f;
          }
        } catch {
        }
        return t.updateRequest(d), p;
      } catch (p) {
        throw d.status = -1, d.response = p.message, d.duration = Date.now() - l, t.updateRequest(d), p;
      }
    };
    const r = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(i, a) {
      this.__kupolaRequest = {
        method: i,
        url: a,
        params: null,
        requestBody: null,
        status: 0,
        response: null,
        startTime: Date.now()
      };
      try {
        const l = new URL(a);
        l.search && (this.__kupolaRequest.params = Object.fromEntries(l.searchParams));
      } catch {
      }
      r.apply(this, arguments);
    };
    const o = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(i) {
      if (this.__kupolaRequest) {
        if (i) {
          if (typeof i == "string")
            this.__kupolaRequest.requestBody = i;
          else if (i instanceof FormData)
            try {
              this.__kupolaRequest.requestBody = JSON.stringify(Object.fromEntries(i));
            } catch {
            }
        }
        const a = { ...this.__kupolaRequest };
        t.addRequest(a), this.__kupolaEntry = a;
      }
      o.apply(this, arguments);
    };
    const n = XMLHttpRequest.prototype.onreadystatechange;
    XMLHttpRequest.prototype.onreadystatechange = function() {
      if (this.__kupolaEntry && this.readyState === 4) {
        this.__kupolaEntry.status = this.status, this.__kupolaEntry.duration = Date.now() - this.__kupolaRequest.startTime;
        try {
          const i = this.responseText;
          try {
            this.__kupolaEntry.response = JSON.parse(i);
          } catch {
            this.__kupolaEntry.response = i;
          }
        } catch {
        }
        t.updateRequest(this.__kupolaEntry);
      }
      typeof n == "function" && n.apply(this, arguments);
    };
  }
  addRequest(t) {
    this.requestHistory.unshift(t), this.requestHistory.length > this.maxHistorySize && this.requestHistory.pop(), this.isOpen && this.activeTab === "network" && this.renderNetworkContent();
  }
  updateRequest(t) {
    const e = this.requestHistory.findIndex((r) => r.id === t.id || r.url === t.url && r.method === t.method && !r.status);
    e !== -1 && (this.requestHistory[e] = t, this.isOpen && this.activeTab === "network" && this.renderNetworkContent());
  }
  setupStorageListener() {
    const t = this;
    window.addEventListener("storage", (o) => {
      if (t.isOpen && t.activeTab === "storage") {
        const n = t.panel?.querySelector(".kupola-devtools__content");
        if (n) {
          const i = o.storageArea === localStorage ? "localStorage" : "sessionStorage";
          t.activeStorageType = i, t.updateStorageTabs(), n.innerHTML = t.getStorageContent(i);
        }
      }
    });
    const e = Storage.prototype.setItem;
    Storage.prototype.setItem = function(o, n) {
      const i = this.getItem(o);
      e.call(this, o, n);
      const a = new StorageEvent("storage", {
        key: o,
        oldValue: i,
        newValue: n,
        url: window.location.href,
        storageArea: this
      });
      window.dispatchEvent(a);
    };
    const r = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(o) {
      const n = this.getItem(o);
      r.call(this, o);
      const i = new StorageEvent("storage", {
        key: o,
        oldValue: n,
        newValue: null,
        url: window.location.href,
        storageArea: this
      });
      window.dispatchEvent(i);
    };
  }
  injectStyles() {
    const t = document.createElement("style");
    t.textContent = `
      .kupola-devtools__header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #2d2d2d; border-bottom: 1px solid #333; }
      .kupola-devtools__title { color: #535164; font-weight: 600; font-size: 14px; }
      .kupola-devtools__close { background: none; border: none; color: #888; cursor: pointer; font-size: 14px; padding: 4px; }
      .kupola-devtools__close:hover { color: #fff; }
      .kupola-devtools__tabs { display: flex; background: #252525; border-bottom: 1px solid #333; }
      .kupola-devtools__tab { flex: 1; padding: 10px 8px; background: none; border: none; color: #888; cursor: pointer; font-size: 11px; border-bottom: 2px solid transparent; transition: all 0.2s; }
      .kupola-devtools__tab:hover { color: #fff; }
      .kupola-devtools__tab.active { color: #535164; border-bottom-color: #535164; }
      .kupola-devtools__sub-tabs { display: flex; gap: 4px; padding: 8px 12px; background: #1e1e1e; border-bottom: 1px solid #333; }
      .kupola-devtools__sub-tab { padding: 4px 8px; background: #333; border: none; color: #888; cursor: pointer; font-size: 11px; border-radius: 4px; }
      .kupola-devtools__sub-tab:hover { color: #fff; }
      .kupola-devtools__sub-tab.active { background: #535164; color: white; }
      .kupola-devtools__network-action { padding: 4px 8px; background: #333; border: none; color: #888; cursor: pointer; font-size: 11px; border-radius: 4px; }
      .kupola-devtools__network-action:hover { color: #fff; background: #444; }
      .kupola-devtools__content { flex: 1; overflow-y: auto; padding: 12px; font-family: 'Consolas', monospace; font-size: 12px; }
      .kupola-devtools__list-item { padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; background: #2a2a2a; }
      .kupola-devtools__list-item:hover { background: #333; }
      .kupola-devtools__loading { display: flex; justify-content: center; align-items: center; height: 100px; color: #666; }
      .kupola-devtools__storage-key { color: #9cdcfe; margin-right: 8px; }
      .kupola-devtools__storage-value { color: #ce9178; word-break: break-all; }
      .kupola-devtools__network-item { padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; background: #2a2a2a; cursor: pointer; }
      .kupola-devtools__network-item:hover { background: #333; }
      .kupola-devtools__network-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .kupola-devtools__network-method { padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; color: white; }
      .kupola-devtools__network-method.GET { background: #4CAF50; }
      .kupola-devtools__network-method.POST { background: #2196F3; }
      .kupola-devtools__network-method.PUT { background: #FF9800; }
      .kupola-devtools__network-method.DELETE { background: #F44336; }
      .kupola-devtools__network-method.PATCH { background: #9C27B0; }
      .kupola-devtools__network-url { flex: 1; color: #9cdcfe; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .kupola-devtools__network-status { padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
      .kupola-devtools__network-status.success { background: #4CAF50; color: white; }
      .kupola-devtools__network-status.error { background: #F44336; color: white; }
      .kupola-devtools__network-status.warning { background: #FF9800; color: white; }
      .kupola-devtools__network-duration { color: #888; font-size: 11px; }
      .kupola-devtools__network-details { margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; }
      .kupola-devtools__network-detail { margin-bottom: 8px; }
      .kupola-devtools__network-detail strong { color: #535164; display: block; margin-bottom: 4px; }
      .kupola-devtools__network-detail pre { margin: 0; color: #ce9178; white-space: pre-wrap; word-break: break-all; }
    `, document.head.appendChild(t);
  }
  makeDraggable() {
    const t = this.panel.querySelector(".kupola-devtools__header");
    let e = !1, r, o, n, i;
    this._dragMouseDownHandler = (a) => {
      a.target.closest(".kupola-devtools__close") || (e = !0, r = a.clientX, o = a.clientY, n = this.panel.offsetLeft, i = this.panel.offsetTop);
    }, this._dragMouseMoveHandler = (a) => {
      if (!e) return;
      const l = a.clientX - r, c = a.clientY - o;
      this.panel.style.left = `${n + l}px`, this.panel.style.right = "auto", this.panel.style.top = `${Math.max(0, i + c)}px`;
    }, this._dragMouseUpHandler = () => {
      e = !1;
    }, t.addEventListener("mousedown", this._dragMouseDownHandler), document.addEventListener("mousemove", this._dragMouseMoveHandler), document.addEventListener("mouseup", this._dragMouseUpHandler);
  }
  destroy() {
    const t = this.panel.querySelector(".kupola-devtools__header");
    t && this._dragMouseDownHandler && t.removeEventListener("mousedown", this._dragMouseDownHandler), this._dragMouseMoveHandler && document.removeEventListener("mousemove", this._dragMouseMoveHandler), this._dragMouseUpHandler && document.removeEventListener("mouseup", this._dragMouseUpHandler), this.panel && this.panel.parentNode && this.panel.parentNode.removeChild(this.panel), this._dragMouseDownHandler = null, this._dragMouseMoveHandler = null, this._dragMouseUpHandler = null, this.panel = null;
  }
  togglePanel() {
    this.isOpen = !this.isOpen, this.panel.style.display = this.isOpen ? "flex" : "none", this.isOpen && this.activeTab === "network" && this.renderNetworkContent();
  }
  updateStorageTabs() {
    this.panel.querySelectorAll(".kupola-devtools__sub-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.storage === this.activeStorageType);
    });
  }
  getStorageContent(t) {
    let e = [];
    try {
      if (t === "cookies")
        e = document.cookie.split(";").map((o) => o.trim()).filter((o) => o).map((o) => {
          const [n, ...i] = o.split("=");
          return { key: n, value: i.join("=") };
        });
      else if (t === "localStorage")
        for (let o = 0; o < localStorage.length; o++)
          e.push({ key: localStorage.key(o), value: localStorage.getItem(localStorage.key(o)) });
      else if (t === "sessionStorage")
        for (let o = 0; o < sessionStorage.length; o++)
          e.push({ key: sessionStorage.key(o), value: sessionStorage.getItem(sessionStorage.key(o)) });
    } catch (o) {
      return console.error("Error reading storage:", o), '<div class="kupola-devtools__loading">Error reading storage</div>';
    }
    if (e.length === 0) return '<div class="kupola-devtools__loading">No data</div>';
    let r = "";
    return e.forEach((o) => {
      let n = o.value;
      if (n && n.length > 0 && n.length < 2e3)
        try {
          const i = JSON.parse(n);
          n = JSON.stringify(i, null, 2);
        } catch {
        }
      else n && n.length >= 2e3 && (n = n.substring(0, 500) + "... (truncated, " + n.length + " chars)");
      r += `<div class="kupola-devtools__list-item"><div><span class="kupola-devtools__storage-key">${o.key}</span></div><div class="kupola-devtools__storage-value">${n}</div></div>`;
    }), r;
  }
  handleStorageClick(t) {
    const e = t.target;
    if (e.classList.contains("kupola-devtools__sub-tab")) {
      t.stopPropagation();
      const r = e.dataset.storage;
      if (r) {
        this.activeStorageType = r, this.updateStorageTabs();
        const o = this.panel.querySelector(".kupola-devtools__content");
        o && (o.innerHTML = this.getStorageContent(r));
      }
    }
  }
};
function At() {
  try {
    const s = new URLSearchParams(window.location.search);
    (s.has("dev") || s.has("debug")) && (window.kupolaDevTools = new Jt({ enabled: !0 }), window.kupolaDevTools.init(), window.addEventListener("click", (e) => {
      window.kupolaDevTools && window.kupolaDevTools.handleStorageClick && window.kupolaDevTools.handleStorageClick(e);
    }));
  } catch (s) {
    console.error("Error initializing Kupola DevTools:", s);
  }
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", At) : At();
window.KupolaDevTools = Jt;
var qt = {}, zt;
function Ye() {
  return zt || (zt = 1, function(s) {
    const t = 'xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter"', e = {
      // navigation
      globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>',
      dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
      mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><line x1="12" y1="6" x2="12" y2="11"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
      square: '<rect x="3" y="3" width="18" height="18"/>',
      circle: '<circle cx="12" cy="12" r="9"/>',
      list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
      palette: '<rect x="3"  y="3"  width="8" height="8"/><rect x="13" y="3"  width="8" height="8"/><rect x="3"  y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
      type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
      ruler: '<rect x="3" y="9" width="18" height="6" transform="rotate(-45 12 12)"/><line x1="7.5" y1="12.5" x2="9" y2="14"/><line x1="11" y1="9" x2="12.5" y2="10.5"/><line x1="14.5" y1="5.5" x2="16" y2="7"/>',
      sparkles: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"/><path d="M19 14l1 2.2 2.2 1-2.2 1L19 20.4l-1-2.2-2.2-1 2.2-1L19 14z"/>',
      // actions
      copy: '<rect x="8" y="8" width="13" height="13"/><path d="M16 8V4H4v13h4"/>',
      download: '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><line x1="3" y1="21" x2="21" y2="21"/>',
      refresh: '<polyline points="21 4 21 10 15 10"/><polyline points="3 20 3 14 9 14"/><path d="M20.5 9A9 9 0 0 0 5 5.5L3 7M3.5 15A9 9 0 0 0 19 18.5L21 17"/>',
      external: '<polyline points="14 4 20 4 20 10"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
      sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
      x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
      github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
      "message-circle": '<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z"/>',
      // SOLO chat title-bar glyphs (Figma 2510_18334) — round bubble + plus,
      // 4-tooth gear with center circle, and person-in-circle account avatar.
      "message-plus": '<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/>',
      gear: '<path d="M9.3 5.7 6.375 5.025 5.025 6.375 5.7 9.3 3 11.1 3 12.9 5.7 14.7 5.025 17.625 6.375 18.975 9.3 18.3 11.1 21 12.9 21 14.7 18.3 17.625 18.975 18.975 17.625 18.3 14.7 21 12.9 21 11.1 18.3 9.3 18.975 6.375 17.625 5.025 14.7 5.7 12.9 3 11.1 3 9.3 5.7Z"/><circle cx="12" cy="12" r="3"/>',
      "user-circle": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="2.5"/><path d="M7 17.5a5 5 0 0 1 10 0"/>',
      shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
      check: '<polyline points="4 12 10 18 20 6"/>',
      "arrow-right": '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
      "arrow-up-right": '<line x1="6" y1="18" x2="18" y2="6"/><polyline points="9 6 18 6 18 15"/>',
      "chevron-right": '<polyline points="9 6 15 12 9 18"/>',
      "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
      // status — strict outline, 24x24, 2px stroke (no filled bowls)
      "check-circle": '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
      "alert-circle": '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12" y2="16.01"/>',
      "alert-triangle": '<path d="M12 3 22 20 2 20 Z"/><line x1="12" y1="10" x2="12" y2="15"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
      "info-circle": '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8.01"/>',
      "x-circle": '<circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>',
      // legacy aliases — kept outline, square frame
      alert: '<path d="M12 3 22 20 2 20 Z"/><line x1="12" y1="10" x2="12" y2="15"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
      info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8.01"/>',
      // misc
      mail: '<rect x="3" y="5" width="18" height="14"/><polyline points="3 6 12 13 21 6"/>',
      user: '<path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/><circle cx="12" cy="8" r="4"/>',
      users: '<path d="M2 21v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><circle cx="8.5" cy="8" r="3.5"/><path d="M22 21v-1a5 5 0 0 0-4-4.9"/><path d="M16 3.1A4 4 0 0 1 16 11"/>',
      box: '<polyline points="3 7 12 2 21 7 21 17 12 22 3 17 3 7"/><line x1="3" y1="7" x2="12" y2="12"/><line x1="21" y1="7" x2="12" y2="12"/><line x1="12" y1="22" x2="12" y2="12"/>',
      zap: '<polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/>',
      moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.6" y1="4.6" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.4" y2="4.6"/>',
      cmd: '<path d="M9 6h6v12H9z"/><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/>',
      key: '<circle cx="7.5" cy="14.5" r="3.5"/><line x1="10" y1="12" x2="22" y2="12"/><line x1="22" y1="12" x2="22" y2="16"/><line x1="18" y1="12" x2="18" y2="15"/>',
      bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
      "arrow-up": '<line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/>',
      "chevron-up": '<polyline points="6 15 12 9 18 15"/>',
      "arrow-left": '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/>',
      mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/>',
      at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
      hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
      "sidebar-left": '<rect x="3" y="3" width="18" height="18"/><line x1="9" y1="3" x2="9" y2="21"/>',
      "sidebar-right": '<rect x="3" y="3" width="18" height="18"/><line x1="15" y1="3" x2="15" y2="21"/>',
      "panel-bottom": '<rect x="3" y="3" width="18" height="18"/><line x1="3" y1="15" x2="21" y2="15"/>',
      /* ===== Activity-bar icon set =====================================
       * Lucide / shadcn-ui (MIT) — squared outline, 2px stroke. Every glyph
       * draws into the same standard 24-grid bbox (≈3..21) so they read at
       * identical optical size when sized via `data-size` alone, just like
       * every other glyph in this file. See skill.md §13.4. */
      git: '<circle cx="6" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><line x1="6" y1="8" x2="6" y2="16"/><path d="M18 8v3a4 4 0 0 1-4 4h-4"/>',
      bug: '<rect x="8" y="6" width="8" height="14" rx="4"/><line x1="12" y1="11" x2="12" y2="20"/><line x1="3" y1="9" x2="8" y2="9"/><line x1="3" y1="14" x2="8" y2="14"/><line x1="3" y1="19" x2="8" y2="19"/><line x1="16" y1="9" x2="21" y2="9"/><line x1="16" y1="14" x2="21" y2="14"/><line x1="16" y1="19" x2="21" y2="19"/><line x1="9" y1="6" x2="9" y2="3"/><line x1="15" y1="6" x2="15" y2="3"/>',
      "search-menu": '<circle cx="11" cy="11" r="6"/><line x1="20" y1="20" x2="16" y2="16"/><line x1="3" y1="20" x2="13" y2="20"/>',
      extensions: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M17.5 14v3.5H21a2 2 0 0 1 0 4h-3.5V21a2 2 0 0 1-4 0v-3.5H14a2 2 0 0 1 0-4h3.5z"/>',
      // settings sidebar — squared, hard-edged outline (Lucide-ish), 2px stroke
      wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.5l-7.5 7.5a3 3 0 0 1-4.2-4.2L16.7 8 14.7 6.3z"/><path d="M14.7 6.3 12 9l-3-3 2.7-2.7a4 4 0 0 1 3 3z"/>',
      "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      "file-text": '<path d="M14 3H6v18h12V8z"/><polyline points="14 3 14 8 18 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>',
      "scroll-text": '<path d="M5 4h11a3 3 0 0 1 3 3v10H8v3a1 1 0 0 1-1 1 3 3 0 0 1-3-3V7a3 3 0 0 1 1-3z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>',
      atom: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
      "arrow-right-to-line": '<line x1="20" y1="4" x2="20" y2="20"/><line x1="3" y1="12" x2="17" y2="12"/><polyline points="11 6 17 12 11 18"/>',
      "info-square": '<rect x="3" y="3" width="18" height="18"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8.01"/>',
      /* Window-control glyphs for SOLO top bar (Figma 2510_20754):
       *   .arrow-minimize → diagonal-in arrows (collapse to corners)
       *   .icon-expand    → diagonal-out arrows (expand to corners) */
      "arrow-minimize": '<polyline points="20 4 14 10 20 10"/><line x1="14" y1="10" x2="14" y2="4"/><polyline points="4 20 10 14 4 14"/><line x1="10" y1="14" x2="10" y2="20"/>',
      "arrow-expand": '<polyline points="14 4 20 4 20 10"/><line x1="14" y1="10" x2="20" y2="4"/><polyline points="10 20 4 20 4 14"/><line x1="10" y1="14" x2="4" y2="20"/>',
      "arrow-down": '<line x1="12" y1="4" x2="12" y2="20"/><polyline points="6 14 12 20 18 14"/>',
      logo: '<rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
      // additional UI
      "more-h": '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
      edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
      trash: '<polyline points="4 6 20 6"/><path d="M6 6v14h12V6"/><path d="M9 6V4h6v2"/><line x1="10" y1="10" x2="10" y2="17"/><line x1="14" y1="10" x2="14" y2="17"/>',
      file: '<path d="M14 3H6v18h12V7z"/><polyline points="14 3 14 7 18 7"/>',
      // Stacked documents — Lucide "files" (3..21).
      files: '<path d="M21 8v13H8V3h8z"/><polyline points="16 3 16 8 21 8"/><path d="M8 7H3v14h13v-3"/>',
      // Pure 2×2 grid — Lucide "layout-grid" (3..21).
      "grid-2x2": '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
      folder: '<path d="M3 6h6l2 3h10v10H3z"/>',
      layers: '<polygon points="12 3 22 8 12 13 2 8 12 3"/><polyline points="2 13 12 18 22 13"/>',
      layout: '<rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
      terminal: '<polyline points="4 7 9 12 4 17"/><line x1="12" y1="17" x2="20" y2="17"/>',
      image: '<rect x="3" y="3" width="18" height="18"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><polyline points="3 18 9 12 13 16 17 12 21 16"/>',
      play: '<polygon points="6 4 20 12 6 20 6 4"/>',
      pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
      help: '<rect x="3" y="3" width="18" height="18"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
      lock: '<rect x="4" y="11" width="16" height="10"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      // Lucide "eye" (2..22 horizontal, naturally short — eye shape).
      eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
      star: '<polygon points="12 3 15 9 22 10 17 14 18 21 12 18 6 21 7 14 2 10 9 9 12 3"/>',
      heart: '<path d="M12 21s-7-5-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-7 11-7 11z"/>',
      home: '<polygon points="3 11 12 3 21 11 21 21 14 21 14 14 10 14 10 21 3 21 3 11"/>',
      calendar: '<rect x="3" y="5" width="18" height="16"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
      clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
      filter: '<polygon points="3 4 21 4 14 12 14 20 10 18 10 12 3 4"/>',
      send: '<polygon points="3 12 21 4 17 21 12 13 3 12"/>',
      link: '<path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6l1.5-1.5"/>',
      upload: '<path d="M12 21V9"/><polyline points="7 14 12 9 17 14"/><line x1="3" y1="3" x2="21" y2="3"/>',
      "log-out": '<path d="M14 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><polyline points="16 16 21 12 16 8"/><line x1="9" y1="12" x2="21" y2="12"/>',
      menu: '<line x1="4" y1="6"  x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
      // data / charts
      dollar: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      bar: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5"  y="11" width="3" height="8"/><rect x="10.5" y="6"  width="3" height="13"/><rect x="16" y="14" width="3" height="5"/>',
      "trending-up": '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
      "trending-down": '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/>',
      columns: '<rect x="3" y="3" width="18" height="18"/><line x1="9"  y1="3" x2="9"  y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
      // settings — framework rules
      plug: '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M7 8h10v4a5 5 0 0 1-10 0V8z"/><path d="M12 17v5"/>',
      cpu: '<rect x="6" y="6" width="12" height="12"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/><line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>',
      code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      // brand — filled Apple glyph for download CTA
      apple: '<path fill="currentColor" stroke="none" d="M17.05 12.04c-.03-3.04 2.49-4.5 2.6-4.57-1.42-2.07-3.62-2.36-4.4-2.39-1.87-.19-3.65 1.1-4.6 1.1-.96 0-2.42-1.08-3.98-1.05-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.13 1.53 12.12 1.01 1.46 2.21 3.1 3.78 3.04 1.52-.06 2.09-.98 3.93-.98 1.83 0 2.36.98 3.97.95 1.64-.03 2.68-1.49 3.68-2.96 1.16-1.7 1.64-3.35 1.66-3.43-.04-.02-3.18-1.22-3.21-4.85zM14.06 4.34c.83-1.01 1.39-2.41 1.24-3.81-1.2.05-2.65.8-3.51 1.8-.77.89-1.45 2.31-1.27 3.68 1.34.1 2.71-.68 3.54-1.67z"/>'
    };
    function r(n, i = 16, a = "0 0 24 24") {
      const l = e[n];
      return l ? `<svg ${t.replace('width="16"', `width="${i}"`).replace('height="16"', `height="${i}"`).replace('viewBox="0 0 24 24"', `viewBox="${a}"`)}>${l}</svg>` : "";
    }
    function o(n = document) {
      n.querySelectorAll("[data-icon]").forEach((i) => {
        const a = i.getAttribute("data-icon"), l = +i.getAttribute("data-size") || 16, c = i.getAttribute("data-viewbox") || "0 0 24 24";
        i.innerHTML = r(a, l, c), i.classList.add("icon");
      });
    }
    s.Icons = { svg: r, render: o, PATHS: e }, document.readyState !== "loading" ? o() : document.addEventListener("DOMContentLoaded", () => o());
  }(typeof window < "u" ? window : globalThis)), qt;
}
Ye();
var st = { exports: {} }, Pt;
function Xe() {
  return Pt || (Pt = 1, function(s) {
    class t {
      constructor(i) {
        this.element = i, this.hoursEl = i.querySelector(".ds-countdown__item--hours .ds-countdown__value"), this.minutesEl = i.querySelector(".ds-countdown__item--minutes .ds-countdown__value"), this.secondsEl = i.querySelector(".ds-countdown__item--seconds .ds-countdown__value"), this.endTime = this.parseEndTime(), this.interval = null, this.init();
      }
      parseEndTime() {
        const i = this.element.getAttribute("data-end-time");
        if (i)
          return new Date(i).getTime();
        const a = parseInt(this.element.getAttribute("data-hours")) || 0, l = parseInt(this.element.getAttribute("data-minutes")) || 0, c = parseInt(this.element.getAttribute("data-seconds")) || 0;
        return (/* @__PURE__ */ new Date()).getTime() + (a * 3600 + l * 60 + c) * 1e3;
      }
      init() {
        this.update(), this.start();
      }
      start() {
        this.interval && clearInterval(this.interval), this.interval = setInterval(() => {
          this.update();
        }, 1e3);
      }
      stop() {
        this.interval && (clearInterval(this.interval), this.interval = null);
      }
      reset() {
        this.stop(), this.endTime = this.parseEndTime(), this.init();
      }
      update() {
        const i = (/* @__PURE__ */ new Date()).getTime(), a = this.endTime - i;
        if (a <= 0) {
          this.stop(), this.displayTime(0, 0, 0), this.dispatchComplete();
          return;
        }
        const l = Math.floor(a % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60)), c = Math.floor(a % (1e3 * 60 * 60) / (1e3 * 60)), h = Math.floor(a % (1e3 * 60) / 1e3);
        this.displayTime(l, c, h);
      }
      displayTime(i, a, l) {
        this.hoursEl && (this.hoursEl.textContent = String(i).padStart(2, "0")), this.minutesEl && (this.minutesEl.textContent = String(a).padStart(2, "0")), this.secondsEl && (this.secondsEl.textContent = String(l).padStart(2, "0"));
      }
      setEndTime(i) {
        this.endTime = i.getTime(), this.update();
      }
      addTime(i) {
        this.endTime += i * 1e3, this.update();
      }
      dispatchComplete() {
        this.element.dispatchEvent(new CustomEvent("ds-countdown-complete", {
          detail: {}
        }));
      }
      destroy() {
        this.stop(), this.hoursEl = null, this.minutesEl = null, this.secondsEl = null, this.element = null;
      }
    }
    function e(n) {
      if (n.__kupolaInitialized) return;
      const i = new t(n);
      n.__kupolaInstance = i, n.__kupolaInitialized = !0;
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-countdown").forEach((i) => {
        e(i);
      });
    }
    s.exports ? s.exports = { Countdown: t, initCountdowns: o, initCountdown: e, cleanupCountdown: r } : (window.Countdown = t, window.initCountdown = e, window.cleanupCountdown = r), window.kupolaInitializer && window.kupolaInitializer.register("countdown", e, r);
  }(st)), st.exports;
}
Xe();
var it = { exports: {} }, $t;
function Je() {
  return $t || ($t = 1, function(s) {
    class t {
      constructor(i) {
        if (this.element = i, this.minusBtn = i.querySelector(".ds-number-input__btn--decrease"), this.plusBtn = i.querySelector(".ds-number-input__btn--increase"), this.inputEl = i.querySelector(".ds-number-input__input"), this._listeners = [], !this.minusBtn || !this.plusBtn || !this.inputEl)
          throw new Error("NumberInput: Missing required elements");
        this.min = parseInt(this.inputEl.getAttribute("min")) || -1 / 0, this.max = parseInt(this.inputEl.getAttribute("max")) || 1 / 0, this.step = parseInt(this.inputEl.getAttribute("step")) || 1, this.init();
      }
      init() {
        this.bindEvents(), this.updateState();
      }
      bindEvents() {
        const i = () => this.updateValue(-this.step), a = () => this.updateValue(this.step), l = () => this.handleInput();
        this.minusBtn.addEventListener("click", i), this.plusBtn.addEventListener("click", a), this.inputEl.addEventListener("input", l), this._listeners.push(
          { el: this.minusBtn, event: "click", handler: i },
          { el: this.plusBtn, event: "click", handler: a },
          { el: this.inputEl, event: "input", handler: l }
        );
      }
      updateValue(i) {
        let a = parseInt(this.inputEl.value) || 0;
        a += i, a < this.min && (a = this.min), a > this.max && (a = this.max), this.inputEl.value = a, this.inputEl.dispatchEvent(new Event("change")), this.updateState(), this.dispatchChange();
      }
      handleInput() {
        let i = parseInt(this.inputEl.value);
        isNaN(i) && (i = 0), i < this.min && (i = this.min), i > this.max && (i = this.max), this.inputEl.value = i, this.updateState(), this.dispatchChange();
      }
      updateState() {
        const i = parseInt(this.inputEl.value) || 0;
        this.minusBtn.disabled = i <= this.min, this.plusBtn.disabled = i >= this.max;
      }
      setValue(i) {
        i < this.min && (i = this.min), i > this.max && (i = this.max), this.inputEl.value = i, this.updateState(), this.dispatchChange();
      }
      getValue() {
        return parseInt(this.inputEl.value) || 0;
      }
      setRange(i, a) {
        this.min = i, this.max = a, this.updateState();
      }
      dispatchChange() {
        this.element.dispatchEvent(new CustomEvent("ds-number-input-change", {
          detail: {
            value: this.getValue()
          }
        }));
      }
      destroy() {
        this._listeners.forEach(({ el: i, event: a, handler: l }) => {
          i.removeEventListener(a, l);
        }), this._listeners = null, this.minusBtn = null, this.plusBtn = null, this.inputEl = null, this.element = null;
      }
    }
    function e(n) {
      if (!n.__kupolaInitialized)
        try {
          const i = new t(n);
          n.__kupolaInstance = i, n.__kupolaInitialized = !0;
        } catch (i) {
          console.error("[NumberInput] Error initializing:", i);
        }
    }
    function r(n) {
      if (!n.__kupolaInitialized || !n.__kupolaInstance) return;
      n.__kupolaInstance.destroy(), n.__kupolaInstance = null, n.__kupolaInitialized = !1;
    }
    function o() {
      document.querySelectorAll(".ds-number-input").forEach((n) => {
        e(n);
      });
    }
    s.exports ? s.exports = { NumberInput: t, initNumberInputs: o, initNumberInput: e, cleanupNumberInput: r } : (window.NumberInput = t, window.initNumberInput = e, window.cleanupNumberInput = r), window.kupolaInitializer && window.kupolaInitializer.register("number-input", e, r);
  }(it)), it.exports;
}
Je();
var nt = { exports: {} }, Rt;
function je() {
  return Rt || (Rt = 1, function(s) {
    class t {
      constructor(i) {
        this.container = i, this.track = i.querySelector(".ds-slider-captcha__track"), this.btn = i.querySelector(".ds-slider-captcha__btn"), this.text = i.querySelector(".ds-slider-captcha__text"), this.progress = i.querySelector(".ds-slider-captcha__progress"), this.statusEl = i.querySelector(".ds-slider-captcha__status"), this.refreshBtn = i.querySelector(".ds-slider-captcha__refresh"), this.footerRefreshBtn = i.querySelector(".ds-slider-captcha__footer-refresh"), this.config = {
          tolerance: 6,
          minPoints: 20,
          minDuration: 300,
          maxDuration: 1e4,
          minSpeedDelta: 0.3,
          maxAttempts: 5
        }, this.isDragging = !1, this.startX = 0, this.startY = 0, this.currentX = 0, this.trackData = [], this.startTime = 0, this.isVerified = !1, this.isProcessing = !1, this.attempts = 0, this.targetX = 0, this.distractorX = 0, this.angle = 0, this.distractorAngle = 0, this.maxAngle = parseInt(i.getAttribute("data-angle")) || 30, this.shape = i.getAttribute("data-shape") || "circle", this.hasDistractor = this.shape !== "circle", this.scope = `slidecaptcha-${Math.random().toString(36).substr(2, 9)}`, this._mouseDownHandler = null, this._mouseMoveHandler = null, this._mouseUpHandler = null, this._touchStartHandler = null, this._touchMoveHandler = null, this._touchEndHandler = null, this._mouseMoveListener = null, this._mouseUpListener = null, this._touchMoveListener = null, this._touchEndListener = null;
      }
      init() {
        !this.track || !this.btn || this.container._initialized || (this._mouseDownHandler = (i) => {
          this.isVerified || this.isProcessing || (i.preventDefault(), this.isDragging = !0, this.startX = i.clientX, this.startY = i.clientY, this.startTime = Date.now(), this.trackData = [], this.container.classList.add("is-active"), this.text && (this.text.textContent = "拖动中...", this.text.style.color = "var(--status-info-default)"));
        }, this._mouseMoveHandler = (i) => {
          if (!this.isDragging) return;
          i.preventDefault();
          const a = this.track.offsetWidth, l = this.btn.offsetWidth, c = a - l - 8;
          let h = i.clientX - this.startX;
          h < 0 && (h = 0), h > c && (h = c), this.currentX = h, this.btn.style.left = 14 + h + "px", this.progress && (this.progress.style.width = h / c * 100 + "%"), this.collectTrack(i.clientX, i.clientY);
        }, this._mouseUpHandler = () => {
          this.isDragging && (this.isDragging = !1, this.container.classList.remove("is-active"), this.verifyCaptcha());
        }, this._touchStartHandler = (i) => {
          this.isVerified || this.isProcessing || (i.preventDefault(), this.isDragging = !0, this.startX = i.touches[0].clientX, this.startY = i.touches[0].clientY, this.startTime = Date.now(), this.trackData = [], this.container.classList.add("is-active"), this.text && (this.text.textContent = "拖动中...", this.text.style.color = "var(--status-info-default)"));
        }, this._touchMoveHandler = (i) => {
          if (!this.isDragging) return;
          i.preventDefault();
          const a = this.track.offsetWidth, l = this.btn.offsetWidth, c = a - l - 8;
          let h = i.touches[0].clientX - this.startX;
          h < 0 && (h = 0), h > c && (h = c), this.currentX = h, this.btn.style.left = 14 + h + "px", this.progress && (this.progress.style.width = h / c * 100 + "%"), this.collectTrack(i.touches[0].clientX, i.touches[0].clientY);
        }, this._touchEndHandler = () => {
          this.isDragging && (this.isDragging = !1, this.container.classList.remove("is-active"), this.verifyCaptcha());
        }, this.btn.addEventListener("mousedown", this._mouseDownHandler), window.globalEvents ? (this._mouseMoveListener = window.globalEvents.on(document, "mousemove", this._mouseMoveHandler, { scope: this.scope }), this._mouseUpListener = window.globalEvents.on(document, "mouseup", this._mouseUpHandler, { scope: this.scope }), this._touchMoveListener = window.globalEvents.on(document, "touchmove", this._touchMoveHandler, { scope: this.scope, passive: !1 }), this._touchEndListener = window.globalEvents.on(document, "touchend", this._touchEndHandler, { scope: this.scope })) : (document.addEventListener("mousemove", this._mouseMoveHandler), document.addEventListener("mouseup", this._mouseUpHandler), document.addEventListener("touchmove", this._touchMoveHandler, { passive: !1 }), document.addEventListener("touchend", this._touchEndHandler)), this.btn.addEventListener("touchstart", this._touchStartHandler, { passive: !1 }), this.refreshBtn && this.refreshBtn.addEventListener("click", () => this.loadCaptcha()), this.footerRefreshBtn && this.footerRefreshBtn.addEventListener("click", () => this.loadCaptcha()), this.container._initialized = !0, this.loadCaptcha());
      }
      generateTarget() {
        const i = this.track.offsetWidth, a = this.btn.offsetWidth, l = 14, c = i * 0.35, h = i * 0.85 - a, u = i * 0.6;
        if (this.angle = Math.floor(Math.random() * (this.maxAngle + 1)), this.hasDistractor)
          do
            this.distractorAngle = Math.floor(Math.random() * (this.maxAngle + 1));
          while (Math.abs(this.distractorAngle - this.angle) < 5);
        this.hasDistractor ? Math.random() > 0.5 ? (this.targetX = Math.floor(c + Math.random() * (u - c - a)), this.distractorX = Math.floor(u + Math.random() * (h - u))) : (this.targetX = Math.floor(u + Math.random() * (h - u)), this.distractorX = Math.floor(c + Math.random() * (u - c - a))) : this.targetX = Math.floor(c + Math.random() * (h - c));
        const d = this.container.querySelector(".ds-slider-captcha__target");
        if (d && (d.style.left = this.targetX + l + a / 2 + "px", d.style.transform = "translate(-50%, -50%) rotate(" + this.angle + "deg)", d.style.display = "block"), this.hasDistractor) {
          const p = this.container.querySelector(".ds-slider-captcha__target--distractor");
          p && (p.style.left = this.distractorX + l + a / 2 + "px", p.style.transform = "translate(-50%, -50%) rotate(" + this.distractorAngle + "deg)", p.style.display = "block");
        } else {
          const p = this.container.querySelector(".ds-slider-captcha__target--distractor");
          p && (p.style.display = "none");
        }
      }
      resetSlider() {
        this.btn.className = "ds-slider-captcha__btn", this.btn.style.transform = "rotate(" + this.angle + "deg)", this.btn.innerHTML = "", this.btn.style.left = "14px", this.btn.style.display = "block", this.progress && (this.progress.style.width = "0%", this.progress.style.display = "block"), this.text && (this.text.textContent = "按住滑块，拖动到缺口位置", this.text.style.color = ""), this.refreshBtn && (this.refreshBtn.style.display = "none"), this.currentX = 0, this.trackData = [], this.container.classList.remove("is-verified", "is-error", "is-disabled");
      }
      loadCaptcha() {
        this.isVerified = !1, this.isProcessing = !1, this.attempts = 0, this.generateTarget(), this.resetSlider(), this.statusEl && (this.statusEl.textContent = "请完成验证", this.statusEl.className = "ds-slider-captcha__status");
      }
      collectTrack(i, a) {
        const c = Date.now() - this.startTime;
        let h = 0, u = 0;
        if (this.trackData.length > 0) {
          const p = this.trackData[this.trackData.length - 1], g = this.currentX - p.x, f = c - p.t;
          if (f > 0 && (h = g / f, this.trackData.length > 1)) {
            const m = this.trackData[this.trackData.length - 2], v = p.t - m.t;
            if (v > 0) {
              const y = (p.x - m.x) / v;
              u = h - y;
            }
          }
        }
        this.trackData.push({
          x: this.currentX,
          y: a - this.startY,
          t: c,
          v: h,
          a: u
        });
        const d = this.container.querySelector(".ds-slider-captcha__point-count");
        d && (d.textContent = "轨迹点: " + this.trackData.length);
      }
      validateTrack() {
        if (!this.trackData || this.trackData.length < this.config.minPoints)
          return { passed: !1, msg: "验证失败" };
        const i = this.trackData[this.trackData.length - 1].x, a = this.hasDistractor ? Math.abs(i - this.distractorX) : 1 / 0, l = Math.abs(i - this.targetX);
        if (this.hasDistractor && a < l && a <= this.config.tolerance)
          return { passed: !1, msg: "验证失败" };
        if (l > this.config.tolerance)
          return { passed: !1, msg: "验证失败" };
        const c = [];
        for (let f = 1; f < this.trackData.length; f++) {
          const m = this.trackData[f].x - this.trackData[f - 1].x, v = this.trackData[f].t - this.trackData[f - 1].t;
          v > 0 && v < 500 && c.push(m / v);
        }
        if (c.length < 3)
          return { passed: !1, msg: "验证失败" };
        const h = Math.max(...c), u = Math.min(...c);
        if (h - u < this.config.minSpeedDelta)
          return { passed: !1, msg: "验证失败" };
        let d = !1;
        for (const f of this.trackData)
          if (Math.abs(f.y) > 2) {
            d = !0;
            break;
          }
        if (!d && this.trackData.length > 20)
          return { passed: !1, msg: "验证失败" };
        const p = this.trackData[this.trackData.length - 1].t;
        if (p < this.config.minDuration)
          return { passed: !1, msg: "验证失败" };
        if (p > this.config.maxDuration)
          return { passed: !1, msg: "验证失败" };
        const g = [];
        for (let f = 1; f < c.length; f++)
          g.push(Math.abs(c[f] - c[f - 1]));
        return g.length > 2 && g.reduce((m, v) => m + v, 0) / g.length < 0.05 ? { passed: !1, msg: "验证失败" } : { passed: !0, msg: "验证通过" };
      }
      verifyCaptcha() {
        this.isProcessing || this.isVerified || (this.isProcessing = !0, this.statusEl && (this.statusEl.textContent = "验证中...", this.statusEl.className = "ds-slider-captcha__status is-loading"), this.btn.style.cursor = "wait", this.container.classList.add("is-disabled"), setTimeout(() => {
          const i = this.validateTrack();
          if (this.isProcessing = !1, this.btn.style.cursor = "", i.passed) {
            this.isVerified = !0, this.btn.style.display = "none", this.progress && (this.progress.style.display = "none");
            const a = this.container.querySelector(".ds-slider-captcha__target");
            a && (a.style.display = "none");
            const l = this.container.querySelector(".ds-slider-captcha__target--distractor");
            l && (l.style.display = "none"), this.text && (this.text.textContent = "验证通过", this.text.style.color = "var(--status-success-default)"), this.statusEl && (this.statusEl.textContent = "验证成功", this.statusEl.className = "ds-slider-captcha__status is-success"), this.container.classList.add("is-verified"), this.container.classList.remove("is-disabled");
            const c = this.container.getAttribute("data-on-verified");
            c && typeof window[c] == "function" && window[c](this.container);
          } else if (this.attempts++, this.text && (this.text.textContent = i.msg, this.text.style.color = "var(--status-error-default)"), this.statusEl && (this.statusEl.textContent = i.msg, this.statusEl.className = "ds-slider-captcha__status is-error"), this.container.getAttribute("data-err-refresh") === "auto")
            setTimeout(() => {
              this.loadCaptcha();
            }, 1200);
          else {
            this.btn.style.display = "none", this.progress && (this.progress.style.display = "none");
            const l = this.container.querySelector(".ds-slider-captcha__target");
            l && (l.style.display = "none");
            const c = this.container.querySelector(".ds-slider-captcha__target--distractor");
            c && (c.style.display = "none"), this.refreshBtn && (this.refreshBtn.style.display = "block");
          }
        }, 300));
      }
      destroy() {
        this.container._initialized && (this.btn && this._mouseDownHandler && this.btn.removeEventListener("mousedown", this._mouseDownHandler), this.btn && this._touchStartHandler && this.btn.removeEventListener("touchstart", this._touchStartHandler), this.refreshBtn && this.refreshBtn.removeEventListener("click", () => this.loadCaptcha()), this.footerRefreshBtn && this.footerRefreshBtn.removeEventListener("click", () => this.loadCaptcha()), this._mouseMoveListener && this._mouseMoveListener.unsubscribe ? this._mouseMoveListener.unsubscribe() : this._mouseMoveHandler && document.removeEventListener("mousemove", this._mouseMoveHandler), this._mouseUpListener && this._mouseUpListener.unsubscribe ? this._mouseUpListener.unsubscribe() : this._mouseUpHandler && document.removeEventListener("mouseup", this._mouseUpHandler), this._touchMoveListener && this._touchMoveListener.unsubscribe ? this._touchMoveListener.unsubscribe() : this._touchMoveHandler && document.removeEventListener("touchmove", this._touchMoveHandler), this._touchEndListener && this._touchEndListener.unsubscribe ? this._touchEndListener.unsubscribe() : this._touchEndHandler && document.removeEventListener("touchend", this._touchEndHandler), this.container._initialized = !1);
      }
    }
    function e() {
      document.querySelectorAll(".ds-slider-captcha").forEach((n) => {
        const i = new t(n);
        i.init(), n._kupolaSlideCaptcha = i;
      });
    }
    function r(n) {
      n._kupolaSlideCaptcha && (n._kupolaSlideCaptcha.destroy(), n._kupolaSlideCaptcha = null);
    }
    function o() {
      document.querySelectorAll(".ds-slider-captcha").forEach((n) => {
        r(n);
      });
    }
    s.exports && (s.exports = { initSlideCaptchas: e, cleanupSlideCaptcha: r, cleanupAllSlideCaptchas: o });
  }(nt)), nt.exports;
}
je();
(function(s) {
  let t = null;
  class e {
    constructor(d) {
      this.component = d, this.lifecycle = d && d.lifecycle || null, this._onMountedHandlers = [], this._onUnmountedHandlers = [], this._onUpdatedHandlers = [], this._watches = [], this._refs = /* @__PURE__ */ new Map(), this._computedDeps = /* @__PURE__ */ new Map();
    }
    ref(d = null) {
      if (s.kupolaData) {
        const g = `__ref_${Math.random().toString(36).slice(2, 11)}__`;
        return s.kupolaData.set(g, d), {
          get value() {
            return s.kupolaData.get(g);
          },
          set value(f) {
            s.kupolaData.set(g, f);
          },
          _key: g
        };
      }
      const p = {
        _value: d,
        _subscribers: /* @__PURE__ */ new Set()
      };
      return Object.defineProperty(p, "value", {
        get() {
          return p._value;
        },
        set(g) {
          g !== p._value && (p._value = g, p._subscribers.forEach((f) => f(g)));
        }
      }), p;
    }
    reactive(d) {
      if (s.kupolaData)
        return s.kupolaData.createReactive(d);
      const p = this, g = {
        get(m, v) {
          if (v === "__isReactive") return !0;
          if (v === "__raw") return m;
          const y = m[v];
          return typeof y == "object" && y !== null && !y.__isReactive && (m[v] = p.reactive(y)), m[v];
        },
        set(m, v, y) {
          return m[v] === y || (m[v] = y, p._notifyWatchers(v, y)), !0;
        },
        deleteProperty(m, v) {
          return delete m[v], p._notifyWatchers(v, void 0), !0;
        }
      }, f = new Proxy(d, g);
      return f.__isReactive = !0, f;
    }
    onMounted(d) {
      this.lifecycle ? this.lifecycle.on("mount", d, { name: "onMounted" }) : this._onMountedHandlers.push(d);
    }
    onUnmounted(d) {
      this.lifecycle ? this.lifecycle.on("unmount", d, { name: "onUnmounted" }) : this._onUnmountedHandlers.push(d);
    }
    onUpdated(d) {
      this.lifecycle ? this.lifecycle.on("update", d, { name: "onUpdated" }) : this._onUpdatedHandlers.push(d);
    }
    watch(d, p, g = {}) {
      if (typeof d == "function") {
        const f = () => {
          const m = d();
          m !== f._oldValue && (p(m, f._oldValue), f._oldValue = m);
        };
        if (f._oldValue = void 0, this._watches.push(f), f(), s.kupolaData) {
          const m = [], v = s.kupolaData.get;
          s.kupolaData.get = function(y) {
            return m.push(y), v.call(this, y);
          }, d(), s.kupolaData.get = v, m.forEach((y) => {
            s.kupolaData.observe(y, f);
          });
        }
      } else typeof d == "object" && d !== null && (d._subscribers ? d._subscribers.add(p) : d._key && s.kupolaData && s.kupolaData.observe(d._key, () => {
        p(d.value);
      }));
    }
    computed(d) {
      const p = this.ref();
      let g = () => {
        try {
          p.value = d();
        } catch (v) {
          console.error("Computed property error:", v);
        }
      };
      const f = [];
      if (s.kupolaData) {
        const v = s.kupolaData.get;
        s.kupolaData.get = function(y) {
          return f.push(y), v.call(this, y);
        }, g(), s.kupolaData.get = v, f.forEach((y) => {
          s.kupolaData.observe(y, g);
        }), this._computedDeps.set(p, f);
      } else
        g();
      let m = p._value;
      return Object.defineProperty(p, "value", {
        get: () => m,
        set: (v) => {
          console.warn("Cannot assign to a computed property");
        }
      }), g = () => {
        try {
          m = d();
        } catch (v) {
          console.error("Computed property error:", v);
        }
      }, p;
    }
    emit(d, p) {
      this.component && this.component.$emit(d, p);
    }
    _notifyWatchers(d, p) {
      this._watches.forEach((g) => {
        try {
          g();
        } catch (f) {
          console.error(f);
        }
      });
    }
    _executeMounted() {
      this._onMountedHandlers.forEach((d) => {
        try {
          d();
        } catch (p) {
          console.error(p);
        }
      });
    }
    _executeUnmounted() {
      this._onUnmountedHandlers.forEach((d) => {
        try {
          d();
        } catch (p) {
          console.error(p);
        }
      });
    }
    _executeUpdated() {
      this._onUpdatedHandlers.forEach((d) => {
        try {
          d();
        } catch (p) {
          console.error(p);
        }
      });
    }
    destroy() {
      this._watches.forEach((d) => {
        d._subscribers && d._subscribers.clear();
      }), this._watches = [], this._computedDeps.forEach((d, p) => {
        d.forEach((g) => {
          s.kupolaData && s.kupolaData.unobserve(g);
        });
      }), this._computedDeps.clear(), this._refs.clear(), this._onMountedHandlers = [], this._onUnmountedHandlers = [], this._onUpdatedHandlers = [], this.component = null, this.lifecycle = null;
    }
  }
  function r(u = null) {
    if (t)
      return t.ref(u);
    if (s.kupolaData) {
      const p = `__ref_${Math.random().toString(36).slice(2, 11)}__`;
      return s.kupolaData.set(p, u), {
        get value() {
          return s.kupolaData.get(p);
        },
        set value(g) {
          s.kupolaData.set(p, g);
        },
        _key: p
      };
    }
    const d = {
      _value: u,
      _subscribers: /* @__PURE__ */ new Set()
    };
    return Object.defineProperty(d, "value", {
      get() {
        return d._value;
      },
      set(p) {
        p !== d._value && (d._value = p, d._subscribers.forEach((g) => g(p)));
      }
    }), d;
  }
  function o(u) {
    if (t)
      return t.reactive(u);
    if (s.kupolaData)
      return s.kupolaData.createReactive(u);
    const d = {
      get(g, f) {
        if (f === "__isReactive") return !0;
        if (f === "__raw") return g;
        const m = g[f];
        return typeof m == "object" && m !== null && !m.__isReactive && (g[f] = new Proxy(m, d), g[f].__isReactive = !0), g[f];
      },
      set(g, f, m) {
        return g[f] === m || (g[f] = m, t && t._notifyWatchers(f, m)), !0;
      },
      deleteProperty(g, f) {
        return delete g[f], t && t._notifyWatchers(f, void 0), !0;
      }
    }, p = new Proxy(u, d);
    return p.__isReactive = !0, p;
  }
  function n(u) {
    t ? t.onMounted(u) : console.warn("onMounted called outside of setup()");
  }
  function i(u) {
    t ? t.onUnmounted(u) : console.warn("onUnmounted called outside of setup()");
  }
  function a(u) {
    t ? t.onUpdated(u) : console.warn("onUpdated called outside of setup()");
  }
  function l(u, d, p = {}) {
    t && t.watch(u, d, p);
  }
  function c(u) {
    if (t)
      return t.computed(u);
    const d = r();
    let p = () => {
      try {
        d.value = u();
      } catch (f) {
        console.error("Computed property error:", f);
      }
    };
    if (s.kupolaData) {
      const f = [], m = s.kupolaData.get;
      s.kupolaData.get = function(v) {
        return f.push(v), m.call(this, v);
      }, p(), s.kupolaData.get = m, f.forEach((v) => {
        s.kupolaData.observe(v, p);
      });
    } else
      p();
    let g = d._value;
    return Object.defineProperty(d, "value", {
      get: () => g,
      set: (f) => {
        console.warn("Cannot assign to a computed property");
      }
    }), p = () => {
      try {
        g = u();
      } catch (f) {
        console.error("Computed property error:", f);
      }
    }, d;
  }
  function h(u) {
    if (typeof u != "function") {
      console.error("setup() requires a function argument");
      return;
    }
    const d = new e(), p = t;
    t = d;
    let g;
    try {
      g = u(d);
    } finally {
      t = p;
    }
    return g;
  }
  s.SetupContext = e, s.ref = r, s.reactive = o, s.onMounted = n, s.onUnmounted = i, s.onUpdated = a, s.watch = l, s.computed = c, s.setup = h, s._getCurrentSetupContext = () => t, s._setCurrentSetupContext = (u) => {
    t = u;
  }, s._clearSetupContext = () => {
    t = null;
  };
})(window);
(function(s) {
  class t {
    constructor(n, i = {}) {
      if (this.form = typeof n == "string" ? document.querySelector(n) : n, this.options = {
        validateOnSubmit: !0,
        validateOnChange: !1,
        validateOnBlur: !1,
        preventDefault: !0,
        ...i
      }, this.submitHandlers = [], this.isSubmitting = !1, this.errors = {}, this.rules = {}, this.validator = s.kupolaValidator || new s.KupolaValidator(), !this.form || !(this.form instanceof HTMLFormElement)) {
        console.warn("[KupolaForm] Invalid form element");
        return;
      }
      this._init();
    }
    _init() {
      this.options.validateOnChange && this.form.addEventListener("input", (n) => {
        this._validateField(n.target);
      }), this.options.validateOnBlur && this.form.addEventListener("blur", (n) => {
        n.target.form === this.form && this._validateField(n.target);
      }, !0);
    }
    submit(n) {
      const i = async (a) => {
        if (this.options.preventDefault && a.preventDefault(), !this.isSubmitting) {
          this.isSubmitting = !0;
          try {
            if (this.options.validateOnSubmit) {
              const c = await this.validate();
              if (!c.valid) {
                this._showErrors(c.errors);
                return;
              }
            }
            const l = n(a);
            l instanceof Promise && await l;
          } finally {
            this.isSubmitting = !1;
          }
        }
      };
      return this.submitHandlers.push(i), this.form.addEventListener("submit", i), () => {
        const a = this.submitHandlers.indexOf(i);
        a > -1 && (this.submitHandlers.splice(a, 1), this.form.removeEventListener("submit", i));
      };
    }
    setRules(n) {
      return this.rules = { ...this.rules, ...n }, this._applyRulesToDOM(), this;
    }
    _applyRulesToDOM() {
      Object.keys(this.rules).forEach((n) => {
        const i = this.form.querySelector(`[name="${n}"]`);
        if (!i) return;
        const a = this.rules[n], l = this._rulesToString(a);
        i.setAttribute("data-validate", l);
      });
    }
    _rulesToString(n) {
      if (typeof n == "function")
        return "custom";
      const i = [];
      return Object.keys(n).forEach((a) => {
        const l = n[a];
        typeof l == "object" && l !== null ? a === "pattern" ? i.push(`pattern:${l.source?.replace(/\//g, "")}`) : a === "equalTo" ? i.push(`equalTo:${l}`) : i.push(a) : typeof l == "number" || typeof l == "string" ? i.push(`${a}:${l}`) : l === !0 && i.push(a);
      }), i.join("|");
    }
    async validate(n = null) {
      this.errors = {};
      const i = [], a = n ? Array.isArray(n) ? n : [n] : this.form.querySelectorAll("input, select, textarea");
      for (const l of a) {
        const c = l.name;
        if (!c) continue;
        const h = await this._validateField(l);
        h.length > 0 && (this.errors[c] = h, i.push(...h));
      }
      return {
        valid: i.length === 0,
        errors: i,
        fieldErrors: this.errors
      };
    }
    async _validateField(n) {
      const i = n.name, a = this.rules[i];
      if (typeof a == "function") {
        const c = a(n.value.trim(), n);
        if (c instanceof Promise) {
          const h = await c;
          if (h !== !0) {
            const u = n.getAttribute("data-label") || n.getAttribute("placeholder") || i, d = typeof h == "string" ? h : `${u} 验证失败`;
            return this.validator.showError(n, d), [d];
          }
        } else if (c !== !0) {
          const h = n.getAttribute("data-label") || n.getAttribute("placeholder") || i, u = typeof c == "string" ? c : `${h} 验证失败`;
          return this.validator.showError(n, u), [u];
        }
        return this.validator.clearError(n), [];
      }
      if (!await this.validator.validateInputAsync(n)) {
        const c = n.parentElement?.querySelector(".ds-input__error");
        return c ? [c.textContent] : ["Validation failed"];
      }
      return [];
    }
    _showErrors(n) {
      typeof Message < "u" ? Message.error(n.join(`
`)) : typeof console < "u" && console.error("Form validation errors:", n);
    }
    getValues() {
      const n = {};
      return this.form.querySelectorAll("input, select, textarea").forEach((a) => {
        const l = a.name;
        l && (a.type === "checkbox" ? (n[l] || (n[l] = []), a.checked && n[l].push(a.value)) : a.type === "radio" ? a.checked && (n[l] = a.value) : a.type === "file" ? n[l] = a.files : n[l] = a.value);
      }), n;
    }
    setValues(n) {
      return Object.keys(n).forEach((i) => {
        const a = this.form.querySelector(`[name="${i}"]`);
        if (a)
          if (a.type === "checkbox") {
            const l = Array.isArray(n[i]) ? n[i] : [n[i]];
            a.checked = l.includes(a.value);
          } else if (a.type === "radio") {
            const l = this.form.querySelector(`[name="${i}"][value="${n[i]}"]`);
            l && (l.checked = !0);
          } else if (a.type === "file") {
            const l = new DataTransfer();
            n[i] instanceof FileList && Array.from(n[i]).forEach((c) => {
              l.items.add(c);
            }), a.files = l.files;
          } else
            a.value = n[i];
      }), this;
    }
    reset() {
      return this.form.reset(), this.errors = {}, this.validator.resetForm(this.form), this;
    }
    clearErrors() {
      return this.errors = {}, this.form.querySelectorAll(".ds-input--error").forEach((n) => {
        this.validator.clearError(n);
      }), this;
    }
    getError(n) {
      return this.errors[n] || [];
    }
    hasError(n) {
      return this.errors[n] && this.errors[n].length > 0;
    }
    destroy() {
      this.submitHandlers.forEach((n) => {
        this.form.removeEventListener("submit", n);
      }), this.submitHandlers = [], this.errors = {}, this.rules = {};
    }
  }
  function e(o, n = {}) {
    return new t(o, n);
  }
  function r(o, n = {}) {
    return new t(o, n);
  }
  s.KupolaForm = t, s.useForm = e, s.createForm = r;
})(window);
let jt = class {
  static createElement(t) {
    const e = document.createElement("div");
    return e.innerHTML = t, e.firstElementChild;
  }
  static mountComponent(t, e = {}, r = "") {
    const o = this.createElement(r), n = new t(o);
    return Object.assign(n.props, e), { component: n, element: o };
  }
  static async waitFor(t, e = 1e3) {
    const r = Date.now();
    return new Promise((o, n) => {
      const i = async () => {
        try {
          const a = await t();
          a ? o(a) : Date.now() - r < e ? requestAnimationFrame(i) : n(new Error("waitFor timeout"));
        } catch {
          Date.now() - r < e ? requestAnimationFrame(i) : n(new Error("waitFor timeout"));
        }
      };
      requestAnimationFrame(i);
    });
  }
  static async waitForElement(t, e = document, r = 1e3) {
    return this.waitFor(() => e.querySelector(t), r);
  }
  static async waitForText(t, e = document, r = 1e3) {
    return this.waitFor(() => e.textContent.includes(t), r);
  }
  static fireEvent(t, e, r = {}) {
    const o = new CustomEvent(e, {
      bubbles: !0,
      cancelable: !0,
      detail: r
    });
    t.dispatchEvent(o);
  }
  static fireInput(t, e) {
    t.value = e, this.fireEvent(t, "input"), this.fireEvent(t, "change");
  }
  static fireClick(t) {
    this.fireEvent(t, "click");
  }
  static fireKeyDown(t, e) {
    const r = new KeyboardEvent("keydown", { key: e, bubbles: !0 });
    t.dispatchEvent(r);
  }
  static async nextTick() {
    return new Promise((t) => requestAnimationFrame(t));
  }
  static mockDate(t) {
    const e = Date.now, r = Date;
    return Date.now = () => t.getTime(), globalThis.Date = class extends Date {
      constructor(...o) {
        return super(...o), o.length === 0 ? new Date(t) : new r(...o);
      }
    }, () => {
      Date.now = e, globalThis.Date = r;
    };
  }
  static mockFetch(t) {
    const e = fetch;
    return globalThis.fetch = jest.fn(async (r, o) => {
      for (const n of t)
        if (typeof n.url == "string" && r === n.url || n.url instanceof RegExp && n.url.test(r) || n.method && o && o.method === n.method)
          return n.response();
      return e(r, o);
    }), () => {
      globalThis.fetch = e;
    };
  }
  static async mountAndWait(t, e = {}, r = "") {
    const { component: o, element: n } = this.mountComponent(t, e, r);
    return await o.mount(), await this.nextTick(), { component: o, element: n };
  }
  static async unmountAndWait(t) {
    await t.unmount(), await this.nextTick();
  }
  static getByText(t, e) {
    const r = t.querySelectorAll("*");
    for (const o of r)
      if (o.textContent.trim() === e)
        return o;
    throw new Error(`Element with text "${e}" not found`);
  }
  static queryByText(t, e) {
    const r = t.querySelectorAll("*");
    for (const o of r)
      if (o.textContent.trim() === e)
        return o;
    return null;
  }
  static getByTestId(t, e) {
    const r = t.querySelector(`[data-testid="${e}"]`);
    if (!r)
      throw new Error(`Element with data-testid="${e}" not found`);
    return r;
  }
  static queryByTestId(t, e) {
    return t.querySelector(`[data-testid="${e}"]`);
  }
  static getByRole(t, e) {
    const r = t.querySelector(`[role="${e}"]`);
    if (!r)
      throw new Error(`Element with role="${e}" not found`);
    return r;
  }
  static queryByRole(t, e) {
    return t.querySelector(`[role="${e}"]`);
  }
  static async simulateDrag(t, e, r, o, n) {
    this.fireEvent(t, "dragstart", {
      clientX: e,
      clientY: r
    }), this.fireEvent(t, "drag", {
      clientX: (e + o) / 2,
      clientY: (r + n) / 2
    }), this.fireEvent(t, "dragend", {
      clientX: o,
      clientY: n
    });
  }
  static async simulateTouch(t, e, r, o, n) {
    const i = new TouchEvent("touchstart", {
      touches: [{ clientX: e, clientY: r }],
      bubbles: !0
    });
    t.dispatchEvent(i);
    const a = new TouchEvent("touchmove", {
      touches: [{ clientX: (e + o) / 2, clientY: (r + n) / 2 }],
      bubbles: !0
    });
    t.dispatchEvent(a);
    const l = new TouchEvent("touchend", {
      touches: [{ clientX: o, clientY: n }],
      bubbles: !0
    });
    t.dispatchEvent(l);
  }
  static async waitForState(t, e, r) {
    return this.waitFor(() => t.state[e] === r);
  }
  static async waitForProps(t, e, r) {
    return this.waitFor(() => t.props[e] === r);
  }
  static async waitForEmitted(t, e) {
    return this.waitFor(() => t._emitted && t._emitted[e]);
  }
  static spyOn(t, e) {
    const r = t[e], o = function(...n) {
      return o.called = !0, o.callCount = (o.callCount || 0) + 1, o.args = (o.args || []).concat([n]), r.apply(this, n);
    };
    return t[e] = o, () => {
      t[e] = r;
    };
  }
  static async flushPromises() {
    return new Promise((t) => setImmediate(t));
  }
};
window.KupolaTestUtils = jt;
window.testUtils = jt;
let ct = class {
  constructor(t = {}) {
    this.locales = t.locales || {}, this.currentLocale = t.defaultLocale || "zh-CN", this.fallbackLocale = t.fallbackLocale || "zh-CN", this.delimiter = t.delimiter || ".", this.missingHandler = t.missingHandler || ((e) => (console.warn(`Missing translation: ${e}`), e)), this._initFromDOM();
  }
  _initFromDOM() {
    document.querySelectorAll('script[type="application/json"][data-kupola-i18n]').forEach((r) => {
      const o = r.dataset.kupolaI18n;
      if (o)
        try {
          const n = JSON.parse(r.textContent);
          this.addLocale(o, n);
        } catch (n) {
          console.error("Failed to parse i18n data:", n);
        }
    });
    const e = document.documentElement.lang;
    e && this.locales[e] && (this.currentLocale = e);
  }
  addLocale(t, e) {
    this.locales[t] || (this.locales[t] = {}), this._mergeDeep(this.locales[t], e);
  }
  _mergeDeep(t, e) {
    for (const r of Object.keys(e))
      e[r] instanceof Object && r in t ? this._mergeDeep(t[r], e[r]) : t[r] = e[r];
  }
  setLocale(t) {
    return this.locales[t] ? (this.currentLocale = t, document.documentElement.lang = t, this._emitChange(), !0) : !1;
  }
  getLocale() {
    return this.currentLocale;
  }
  t(t, e = {}) {
    let r = this._getTranslation(t, this.currentLocale);
    return r || (r = this._getTranslation(t, this.fallbackLocale)), r ? this._interpolate(r, e) : this.missingHandler(t);
  }
  _getTranslation(t, e) {
    if (!this.locales[e]) return null;
    const r = t.split(this.delimiter);
    let o = this.locales[e];
    for (const n of r)
      if (o && typeof o == "object" && n in o)
        o = o[n];
      else
        return null;
    return typeof o == "string" ? o : null;
  }
  _interpolate(t, e) {
    return t.replace(/\{(\w+)\}/g, (r, o) => e[o] !== void 0 ? e[o] : r);
  }
  n(t, e, r = {}) {
    const o = this.t(t, { ...r, count: e });
    if (!o) return o;
    const n = o.split("|");
    return n.length === 1 ? o.replace("{count}", e) : n.length === 2 ? e === 1 ? n[0] : n[1] : n.length >= 3 ? e === 0 ? n[0] : e === 1 ? n[1] : n[2] : o;
  }
  _emitChange() {
    const t = new CustomEvent("kupola:i18n:change", {
      detail: { locale: this.currentLocale },
      bubbles: !0
    });
    document.dispatchEvent(t);
  }
  async loadLocale(t, e) {
    try {
      const o = await (await fetch(e)).json();
      return this.addLocale(t, o), !0;
    } catch (r) {
      return console.error("Failed to load locale:", r), !1;
    }
  }
  getAvailableLocales() {
    return Object.keys(this.locales);
  }
  hasLocale(t) {
    return !!this.locales[t];
  }
  formatDate(t, e = {}) {
    const r = e.locale || this.currentLocale, o = typeof t == "string" ? new Date(t) : t;
    return new Intl.DateTimeFormat(r, e).format(o);
  }
  formatNumber(t, e = {}) {
    const r = e.locale || this.currentLocale;
    return new Intl.NumberFormat(r, e).format(t);
  }
  formatCurrency(t, e, r = {}) {
    const o = r.locale || this.currentLocale;
    return new Intl.NumberFormat(o, {
      style: "currency",
      currency: e,
      ...r
    }).format(t);
  }
  formatRelativeTime(t, e, r = {}) {
    const o = r.locale || this.currentLocale;
    return new Intl.RelativeTimeFormat(o, r).format(t, e);
  }
};
const I = new ct();
function Ge(s) {
  return new ct(s);
}
function Qe(s, t = {}) {
  return I.t(s, t);
}
function Ze(s, t, e = {}) {
  return I.n(s, t, e);
}
function ts(s) {
  return I.setLocale(s);
}
function es() {
  return I.getLocale();
}
function ss(s, t = {}) {
  return I.formatDate(s, t);
}
function is(s, t = {}) {
  return I.formatNumber(s, t);
}
function ns(s, t, e = {}) {
  return I.formatCurrency(s, t, e);
}
window.KupolaI18n = ct;
window.kupolaI18n = I;
window.createI18n = Ge;
window.t = Qe;
window.n = Ze;
window.setLocale = ts;
window.getLocale = es;
window.formatDate = ss;
window.formatNumber = is;
window.formatCurrency = ns;
let Gt = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map(), this.scopes = /* @__PURE__ */ new Map();
  }
  on(t, e, r, o = {}) {
    const n = this._getKey(t, e);
    this.listeners.has(n) || this.listeners.set(n, []);
    const i = (c) => {
      r.before && typeof r.before == "function" && r.before(c);
      const h = r(c);
      return r.after && typeof r.after == "function" && r.after(c, h), h;
    }, a = {
      handler: r,
      wrapper: i,
      options: o,
      active: !0
    };
    this.listeners.get(n).push(a), o.scope && (this.scopes.has(o.scope) || this.scopes.set(o.scope, []), this.scopes.get(o.scope).push({ target: t, eventType: e, handler: r, wrapper: i })), t.addEventListener(e, i, o);
    const l = () => {
      if (t.removeEventListener(e, i, o), this.listeners.has(n)) {
        const c = this.listeners.get(n), h = c.indexOf(a);
        h !== -1 && c.splice(h, 1);
      }
      if (o.scope && this.scopes.has(o.scope)) {
        const c = this.scopes.get(o.scope), h = c.findIndex(
          (u) => u.target === t && u.eventType === e && u.handler === r
        );
        h !== -1 && c.splice(h, 1);
      }
      a.active = !1;
    };
    return a.unsubscribe = l, a;
  }
  off(t, e, r) {
    const o = this._getKey(t, e);
    if (!this.listeners.has(o)) return;
    const n = this.listeners.get(o), i = n.findIndex((a) => a.handler === r);
    if (i !== -1) {
      const a = n[i];
      t.removeEventListener(e, a.wrapper, a.options), a.active = !1, n.splice(i, 1), a.options.scope && this._removeFromScope(a.options.scope, t, e, r);
    }
  }
  once(t, e, r, o = {}) {
    const n = (i) => (this.off(t, e, n), r(i));
    return this.on(t, e, n, o);
  }
  clearScope(t) {
    if (!this.scopes.has(t)) return;
    this.scopes.get(t).forEach(({ target: r, eventType: o, handler: n, wrapper: i }) => {
      r.removeEventListener(o, i);
      const a = this._getKey(r, o);
      if (this.listeners.has(a)) {
        const l = this.listeners.get(a), c = l.findIndex((h) => h.handler === n);
        c !== -1 && (l[c].active = !1, l.splice(c, 1));
      }
    }), this.scopes.delete(t);
  }
  _removeFromScope(t, e, r, o) {
    if (!this.scopes.has(t)) return;
    const n = this.scopes.get(t), i = n.findIndex(
      (a) => a.target === e && a.eventType === r && a.handler === o
    );
    i !== -1 && n.splice(i, 1);
  }
  _getKey(t, e) {
    return `${t === document ? "document" : t === window ? "window" : t === document.body ? "body" : t.nodeName ? t.nodeName : "unknown"}:${e}`;
  }
  getListenerCount(t, e) {
    const r = this._getKey(t, e);
    return this.listeners.has(r) ? this.listeners.get(r).length : 0;
  }
  getAllListenerCounts() {
    const t = {};
    return this.listeners.forEach((e, r) => {
      t[r] = e.filter((o) => o.active).length;
    }), t;
  }
  cleanup() {
    this.listeners.forEach((t, e) => {
      const [r, o] = e.split(":");
      let n;
      r === "document" ? n = document : r === "window" ? n = window : r === "body" && (n = document.body), n && t.forEach((i) => {
        n.removeEventListener(o, i.wrapper, i.options);
      });
    }), this.listeners.clear(), this.scopes.clear();
  }
};
const A = new Gt();
function rs(s, t, e, r) {
  return A.on(s, t, e, r);
}
function os(s, t, e) {
  A.off(s, t, e);
}
function as(s, t, e, r) {
  return A.once(s, t, e, r);
}
function ls(s) {
  A.clearScope(s);
}
window.GlobalEventManager = Gt;
window.globalEvents = A;
window.on = rs;
window.off = os;
window.once = as;
window.clearScope = ls;
let Qt = class {
  constructor() {
    this.csrfToken = null, this.cspEnabled = !1;
  }
  init() {
    this._initCSRF(), this._initCSP();
  }
  _initCSRF() {
    const t = document.querySelector('meta[name="csrf-token"]');
    t && (this.csrfToken = t.getAttribute("content"));
  }
  _initCSP() {
    document.querySelector('meta[http-equiv="Content-Security-Policy"]') && (this.cspEnabled = !0);
  }
  getCSRFToken() {
    return this.csrfToken;
  }
  setCSRFToken(t) {
    this.csrfToken = t;
    const e = document.querySelector('meta[name="csrf-token"]');
    e && e.setAttribute("content", t);
  }
  addCSRFHeader(t) {
    return this.csrfToken && (t.headers = t.headers || {}, t.headers["X-CSRF-Token"] = this.csrfToken), t;
  }
  escapeHtml(t) {
    if (!t || typeof t != "string") return t;
    const e = document.createElement("div");
    return e.textContent = t, e.innerHTML;
  }
  sanitize(t) {
    if (!t || typeof t != "string") return t;
    const e = [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "strike",
      "sub",
      "sup",
      "a",
      "br",
      "p",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "img",
      "video",
      "audio",
      "iframe"
    ], r = [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "data-*",
      "width",
      "height",
      "frameborder",
      "allowfullscreen"
    ], o = document.createElement("div");
    o.innerHTML = t;
    const n = (i) => {
      if (i.nodeType === Node.ELEMENT_NODE) {
        const a = i.tagName.toLowerCase();
        if (!e.includes(a)) {
          i.parentNode.replaceChild(document.createTextNode(i.textContent), i);
          return;
        }
        Array.from(i.attributes).forEach((l) => {
          const c = l.name.toLowerCase();
          r.includes(c) || c.startsWith("data-") ? (c === "href" || c === "src") && (this._isSafeUrl(l.value) || i.removeAttribute(l.name)) : i.removeAttribute(l.name);
        });
      }
      for (let a = i.childNodes.length - 1; a >= 0; a--)
        n(i.childNodes[a]);
    };
    return n(o), o.innerHTML;
  }
  _isSafeUrl(t) {
    try {
      const e = new URL(t);
      return ["http:", "https:", "data:", "mailto:", "tel:"].includes(e.protocol);
    } catch {
      return !1;
    }
  }
  validateEmail(t) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }
  validateURL(t) {
    try {
      return new URL(t), !0;
    } catch {
      return !1;
    }
  }
  validatePhone(t) {
    return /^[\d\s\-\+\(\)]{7,20}$/.test(t.replace(/\s/g, ""));
  }
  generateSecureHash(t) {
    if (!t || typeof t != "string") return "";
    let e = 0;
    for (let r = 0; r < t.length; r++) {
      const o = t.charCodeAt(r);
      e = (e << 5) - e + o, e = e & e;
    }
    return Math.abs(e).toString(36);
  }
  isXSSAttack(t) {
    return !t || typeof t != "string" ? !1 : [
      /<script[^>]*>.*?<\/script>/gi,
      /<img[^>]*onerror[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload[^>]*=/gi,
      /onclick[^>]*=/gi,
      /onmouseover[^>]*=/gi,
      /<iframe[^>]*>/gi
    ].some((r) => r.test(t));
  }
  protectForm(t) {
    t instanceof HTMLFormElement && t.addEventListener("submit", (e) => {
      const r = t.querySelectorAll("input, textarea");
      let o = !1;
      r.forEach((n) => {
        this.isXSSAttack(n.value) ? (o = !0, n.classList.add("ds-input--error")) : n.classList.remove("ds-input--error");
      }), o && (e.preventDefault(), console.error("[KupolaSecurity] XSS attack detected in form"));
    });
  }
};
const cs = new Qt();
window.kupolaSecurity = cs;
window.KupolaSecurity = Qt;
let Zt = class {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map(), this.errorLog = [], this.maxLogs = 100, this.globalHandler = null;
  }
  init() {
    this._installGlobalHandlers();
  }
  _installGlobalHandlers() {
    window.addEventListener("error", (t) => {
      this.handleError(t.error || t.message, {
        source: t.filename,
        line: t.lineno,
        column: t.colno,
        type: "global"
      });
    }), window.addEventListener("unhandledrejection", (t) => {
      this.handleError(t.reason, {
        type: "promise",
        rejection: !0
      });
    });
  }
  setGlobalHandler(t) {
    typeof t == "function" && (this.globalHandler = t);
  }
  handleError(t, e = {}) {
    const r = this._normalizeError(t, e);
    if (this._logError(r), this._notifyHandlers(r), this.globalHandler)
      try {
        this.globalHandler(r);
      } catch (o) {
        console.error("[KupolaErrorHandler] Error in global handler:", o);
      }
    return r;
  }
  _normalizeError(t, e) {
    const r = {
      id: this._generateId(),
      timestamp: Date.now(),
      message: "",
      stack: "",
      type: e.type || "unknown",
      source: e.source || "",
      line: e.line || 0,
      column: e.column || 0,
      component: e.component || "",
      hook: e.hook || "",
      args: e.args || [],
      ...e
    };
    return t instanceof Error ? (r.message = t.message, r.stack = t.stack || "", r.name = t.name) : typeof t == "string" ? r.message = t : t && typeof t == "object" && (r.message = t.message || JSON.stringify(t), r.stack = t.stack || "", r.name = t.name || ""), r;
  }
  _generateId() {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  _logError(t) {
    this.errorLog.unshift(t), this.errorLog.length > this.maxLogs && this.errorLog.pop(), console.error(`[KupolaError] [${t.type}] ${t.message}`, t);
  }
  _notifyHandlers(t) {
    this.handlers.forEach((e, r) => {
      try {
        e(t);
      } catch (o) {
        console.error(`[KupolaErrorHandler] Error in handler "${r}":`, o);
      }
    });
  }
  on(t, e) {
    this.handlers.has(t) || this.handlers.set(t, []), this.handlers.get(t).push(e);
  }
  off(t, e) {
    if (!this.handlers.has(t)) return;
    const r = this.handlers.get(t), o = r.indexOf(e);
    o > -1 && r.splice(o, 1);
  }
  getErrorLog() {
    return [...this.errorLog];
  }
  clearErrorLog() {
    this.errorLog = [];
  }
  getErrorCount() {
    return this.errorLog.length;
  }
  getErrorByType(t) {
    return this.errorLog.filter((e) => e.type === t);
  }
  captureErrors(t, e) {
    !t || !e || !Array.isArray(e) || e.forEach((r) => {
      if (typeof t[r] == "function") {
        const o = t[r];
        t[r] = function(...n) {
          try {
            const i = o.apply(this, n);
            return i instanceof Promise ? i.catch((a) => {
              throw at.handleError(a, {
                type: "method",
                component: t.constructor?.name || "",
                hook: r,
                args: n
              }), a;
            }) : i;
          } catch (i) {
            throw at.handleError(i, {
              type: "method",
              component: t.constructor?.name || "",
              hook: r,
              args: n
            }), i;
          }
        };
      }
    });
  }
};
const at = new Zt();
window.kupolaErrorHandler = at;
window.KupolaErrorHandler = Zt;
let te = class {
  constructor() {
    this.metrics = /* @__PURE__ */ new Map(), this.timers = /* @__PURE__ */ new Map(), this.observers = [], this.enabled = !1, this.thresholds = {
      render: 16,
      mount: 100,
      update: 50,
      http: 3e3
    };
  }
  init() {
    this.enabled = !0, this._setupObservers(), this._measureNavigation();
  }
  _setupObservers() {
    if ("PerformanceObserver" in window) {
      const t = new PerformanceObserver((o) => {
        o.getEntries().forEach((n) => {
          this._recordMetric("paint", {
            name: n.name,
            startTime: n.startTime,
            duration: n.duration
          });
        });
      });
      t.observe({ type: "paint", buffered: !0 }), this.observers.push(t);
      const e = new PerformanceObserver((o) => {
        o.getEntries().forEach((n) => {
          this._recordMetric("resource", {
            name: n.name,
            type: n.initiatorType,
            duration: n.duration,
            size: n.transferSize,
            startTime: n.startTime
          });
        });
      });
      e.observe({ type: "resource", buffered: !0 }), this.observers.push(e);
      const r = new PerformanceObserver((o) => {
        o.getEntries().forEach((n) => {
          this._recordMetric("longtask", {
            duration: n.duration,
            startTime: n.startTime
          });
        });
      });
      r.observe({ type: "longtask", buffered: !0 }), this.observers.push(r);
    }
  }
  _measureNavigation() {
    if ("performance" in window) {
      const t = performance.getEntriesByType("navigation")[0];
      t && this._recordMetric("navigation", {
        domContentLoaded: t.domContentLoadedEventEnd - t.fetchStart,
        load: t.loadEventEnd - t.fetchStart,
        firstByte: t.responseStart - t.requestStart,
        redirectCount: t.redirectCount
      });
    }
  }
  startTimer(t, e = {}) {
    this.enabled && this.timers.set(t, {
      startTime: performance.now(),
      context: e
    });
  }
  stopTimer(t) {
    if (!this.enabled) return null;
    const e = this.timers.get(t);
    if (!e) return null;
    const r = performance.now() - e.startTime;
    return this.timers.delete(t), this._recordMetric("timer", {
      name: t,
      duration: r,
      ...e.context
    }), r;
  }
  _recordMetric(t, e) {
    if (!this.enabled) return;
    const r = {
      type: t,
      timestamp: Date.now(),
      ...e
    };
    this.metrics.has(t) || this.metrics.set(t, []), this.metrics.get(t).push(r);
  }
  measure(t, e, r = {}) {
    if (!this.enabled) return t();
    this.startTimer(e, r);
    let o, n;
    try {
      o = t();
    } catch (i) {
      n = i;
    }
    if (this.stopTimer(e), n)
      throw n;
    return o;
  }
  measureAsync(t, e, r = {}) {
    return this.enabled ? (this.startTimer(e, r), t().then((o) => (this.stopTimer(e), o)).catch((o) => {
      throw this.stopTimer(e), o;
    })) : t();
  }
  getMetrics(t) {
    return t ? this.metrics.get(t) || [] : Array.from(this.metrics.entries());
  }
  getSummary() {
    const t = {
      navigation: null,
      paint: null,
      timers: [],
      resources: [],
      longTasks: []
    };
    return this.metrics.has("navigation") && (t.navigation = this.metrics.get("navigation")[0]), this.metrics.has("paint") && (t.paint = this.metrics.get("paint")), this.metrics.has("timer") && (t.timers = this.metrics.get("timer")), this.metrics.has("resource") && (t.resources = this.metrics.get("resource")), this.metrics.has("longtask") && (t.longTasks = this.metrics.get("longtask")), t;
  }
  getPerformanceScore() {
    const t = this.getSummary();
    let e = 100;
    if (t.navigation && (t.navigation.load > 3e3 ? e -= 20 : t.navigation.load > 2e3 && (e -= 10), t.navigation.domContentLoaded > 1500 ? e -= 15 : t.navigation.domContentLoaded > 1e3 && (e -= 5)), t.paint) {
      const r = t.paint.find((o) => o.name === "first-contentful-paint");
      r && r.startTime > 2e3 ? e -= 20 : r && r.startTime > 1e3 && (e -= 10);
    }
    return t.longTasks.length > 0 && (e -= t.longTasks.length * 10), Math.max(0, e);
  }
  logSummary() {
    const t = this.getSummary(), e = this.getPerformanceScore();
    console.group("[KupolaPerformance] Summary"), console.log("Score:", e), console.log("Navigation:", t.navigation), console.log("Paint:", t.paint), console.log("Long Tasks:", t.longTasks.length), console.groupEnd();
  }
  clear() {
    this.metrics.clear(), this.timers.clear();
  }
  destroy() {
    this.observers.forEach((t) => {
      t.disconnect();
    }), this.observers = [], this.clear(), this.enabled = !1;
  }
};
const ds = new te();
window.kupolaPerformance = ds;
window.KupolaPerformance = te;
const hs = window.KupolaComponent, us = window.KupolaComponentRegistry, ps = window.KupolaRouter, fs = window.KupolaHttp, ms = window.KupolaStatePersist, gs = window.KupolaLifecycle, ys = window.KupolaPluginManager, vs = window.KupolaDevTools, _s = window.kupolaRegistry, ws = window.kupolaPersist, xs = window.kupolaLifecycle, bs = window.kupolaPluginManager, ks = window.KupolaUtils, Es = window.createRouter, Cs = window.createHttp, Ss = window.createLifecycle, Ls = window.createStore, Hs = window.getStore, Ds = window.registerComponent, Ms = window.registerLazyComponent, Is = window.bootstrapComponents, Ts = window.defineMixin, As = window.useMixin, qs = window.initTheme, zs = window.setTheme, Ps = window.getTheme, $s = window.setBrand, Rs = window.getBrand, Fs = window.initDropdowns, Os = window.initSelects, Bs = window.initDatePickers, Ns = window.initTimePickers, Ks = window.initSliders, Vs = window.initCarousels, Us = window.initDrawers, Ws = window.initModals, Ys = window.initDialogs, Xs = window.initNotifications, Js = window.initMessages, js = window.initFileUploads, Gs = window.initCollapses, Qs = window.initColorPickers, Zs = window.initCalendars, ti = window.initDynamicTags, ei = window.initImagePreviews, si = window.initTags, ii = window.initStatCards, ni = window.initHeatmaps, ri = window.initTooltips, oi = window.initValidation, ai = window.initVirtualLists, li = window.initIcons, ci = window.initCountdowns, di = window.initNumberInputs, hi = window.initSlideCaptchas, ui = window.setup, pi = window.ref, fi = window.reactive, mi = window.onMounted, gi = window.onUnmounted, yi = window.onUpdated, vi = window.watch, _i = window.computed, wi = window.KupolaForm, xi = window.useForm, bi = window.createForm, ki = window.KupolaTestUtils, Ei = window.testUtils, Ci = window.KupolaI18n, Si = window.kupolaI18n, Li = window.createI18n, Hi = window.t, Di = window.n, Mi = window.setLocale, Ii = window.getLocale, Ti = window.formatDate, Ai = window.formatNumber, qi = window.formatCurrency, zi = window.GlobalEventManager, Pi = window.globalEvents, $i = window.on, Ri = window.off, Fi = window.once, Oi = window.clearScope, Bi = window.KupolaSecurity, Ni = window.kupolaSecurity, Ki = window.KupolaErrorHandler, Vi = window.kupolaErrorHandler, Ui = window.KupolaPerformance, Wi = window.kupolaPerformance, sn = {
  KupolaComponent: hs,
  KupolaComponentRegistry: us,
  KupolaRouter: ps,
  KupolaHttp: fs,
  KupolaStatePersist: ms,
  KupolaLifecycle: gs,
  KupolaPluginManager: ys,
  KupolaDevTools: vs,
  KupolaSecurity: Bi,
  KupolaErrorHandler: Ki,
  KupolaPerformance: Ui,
  kupolaRegistry: _s,
  kupolaPersist: ws,
  kupolaLifecycle: xs,
  kupolaPluginManager: bs,
  kupolaSecurity: Ni,
  kupolaErrorHandler: Vi,
  kupolaPerformance: Wi,
  KupolaUtils: ks,
  createRouter: Es,
  createHttp: Cs,
  createLifecycle: Ss,
  createStore: Ls,
  getStore: Hs,
  registerComponent: Ds,
  registerLazyComponent: Ms,
  bootstrapComponents: Is,
  defineMixin: Ts,
  useMixin: As,
  initTheme: qs,
  setTheme: zs,
  getTheme: Ps,
  setBrand: $s,
  getBrand: Rs,
  initDropdowns: Fs,
  initSelects: Os,
  initDatePickers: Bs,
  initTimePickers: Ns,
  initSliders: Ks,
  initCarousels: Vs,
  initDrawers: Us,
  initModals: Ws,
  initDialogs: Ys,
  initNotifications: Xs,
  initMessages: Js,
  initFileUploads: js,
  initCollapses: Gs,
  initColorPickers: Qs,
  initCalendars: Zs,
  initDynamicTags: ti,
  initImagePreviews: ei,
  initTags: si,
  initStatCards: ii,
  initHeatmaps: ni,
  initTooltips: ri,
  initValidation: oi,
  initVirtualLists: ai,
  initIcons: li,
  initCountdowns: ci,
  initNumberInputs: di,
  initSlideCaptchas: hi,
  setup: ui,
  ref: pi,
  reactive: fi,
  onMounted: mi,
  onUnmounted: gi,
  onUpdated: yi,
  watch: vi,
  computed: _i,
  KupolaForm: wi,
  useForm: xi,
  createForm: bi,
  KupolaTestUtils: ki,
  testUtils: Ei,
  KupolaI18n: Ci,
  kupolaI18n: Si,
  createI18n: Li,
  t: Hi,
  n: Di,
  setLocale: Mi,
  getLocale: Ii,
  formatDate: Ti,
  formatNumber: Ai,
  formatCurrency: qi,
  GlobalEventManager: zi,
  globalEvents: Pi,
  on: $i,
  off: Ri,
  once: Fi,
  clearScope: Oi
};
export {
  zi as GlobalEventManager,
  hs as KupolaComponent,
  us as KupolaComponentRegistry,
  vs as KupolaDevTools,
  Ki as KupolaErrorHandler,
  wi as KupolaForm,
  fs as KupolaHttp,
  Ci as KupolaI18n,
  gs as KupolaLifecycle,
  Ui as KupolaPerformance,
  ys as KupolaPluginManager,
  ps as KupolaRouter,
  Bi as KupolaSecurity,
  ms as KupolaStatePersist,
  ki as KupolaTestUtils,
  ks as KupolaUtils,
  Is as bootstrapComponents,
  Oi as clearScope,
  _i as computed,
  bi as createForm,
  Cs as createHttp,
  Li as createI18n,
  Ss as createLifecycle,
  Es as createRouter,
  Ls as createStore,
  sn as default,
  Ts as defineMixin,
  qi as formatCurrency,
  Ti as formatDate,
  Ai as formatNumber,
  Rs as getBrand,
  Ii as getLocale,
  Hs as getStore,
  Ps as getTheme,
  Pi as globalEvents,
  Zs as initCalendars,
  Vs as initCarousels,
  Gs as initCollapses,
  Qs as initColorPickers,
  ci as initCountdowns,
  Bs as initDatePickers,
  Ys as initDialogs,
  Us as initDrawers,
  Fs as initDropdowns,
  ti as initDynamicTags,
  js as initFileUploads,
  ni as initHeatmaps,
  li as initIcons,
  ei as initImagePreviews,
  Js as initMessages,
  Ws as initModals,
  Xs as initNotifications,
  di as initNumberInputs,
  Os as initSelects,
  hi as initSlideCaptchas,
  Ks as initSliders,
  ii as initStatCards,
  si as initTags,
  qs as initTheme,
  Ns as initTimePickers,
  ri as initTooltips,
  oi as initValidation,
  ai as initVirtualLists,
  Vi as kupolaErrorHandler,
  Si as kupolaI18n,
  xs as kupolaLifecycle,
  Wi as kupolaPerformance,
  ws as kupolaPersist,
  bs as kupolaPluginManager,
  _s as kupolaRegistry,
  Ni as kupolaSecurity,
  Di as n,
  Ri as off,
  $i as on,
  mi as onMounted,
  gi as onUnmounted,
  yi as onUpdated,
  Fi as once,
  fi as reactive,
  pi as ref,
  Ds as registerComponent,
  Ms as registerLazyComponent,
  $s as setBrand,
  Mi as setLocale,
  zs as setTheme,
  ui as setup,
  Hi as t,
  Ei as testUtils,
  xi as useForm,
  As as useMixin,
  vi as watch
};
//# sourceMappingURL=kupola.esm.js.map
