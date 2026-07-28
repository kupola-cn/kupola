export interface IconProvider {
  prefix: string;
  resolve(name: string, size?: unknown): string | null | undefined | Promise<string | null | undefined>;
}

export interface IconResolverOptions {
  providers: IconProvider[];
  fallback?: string | null;
}

export interface KupolaIconProviderOptions {
  prefix?: string;
  groups?: 'all' | string[];
}

export interface SetupUiOptions {
  theme?: boolean;
  icons?: IconResolverOptions | IconProvider['resolve'];
}

export function createKupolaIconProvider(options?: KupolaIconProviderOptions): IconProvider;
export function createIconResolver(options: IconResolverOptions): IconProvider['resolve'];
export function setupUi(options?: SetupUiOptions): void;
