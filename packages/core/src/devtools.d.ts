// SPDX-License-Identifier: MIT

export interface ProfilerOptions {
  console?: boolean;
}

export interface ProfileReport {
  duration: number;
  totalTriggers: number;
  totalEffectRuns: number;
  totalComputedRecomputes: number;
  signals: Array<{ label: string, reads: number, writes: number, triggers: number }>;
  effects: Array<{
    label: string;
    runs: number;
    totalTime: string;
    maxTime: string;
    avgTime: string;
  }>;
  computeds: Array<{
    label: string;
    recomputes: number;
    totalTime: string;
    maxTime: string;
    avgTime: string;
  }>;
}

export declare function enableProfiler(options?: ProfilerOptions): void;
export declare function disableProfiler(): void;
export declare function resetProfiler(): void;
export declare function isProfilerEnabled(): boolean;
export declare function getProfileReport(): ProfileReport;
export declare function printProfileReport(): void;
export declare function onDevToolsMessage(type: string, handler: (payload: any) => void): () => void;
export declare function sendDevToolsMessage(type: string, payload?: any): void;
export declare function exposeDevToolsAPI(): (() => void) | undefined;
