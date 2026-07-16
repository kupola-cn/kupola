// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Public API.
 *
 * AI operation engine for Kupola: natural language → structured commands.
 *
 * Engines:
 * - QueryEngine: read-only data retrieval
 * - ActionEngine: one-time write operations with undo
 * - FlowEngine: repeatable multi-step workflows
 *
 * @module @kupola/ai-adapter
 */

export { AIAdapter } from './ai-adapter.js';
export { QueryEngine } from './query-engine.js';
export { ActionEngine } from './action-engine.js';
export { FlowEngine } from './flow-engine.js';
export { IntentParser, RuleBasedParser } from './intent-parser.js';
