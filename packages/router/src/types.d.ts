export interface RouteConfig {
  path: string;
  name?: string;
  component?: Function | { default: Function };
  components?: Record<string, Function | { default: Function }>;
  children?: RouteConfig[];
  meta?: Record<string, any>;
  beforeEnter?: NavigationGuard;
  beforeLeave?: NavigationGuard;
  transition?: TransitionConfig;
}

export interface RouteRecord {
  path: string;
  name: string | undefined;
  component: Function | { default: Function } | undefined;
  components: Record<string, Function | { default: Function }> | undefined;
  children: RouteConfig[];
  meta: Record<string, any>;
  beforeEnter?: NavigationGuard;
  beforeLeave?: NavigationGuard;
  transition?: TransitionConfig;
  regex: RegExp;
  paramNames: string[];
}

export interface RouteLocation {
  path: string;
  name: string | undefined;
  params: Record<string, string>;
  query: Record<string, string>;
  meta: Record<string, any>;
  fullPath: string;
  matched: RouteRecord[];
  redirectedFrom?: string;
}

export type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation | null
) => boolean | void | { path: string; query?: Record<string, string> } | Promise<boolean | void | { path: string; query?: Record<string, string> }>;

export interface TransitionConfig {
  enterClass?: string;
  leaveClass?: string;
  enterActiveClass?: string;
  leaveActiveClass?: string;
  enterToClass?: string;
  leaveToClass?: string;
  onEnter?: (el: HTMLElement, done: () => void) => void | Promise<void>;
  onLeave?: (el: HTMLElement, done: () => void) => void | Promise<void>;
  duration?: number;
}

export interface RouterOptions {
  mode?: 'hash' | 'history' | 'memory';
  routes: RouteConfig[];
  base?: string;
  scrollBehavior?: 'auto' | 'smooth' | 'manual' | ScrollBehaviorFunction;
  transition?: TransitionConfig;
}

export interface AuthGuardOptions {
  authContext: object | null | (() => object | null);
  loginPath?: string;
  forbiddenPath?: string;
  notFoundPath?: string;
  onAuthChange?: (listener: (context: object | null) => void) => () => void;
}

export function setupAuthGuard(router: Router, options: AuthGuardOptions): () => void;
export function installRouter(
  router: Router,
  options?: {
    auth?: boolean | AuthGuardOptions;
    authContext?: AuthGuardOptions['authContext'];
    onAuthChange?: AuthGuardOptions['onAuthChange'];
  }
): void;

export function initRouter(
  options: RouterOptions & {
    auth?: boolean | AuthGuardOptions;
    authContext?: AuthGuardOptions['authContext'];
    onAuthChange?: AuthGuardOptions['onAuthChange'];
  }
): {
  install(): void;
  init(): Promise<boolean | RouteLocation | null>;
  destroy(): void;
};

export type ScrollBehaviorFunction = (
  to: RouteLocation,
  from: RouteLocation | null,
  savedPosition: { x: number; y: number } | null
) => { x: number; y: number } | { selector: string; behavior?: ScrollBehavior } | null;

export interface Router {
  push(location: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }, options?: { query?: Record<string, string> }): Promise<boolean>;
  replace(location: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }, options?: { query?: Record<string, string> }): Promise<boolean>;
  back(): void;
  forward(): void;
  go(delta: number): void;
  match(path: string): RouteLocation | null;
  resolve(to: { path?: string; name?: string; params?: Record<string, string> }): string;
  beforeEach(guard: NavigationGuard): () => void;
  beforeResolve(guard: NavigationGuard): () => void;
  afterEach(callback: (to: RouteLocation, from: RouteLocation | null) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  currentRoute: RouteLocation | null;
  init(): Promise<boolean | RouteLocation | null>;
  destroy(): void;
}
