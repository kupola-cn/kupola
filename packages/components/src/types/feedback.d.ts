import type { Destroyable } from './common.js';

// ============================================================
// Feedback Components
// ============================================================

// Alert
export interface AlertOptions {
  title?: string;
  content?: string;
  type?: 'normal' | 'success' | 'error' | 'warning' | 'info';
  closable?: boolean;
  onClose?: () => void;
}
export interface AlertInstance extends Destroyable {
  dismiss(): void;
}
export function Alert(options?: AlertOptions): AlertInstance;

// Progress
export interface ProgressOptions {
  percent?: number;
  type?: 'line' | 'circle';
  status?: 'normal' | 'success' | 'error';
  showInfo?: boolean;
  strokeWidth?: number;
  width?: number;
}
export interface ProgressInstance extends Destroyable {
  setPercent(percent: number): void;
  getPercent(): number;
}
export function Progress(options?: ProgressOptions): ProgressInstance;

// Skeleton
export interface SkeletonOptions {
  variant?: 'text' | 'heading' | 'avatar' | 'block';
  count?: number;
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}
export interface SkeletonInstance extends Destroyable {}
export function Skeleton(options?: SkeletonOptions): SkeletonInstance;

// Spin
export interface SpinOptions {
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  fullscreen?: boolean;
}
export interface SpinInstance extends Destroyable {
  show(): void;
  hide(): void;
}
export function Spin(options?: SpinOptions): SpinInstance;

// Empty
export interface EmptyOptions {
  description?: string;
  image?: string;
}
export interface EmptyInstance extends Destroyable {}
export function Empty(options?: EmptyOptions): EmptyInstance;

// Countdown
export interface CountdownOptions {
  target?: Date | number | string;
  onTick?: (remaining: number) => void;
  onFinish?: () => void;
  onComplete?: () => void;
  onError?: (error: unknown) => void;
}
export interface CountdownInstance {
  element: DocumentFragment;
  start(target?: Date | number | string): void;
  stop(): void;
  destroy(): void;
}
export function Countdown(options?: CountdownOptions): CountdownInstance;

