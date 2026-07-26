// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Public API (v2.0)
 *
 * AI operation engine for Kupola: natural language → structured commands.
 *
 * Engines:
 * - QueryEngine: read-only data retrieval
 * - ActionEngine: one-time write operations with undo
 * - FlowEngine: repeatable multi-step workflows
 *
 * Infrastructure:
 * - EventBus: pub/sub with once() and wildcard() support
 * - Container: dependency injection container
 * - CommandBus: unified command dispatch
 * - AIInfrastructure: infrastructure layer
 *
 * Middleware factories: createRateLimiter, createDevToolsLogger, createAuthGuard
 *
 * UI Components:
 * - AIPanel: full conversation panel with Kupola native components
 * - AIDashboard: data dashboard with stat cards and auto-refresh
 * - VoiceController: Web Speech API voice interaction with wake word
 *
 * @module @kupola/ai-adapter
 */

export { AIAdapter } from './ai-adapter.js';
export { AIInfrastructure } from './infrastructure.js';
export { Container } from './container.js';
export { CommandBus } from './command-bus.js';
export { QueryEngine } from './query-engine.js';
export { ActionEngine } from './action-engine.js';
export { FlowEngine } from './flow-engine.js';
export { IntentParser, RuleBasedParser } from './intent-parser.js';
export { EventBus } from './event-bus.js';
export { CapabilityRegistry, CapabilityError } from './capability-registry.js';
export { CapabilityBuilder } from './capability-builder.js';
export { UnitOfWork } from './unit-of-work.js';
export { SimpleStateMachine } from './state-machine.js';
export { createRateLimiter, createDevToolsLogger, createAuthGuard } from './middlewares.js';
export { AIPanel } from './panel.js';
export { AIDashboard } from './dashboard.js';
export { VoiceController } from './voice.js';
