// Type definitions for @kupola/ai-adapter

export interface AIAdapterOptions {
  ai?: (prompt: string, context: AIContext) => Promise<ParsedCommand>;
  parser?: RuleBasedParser;
  maxContext?: number;
  maxMessages?: number;
  query?: QueryEngineOptions;
  action?: ActionEngineOptions;
  flow?: FlowEngineOptions;
  bus?: EventBus;
}

export interface AIContext {
  history?: Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  [key: string]: any;
}

export interface ParsedCommand {
  engine: 'query' | 'action' | 'flow' | 'unknown';
  type: string;
  params: Record<string, any>;
  confidence?: number;
  missingSlots?: string[];
  slotQuestion?: string;
}

export interface ProcessResult {
  type: string;
  engine: string;
  result: any;
  message: string;
  confidence?: number;
}

export interface Message {
  role: 'user' | 'system' | 'suggestion';
  text: string;
  timestamp: number;
}

export interface DevToolsSnapshot {
  version: string;
  messages: Message[];
  middlewares: number;
  query: { registered: number; history: number; cache: number };
  action: { registered: number; undoStack: number; audit: number };
  flow: { defined: number; executions: number };
  events: string[];
}

export declare class AIAdapter {
  query: QueryEngine;
  action: ActionEngine;
  flow: FlowEngine;
  parser: IntentParser;
  bus: EventBus;

  constructor(options?: AIAdapterOptions);

  process(input: string, context?: Record<string, any>): Promise<ProcessResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  getPanelHTML(): string;
  getMessages(): Message[];
  clearConversation(): void;
  getDevToolsSnapshot(): DevToolsSnapshot;

  // EventBus proxy methods
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): () => void;
  wildcard(pattern: string, callback: (eventName: string, data: any) => void): () => void;

  use(middleware: (ctx: any, next: () => Promise<void>) => Promise<void>): AIAdapter;
}

// ── EventBus ──────────────────────────────────────────────

export declare class EventBus {
  constructor();
  on(event: string, fn: Function): () => void;
  off(event: string, fn: Function): void;
  emit(event: string, data?: any): void;
  once(event: string, fn: Function): () => void;
  wildcard(pattern: string, fn: (eventName: string, data: any) => void): () => void;
  removeAll(): void;
  listenerCount(event: string): number;
  eventNames(): string[];
}

// ── QueryEngine ──────────────────────────────────────────

export interface QueryEngineOptions {
  maxHistory?: number;
  cacheTTL?: number;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  summary?: string;
  table?: { columns: Array<{ field: string; title: string }>; rows: any[] };
  error?: string;
  available?: string[];
  cached?: boolean;
  paginated?: { total: number; page: number; pageSize: number; pages: number };
}

export declare class QueryEngine {
  constructor(options?: QueryEngineOptions);
  register(name: string, handler: (params: any, context?: any) => Promise<any>): void;
  execute(command: ParsedCommand): Promise<QueryResult>;
  getLastResult(): any;
  clearHistory(): void;
  followUp(input: string, handler: (params: any) => Promise<any>): void;
  aggregate(type: string, field: string, data: any[]): any;
}

// ── ActionEngine ─────────────────────────────────────────

export interface ActionEngineOptions {
  maxUndo?: number;
  requireConfirm?: boolean;
  onConfirm?: (label: string, params: any) => Promise<boolean>;
  retries?: number;
  maxAuditLog?: number;
}

export interface ActionConfig {
  handler: (params: any) => Promise<any>;
  confirm?: boolean;
  undo?: (params: any) => Promise<void>;
  label?: string;
  retries?: number;
  dependsOn?: string[];
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  undoable?: boolean;
  cancelled?: boolean;
  available?: string[];
  suggestion?: FlowSuggestion;
  dependenciesMet?: boolean;
}

export interface AuditEntry {
  action: string;
  params: any;
  status: 'success' | 'failed' | 'cancelled' | 'blocked' | 'undone';
  error?: string | null;
  attempts?: number;
  timestamp: number;
}

export interface FlowSuggestion {
  suggest: boolean;
  pattern?: string;
  count?: number;
  message?: string;
}

export declare class ActionEngine {
  constructor(options?: ActionEngineOptions);
  register(name: string, config: ActionConfig): void;
  execute(command: ParsedCommand, callbacks?: Record<string, Function>): Promise<ActionResult>;
  executeBatch(commands: Array<{ type: string; params: any }>, callbacks?: Record<string, Function>): Promise<{ success: boolean; results: ActionResult[]; failed: number; total: number }>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  canUndo(): boolean;
  getActions(): Array<{ name: string; label: string; confirm: boolean; dependsOn: string[] }>;
  beforeExecute(fn: (actionName: string, params: any) => Promise<void>): () => void;
  afterExecute(fn: (actionName: string, params: any, result: any) => Promise<void>): () => void;
  getAuditLog(filter?: { type?: string; status?: string; limit?: number }): AuditEntry[];
  checkDependencies(type: string): string | null;
}

// ── FlowEngine ───────────────────────────────────────────

export interface FlowEngineOptions {
  storage?: { get(): any; set(data: any): void };
  autoLearnThreshold?: number;
}

export interface FlowStep {
  label?: string;
  action?: string;
  params?: Record<string, any>;
  handler?: (data: any, previousResults: any[]) => Promise<any>;
  condition?: (data: any, results: any[]) => boolean;
  parallel?: FlowStep[];
  flow?: string;
}

export interface FlowConfig {
  steps: FlowStep[];
  description?: string;
  variables?: string[];
}

export interface FlowResult {
  success: boolean;
  results?: Array<{ step: string; success: boolean; data?: any; error?: string }>;
  logs?: Array<{ step: string; status: string; timestamp: number; error?: string }>;
  error?: string;
  available?: string[];
  failedAt?: number;
}

export declare class FlowEngine {
  constructor(options?: FlowEngineOptions);
  define(name: string, config: FlowConfig): any;
  execute(name: string, data?: Record<string, any>, callbacks?: Record<string, Function>, options?: { resumeAt?: number }): Promise<FlowResult>;
  resume(name: string, data?: Record<string, any>, failedAt: number, callbacks?: Record<string, Function>): Promise<FlowResult>;
  remove(name: string): boolean;
  list(): Array<{ name: string; description: string; steps: number; variables: string[]; executionCount: number }>;
  trackAction(command: ParsedCommand): FlowSuggestion;
  clearHistory(): void;
}

// ── IntentParser ─────────────────────────────────────────

export declare class IntentParser {
  constructor(options?: { ai?: Function; fallback?: RuleBasedParser; maxContext?: number });
  parse(input: string, extraContext?: Record<string, any>): Promise<ParsedCommand & { raw: string }>;
  clearContext(): void;
  getHistory(): Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  defineSlots(intent: string, slots: Array<{ name: string; required: boolean; prompt?: string }>): void;
}

export declare class RuleBasedParser {
  constructor();
  addRule(pattern: RegExp, builder: (matches: RegExpMatchArray, context: any) => ParsedCommand): void;
  parse(input: string, context?: Record<string, any>): ParsedCommand;
  static createDefault(): RuleBasedParser;
}

// ── Built-in Middlewares ─────────────────────────────────

export interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface DevToolsLoggerOptions {
  maxEntries?: number;
}

export interface AuthGuardOptions {
  restrictedTypes?: string[];
  roleField?: string;
  allowedRoles?: string[];
}

export declare function createRateLimiter(options?: RateLimiterOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createDevToolsLogger(options?: DevToolsLoggerOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createAuthGuard(options?: AuthGuardOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;

// ── UI Components ────────────────────────────────────────

export interface AIPanelOptions {
  title?: string;
  width?: string;
  height?: string;
  placeholder?: string;
  showTimestamp?: boolean;
}

export declare class AIPanel {
  adapter: AIAdapter;
  options: AIPanelOptions;
  constructor(adapter: AIAdapter, options?: AIPanelOptions);
  mount(parent: HTMLElement): AIPanel;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  addMessage(role: string, text: string, actions?: Array<{ label: string; action: () => void }>): void;
}

export interface AIDashboardOptions {
  refreshInterval?: number;
  columns?: string;
}

export interface DashboardCardConfig {
  label?: string;
  aggregate?: string;
  params?: Record<string, any>;
  icon?: string;
}

export declare class AIDashboard {
  adapter: AIAdapter;
  cards: Map<string, any>;
  constructor(adapter: AIAdapter, options?: AIDashboardOptions);
  addCard(name: string, queryType: string, config?: DashboardCardConfig): AIDashboard;
  removeCard(name: string): AIDashboard;
  mount(parent: HTMLElement): AIDashboard;
  refresh(name: string): Promise<void>;
  refreshAll(): Promise<void>;
  destroy(): void;
}

export interface VoiceControllerOptions {
  lang?: string;
  wakeWord?: string;
  commandMap?: Record<string, string>;
  continuous?: boolean;
  tts?: boolean;
  silenceMs?: number;
}

export declare class VoiceController {
  adapter: AIAdapter;
  options: VoiceControllerOptions;
  readonly supported: boolean;
  readonly isListening: boolean;
  readonly isAwake: boolean;
  constructor(adapter: AIAdapter, options?: VoiceControllerOptions);
  start(): VoiceController;
  stop(): VoiceController;
  onWake(fn: () => void): () => void;
  onResult(fn: (text: string, result: any) => void): () => void;
  onError(fn: (error: string) => void): () => void;
  speak(text: string, options?: { lang?: string; rate?: number; pitch?: number }): void;
  destroy(): void;
}
// Type definitions for @kupola/ai-adapter

export interface AIAdapterOptions {
  ai?: (prompt: string, context: AIContext) => Promise<ParsedCommand>;
  parser?: RuleBasedParser;
  maxContext?: number;
  maxMessages?: number;
  query?: QueryEngineOptions;
  action?: ActionEngineOptions;
  flow?: FlowEngineOptions;
  bus?: EventBus;
}

export interface AIContext {
  history?: Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  [key: string]: any;
}

export interface ParsedCommand {
  engine: 'query' | 'action' | 'flow' | 'unknown';
  type: string;
  params: Record<string, any>;
  confidence?: number;
  missingSlots?: string[];
  slotQuestion?: string;
}

export interface ProcessResult {
  type: string;
  engine: string;
  result: any;
  message: string;
  confidence?: number;
}

export interface Message {
  role: 'user' | 'system' | 'suggestion';
  text: string;
  timestamp: number;
}

export interface DevToolsSnapshot {
  version: string;
  messages: Message[];
  middlewares: number;
  query: { registered: number; history: number; cache: number };
  action: { registered: number; undoStack: number; audit: number };
  flow: { defined: number; executions: number };
  events: string[];
}

export declare class AIAdapter {
  query: QueryEngine;
  action: ActionEngine;
  flow: FlowEngine;
  parser: IntentParser;
  bus: EventBus;

  constructor(options?: AIAdapterOptions);

  process(input: string, context?: Record<string, any>): Promise<ProcessResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  getPanelHTML(): string;
  getMessages(): Message[];
  clearConversation(): void;
  getDevToolsSnapshot(): DevToolsSnapshot;

  // EventBus proxy methods
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): () => void;
  wildcard(pattern: string, callback: (eventName: string, data: any) => void): () => void;

  use(middleware: (ctx: any, next: () => Promise<void>) => Promise<void>): AIAdapter;
}

// ── EventBus ──────────────────────────────────────────────

export declare class EventBus {
  constructor();
  on(event: string, fn: Function): () => void;
  off(event: string, fn: Function): void;
  emit(event: string, data?: any): void;
  once(event: string, fn: Function): () => void;
  wildcard(pattern: string, fn: (eventName: string, data: any) => void): () => void;
  removeAll(): void;
  listenerCount(event: string): number;
  eventNames(): string[];
}

// ── QueryEngine ──────────────────────────────────────────

export interface QueryEngineOptions {
  maxHistory?: number;
  cacheTTL?: number;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  summary?: string;
  table?: { columns: Array<{ field: string; title: string }>; rows: any[] };
  error?: string;
  available?: string[];
  cached?: boolean;
  paginated?: { total: number; page: number; pageSize: number; pages: number };
}

export declare class QueryEngine {
  constructor(options?: QueryEngineOptions);
  register(name: string, handler: (params: any, context?: any) => Promise<any>): void;
  execute(command: ParsedCommand): Promise<QueryResult>;
  getLastResult(): any;
  clearHistory(): void;
  followUp(input: string, handler: (params: any) => Promise<any>): void;
  aggregate(type: string, field: string, data: any[]): any;
}

// ── ActionEngine ─────────────────────────────────────────

export interface ActionEngineOptions {
  maxUndo?: number;
  requireConfirm?: boolean;
  onConfirm?: (label: string, params: any) => Promise<boolean>;
  retries?: number;
  maxAuditLog?: number;
}

export interface ActionConfig {
  handler: (params: any) => Promise<any>;
  confirm?: boolean;
  undo?: (params: any) => Promise<void>;
  label?: string;
  retries?: number;
  dependsOn?: string[];
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  undoable?: boolean;
  cancelled?: boolean;
  available?: string[];
  suggestion?: FlowSuggestion;
  dependenciesMet?: boolean;
}

export interface AuditEntry {
  action: string;
  params: any;
  status: 'success' | 'failed' | 'cancelled' | 'blocked' | 'undone';
  error?: string | null;
  attempts?: number;
  timestamp: number;
}

export interface FlowSuggestion {
  suggest: boolean;
  pattern?: string;
  count?: number;
  message?: string;
}

export declare class ActionEngine {
  constructor(options?: ActionEngineOptions);
  register(name: string, config: ActionConfig): void;
  execute(command: ParsedCommand, callbacks?: Record<string, Function>): Promise<ActionResult>;
  executeBatch(commands: Array<{ type: string; params: any }>, callbacks?: Record<string, Function>): Promise<{ success: boolean; results: ActionResult[]; failed: number; total: number }>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  canUndo(): boolean;
  getActions(): Array<{ name: string; label: string; confirm: boolean; dependsOn: string[] }>;
  beforeExecute(fn: (actionName: string, params: any) => Promise<void>): () => void;
  afterExecute(fn: (actionName: string, params: any, result: any) => Promise<void>): () => void;
  getAuditLog(filter?: { type?: string; status?: string; limit?: number }): AuditEntry[];
  checkDependencies(type: string): string | null;
}

// ── FlowEngine ───────────────────────────────────────────

export interface FlowEngineOptions {
  storage?: { get(): any; set(data: any): void };
  autoLearnThreshold?: number;
}

export interface FlowStep {
  label?: string;
  action?: string;
  params?: Record<string, any>;
  handler?: (data: any, previousResults: any[]) => Promise<any>;
  condition?: (data: any, results: any[]) => boolean;
  parallel?: FlowStep[];
  flow?: string;
}

export interface FlowConfig {
  steps: FlowStep[];
  description?: string;
  variables?: string[];
}

export interface FlowResult {
  success: boolean;
  results?: Array<{ step: string; success: boolean; data?: any; error?: string }>;
  logs?: Array<{ step: string; status: string; timestamp: number; error?: string }>;
  error?: string;
  available?: string[];
  failedAt?: number;
}

export declare class FlowEngine {
  constructor(options?: FlowEngineOptions);
  define(name: string, config: FlowConfig): any;
  execute(name: string, data?: Record<string, any>, callbacks?: Record<string, Function>, options?: { resumeAt?: number }): Promise<FlowResult>;
  resume(name: string, data?: Record<string, any>, failedAt: number, callbacks?: Record<string, Function>): Promise<FlowResult>;
  remove(name: string): boolean;
  list(): Array<{ name: string; description: string; steps: number; variables: string[]; executionCount: number }>;
  trackAction(command: ParsedCommand): FlowSuggestion;
  clearHistory(): void;
}

// ── IntentParser ─────────────────────────────────────────

export declare class IntentParser {
  constructor(options?: { ai?: Function; fallback?: RuleBasedParser; maxContext?: number });
  parse(input: string, extraContext?: Record<string, any>): Promise<ParsedCommand & { raw: string }>;
  clearContext(): void;
  getHistory(): Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  defineSlots(intent: string, slots: Array<{ name: string; required: boolean; prompt?: string }>): void;
}

export declare class RuleBasedParser {
  constructor();
  addRule(pattern: RegExp, builder: (matches: RegExpMatchArray, context: any) => ParsedCommand): void;
  parse(input: string, context?: Record<string, any>): ParsedCommand;
  static createDefault(): RuleBasedParser;
}

// ── Built-in Middlewares ─────────────────────────────────

export interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface DevToolsLoggerOptions {
  maxEntries?: number;
}

export interface AuthGuardOptions {
  restrictedTypes?: string[];
  roleField?: string;
  allowedRoles?: string[];
}

export declare function createRateLimiter(options?: RateLimiterOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createDevToolsLogger(options?: DevToolsLoggerOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createAuthGuard(options?: AuthGuardOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;

// ── UI Components ────────────────────────────────────────

export interface AIPanelOptions {
  title?: string;
  width?: string;
  height?: string;
  placeholder?: string;
  showTimestamp?: boolean;
}

export declare class AIPanel {
  constructor(adapter: AIAdapter, options?: AIPanelOptions);
  mount(parent: HTMLElement): AIPanel;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  addMessage(role: string, text: string, actions?: Array<{ label: string; action: () => void }>): void;
}

export interface AIDashboardOptions {
  refreshInterval?: number;
  columns?: string;
}

export interface DashboardCardConfig {
  label?: string;
  aggregate?: string;
  params?: Record<string, any>;
  icon?: string;
}

export declare class AIDashboard {
  constructor(adapter: AIAdapter, options?: AIDashboardOptions);
  addCard(name: string, queryType: string, config?: DashboardCardConfig): AIDashboard;
  removeCard(name: string): AIDashboard;
  mount(parent: HTMLElement): AIDashboard;
  refresh(name: string): Promise<void>;
  refreshAll(): Promise<void>;
  destroy(): void;
}

export interface VoiceControllerOptions {
  lang?: string;
  wakeWord?: string;
  commandMap?: Record<string, string>;
  continuous?: boolean;
  tts?: boolean;
  silenceMs?: number;
}

export declare class VoiceController {
  constructor(adapter: AIAdapter, options?: VoiceControllerOptions);
  readonly supported: boolean;
  readonly isListening: boolean;
  readonly isAwake: boolean;
  start(): VoiceController;
  stop(): VoiceController;
  onWake(fn: () => void): () => void;
  onResult(fn: (text: string, result: any) => void): () => void;
  onError(fn: (error: string) => void): () => void;
  speak(text: string, options?: { lang?: string; rate?: number; pitch?: number }): void;
  destroy(): void;
}
// Type definitions for @kupola/ai-adapter

export interface AIAdapterOptions {
  ai?: (prompt: string, context: AIContext) => Promise<ParsedCommand>;
  parser?: RuleBasedParser;
  maxContext?: number;
  maxMessages?: number;
  query?: QueryEngineOptions;
  action?: ActionEngineOptions;
  flow?: FlowEngineOptions;
  bus?: EventBus;
}

export interface AIContext {
  history?: Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  [key: string]: any;
}

export interface ParsedCommand {
  engine: 'query' | 'action' | 'flow' | 'unknown';
  type: string;
  params: Record<string, any>;
  confidence?: number;
  missingSlots?: string[];
  slotQuestion?: string;
}

export interface ProcessResult {
  type: string;
  engine: string;
  result: any;
  message: string;
  confidence?: number;
}

export interface Message {
  role: 'user' | 'system' | 'suggestion';
  text: string;
  timestamp: number;
}

export interface DevToolsSnapshot {
  version: string;
  messages: Message[];
  middlewares: number;
  query: { registered: number; history: number; cache: number };
  action: { registered: number; undoStack: number; audit: number };
  flow: { defined: number; executions: number };
  events: string[];
}

export declare class AIAdapter {
  query: QueryEngine;
  action: ActionEngine;
  flow: FlowEngine;
  parser: IntentParser;
  bus: EventBus;

  constructor(options?: AIAdapterOptions);

  process(input: string, context?: Record<string, any>): Promise<ProcessResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  getPanelHTML(): string;
  getMessages(): Message[];
  clearConversation(): void;
  getDevToolsSnapshot(): DevToolsSnapshot;

  // EventBus proxy methods
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): () => void;
  wildcard(pattern: string, callback: (eventName: string, data: any) => void): () => void;

  use(middleware: (ctx: any, next: () => Promise<void>) => Promise<void>): AIAdapter;
}

// ── EventBus ──────────────────────────────────────────────

export declare class EventBus {
  constructor();
  on(event: string, fn: Function): () => void;
  off(event: string, fn: Function): void;
  emit(event: string, data?: any): void;
  once(event: string, fn: Function): () => void;
  wildcard(pattern: string, fn: (eventName: string, data: any) => void): () => void;
  removeAll(): void;
  listenerCount(event: string): number;
  eventNames(): string[];
}

// ── QueryEngine ──────────────────────────────────────────

export interface QueryEngineOptions {
  maxHistory?: number;
  cacheTTL?: number;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  summary?: string;
  table?: { columns: Array<{ field: string; title: string }>; rows: any[] };
  error?: string;
  available?: string[];
  cached?: boolean;
  paginated?: { total: number; page: number; pageSize: number; pages: number };
}

export declare class QueryEngine {
  constructor(options?: QueryEngineOptions);
  register(name: string, handler: (params: any, context?: any) => Promise<any>): void;
  execute(command: ParsedCommand): Promise<QueryResult>;
  getLastResult(): any;
  clearHistory(): void;
  followUp(input: string, handler: (params: any) => Promise<any>): void;
  aggregate(type: string, field: string, data: any[]): any;
}

// ── ActionEngine ─────────────────────────────────────────

export interface ActionEngineOptions {
  maxUndo?: number;
  requireConfirm?: boolean;
  onConfirm?: (label: string, params: any) => Promise<boolean>;
  retries?: number;
  maxAuditLog?: number;
}

export interface ActionConfig {
  handler: (params: any) => Promise<any>;
  confirm?: boolean;
  undo?: (params: any) => Promise<void>;
  label?: string;
  retries?: number;
  dependsOn?: string[];
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  undoable?: boolean;
  cancelled?: boolean;
  available?: string[];
  suggestion?: FlowSuggestion;
  dependenciesMet?: boolean;
}

export interface AuditEntry {
  action: string;
  params: any;
  status: 'success' | 'failed' | 'cancelled' | 'blocked' | 'undone';
  error?: string | null;
  attempts?: number;
  timestamp: number;
}

export interface FlowSuggestion {
  suggest: boolean;
  pattern?: string;
  count?: number;
  message?: string;
}

export declare class ActionEngine {
  constructor(options?: ActionEngineOptions);
  register(name: string, config: ActionConfig): void;
  execute(command: ParsedCommand, callbacks?: Record<string, Function>): Promise<ActionResult>;
  executeBatch(commands: Array<{ type: string; params: any }>, callbacks?: Record<string, Function>): Promise<{ success: boolean; results: ActionResult[]; failed: number; total: number }>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  canUndo(): boolean;
  getActions(): Array<{ name: string; label: string; confirm: boolean; dependsOn: string[] }>;
  beforeExecute(fn: (actionName: string, params: any) => Promise<void>): () => void;
  afterExecute(fn: (actionName: string, params: any, result: any) => Promise<void>): () => void;
  getAuditLog(filter?: { type?: string; status?: string; limit?: number }): AuditEntry[];
  checkDependencies(type: string): string | null;
}

// ── FlowEngine ───────────────────────────────────────────

export interface FlowEngineOptions {
  storage?: { get(): any; set(data: any): void };
  autoLearnThreshold?: number;
}

export interface FlowStep {
  label?: string;
  action?: string;
  params?: Record<string, any>;
  handler?: (data: any, previousResults: any[]) => Promise<any>;
  condition?: (data: any, results: any[]) => boolean;
  parallel?: FlowStep[];
  flow?: string;
}

export interface FlowConfig {
  steps: FlowStep[];
  description?: string;
  variables?: string[];
}

export interface FlowResult {
  success: boolean;
  results?: Array<{ step: string; success: boolean; data?: any; error?: string }>;
  logs?: Array<{ step: string; status: string; timestamp: number; error?: string }>;
  error?: string;
  available?: string[];
  failedAt?: number;
}

export declare class FlowEngine {
  constructor(options?: FlowEngineOptions);
  define(name: string, config: FlowConfig): any;
  execute(name: string, data?: Record<string, any>, callbacks?: Record<string, Function>, options?: { resumeAt?: number }): Promise<FlowResult>;
  resume(name: string, data?: Record<string, any>, failedAt: number, callbacks?: Record<string, Function>): Promise<FlowResult>;
  remove(name: string): boolean;
  list(): Array<{ name: string; description: string; steps: number; variables: string[]; executionCount: number }>;
  trackAction(command: ParsedCommand): FlowSuggestion;
  clearHistory(): void;
}

// ── IntentParser ─────────────────────────────────────────

export declare class IntentParser {
  constructor(options?: { ai?: Function; fallback?: RuleBasedParser; maxContext?: number });
  parse(input: string, extraContext?: Record<string, any>): Promise<ParsedCommand & { raw: string }>;
  clearContext(): void;
  getHistory(): Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  defineSlots(intent: string, slots: Array<{ name: string; required: boolean; prompt?: string }>): void;
}

export declare class RuleBasedParser {
  constructor();
  addRule(pattern: RegExp, builder: (matches: RegExpMatchArray, context: any) => ParsedCommand): void;
  parse(input: string, context?: Record<string, any>): ParsedCommand;
  static createDefault(): RuleBasedParser;
}

// ── Built-in Middlewares ─────────────────────────────────

export interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface DevToolsLoggerOptions {
  maxEntries?: number;
}

export interface AuthGuardOptions {
  restrictedTypes?: string[];
  roleField?: string;
  allowedRoles?: string[];
}

export declare function createRateLimiter(options?: RateLimiterOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createDevToolsLogger(options?: DevToolsLoggerOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createAuthGuard(options?: AuthGuardOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
// Type definitions for @kupola/ai-adapter

export interface AIAdapterOptions {
  ai?: (prompt: string, context: AIContext) => Promise<ParsedCommand>;
  parser?: RuleBasedParser;
  maxContext?: number;
  maxMessages?: number;
  query?: QueryEngineOptions;
  action?: ActionEngineOptions;
  flow?: FlowEngineOptions;
}

export interface AIContext {
  history?: Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  [key: string]: any;
}

export interface ParsedCommand {
  engine: 'query' | 'action' | 'flow' | 'unknown';
  type: string;
  params: Record<string, any>;
}

export interface ProcessResult {
  type: string;
  engine: string;
  result: any;
  message: string;
}

export interface Message {
  role: 'user' | 'system' | 'suggestion';
  text: string;
  timestamp: number;
}

export declare class AIAdapter {
  query: QueryEngine;
  action: ActionEngine;
  flow: FlowEngine;
  parser: IntentParser;

  constructor(options?: AIAdapterOptions);

  process(input: string, context?: Record<string, any>): Promise<ProcessResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  getPanelHTML(): string;
  getMessages(): Message[];
  clearConversation(): void;
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
}

export interface QueryEngineOptions {
  maxHistory?: number;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  summary?: string;
  table?: { columns: Array<{ field: string; title: string }>; rows: any[] };
  error?: string;
  available?: string[];
}

export declare class QueryEngine {
  constructor(options?: QueryEngineOptions);
  register(name: string, handler: (params: any, context?: any) => Promise<any>): void;
  execute(command: ParsedCommand): Promise<QueryResult>;
  getLastResult(): any;
  clearHistory(): void;
}

export interface ActionEngineOptions {
  maxUndo?: number;
  requireConfirm?: boolean;
  onConfirm?: (label: string, params: any) => Promise<boolean>;
}

export interface ActionConfig {
  handler: (params: any) => Promise<any>;
  confirm?: boolean;
  undo?: (params: any) => Promise<void>;
  label?: string;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  undoable?: boolean;
  cancelled?: boolean;
  available?: string[];
  suggestion?: FlowSuggestion;
}

export interface FlowSuggestion {
  suggest: boolean;
  pattern?: string;
  count?: number;
  message?: string;
}

export declare class ActionEngine {
  constructor(options?: ActionEngineOptions);
  register(name: string, config: ActionConfig): void;
  execute(command: ParsedCommand, callbacks?: Record<string, Function>): Promise<ActionResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  canUndo(): boolean;
  getActions(): Array<{ name: string; label: string; confirm: boolean }>;
}

export interface FlowEngineOptions {
  storage?: { get(): any; set(data: any): void };
  autoLearnThreshold?: number;
}

export interface FlowStep {
  label?: string;
  action?: string;
  params?: Record<string, any>;
  handler?: (data: any, previousResults: any[]) => Promise<any>;
}

export interface FlowConfig {
  steps: FlowStep[];
  description?: string;
  variables?: string[];
}

export interface FlowResult {
  success: boolean;
  results?: Array<{ step: string; success: boolean; data?: any; error?: string }>;
  logs?: Array<{ step: string; status: string; timestamp: number; error?: string }>;
  error?: string;
  available?: string[];
  failedAt?: number;
}

export declare class FlowEngine {
  constructor(options?: FlowEngineOptions);
  define(name: string, config: FlowConfig): any;
  execute(name: string, data?: Record<string, any>, callbacks?: Record<string, Function>): Promise<FlowResult>;
  remove(name: string): boolean;
  list(): Array<{ name: string; description: string; steps: number; variables: string[]; executionCount: number }>;
  trackAction(command: ParsedCommand): FlowSuggestion;
  clearHistory(): void;
}

export declare class IntentParser {
  constructor(options?: { ai?: Function; fallback?: RuleBasedParser; maxContext?: number });
  parse(input: string, extraContext?: Record<string, any>): Promise<ParsedCommand & { raw: string }>;
  clearContext(): void;
  getHistory(): Array<{ input: string; command: ParsedCommand; timestamp: number }>;
}

export declare class RuleBasedParser {
  constructor();
  addRule(pattern: RegExp, builder: (matches: RegExpMatchArray, context: any) => ParsedCommand): void;
  parse(input: string, context?: Record<string, any>): ParsedCommand;
  static createDefault(): RuleBasedParser;
}
