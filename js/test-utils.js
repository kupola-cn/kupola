class KupolaTestUtils {
  static createElement(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstElementChild;
  }

  static mountComponent(ComponentClass, props = {}, html = '') {
    const element = this.createElement(html);
    const component = new ComponentClass(element);
    Object.assign(component.props, props);
    return { component, element };
  }

  static async waitFor(condition, timeout = 1000) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const result = await condition();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime < timeout) {
            requestAnimationFrame(check);
          } else {
            reject(new Error('waitFor timeout'));
          }
        } catch (error) {
          if (Date.now() - startTime < timeout) {
            requestAnimationFrame(check);
          } else {
            reject(new Error('waitFor timeout'));
          }
        }
      };
      requestAnimationFrame(check);
    });
  }

  static async waitForElement(selector, parent = document, timeout = 1000) {
    return this.waitFor(() => parent.querySelector(selector), timeout);
  }

  static async waitForText(text, parent = document, timeout = 1000) {
    return this.waitFor(() => parent.textContent.includes(text), timeout);
  }

  static fireEvent(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, { 
      bubbles: true, 
      cancelable: true, 
      detail 
    });
    element.dispatchEvent(event);
  }

  static fireInput(element, value) {
    element.value = value;
    this.fireEvent(element, 'input');
    this.fireEvent(element, 'change');
  }

  static fireClick(element) {
    this.fireEvent(element, 'click');
  }

  static fireKeyDown(element, key) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    element.dispatchEvent(event);
  }

  static async nextTick() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  static mockDate(date) {
    const originalNow = Date.now;
    const originalDate = Date;
    
    Date.now = () => date.getTime();
    globalThis.Date = class extends Date {
      constructor(...args) {
        super(...args);
        if (args.length === 0) {
          return new Date(date);
        }
        return new originalDate(...args);
      }
    };
    
    return () => {
      Date.now = originalNow;
      globalThis.Date = originalDate;
    };
  }

  static mockFetch(mockResponses) {
    const originalFetch = fetch;
    
    globalThis.fetch = jest.fn(async (url, options) => {
      for (const mock of mockResponses) {
        if (typeof mock.url === 'string' && url === mock.url) {
          return mock.response();
        }
        if (mock.url instanceof RegExp && mock.url.test(url)) {
          return mock.response();
        }
        if (mock.method && options && options.method === mock.method) {
          return mock.response();
        }
      }
      return originalFetch(url, options);
    });
    
    return () => {
      globalThis.fetch = originalFetch;
    };
  }

  static async mountAndWait(ComponentClass, props = {}, html = '') {
    const { component, element } = this.mountComponent(ComponentClass, props, html);
    await component.mount();
    await this.nextTick();
    return { component, element };
  }

  static async unmountAndWait(component) {
    await component.unmount();
    await this.nextTick();
  }

  static getByText(parent, text) {
    const elements = parent.querySelectorAll('*');
    for (const element of elements) {
      if (element.textContent.trim() === text) {
        return element;
      }
    }
    throw new Error(`Element with text "${text}" not found`);
  }

  static queryByText(parent, text) {
    const elements = parent.querySelectorAll('*');
    for (const element of elements) {
      if (element.textContent.trim() === text) {
        return element;
      }
    }
    return null;
  }

  static getByTestId(parent, testId) {
    const element = parent.querySelector(`[data-testid="${testId}"]`);
    if (!element) {
      throw new Error(`Element with data-testid="${testId}" not found`);
    }
    return element;
  }

  static queryByTestId(parent, testId) {
    return parent.querySelector(`[data-testid="${testId}"]`);
  }

  static getByRole(parent, role) {
    const element = parent.querySelector(`[role="${role}"]`);
    if (!element) {
      throw new Error(`Element with role="${role}" not found`);
    }
    return element;
  }

  static queryByRole(parent, role) {
    return parent.querySelector(`[role="${role}"]`);
  }

  static async simulateDrag(element, startX, startY, endX, endY) {
    this.fireEvent(element, 'dragstart', {
      clientX: startX,
      clientY: startY
    });
    
    this.fireEvent(element, 'drag', {
      clientX: (startX + endX) / 2,
      clientY: (startY + endY) / 2
    });
    
    this.fireEvent(element, 'dragend', {
      clientX: endX,
      clientY: endY
    });
  }

  static async simulateTouch(element, startX, startY, endX, endY) {
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: startX, clientY: startY }],
      bubbles: true
    });
    element.dispatchEvent(touchStart);
    
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: (startX + endX) / 2, clientY: (startY + endY) / 2 }],
      bubbles: true
    });
    element.dispatchEvent(touchMove);
    
    const touchEnd = new TouchEvent('touchend', {
      touches: [{ clientX: endX, clientY: endY }],
      bubbles: true
    });
    element.dispatchEvent(touchEnd);
  }

  static async waitForState(component, stateKey, expectedValue) {
    return this.waitFor(() => {
      return component.state[stateKey] === expectedValue;
    });
  }

  static async waitForProps(component, propKey, expectedValue) {
    return this.waitFor(() => {
      return component.props[propKey] === expectedValue;
    });
  }

  static async waitForEmitted(component, eventName) {
    return this.waitFor(() => {
      return component._emitted && component._emitted[eventName];
    });
  }

  static spyOn(obj, methodName) {
    const original = obj[methodName];
    const spy = function(...args) {
      spy.called = true;
      spy.callCount = (spy.callCount || 0) + 1;
      spy.args = (spy.args || []).concat([args]);
      return original.apply(this, args);
    };
    obj[methodName] = spy;
    return () => {
      obj[methodName] = original;
    };
  }

  static async flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
  }
}

window.KupolaTestUtils = KupolaTestUtils;
window.testUtils = KupolaTestUtils;