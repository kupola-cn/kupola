// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — VoiceController
 *
 * Voice interaction for AI Adapter using Web Speech API.
 *
 * Features:
 * - Wake word detection (e.g. "小库")
 * - Voice command mapping (specific phrases → process() input)
 * - Continuous listening with auto-restart
 * - TTS (Text-to-Speech) for result playback
 *
 * Browser support: Chrome, Edge (Chromium-based).
 * Falls back gracefully on unsupported browsers.
 *
 * Usage:
 *   import { VoiceController } from '@kupola/ai-adapter/voice';
 *
 *   const voice = new VoiceController(adapter, {
 *     wakeWord: '小库',
 *     commandMap: {
 *       '发工资': '执行 发工资条',
 *       '查出勤': '查询 出勤',
 *     },
 *   });
 *
 *   voice.start();
 *   voice.onWake(() => console.log('Activated!'));
 */

export class VoiceController {
  /**
   * @param {import('./ai-adapter.js').AIAdapter} adapter
   * @param {object} [options]
   * @param {string} [options.lang]           — speech language (default: 'zh-CN')
   * @param {string} [options.wakeWord]       — wake word to activate command mode
   * @param {object} [options.commandMap]     — { spokenPhrase: processInput }
   * @param {boolean} [options.continuous]    — continuous listening (default: true)
   * @param {boolean} [options.tts]           — enable text-to-speech for results (default: false)
   * @param {number}  [options.silenceMs]     — silence timeout before auto-stop (default: 5000)
   */
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      lang: 'zh-CN',
      wakeWord: '小库',
      commandMap: {},
      continuous: true,
      tts: false,
      silenceMs: 5000,
      ...options,
    };

    this._recognition = null;
    this._isListening = false;
    this._isAwake = false;
    this._wakeCallbacks = [];
    this._resultCallbacks = [];
    this._errorCallbacks = [];
    this._silenceTimer = null;
    this._unsubscribers = [];

    // Check Web Speech API support
    this._SpeechRecognition = _getRecognitionAPI();
    this._supported = !!this._SpeechRecognition;
  }

  /** Whether the browser supports speech recognition. */
  get supported() {
    return this._supported;
  }

  /** Whether the controller is currently listening. */
  get isListening() {
    return this._isListening;
  }

  /** Whether wake word has been detected (command mode active). */
  get isAwake() {
    return this._isAwake;
  }

  /**
   * Start listening for voice input.
   * @returns {VoiceController} this
   */
  start() {
    if (!this._supported) {
      console.warn('[VoiceController] Web Speech API not supported in this browser.');
      return this;
    }
    if (this._isListening) return this;

    this._recognition = new this._SpeechRecognition();
    this._recognition.lang = this.options.lang;
    this._recognition.continuous = this.options.continuous;
    this._recognition.interimResults = true;

    this._recognition.onresult = (event) => this._handleResult(event);
    this._recognition.onerror = (event) => this._handleError(event);
    this._recognition.onend = () => this._handleEnd();

    this._recognition.start();
    this._isListening = true;

    // Subscribe to adapter results for TTS
    if (this.options.tts) {
      const unsub = this.adapter.bus.on('result', ({ result }) => {
        if (result && result.message) {
          this.speak(result.message);
        }
      });
      this._unsubscribers.push(unsub);
    }

    return this;
  }

  /** Stop listening. */
  stop() {
    if (this._recognition) {
      this._isListening = false;
      this._recognition.stop();
      this._recognition = null;
    }
    this._isAwake = false;
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
    return this;
  }

  /**
   * Register a callback for wake word detection.
   * @param {Function} fn — () => void
   * @returns {Function} unsubscribe
   */
  onWake(fn) {
    this._wakeCallbacks.push(fn);
    return () => {
      const idx = this._wakeCallbacks.indexOf(fn);
      if (idx >= 0) this._wakeCallbacks.splice(idx, 1);
    };
  }

  /**
   * Register a callback for recognized commands.
   * @param {Function} fn — (text: string, result: any) => void
   * @returns {Function} unsubscribe
   */
  onResult(fn) {
    this._resultCallbacks.push(fn);
    return () => {
      const idx = this._resultCallbacks.indexOf(fn);
      if (idx >= 0) this._resultCallbacks.splice(idx, 1);
    };
  }

  /**
   * Register a callback for errors.
   * @param {Function} fn — (error: string) => void
   * @returns {Function} unsubscribe
   */
  onError(fn) {
    this._errorCallbacks.push(fn);
    return () => {
      const idx = this._errorCallbacks.indexOf(fn);
      if (idx >= 0) this._errorCallbacks.splice(idx, 1);
    };
  }

  /**
   * Speak text using Text-to-Speech.
   * @param {string} text
   * @param {object} [options]
   */
  speak(text, options = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || this.options.lang;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    window.speechSynthesis.speak(utterance);
  }

  /** Destroy and clean up all listeners. */
  destroy() {
    this.stop();
    this._unsubscribers.forEach(fn => fn());
    this._unsubscribers = [];
    this._wakeCallbacks = [];
    this._resultCallbacks = [];
    this._errorCallbacks = [];
  }

  // ── Private ────────────────────────────────────────────

  _handleResult(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript;
      }
    }

    if (!transcript.trim()) return;

    // Reset silence timer
    this._resetSilenceTimer();

    const text = transcript.trim();

    // Wake word detection
    if (!this._isAwake && text.includes(this.options.wakeWord)) {
      this._isAwake = true;
      for (const cb of this._wakeCallbacks) {
        try { cb(); } catch { /* swallow */ }
      }
      return;
    }

    // Command mapping check
    const mapped = this._findCommand(text);
    if (mapped) {
      this._processCommand(mapped, text);
      return;
    }

    // If awake, process as natural language input
    if (this._isAwake) {
      this._processCommand(text, text);
      this._isAwake = false; // back to sleep after one command
    }
  }

  _findCommand(text) {
    const { commandMap } = this.options;
    for (const [phrase, mapped] of Object.entries(commandMap)) {
      if (text.includes(phrase)) {
        return mapped;
      }
    }
    return null;
  }

  async _processCommand(input, originalText) {
    try {
      const result = await this.adapter.process(input);
      for (const cb of this._resultCallbacks) {
        try { cb(originalText, result); } catch { /* swallow */ }
      }
    } catch (err) {
      for (const cb of this._errorCallbacks) {
        try { cb(err.message); } catch { /* swallow */ }
      }
    }
  }

  _handleError(event) {
    const msg = event.error || 'Unknown speech recognition error';
    for (const cb of this._errorCallbacks) {
      try { cb(msg); } catch { /* swallow */ }
    }

    // Auto-restart on certain errors
    if (['no-speech', 'aborted'].includes(event.error) && this._isListening) {
      // Will restart in _handleEnd
    }
  }

  _handleEnd() {
    if (this._isListening && this.options.continuous) {
      // Auto-restart after brief delay
      setTimeout(() => {
        if (this._isListening && this._recognition) {
          try { this._recognition.start(); } catch { /* already started */ }
        }
      }, 100);
    }
  }

  _resetSilenceTimer() {
    if (this._silenceTimer) clearTimeout(this._silenceTimer);
    if (this.options.silenceMs > 0 && this._isAwake) {
      this._silenceTimer = setTimeout(() => {
        this._isAwake = false; // go back to sleep on silence
      }, this.options.silenceMs);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────

function _getRecognitionAPI() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
