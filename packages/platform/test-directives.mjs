import { JSDOM } from 'jsdom';
import { signal, computed, nextTick, flushJobs } from '@kupola/core';
import { html } from './src/template.js';
import { render } from './src/render.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;

const container = dom.window.document.body;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

async function run() {
  console.log('=== Kupola Directive Part Tests ===\n');

  // ── Test 1: k-class with string signal ──
  console.log('Test 1: k-class with string signal');
  {
    const active = signal('');
    const tpl = html`<div id="t1" class="card" k-class="${active}">Test 1</div>`;
    render(tpl, container);
    const el = container.querySelector('#t1');
    assert(el.className === 'card', 'initial class is "card"');
    active.value = 'is-active';
    await nextTick();
    assert(el.className === 'card is-active', 'after active="is-active" class is "card is-active"');
    active.value = '';
    await nextTick();
    assert(el.className === 'card', 'after active="" class is back to "card"');
    el.remove();
  }

  // ── Test 2: k-class with object map signal ──
  console.log('Test 2: k-class with object map signal');
  {
    const classObj = signal({ 'is-active': false, 'is-disabled': true });
    const tpl = html`<div id="t2" class="card" k-class="${classObj}">Test 2</div>`;
    render(tpl, container);
    const el = container.querySelector('#t2');
    assert(el.classList.contains('is-active') === false, 'initial: is-active NOT present');
    assert(el.classList.contains('is-disabled') === true, 'initial: is-disabled present');
    classObj.value = { 'is-active': true, 'is-disabled': false };
    await nextTick();
    assert(el.classList.contains('is-active') === true, 'after update: is-active present');
    assert(el.classList.contains('is-disabled') === false, 'after update: is-disabled NOT present');
    assert(el.classList.contains('card') === true, 'static class "card" preserved');
    el.remove();
  }

  // ── Test 3: k-class with function ──
  console.log('Test 3: k-class with function');
  {
    const active = signal(false);
    const tpl = html`<div id="t3" class="card" k-class="${() => active.value ? 'is-active' : ''}">Test 3</div>`;
    render(tpl, container);
    const el = container.querySelector('#t3');
    assert(el.classList.contains('is-active') === false, 'initial: is-active NOT present');
    active.value = true;
    await nextTick();
    assert(el.classList.contains('is-active') === true, 'after active=true: is-active present');
    el.remove();
  }

  // ── Test 4: k-class with computed signal ──
  console.log('Test 4: k-class with computed signal');
  {
    const active = signal(false);
    const disabled = signal(false);
    const classObj = computed(() => ({ 'is-active': active.value, 'is-disabled': disabled.value }));
    const tpl = html`<div id="t4" k-class="${classObj}">Test 4</div>`;
    render(tpl, container);
    const el = container.querySelector('#t4');
    assert(el.classList.contains('is-active') === false, 'initial: is-active NOT present');
    active.value = true;
    await nextTick();
    assert(el.classList.contains('is-active') === true, 'after active=true: is-active present');
    disabled.value = true;
    await nextTick();
    assert(el.classList.contains('is-disabled') === true, 'after disabled=true: is-disabled present');
    active.value = false;
    await nextTick();
    assert(el.classList.contains('is-active') === false, 'after active=false: is-active removed');
    assert(el.classList.contains('is-disabled') === true, 'is-disabled still present');
    el.remove();
  }

  // ── Test 5: k-class with multiple class toggle ──
  console.log('Test 5: k-class with multiple class toggle');
  {
    const cls = signal('');
    const tpl = html`<div id="t5" k-class="${cls}">Test 5</div>`;
    render(tpl, container);
    const el = container.querySelector('#t5');
    cls.value = 'foo bar';
    await nextTick();
    assert(el.classList.contains('foo') && el.classList.contains('bar'), 'foo and bar both present');
    cls.value = 'bar baz';
    await nextTick();
    assert(el.classList.contains('foo') === false, 'foo removed');
    assert(el.classList.contains('bar') === true, 'bar still present');
    assert(el.classList.contains('baz') === true, 'baz added');
    el.remove();
  }

  // ── Test 6: k-show (initially visible) ──
  console.log('Test 6: k-show (initially visible)');
  {
    const visible = signal(true);
    const tpl = html`<div id="t6" k-show="${visible}">Test 6</div>`;
    render(tpl, container);
    const el = container.querySelector('#t6');
    assert(el.style.display === '', 'initial display is empty');
    visible.value = false;
    await nextTick();
    assert(el.style.display === 'none', 'after visible=false: display=none');
    visible.value = true;
    await nextTick();
    assert(el.style.display === '', 'after visible=true: display restored to empty');
    el.remove();
  }

  // ── Test 7: k-show (initially hidden) ──
  console.log('Test 7: k-show (initially hidden)');
  {
    const visible = signal(false);
    const tpl = html`<div id="t7" k-show="${visible}">Test 7</div>`;
    render(tpl, container);
    const el = container.querySelector('#t7');
    assert(el.style.display === 'none', 'initial display is none');
    visible.value = true;
    await nextTick();
    assert(el.style.display === '', 'after visible=true: display restored');
    el.remove();
  }

  // ── Test 8: k-show with function ──
  console.log('Test 8: k-show with function');
  {
    const count = signal(0);
    const tpl = html`<div id="t8" k-show="${() => count.value > 0}">Test 8</div>`;
    render(tpl, container);
    const el = container.querySelector('#t8');
    assert(el.style.display === 'none', 'initial: hidden (count=0)');
    count.value = 5;
    await nextTick();
    assert(el.style.display === '', 'after count=5: visible');
    count.value = 0;
    await nextTick();
    assert(el.style.display === 'none', 'after count=0: hidden again');
    el.remove();
  }

  // ── Test 9: k-show preserves original display ──
  console.log('Test 9: k-show preserves original display style');
  {
    const visible = signal(true);
    const tpl = html`<div id="t9" style="display: flex" k-show="${visible}">Test 9</div>`;
    render(tpl, container);
    const el = container.querySelector('#t9');
    assert(el.style.display === 'flex', 'initial display is flex');
    visible.value = false;
    await nextTick();
    assert(el.style.display === 'none', 'after visible=false: display=none');
    visible.value = true;
    await nextTick();
    assert(el.style.display === 'flex', 'after visible=true: display restored to flex');
    el.remove();
  }

  // ── Test 10: k-if (initially true) ──
  console.log('Test 10: k-if (initially true)');
  {
    const show = signal(true);
    const tpl = html`<div id="t10" k-if="${show}">Test 10</div>`;
    const inst = render(tpl, container);
    const el = container.querySelector('#t10');
    assert(el !== null && container.contains(el), 'initial: element in DOM');
    assert(inst.parts.length > 0, 'render instance has parts');
    show.value = false;
    flushJobs();
    await nextTick();
    const elAfter = container.querySelector('#t10');
    assert(elAfter === null, 'after show=false: element NOT in DOM');
    show.value = true;
    flushJobs();
    await nextTick();
    const elRestored = container.querySelector('#t10');
    assert(elRestored !== null && container.contains(elRestored), 'after show=true: element back in DOM');
    elRestored?.remove();
  }

  // ── Test 11: k-if (initially false) ──
  console.log('Test 11: k-if (initially false)');
  {
    const show = signal(false);
    const tpl = html`<div id="t11" k-if="${show}">Test 11</div>`;
    render(tpl, container);
    assert(container.querySelector('#t11') === null, 'initial: element NOT in DOM');
    show.value = true;
    flushJobs();
    await nextTick();
    const el = container.querySelector('#t11');
    assert(el !== null && container.contains(el), 'after show=true: element in DOM');
    show.value = false;
    flushJobs();
    await nextTick();
    assert(container.querySelector('#t11') === null, 'after show=false: element removed again');
  }

  // ── Test 12: k-if with function ──
  console.log('Test 12: k-if with function');
  {
    const count = signal(0);
    const tpl = html`<div id="t12" k-if="${() => count.value > 0}">Test 12</div>`;
    render(tpl, container);
    assert(container.querySelector('#t12') === null, 'initial: NOT in DOM (count=0)');
    count.value = 1;
    flushJobs();
    await nextTick();
    assert(container.querySelector('#t12') !== null, 'after count=1: in DOM');
    count.value = 0;
    flushJobs();
    await nextTick();
    assert(container.querySelector('#t12') === null, 'after count=0: removed');
  }

  // ── Test 13: k-style with signal object ──
  console.log('Test 13: k-style with signal object');
  {
    const styles = signal({ color: 'red', 'font-size': '14px' });
    const tpl = html`<div id="t13" k-style="${styles}">Test 13</div>`;
    render(tpl, container);
    const el = container.querySelector('#t13');
    assert(el.style.color === 'red', 'initial color: red');
    assert(el.style.fontSize === '14px', 'initial fontSize: 14px');
    styles.value = { color: 'blue', 'font-weight': 'bold' };
    await nextTick();
    assert(el.style.color === 'blue', 'after update: color=blue');
    assert(el.style.fontSize === '', 'font-size removed');
    assert(el.style.fontWeight === 'bold', 'font-weight added');
    el.remove();
  }

  // ── Test 14: k-style with computed ──
  console.log('Test 14: k-style with computed');
  {
    const color = signal('green');
    const size = signal(12);
    const styleObj = computed(() => ({ color: color.value, 'font-size': `${size.value}px` }));
    const tpl = html`<div id="t14" k-style="${styleObj}">Test 14</div>`;
    render(tpl, container);
    const el = container.querySelector('#t14');
    assert(el.style.color === 'green', 'initial color: green');
    assert(el.style.fontSize === '12px', 'initial fontSize: 12px');
    color.value = 'purple';
    size.value = 16;
    await nextTick();
    assert(el.style.color === 'purple', 'after update: color=purple');
    assert(el.style.fontSize === '16px', 'after update: fontSize=16px');
    el.remove();
  }

  // ── Test 15: k-style with function ──
  console.log('Test 15: k-style with function');
  {
    const active = signal(false);
    const tpl = html`<div id="t15" k-style="${() => ({ color: active.value ? 'red' : 'gray' })}">Test 15</div>`;
    render(tpl, container);
    const el = container.querySelector('#t15');
    assert(el.style.color === 'gray', 'initial color: gray');
    active.value = true;
    await nextTick();
    assert(el.style.color === 'red', 'after active=true: color=red');
    el.remove();
  }

  // ── Test 16: k-style with null value removes property ──
  console.log('Test 16: k-style with null value removes property');
  {
    const styles = signal({ color: 'red', 'font-size': '14px' });
    const tpl = html`<div id="t16" k-style="${styles}">Test 16</div>`;
    render(tpl, container);
    const el = container.querySelector('#t16');
    assert(el.style.color === 'red', 'initial color: red');
    styles.value = { color: null, 'font-size': '14px' };
    await nextTick();
    assert(el.style.color === '', 'after color=null: color removed');
    assert(el.style.fontSize === '14px', 'font-size still present');
    el.remove();
  }

  // ── Test 17: Multiple directives on same element ──
  console.log('Test 17: Multiple directives on same element');
  {
    const active = signal(false);
    const visible = signal(true);
    const tpl = html`<div id="t17" class="card" k-class="${() => active.value ? 'is-active' : ''}" k-show="${visible}">Test 17</div>`;
    render(tpl, container);
    const el = container.querySelector('#t17');
    assert(el.classList.contains('is-active') === false, 'initial: is-active NOT present');
    assert(el.style.display === '', 'initial: visible');
    active.value = true;
    visible.value = false;
    await nextTick();
    assert(el.classList.contains('is-active') === true, 'is-active added');
    assert(el.style.display === 'none', 'hidden');
    active.value = false;
    visible.value = true;
    await nextTick();
    assert(el.classList.contains('is-active') === false, 'is-active removed');
    assert(el.style.display === '', 'visible again');
    el.remove();
  }

  // ── Test 18: k-if and k-show combined (k-if dominant) ──
  console.log('Test 18: k-if and k-show combined');
  {
    const show = signal(true);
    const visible = signal(false);
    const tpl = html`<div id="t18" k-if="${show}" k-show="${visible}">Test 18</div>`;
    render(tpl, container);
    const el = container.querySelector('#t18');
    assert(el !== null, 'element in DOM');
    assert(el.style.display === 'none', 'hidden by k-show');
    show.value = false;
    flushJobs();
    await nextTick();
    assert(container.querySelector('#t18') === null, 'removed from DOM by k-if');
    show.value = true;
    flushJobs();
    await nextTick();
    const el2 = container.querySelector('#t18');
    assert(el2 !== null, 'back in DOM');
    assert(el2.style.display === 'none', 'still hidden by k-show');
    visible.value = true;
    await nextTick();
    assert(el2.style.display === '', 'now visible');
    el2?.remove();
  }

  // ── Test 19: Instance destroy cleans up parts ──
  console.log('Test 19: Instance destroy cleans up parts');
  {
    const active = signal('');
    const visible = signal(true);
    const tpl = html`<div id="t19" k-class="${active}" k-show="${visible}">Test 19</div>`;
    const inst = render(tpl, container);
    const el = container.querySelector('#t19');
    assert(el !== null, 'element rendered');
    assert(inst.parts.length === 2, '2 parts registered');
    active.value = 'is-active';
    await nextTick();
    assert(el.classList.contains('is-active'), 'class directive works');
    inst.destroy();
    // After destroy, signals should not affect the element
    active.value = '';
    visible.value = false;
    await nextTick();
    // Element should remain as-is after destroy (no crash)
    console.log('    (destroyed instance, no crash expected)');
    el.remove();
  }

  // ── Summary ──
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) { process.exit(1); }
}

run().catch(e => { console.error(e); process.exit(1); });
