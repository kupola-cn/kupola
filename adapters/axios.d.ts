/**
 * Axios adapter for Kupola HTTP client plugin system.
 */

export interface AxiosAdapterOptions {
  /** Additional Axios request config to merge into every request */
  [key: string]: any;
}

/**
 * Create a Kupola-compatible HTTP client from an Axios instance.
 *
 * @param axiosInstance - An Axios instance (from axios.create() or default axios)
 * @param options - Additional Axios request config to merge into every request
 * @returns Kupola HTTP client object with a `fetch` function
 */
export function createAxiosAdapter(
  axiosInstance: any,
  options?: AxiosAdapterOptions
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
