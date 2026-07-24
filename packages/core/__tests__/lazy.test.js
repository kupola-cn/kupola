// SPDX-License-Identifier: MIT
/**
 * @kupola/core — Unit tests for the lazy component loading.
 */

import { lazyComponent, preloadComponent } from '../src/lazy.js';

describe('lazy', () => {
  // ─── lazyComponent ───────────────────────────────────────────────────────────

  test('lazyComponent creates a lazy factory function', () => {
    const loader = () => Promise.resolve({ default: () => ({ element: document.createElement('div') }) });
    const LazyComp = lazyComponent(loader);
    
    expect(typeof LazyComp).toBe('function');
    expect(typeof LazyComp._lazyLoader).toBe('function');
    expect(typeof LazyComp._isResolved).toBe('function');
    expect(typeof LazyComp._preload).toBe('function');
  });

  test('lazyComponent resolves and returns component on first call', async () => {
    const expectedResult = { element: 'div-element' };
    const loader = jest.fn(() => Promise.resolve({ 
      default: () => expectedResult 
    }));
    
    const LazyComp = lazyComponent(loader);
    
    // First call should invoke loader
    const result = await LazyComp({ prop1: 'value' });
    
    expect(loader).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedResult);
  });

  test('lazyComponent caches resolved component', async () => {
    const loader = jest.fn(() => Promise.resolve({ 
      default: () => ({ element: 'cached' }) 
    }));
    
    const LazyComp = lazyComponent(loader);
    
    // First call
    await LazyComp();
    expect(loader).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    await LazyComp();
    expect(loader).toHaveBeenCalledTimes(1);
    
    // Third call
    await LazyComp({ foo: 'bar' });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('lazyComponent resolves named export when specified', async () => {
    const namedExport = () => ({ element: 'named' });
    const loader = jest.fn(() => Promise.resolve({ 
      default: null,  // default is not a function, so named export will be used
      MyComponent: namedExport
    }));
    
    const LazyComp = lazyComponent(loader, 'MyComponent');
    const result = await LazyComp();
    
    expect(result.element).toBe('named');
  });

  test('lazyComponent falls back to first exported function', async () => {
    const firstExport = () => ({ element: 'first' });
    const loader = jest.fn(() => Promise.resolve({ 
      firstExport,
      anotherExport: 'not-a-function',
      nested: { value: 1 }
    }));
    
    const LazyComp = lazyComponent(loader);
    const result = await LazyComp();
    
    expect(result.element).toBe('first');
  });

  test('lazyComponent throws error when no component factory found', async () => {
    const loader = jest.fn(() => Promise.resolve({ 
      default: null,
      someValue: 42
    }));
    
    const LazyComp = lazyComponent(loader);
    
    await expect(LazyComp()).rejects.toThrow(
      '[Kupola lazy] No component factory found in module'
    );
  });

  test('lazyComponent handles concurrent calls correctly', async () => {
    let resolveLoader;
    const loaderPromise = new Promise(resolve => {
      resolveLoader = () => resolve({ default: () => ({ element: 'async' }) });
    });
    const loader = jest.fn(() => loaderPromise);
    
    const LazyComp = lazyComponent(loader);
    
    // Start two concurrent calls before loader resolves
    const promise1 = LazyComp();
    const promise2 = LazyComp();
    
    // Now resolve the loader
    resolveLoader();
    
    // Both should resolve to the same result
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    expect(loader).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(result2);
    expect(result1.element).toBe('async');
  });

  test('lazyComponent._isResolved returns false before first call', () => {
    const loader = () => Promise.resolve({ default: () => ({}) });
    const LazyComp = lazyComponent(loader);
    
    expect(LazyComp._isResolved()).toBe(false);
  });

  test('lazyComponent._isResolved returns true after resolution', async () => {
    const loader = () => Promise.resolve({ default: () => ({}) });
    const LazyComp = lazyComponent(loader);
    
    await LazyComp();
    
    expect(LazyComp._isResolved()).toBe(true);
  });

  test('lazyComponent passes arguments to component factory', async () => {
    const factory = jest.fn((options, extra) => ({ options, extra }));
    const loader = () => Promise.resolve({ default: factory });
    
    const LazyComp = lazyComponent(loader);
    const result = await LazyComp({ foo: 'bar' }, 'extraArg');
    
    expect(factory).toHaveBeenCalledWith({ foo: 'bar' }, 'extraArg');
    expect(result.options).toEqual({ foo: 'bar' });
    expect(result.extra).toBe('extraArg');
  });

  // ─── preloadComponent ────────────────────────────────────────────────────────

  test('preloadComponent triggers lazy component loading', async () => {
    const loader = jest.fn(() => Promise.resolve({ default: () => ({}) }));
    const LazyComp = lazyComponent(loader);
    
    await preloadComponent(LazyComp);
    
    expect(loader).toHaveBeenCalledTimes(1);
    expect(LazyComp._isResolved()).toBe(true);
  });

  test('preloadComponent throws error for non-lazy components', async () => {
    const notLazy = () => {};
    
    await expect(preloadComponent(notLazy)).rejects.toThrow(
      '[Kupola preload] Argument must be a lazy component from lazyComponent()'
    );
  });

  test('preloadComponent is idempotent', async () => {
    const loader = jest.fn(() => Promise.resolve({ default: () => ({}) }));
    const LazyComp = lazyComponent(loader);
    
    await preloadComponent(LazyComp);
    await preloadComponent(LazyComp);
    await preloadComponent(LazyComp);
    
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('preloadComponent allows subsequent calls to resolve instantly', async () => {
    const loader = jest.fn(() => Promise.resolve({ 
      default: () => ({ element: 'preloaded' }) 
    }));
    const LazyComp = lazyComponent(loader);
    
    // Preload first
    await preloadComponent(LazyComp);
    expect(loader).toHaveBeenCalledTimes(1);
    
    // Now call the lazy component - should resolve immediately from cache
    const result = await LazyComp();
    
    expect(loader).toHaveBeenCalledTimes(1); // Still only once
    expect(result.element).toBe('preloaded');
  });
});