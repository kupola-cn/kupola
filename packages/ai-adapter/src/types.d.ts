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
