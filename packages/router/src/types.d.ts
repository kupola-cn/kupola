export type RouteParams = Record<string, string>;
export type RouteQueryValue = string | number | boolean | null | undefined;
export type RouteQuery = Record<string, RouteQueryValue | RouteQueryValue[]>;
export type RouteMeta = Record<string, any>;
export type RouteComponent = Function | { default: Function };
export type RouteRedirect = { path: string; query?: RouteQuery };
export type NavigationGuardResult = boolean | void | RouteRedirect;
export type MaybePromise<T> = T | Promise<T>;

/** Type-safe route parameter converter. */
export type RouteParamType = 'string' | 'number' | 'boolean' | 'json' | ((raw: string) => unknown);
export type RouteParamsSchema = Record<string, RouteParamType>;

export interface RouteLocationInput {
  path?: string;
  name?: string;
  params?: RouteParams;
  query?: RouteQuery;
}

export interface RouteConfig {
  path: string;
  name?: string;
  component?: RouteComponent;
  components?: Record<string, RouteComponent>;
  children?: RouteConfig[];
  meta?: RouteMeta;
  params?: RouteParamsSchema;
  beforeEnter?: NavigationGuard;
  beforeLeave?: NavigationGuard;
  transition?: TransitionConfig;
}

export interface RouteRecord {
  path: string;
  name: string | undefined;
  component: RouteComponent | undefined;
  components: Record<string, RouteComponent> | undefined;
  children: RouteConfig[];
  meta: RouteMeta;
  paramsSchema: RouteParamsSchema | null;
  beforeEnter?: NavigationGuard;
  beforeLeave?: NavigationGuard;
  transition?: TransitionConfig;
  regex: RegExp;
  paramNames: string[];
}

export interface RouteLocation {
  path: string;
  name: string | undefined;
  params: RouteParams;
  query: RouteQuery;
  meta: RouteMeta;
  fullPath: string;
  matched: RouteRecord[];
  redirectedFrom?: string;
}

export type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation | null
) => MaybePromise<NavigationGuardResult>;

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
  initialLocation?: string;
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

export interface RouterPlugin {
  install(): Promise<void> | void;
  destroy(): void;
}

export interface RouterPluginAuthProvider {
  getContext(): object | null;
  onChange(listener: (context: object | null) => void): () => void;
}

export function createRouterPlugin(
  router: Router,
  options?: {
    auth?: RouterPluginAuthProvider | null;
    loginPath?: string;
    forbiddenPath?: string;
    notFoundPath?: string;
    initialize?: boolean;
  }
): RouterPlugin;

export type ScrollBehaviorFunction = (
  to: RouteLocation,
  from: RouteLocation | null,
  savedPosition: { x: number; y: number } | null
) => { x: number; y: number } | { selector: string; behavior?: ScrollBehavior } | null;

export interface Router {
  push(location: string | RouteLocationInput, options?: { query?: RouteQuery }): Promise<boolean>;
  replace(location: string | RouteLocationInput, options?: { query?: RouteQuery }): Promise<boolean>;
  back(): void;
  forward(): void;
  go(delta: number): void;
  match(path: string): RouteLocation | null;
  resolve(to: RouteLocationInput): string;
  beforeEach(guard: NavigationGuard): () => void;
  beforeResolve(guard: NavigationGuard): () => void;
  afterEach(callback: (to: RouteLocation, from: RouteLocation | null) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
  currentRoute: RouteLocation | null;
  init(): Promise<boolean | RouteLocation | null>;
  destroy(): void;
}
