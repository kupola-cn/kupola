# @kupola/core

Core reactivity primitives for Kupola: signals, computed values, effects,
watchers, batching, scopes, and scheduling.

## Install

```bash
npm install @kupola/core
```

## Quick Start

```js
import { signal, computed, effect } from '@kupola/core';

const count = signal(0);
const double = computed(() => count.value * 2);

const stop = effect(() => {
  console.log(count.value, double.value);
});

count.value++;
stop();
```

## Signals

```js
import { signal } from '@kupola/core';

const name = signal('Kupola');
name.value = 'New Name';
console.log(name.value);
console.log(name.peek());
```

Signals use `Object.is` equality. Reading `value` in an effect registers a
dependency; `peek()` does not.

`Signal#toJSON()` returns the underlying value. This keeps native JSON
serialization correct: `JSON.stringify(signal)` serializes the signal value
once. Code that needs a JSON string should call `JSON.stringify(signal.value)`
explicitly; do not parse or stringify the result of `toJSON()` a second time.

## Computed

```js
import { signal, computed } from '@kupola/core';

const first = signal('Jane');
const last = signal('Doe');
const fullName = computed(() => `${first.value} ${last.value}`);
console.log(fullName.value);
```

Computed values are lazy, cached, read-only, and expose `dispose()`.

## Effects and Scopes

```js
import { effect, effectScope, onScopeDispose } from '@kupola/core';

const scope = effectScope();
scope.run(() => {
  effect(() => syncExternalSystem());
  onScopeDispose(() => releaseExternalSystem());
});

scope.stop();
```

An effect may return a cleanup function. Scope cleanup is synchronous.

## Watch

```js
import { reactive, watch } from '@kupola/core';

const state = reactive({ count: 0 });
const stop = watch(
  () => state.count,
  (value, previous, onCleanup) => {
    const request = startRequest(value);
    onCleanup(() => request.cancel());
    console.log(value, previous);
  },
  { immediate: true },
);

state.count++;
stop();
```

Use `{ deep: true }` only when nested change detection is required. Deep watch
tracks nested reactive objects and performs a structural comparison.
Register cancellation with the third `onCleanup` argument before starting an
async task. Reads after an `await` are not tracked by effects.

## Reactive Objects

```js
import { reactive, effect } from '@kupola/core';

const state = reactive({ count: 0, name: 'Kupola' });
const stop = effect(() => console.log(state.count));
state.count++;
stop();
state.dispose();
```

Plain objects and arrays are supported. Date, Map, Set, Promise, typed arrays,
and other built-in objects are returned unchanged. Map and Set can still be
compared by `watch(..., { deep: true })` when a signal value is replaced, but
their in-place mutations are not reactive; wrap mutation state in signals when
needed.

Reactive proxies expose `toRaw()` for integrations that require the original
object identity. The proxy also provides a JSON-compatible `toJSON()` view of
that original object without adding virtual reactivity properties to output.

## Batch and Scheduling

```js
import { signal, effect, batch, createScheduler, nextTick, runWithScheduler } from '@kupola/core';

const a = signal(0);
const b = signal(0);
effect(() => console.log(a.value, b.value));

batch(() => {
  a.value = 1;
  b.value = 2;
});

await nextTick();
```

For multiple independent apps or SSR requests, create one scheduler per owner.
Effects created in `runWithScheduler()` inherit that scheduler, including
effects created later by a parent effect:

```js
const scheduler = createScheduler({ name: 'request-42' });
runWithScheduler(scheduler, () => {
  effect(() => renderRequestState());
});

scheduler.flushJobs();
```

`@kupola/platform` accepts the same scheduler through `render`, `mount`,
`createApp`, or `walk` options. Existing calls without a scheduler continue to
use the shared default queue.

Use `setErrorHandler()` to receive errors from scheduled jobs and synchronous
reactive triggers.

## Platform APIs

DOM templates, rendering, components, context, SSR, and i18n are provided by
`@kupola/platform`, not this package.

The optional profiler is available from `@kupola/core/devtools`.

## API Reference

| API | Description |
| --- | --- |
| `signal(initial)` | Create a signal |
| `computed(fn)` | Create a lazy derived value |
| `effect(fn, options?)` | Run a reactive side effect |
| `effectScope()` | Group effects and cleanups |
| `onScopeDispose(fn)` | Register scoped cleanup |
| `watch(getter, callback, options?)` | Observe a derived value |
| `reactive(object)` | Create a reactive plain object or array |
| `isReactive(value)` | Check for a reactive proxy |
| `toRaw(value)` | Return the original value behind a proxy |
| `withoutTracking(fn)` | Run without collecting dependencies |
| `batch(fn)` | Coalesce synchronous mutations |
| `queueJob(job)` | Schedule a deduplicated job |
| `queuePostJob(job)` | Schedule a post-phase job |
| `flushJobs()` | Flush pending jobs synchronously |
| `nextTick(callback?)` | Run after pending jobs flush |
| `createScheduler(options?)` | Create an isolated scheduler |
| `runWithScheduler(scheduler, fn)` | Bind a scheduler to setup-created effects |
| `setErrorHandler(handler)` | Configure reactive error handling |

## DevTools

Import from `@kupola/core/devtools` for signal/effect profiling:

```js
import { enableProfiler, getProfileReport, printProfileReport, resetProfiler } from '@kupola/core/devtools';

// Enable profiling
enableProfiler();

// After some interactions...
const report = getProfileReport();
printProfileReport();
// Signal stats: { count, reads, writes }
// Effect stats: { count, runs }
// Computed stats: { count, runs, cacheHits }

// Reset profiling data
resetProfiler();
```

In development mode, `window.__KUPOLA_SIGNALS__` provides a global registry
of all active signals, computed values, and effects for debugging.

## License

MIT
