// SPDX-License-Identifier: MIT
/**
 * Import-time side-effect contracts for public browser modules.
 * @jest-environment jsdom
 */

describe('module side effects', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    [ '@kupola/core', '../../core/src/index.js' ],
    [ '@kupola/platform', '../src/platform.js' ],
    [ '@kupola/platform/directives', '../src/directives.js' ],
    [ '@kupola/components', '../../components/src/index.js' ],
    [ '@kupola/auth', '../../auth/src/index.js' ],
    [ '@kupola/router', '../../router/src/index.js' ],
  ])('importing %s has no browser side effects', (_name, modulePath) => {
    const windowAddEventListener = jest.spyOn(window, 'addEventListener');
    const documentAddEventListener = jest.spyOn(document, 'addEventListener');
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const documentBefore = document.documentElement.outerHTML;

    jest.isolateModules(() => {
      require(modulePath);
    });

    expect(windowAddEventListener).not.toHaveBeenCalled();
    expect(documentAddEventListener).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(document.documentElement.outerHTML).toBe(documentBefore);
  });
});
