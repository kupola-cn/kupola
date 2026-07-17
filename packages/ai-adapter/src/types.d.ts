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
  capability?: CapabilityRegistryOptions;
}

export interface AIContext {
  history?: Array<{ input: string; command: ParsedCommand; timestamp: number }>;
  [key: string]: any;
}

export interface ParsedCommand {
  engine: 'query' | 'action' | 'flow' | 'system' | 'unknown';
  type: string;
  params: Record<string, any>;
  confidence?: number;
  raw?: string;
  missingSlots?: string[];
  slotQuestion?: string;
  context?: AIContext;
}

export interface ProcessResult {
  type: string;
  engine: string;
  result?: any;
  message?: string;
  success?: boolean;
  error?: string;
  code?: string;
  denied?: boolean;
  confidence?: number;
}

export interface Message {
  role: 'user' | 'system' | 'suggestion' | string;
  text: string;
  timestamp: number;
}

export interface DevToolsSnapshot {
  version: string;
  messages: Message[];
  middlewares: number;
  query: { registered: number; history: number; cache: number };
  action: { registered: number; undoStack: number; audit: number };
  capability: { registered: number; ai: number };
  flow: { defined: number; executions: number };
  events: string[];
}

export declare class AIAdapter {
  query: QueryEngine;
  action: ActionEngine;
  flow: FlowEngine;
  parser: IntentParser;
  bus: EventBus;
  capability: CapabilityRegistry;

  constructor(options?: AIAdapterOptions);

  process(input: string, context?: Record<string, any>): Promise<ProcessResult>;
  undo(): Promise<{ success: boolean; message?: string; error?: string }>;
  getPanelHTML(): string;
  getMessages(): Message[];
  clearConversation(): void;
  getDevToolsSnapshot(): DevToolsSnapshot;
  use(middleware: (ctx: any, next: () => Promise<void>) => Promise<void>): AIAdapter;

  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): () => void;
  wildcard(pattern: string, callback: (eventName: string, data: any) => void): () => void;
}

// ── Capability Registry ──────────────────────────────────

export interface CapabilityRegistryOptions {
  roleField?: string;
  permissionsField?: string;
  sensitiveFields?: string[];
}

export type CapabilityParamRule =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'any'
  | {
      type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
      required?: boolean;
      default?: any;
      enum?: any[];
      maxLength?: number;
    }
  | any[];

export interface CapabilityConfig {
  engine: 'query' | 'action' | 'flow';
  type: string;
  resource?: string;
  label?: string;
  description?: string;
  roles?: string[];
  allowedRoles?: string[];
  permissions?: string[];
  permission?: string | string[];
  paramsSchema?: string[] | Record<string, CapabilityParamRule>;
  allowUnknownParams?: boolean;
  resultFields?: string[];
  sensitiveFields?: string[];
  exposeToAI?: boolean;
  available?: (context: AIContext) => boolean;
  message?: string;
  confirm?: boolean;
  undo?: (params: any) => Promise<void>;
  retries?: number;
  dependsOn?: string[];
  handler?: (params: any, context?: AIContext) => Promise<any>;
  flow?: FlowConfig;
}

export interface AICapabilityDescription {
  engine: 'query' | 'action' | 'flow';
  type: string;
  resource: string;
  label: string;
  description?: string;
  paramsSchema?: string[] | Record<string, any> | null;
  roles: string[];
  permissions: string[];
  confirm: boolean;
}

export declare class CapabilityRegistry {
  constructor(adapter: AIAdapter, options?: CapabilityRegistryOptions);
  register(config: CapabilityConfig): CapabilityConfig;
  registerMany(configs: CapabilityConfig[]): CapabilityRegistry;
  unregister(engine: string, type: string): boolean;
  get(engine: string, type: string): CapabilityConfig | null;
  has(engine: string, type: string): boolean;
  canAccess(engine: string, type: string, context?: AIContext): boolean;
  list(filter?: { engine?: string; resource?: string }): CapabilityConfig[];
  toAuthRules(): AuthGuardRule[];
  getAICapabilities(context?: AIContext): AICapabilityDescription[];
  middleware(options?: { strict?: boolean }): (ctx: any, next: () => Promise<void>) => Promise<void>;
}

export declare class CapabilityError extends Error {
  code: string;
  denied: boolean;
  details: any;
  constructor(message: string, options?: { code?: string; denied?: boolean; details?: any });
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
  cacheEnabled?: boolean;
}

export interface QueryResult {
  success: boolean;
  data?: any;
  summary?: string;
  table?: { columns: Array<{ field: string; title: string }>; rows: any[] } | null;
  error?: string;
  code?: string;
  denied?: boolean;
  details?: any;
  available?: string[];
  cached?: boolean;
  pagination?: { total: number; page: number; pageSize: number; totalPages: number };
}

export declare class QueryEngine {
  constructor(options?: QueryEngineOptions);
  register(name: string, handler: (params: any, context?: AIContext) => Promise<any>): void;
  execute(command: ParsedCommand): Promise<QueryResult>;
  followUp(overrides?: Record<string, any>): Promise<QueryResult>;
  aggregate(op: string, field: string): any;
  getLastResult(): any;
  clearHistory(): void;
}

// ── ActionEngine ─────────────────────────────────────────

export interface ActionEngineOptions {
  maxUndo?: number;
  requireConfirm?: boolean;
  onConfirm?: (label: string, params: any) => Promise<boolean> | boolean;
  retries?: number;
  maxAuditLog?: number;
}

export interface ActionConfig {
  handler: (params: any, context?: AIContext) => Promise<any>;
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
  code?: string;
  denied?: boolean;
  details?: any;
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
  beforeExecute(fn: (actionName: string, params: any, context?: AIContext) => Promise<void>): () => void;
  afterExecute(fn: (actionName: string, params: any, result: any, context?: AIContext) => Promise<void>): () => void;
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
  handler?: (data: any, previousResults: any[], context?: AIContext) => Promise<any>;
  condition?: (data: any, results: any[], context?: AIContext) => boolean;
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
  execute(name: string, data?: Record<string, any>, callbacks?: Record<string, Function>, options?: { resumeAt?: number; context?: AIContext }): Promise<FlowResult>;
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
  defineSlots(engine: string, type: string, slots: { required?: string[]; optional?: string[] }): void;
  clearContext(): void;
  getHistory(): Array<{ input: string; command: ParsedCommand; timestamp: number }>;
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
  redactFields?: string[];
}

export interface AuthGuardOptions {
  restrictedTypes?: string[];
  restrictedQueries?: string[];
  restrictedFlows?: string[];
  rules?: AuthGuardRule[];
  permissions?: Record<string, string[] | AuthGuardRule>;
  roleField?: string;
  permissionsField?: string;
  allowedRoles?: string[];
  message?: string | ((payload: { command: ParsedCommand; requiredRoles: string[]; requiredPermissions: string[]; context: any }) => string);
}

export interface AuthGuardRule {
  engine?: string | string[] | ((engine: string) => boolean);
  type?: string | string[] | ((type: string) => boolean);
  types?: string[];
  name?: string | string[] | ((name: string) => boolean);
  names?: string[];
  roles?: string[];
  allowedRoles?: string[];
  permission?: string | string[];
  permissions?: string[];
  message?: string | ((payload: { command: ParsedCommand; requiredRoles: string[]; requiredPermissions: string[]; context: any }) => string);
  match?: (command: ParsedCommand, ctx: any) => boolean;
}

export declare function createRateLimiter(options?: RateLimiterOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createDevToolsLogger(options?: DevToolsLoggerOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;
export declare function createAuthGuard(options?: AuthGuardOptions): (ctx: any, next: () => Promise<void>) => Promise<void>;

// ── UI Components ────────────────────────────────────────

export interface AIPanelOptions {
  title?: string;
  layout?: 'drawer' | 'floating';
  width?: string;
  height?: string;
  placeholder?: string;
  showTimestamp?: boolean;
  resultViewer?: boolean;
  resultPageSize?: number;
  maxTableColumns?: number;
  context?: Record<string, any> | ((input: string) => Record<string, any> | Promise<Record<string, any>>);
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
