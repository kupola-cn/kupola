// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — TypeScript type definitions.
 *
 * @module @kupola/auth
 */

export interface User {
  id?: string | number;
  name?: string;
  role?: string;
  permissions?: string[];
  attributes?: Record<string, any>;
}

export interface AuthContext {
  user: User;
  role: string;
  permissions: string[];
  attributes: Record<string, any>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAuthenticated: boolean;
}

export interface AuthProvider {
  restore(): Promise<AuthContext | null> | AuthContext | null;
  login?(credentials: Record<string, any>): Promise<AuthContext> | AuthContext;
  logout?(): Promise<void> | void;
  changePassword?(credentials: Record<string, any>): Promise<unknown> | unknown;
  getContext?(): AuthContext | null;
  onChange?(listener: (context: AuthContext | null) => void): () => void;
}

export interface AuthPlugin {
  install(): Promise<void> | void;
}

export interface AuthStore {
  createAuthContext(user: User): AuthContext;
  hydrateAuthContext(): AuthContext | null;
  getAuthContext(): AuthContext | null;
  setAuthContext(context: AuthContext | null): void;
  onAuthContextChange(listener: (context: AuthContext | null) => void): () => void;
  registerPermissionHandler(options: PermissionHandlerOptions): PermissionHandler;
  getPermissionHandler(): PermissionHandler | null;
  clearPermissionHandler(): void;
  onPermissionHandlerChange(listener: (handler: PermissionHandler | null) => void): () => void;
}

export interface PermissionHandlerOptions {
  check: (permission: string) => boolean;
  defaultMode?: 'hide' | 'disabled' | 'fallback';
  disabledClass?: string;
  fallback?: (element: HTMLElement, permission: string | string[]) => void;
  cache?: boolean;
  onChange?: (callback: () => void) => () => void;
}

export interface PermissionHandler {
  check: (permission: string) => boolean;
  defaultMode: 'hide' | 'disabled' | 'fallback';
  disabledClass: string;
  fallback: (element: HTMLElement, permission: string | string[]) => void;
  cache: boolean;
  onChange: (callback: () => void) => () => void;
}

export function onPermissionHandlerChange(
  listener: (handler: PermissionHandler | null) => void
): () => void;

export interface RequestConfig {
  method: string;
  url: string;
  data?: any;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  fetchOptions?: RequestInit;
  requiredPermission?: string | string[];
  permissionMatch?: 'any' | 'all';
  timeout?: number;
  retry?: number | RetryOptions;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  throwOnHttpError?: boolean;
  [key: string]: any;
}

export interface RetryOptions {
  retries?: number;
  delay?: number;
  factor?: number;
  statuses?: number[];
  methods?: string[];
}

export interface HttpGuardOptions {
  beforeRequest?: (config: RequestConfig) => RequestConfig | void | Promise<RequestConfig | void>;
  afterResponse?: (response: Response) => Response | void | Promise<Response | void>;
  onPermissionDenied?: (error: Error) => void;
  onUnauthorized?: (error: Error) => void;
  authContext?: AuthContext | null | (() => AuthContext | null);
  timeout?: number;
  retry?: number | RetryOptions;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  throwOnHttpError?: boolean;
  interceptors?: {
    request?: Array<(config: RequestConfig) => RequestConfig | void | Promise<RequestConfig | void>>;
    response?: Array<(response: Response) => Response | void | Promise<Response | void>>;
  };
}

export interface HttpGuard {
  get: (url: string, config?: RequestConfig) => Promise<Response | any>;
  post: (url: string, data?: any, config?: RequestConfig) => Promise<Response | any>;
  put: (url: string, data?: any, config?: RequestConfig) => Promise<Response | any>;
  patch: (url: string, data?: any, config?: RequestConfig) => Promise<Response | any>;
  delete: (url: string, config?: RequestConfig) => Promise<Response | any>;
  request: (method: string, url: string, data?: any, config?: RequestConfig) => Promise<Response | any>;
}

export function createAuthContext(user: User): AuthContext;
export function createAuthStore(): AuthStore;
export function hydrateAuthContext(): AuthContext | null;
export function getAuthContext(): AuthContext | null;
export function setAuthContext(context: AuthContext | null): void;
export function onAuthContextChange(listener: (context: AuthContext | null) => void): () => void;

export const AUTH_KEY: unique symbol;
export const AUTH_PROVIDER_KEY: unique symbol;

export function createAuthPlugin(provider: AuthProvider): AuthPlugin;
export function useAuth<T extends AuthProvider = AuthProvider>(): T;

export function registerPermissionHandler(options: PermissionHandlerOptions): PermissionHandler;
export function getPermissionHandler(): PermissionHandler | null;
export function clearPermissionHandler(): void;

export class PermissionDirective {
  constructor(element: HTMLElement, options?: { authStore?: AuthStore });
  readonly element: HTMLElement;
  permission: string | string[] | null;
  mode: 'hide' | 'disabled' | 'fallback' | null;
  disabledClass: string | null;
  parse(): boolean;
  check(): boolean;
  apply(): void;
  restore(): void;
  listen(): void;
  stopListening(): void;
  destroy(): void;
}

export interface PermissionDirectiveDefinition {
  mount(element: Element): { destroy(): void } | void;
}

export function createPermissionDirectiveDefinition(
  options?: { authStore?: AuthStore }
): PermissionDirectiveDefinition;
export function registerPermissionDirective(
  registerDirective: (name: string, definition: PermissionDirectiveDefinition) => void,
  options?: { authStore?: AuthStore }
): PermissionDirectiveDefinition;
export function processPermissionDirectives(
  root: Element,
  options?: { authStore?: AuthStore }
): PermissionDirective[];
export function clearCache(): void;

export function createHttpGuard(options?: HttpGuardOptions): HttpGuard;

export function requireAuth(authContext: AuthContext | null): boolean;
export function requirePermission(
  authContext: AuthContext | null,
  permission: string | string[],
  options?: { match?: 'any' | 'all' } | 'any' | 'all'
): boolean;
export function requireRole(authContext: AuthContext, role: string): boolean;
export function redirectTo(url: string, options?: { redirectUrl?: string }): void;
