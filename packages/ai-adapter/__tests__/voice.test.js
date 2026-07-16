// SPDX-License-Identifier: MIT
/**
 * VoiceController tests — construction / command mapping / wake word logic
 *
 * Mocks Web Speech API since jsdom doesn't support it natively.
 */

import { AIAdapter } from '../src/ai-adapter.js';
import { VoiceController } from '../src/voice.js';

function createMockStorage() {
  let data = null;
  return { get: () => data, set: (d) => { data = d; } };
}

// Mock SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this._started = false;
  }
  start() { this._started = true; }
  stop() { this._started = false; }
}

describe('VoiceController', () => {
  let adapter;

  beforeEach(() => {
    adapter = new AIAdapter({
      flow: { storage: createMockStorage() },
      action: { requireConfirm: false },
    });
    // Mock Web Speech API
    window.SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    delete window.SpeechRecognition;
  });

  it('should construct with adapter and options', () => {
    const voice = new VoiceController(adapter, {
      wakeWord: '小库',
      commandMap: { '发工资': '执行 发工资条' },
    });

    expect(voice.adapter).toBe(adapter);
    expect(voice.options.wakeWord).toBe('小库');
    expect(voice.supported).toBe(true);
    voice.destroy();
  });

  it('should report unsupported when API is missing', () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    const voice = new VoiceController(adapter);
    expect(voice.supported).toBe(false);
    voice.destroy();
  });

  it('should start and stop listening', () => {
    const voice = new VoiceController(adapter);
    voice.start();
    expect(voice.isListening).toBe(true);

    voice.stop();
    expect(voice.isListening).toBe(false);
    voice.destroy();
  });

  it('should register and call wake callbacks', () => {
    const voice = new VoiceController(adapter, { wakeWord: '小库' });
    const wakeFn = jest.fn();
    voice.onWake(wakeFn);

    // Simulate recognition result with wake word
    voice.start();
    const mockEvent = {
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: '小库' } }],
    };
    voice._recognition.onresult(mockEvent);

    expect(voice.isAwake).toBe(true);
    expect(wakeFn).toHaveBeenCalled();
    voice.destroy();
  });

  it('should map commands from commandMap', () => {
    const voice = new VoiceController(adapter, {
      wakeWord: '小库',
      commandMap: { '发工资': '执行 发工资条' },
    });

    const resultFn = jest.fn();
    voice.onResult(resultFn);

    adapter.query.register('search', async () => []);

    voice.start();

    // First: wake word
    voice._recognition.onresult({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: '小库' } }],
    });
    expect(voice.isAwake).toBe(true);

    // Then: mapped command
    voice._recognition.onresult({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: '发工资' } }],
    });

    // Wait for async process
    return new Promise(r => setTimeout(r, 100)).then(() => {
      expect(resultFn).toHaveBeenCalled();
      voice.destroy();
    });
  });

  it('should unsubscribe onWake callbacks', () => {
    const voice = new VoiceController(adapter);
    const fn = jest.fn();
    const unsub = voice.onWake(fn);
    unsub();
    expect(voice._wakeCallbacks).not.toContain(fn);
    voice.destroy();
  });

  it('should call error callbacks on recognition error', () => {
    const voice = new VoiceController(adapter);
    const errorFn = jest.fn();
    voice.onError(errorFn);

    voice.start();
    voice._recognition.onerror({ error: 'not-allowed' });

    expect(errorFn).toHaveBeenCalledWith('not-allowed');
    voice.destroy();
  });

  it('should destroy cleanly', () => {
    const voice = new VoiceController(adapter, { tts: true });
    voice.start();
    voice.destroy();
    expect(voice.isListening).toBe(false);
    expect(voice._wakeCallbacks).toHaveLength(0);
  });
});
