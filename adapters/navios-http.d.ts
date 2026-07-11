/**
 * @navios/http adapter for Kupola HTTP client plugin system.
 * 
 * @navios/http is a lightweight, fetch-based axios replacement that supports
 * interceptors, multiple response types, and works with Next.js / RSC.
 */

/** Additional @navios/http request config fields that can be merged into every request. */
export interface NaviosAdapterOptions {
  /** Response type: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'stream' */
  responseType?: string;
  /** Custom status validator, e.g. (status) => status < 500 */
  validateStatus?: (status: number) => boolean;
  /** Request credentials: 'omit' | 'same-origin' | 'include' */
  credentials?: string;
  /** URL search parameters */
  params?: Record<string, any> | URLSearchParams;
  /** Allow any other @navios/http requestConfig fields */
  [key: string]: any;
}

/** Minimal @navios/http client interface required by the adapter. */
export interface NaviosHttpClient {
  request(config: any): Promise<{
    data: any;
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    config?: any;
  }>;
  get(url: string, config?: any): Promise<any>;
  post(url: string, data?: any, config?: any): Promise<any>;
  put(url: string, data?: any, config?: any): Promise<any>;
  patch(url: string, data?: any, config?: any): Promise<any>;
  delete(url: string, config?: any): Promise<any>;
  head(url: string, config?: any): Promise<any>;
  options(url: string, config?: any): Promise<any>;
  defaults: Record<string, any>;
  interceptors: {
    request: { use(onFulfilled: Function, onRejected?: Function): number };
    response: { use(onFulfilled: Function, onRejected?: Function): number };
  };
}

/**
 * Create a Kupola-compatible HTTP client from a @navios/http instance.
 *
 * @param naviosClient - A @navios/http client instance (from create() or default import)
 * @param options - Additional @navios/http request config to merge into every request
 * @returns Kupola HTTP client object with a `fetch` function
 */
export function createNaviosAdapter(
  naviosClient: NaviosHttpClient,
  options?: NaviosAdapterOptions
): {
  fetch(url: string, fetchOptions?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    url: string;
    json(): Promise<any>;
    text(): Promise<string>;
  }>;
};
/**
 * @navios/http adapter for Kupola HTTP client plugin system.
 */

export interface NaviosAdapterOptions {
  /** Additional request config to merge into every request */
  [key: string]: any;
}

/**
 * Create a Kupola-compatible HTTP client from a @navios/http instance.
 *
 * @param naviosClient - A @navios/http client instance (from create())
 * @param options - Additional request config to merge into every request
 * @returns Kupola HTTP client object with a `fetch` function
 */
export function createNaviosAdapter(
  naviosClient: {
    request(config: any): Promise<{
      status: number;
      statusText?: string;
      headers?: Record<string, string>;
      data: any;
    }>;
  },
  options?: NaviosAdapterOptions
): {
  fetch(url: string, fetchOptions?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    url: string;
    json(): Promise<any>;
    text(): Promise<string>;
  }>;
};
