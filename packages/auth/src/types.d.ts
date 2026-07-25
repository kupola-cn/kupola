// SPDX-License-Identifier: MIT
/**
 * @kupola/auth — TypeScript type definitions.
 *
 * @module @kupola/auth
 */

export interface User {
  id?: string;
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

export interface RequestConfig {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  fetchOptions?: RequestInit;
  requiredPermission?: string;
  [key: string]: any;
}

export interface HttpGuardOptions {
  beforeRequest?: (config: RequestConfig) => RequestConfig | void;
  afterResponse?: (response: Response) => Response | void;
  onPermissionDenied?: (error: Error) => void;
  onUnauthorized?: (error: Error) => void;
  interceptors?: {
    request?: Array<(config: RequestConfig) => RequestConfig>;
    response?: Array<(response: Response) => Response>;
  };
}

export interface HttpGuard {
  get: (url: string, config?: RequestConfig) => Promise<Response>;
  post: (url: string, data?: any, config?: RequestConfig) => Promise<Response>;
  put: (url: string, data?: any, config?: RequestConfig) => Promise<Response>;
  patch: (url: string, data?: any, config?: RequestConfig) => Promise<Response>;
  delete: (url: string, config?: RequestConfig) => Promise<Response>;
  request: (method: string, url: string, data?: any, config?: RequestConfig) => Promise<Response>;
}

export function createAuthContext(user: User): AuthContext;
export function hydrateAuthContext(): AuthContext | null;
export function getAuthContext(): AuthContext | null;
export function setAuthContext(context: AuthContext | null): void;

export const AUTH_KEY: unique symbol;

export function registerPermissionHandler(options: PermissionHandlerOptions): PermissionHandler;
export function getPermissionHandler(): PermissionHandler | null;
export function clearPermissionHandler(): void;

export function createHttpGuard(options?: HttpGuardOptions): HttpGuard;

export function requireAuth(authContext: AuthContext | null): boolean;
export function requirePermission(authContext: AuthContext, permission: string): boolean;
export function requireRole(authContext: AuthContext, role: string): boolean;
export function redirectTo(url: string, options?: { redirectUrl?: string }): void;