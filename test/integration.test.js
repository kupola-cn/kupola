// SPDX-License-Identifier: MIT
/**
 * Integration tests — cross-module scenarios.
 */

import { signal, computed, effect, flushJobs, resetScheduler, html } from '../packages/core/src/index.js';
import { setLocale, getLocale, t, addMessages } from '../packages/core/src/i18n.js';

describe('i18n module', () => {
  afterEach(() => {
    setLocale('en-US');
  });

  test('default locale is en-US', () => {
    expect(getLocale()).toBe('en-US');
  });

  test('setLocale changes current locale', () => {
    setLocale('zh-CN');
    expect(getLocale()).toBe('zh-CN');
  });

  test('t() returns English text by default', () => {
    expect(t('modal.close')).toBe('Close');
    expect(t('dialog.ok')).toBe('OK');
    expect(t('table.empty')).toBe('No data');
  });

  test('t() returns Chinese text after setLocale("zh-CN")', () => {
    setLocale('zh-CN');
    expect(t('modal.close')).toBe('关闭');
    expect(t('dialog.ok')).toBe('确定');
    expect(t('table.empty')).toBe('暂无数据');
  });

  test('t() returns key when translation missing', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('t() supports interpolation', () => {
    addMessages('en-US', { 'greeting': 'Hello, {name}!' });
    expect(t('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
  });

  test('addMessages adds new locale', () => {
    addMessages('ja-JP', { 'modal.close': '閉じる' });
    setLocale('ja-JP');
    expect(t('modal.close')).toBe('閉じる');
  });

  test('addMessages extends existing locale', () => {
    addMessages('en-US', { 'custom.key': 'Custom value' });
    expect(t('custom.key')).toBe('Custom value');
    // Original keys still work
    expect(t('modal.close')).toBe('Close');
  });
});

describe('Signal + Effect integration', () => {
  test('computed chains update correctly', () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    expect(quadrupled.value).toBe(4);

    count.value = 3;
    flushJobs();
    expect(doubled.value).toBe(6);
    expect(quadrupled.value).toBe(12);
  });

  test('effect runs on signal change', () => {
    const name = signal('Alice');
    const log = [];

    effect(() => {
      log.push(name.value);
    });

    expect(log).toEqual(['Alice']);

    name.value = 'Bob';
    flushJobs();
    expect(log).toEqual(['Alice', 'Bob']);
  });

  test('multiple effects on same signal', () => {
    const x = signal(0);
    const log1 = [];
    const log2 = [];

    effect(() => log1.push(x.value));
    effect(() => log2.push(x.value * 10));

    x.value = 5;
    flushJobs();

    expect(log1).toEqual([0, 5]);
    expect(log2).toEqual([0, 50]);
  });

  test('computed does not recompute if dependency unchanged', () => {
    const a = signal(1);
    const b = signal(2);
    let computeCount = 0;

    const sum = computed(() => {
      computeCount++;
      return a.value + b.value;
    });

    expect(sum.value).toBe(3);
    expect(computeCount).toBe(1);

    // Change a
    a.value = 10;
    flushJobs();
    expect(sum.value).toBe(12);
  });
});

describe('SSR + i18n integration', () => {
  test('renderToString works with locale set', async () => {
    const { renderToString } = await import('../packages/core/src/server.js');

    setLocale('zh-CN');
    const closeText = t('modal.close');
    expect(closeText).toBe('关闭');

    // Verify the translated text can be used in SSR context
    const tpl = html`<span>${closeText}</span>`;
    const result = await renderToString(tpl);
    expect(result).toContain('关闭');

    setLocale('en-US');
  });
});
