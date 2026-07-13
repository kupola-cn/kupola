type Primitive = string | number | boolean | null | undefined;

type Reactive<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? Reactive<U>[]
  : T extends object
  ? { [K in keyof T]: Reactive<T[K]> }
  : T;

interface BrandOption {
  id: BrandColor;
  name: string;
  color: string;
}

type BrandColor = 
  | 'zengqing'
  | 'green'
  | 'xionghuang'
  | 'jianghuang'
  | 'lanlv'
  | 'kongquelan'
  | 'meiguizi'
  | 'shihong'
  | 'shanchahong'
  | 'quhong'
  | 'roulan';

type ThemeType = 'dark' | 'light';

type BindingType = 
  | 'text'
  | 'html'
  | 'value'
  | 'checked'
  | 'disabled'
  | 'hidden'
  | 'class'
  | 'style'
  | 'attr'
  | 'src'
  | 'href'
  | 'placeholder';

interface PersistOptions {
  storage?: 'local' | 'session';
  debounce?: number;
}


interface StoreOptions<S extends object = Record<string, unknown>> {
  state?: () => S;
  getters?: Record<string, (state: S) => unknown>;
  actions?: Record<string, (context: StoreContext<S>) => unknown | Promise<unknown>>;
  mutations?: Record<string, (state: S, payload?: unknown) => void>;
}

interface StoreContext<S extends object = Record<string, unknown>> {
  state: S;
  commit: (type: string, payload?: unknown) => void;
  dispatch: (type: string, payload?: unknown) => unknown | Promise<unknown>;
  getters: Record<string, unknown>;
}

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

interface ModalOptions {
  title?: string;
  content: string | HTMLElement;
  width?: string | number;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface NotificationOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClick?: () => void;
  onClose?: () => void;
}

interface DatepickerOptions {
  format?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  disabledDates?: (date: Date) => boolean;
}

interface TimepickerOptions {
  format?: '12h' | '24h';
  minTime?: string;
  maxTime?: string;
}

interface NumberInputOptions {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

interface HeatmapCell {
  date: string;
  value: number;
  level: number;
  element: HTMLElement;
}

interface HeatmapOptions {
  data?: Array<{ date: string; value: number }>;
  startDate?: Date;
  endDate?: Date;
  cellSize?: number;
  color?: string;
  onCellClick?: (cell: HeatmapCell) => void;
}

interface VirtualListItem<T = unknown> {
  data: T;
  index: number;
  element: HTMLElement;
}

declare class KupolaDataBind<T extends object = Record<string, unknown>> {
  constructor();
  
  data: Reactive<T>;
  rawData: T;
  
  set<K extends keyof T>(key: K, value: T[K], silent?: boolean): void;
  set<V = unknown>(key: string, value: V, silent?: boolean): void;
  set(data: Partial<T>, silent?: boolean): void;
  
  get<K extends keyof T>(key: K): T[K];
  get<V = unknown>(key: string): V;
  
  observe<K extends keyof T>(key: K, callback: (newValue: T[K], oldValue: T[K]) => void): void;
  observe<V = unknown>(key: string, callback: (newValue: V, oldValue: V) => void): void;
  observe(callback: (key: string, newValue: unknown, oldValue: unknown) => void): void;
  
  unobserve<K extends keyof T>(key: K, callback: (newValue: T[K], oldValue: T[K]) => void): void;
  unobserve<V = unknown>(key: string, callback: (newValue: V, oldValue: V) => void): void;
  
  computed<K extends string, R = unknown>(name: K, deps: (keyof T | string)[], callback: (...args: unknown[]) => R): void;
  
  bind(): void;
  load(data: Partial<T>): void;
  reset(): void;
  destroy(): void;
  
  persist<K extends keyof T>(key: K, options?: PersistOptions): void;
  persist(key: string, options?: PersistOptions): void;
  unpersist<K extends keyof T>(key: K): void;
  unpersist(key: string): void;
  
  snapshot(): number;
  rollback(index?: number): boolean;
  getSnapshotCount(): number;
  clearSnapshots(): void;
  
  serializeForm(formElement: HTMLFormElement): Record<string, unknown>;
  fillForm(formElement: HTMLFormElement, data: Record<string, unknown>): void;
}

declare class KupolaEventBus {
  constructor();
  
  on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
  on(callback: (eventName: string, data: unknown) => void): void;
  
  off<T = unknown>(eventName: string, callback: (data: T) => void): void;
  off(callback: (eventName: string, data: unknown) => void): void;
  
  emit<T = unknown>(eventName: string, data: T): void;
  
  once<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
  once(callback: (eventName: string, data: unknown) => void): void;
  
  delegate(selector: string, eventName: string, callback: (event: Event) => void): () => void;
  undelegate(selector: string, eventName: string): void;
  
  destroy(): void;
}

declare class KupolaStore<S extends object = Record<string, unknown>> {
  constructor(name: string, options?: StoreOptions<S>);
  
  readonly name: string;
  readonly state: S;
  
  commit(type: string, payload?: unknown): void;
  dispatch(type: string, payload?: unknown): unknown | Promise<unknown>;
  
  observe(callback: (newState: S, oldState: S) => void): () => void;
  unobserve(callback: (newState: S, oldState: S) => void): void;
  
  toJSON(): { name: string; state: S; getters: Record<string, unknown> };
}

declare class KupolaStoreManager {
  constructor();
  
  createStore<S extends object = Record<string, unknown>>(name: string, options?: StoreOptions<S>): KupolaStore<S>;
  getStore<S extends object = Record<string, unknown>>(name: string): KupolaStore<S> | undefined;
  registerStore(store: KupolaStore): void;
  dispose(): void;
}

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface ThrottleOptions {
  trailing?: boolean;
}

declare class KupolaUtils {
  string: {
    trim(str: string): string;
    trimLeft(str: string): string;
    trimRight(str: string): string;
    toUpperCase(str: string): string;
    toLowerCase(str: string): string;
    capitalize(str: string): string;
    camelize(str: string): string;
    hyphenate(str: string): string;
    padStart(str: string | number, length: number, padChar?: string): string;
    padEnd(str: string | number, length: number, padChar?: string): string;
    truncate(str: string, maxLength: number, suffix?: string): string;
    replaceAll(str: string, search: string, replacement: string): string;
    format(template: string, data: Record<string, unknown>): string;
    startsWith(str: string, prefix: string): boolean;
    endsWith(str: string, suffix: string): boolean;
    includes(str: string, search: string): boolean;
    repeat(str: string, times: number): string;
    reverse(str: string): string;
    countOccurrences(str: string, search: string): number;
    escapeHtml(str: string): string;
    unescapeHtml(str: string): string;
    generateRandom(length?: number): string;
    generateUUID(): string;
  };

  array: {
    isArray(arr: unknown): boolean;
    isEmpty(arr: unknown[]): boolean;
    size(arr: unknown[]): number;
    first<T>(arr: T[], defaultValue?: T): T | undefined;
    last<T>(arr: T[], defaultValue?: T): T | undefined;
    get<T>(arr: T[], index: number, defaultValue?: T): T | undefined;
    slice<T>(arr: T[], start: number, end?: number): T[];
    concat<T>(...args: T[][]): T[];
    join(arr: unknown[], separator?: string): string;
    indexOf<T>(arr: T[], item: T, fromIndex?: number): number;
    lastIndexOf<T>(arr: T[], item: T, fromIndex?: number): number;
    includes<T>(arr: T[], item: T): boolean;
    push<T>(arr: T[], ...items: T[]): T[];
    pop<T>(arr: T[]): T | undefined;
    shift<T>(arr: T[]): T | undefined;
    unshift<T>(arr: T[], ...items: T[]): T[];
    remove<T>(arr: T[], item: T): T[];
    removeAt<T>(arr: T[], index: number): T[];
    insert<T>(arr: T[], index: number, item: T): T[];
    reverse<T>(arr: T[]): T[];
    sort<T>(arr: T[], compareFn?: (a: T, b: T) => number): T[];
    sortBy<T>(arr: T[], key: string, order?: 'asc' | 'desc'): T[];
    filter<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[];
    map<T, U>(arr: T[], fn: (value: T, index: number, array: T[]) => U): U[];
    reduce<T, U>(arr: T[], fn: (acc: U, val: T, index: number, array: T[]) => U, initialValue: U): U;
    forEach<T>(arr: T[], fn: (value: T, index: number, array: T[]) => void): void;
    every<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): boolean;
    some<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): boolean;
    find<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): T | undefined;
    findIndex<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): number;
    flat<T>(arr: T[][], depth?: number): T[];
    flattenDeep<T>(arr: unknown[]): T[];
    unique<T>(arr: T[]): T[];
    uniqueBy<T>(arr: T[], key: string): T[];
    chunk<T>(arr: T[], size: number): T[][];
    shuffle<T>(arr: T[]): T[];
    sum(arr: number[]): number;
    average(arr: number[]): number;
    max(arr: number[]): number;
    min(arr: number[]): number;
    intersection<T>(...args: T[][]): T[];
    union<T>(...args: T[][]): T[];
    difference<T>(arr1: T[], arr2: T[]): T[];
    zip<T>(...args: T[][]): T[][];
  };

  object: {
    isObject(obj: unknown): boolean;
    isEmpty(obj: Record<string, unknown>): boolean;
    keys(obj: Record<string, unknown>): string[];
    values<T>(obj: Record<string, T>): T[];
    entries<T>(obj: Record<string, T>): [string, T][];
    has(obj: Record<string, unknown>, key: string): boolean;
    get<T>(obj: Record<string, unknown>, path: string, defaultValue?: T): T | undefined;
    set(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown>;
    pick<T>(obj: Record<string, unknown>, keys: string[]): Record<string, T>;
    omit<T>(obj: Record<string, unknown>, keys: string[]): Record<string, T>;
    merge(...args: Record<string, unknown>[]): Record<string, unknown>;
    clone<T>(obj: T): T;
    deepClone<T>(obj: T): T;
    forEach<T>(obj: Record<string, T>, fn: (value: T, key: string, obj: Record<string, T>) => void): void;
    map<T, U>(obj: Record<string, T>, fn: (value: T, key: string, obj: Record<string, T>) => U): Record<string, U>;
    filter<T>(obj: Record<string, T>, fn: (value: T, key: string, obj: Record<string, T>) => boolean): Record<string, T>;
    reduce<T, U>(obj: Record<string, T>, fn: (acc: U, value: T, key: string, obj: Record<string, T>) => U, initialValue: U): U;
    toArray<T>(obj: Record<string, T>): { key: string; value: T }[];
    fromArray<T>(arr: T[], keyField: string, valueField?: string): Record<string, T>;
    size(obj: Record<string, unknown>): number;
    invert<T>(obj: Record<string, T>): Record<T, string>;
    isEqual(obj1: unknown, obj2: unknown): boolean;
    freeze<T>(obj: T): T;
    seal<T>(obj: T): T;
  };

  number: {
    isNumber(val: unknown): boolean;
    isInteger(val: unknown): boolean;
    isFloat(val: unknown): boolean;
    isPositive(val: unknown): boolean;
    isNegative(val: unknown): boolean;
    isZero(val: unknown): boolean;
    clamp(val: number, min: number, max: number): number;
    round(val: number, precision?: number): number;
    floor(val: number): number;
    ceil(val: number): number;
    abs(val: number): number;
    min(...args: number[]): number | undefined;
    max(...args: number[]): number | undefined;
    sum(...args: number[][]): number;
    average(...args: number[][]): number;
    random(min?: number, max?: number): number;
    randomInt(min: number, max: number): number;
    format(val: number, decimals?: number): string;
    formatCurrency(val: number, currency?: string, decimals?: number): string;
    formatPercent(val: number, decimals?: number): string;
    toFixed(val: number, decimals?: number): string;
    toPrecision(val: number, precision?: number): string;
    isNaN(val: unknown): boolean;
    isFinite(val: unknown): boolean;
    parseInt(val: string, radix?: number): number;
    parseFloat(val: string): number;
    toNumber(val: unknown, defaultValue?: number): number;
    safeDivide(a: number, b: number, defaultValue?: number): number;
    safeMultiply(...args: number[]): number;
  };

  date: {
    now(): number;
    today(): Date;
    tomorrow(): Date;
    yesterday(): Date;
    isDate(val: unknown): boolean;
    isValid(date: Date): boolean;
    parse(str: string): Date | null;
    format(date: Date, formatStr?: string): string;
    toISO(date: Date): string;
    toUTC(date: Date): Date | null;
    addDays(date: Date, days: number): Date;
    addHours(date: Date, hours: number): Date;
    addMinutes(date: Date, minutes: number): Date;
    addSeconds(date: Date, seconds: number): Date;
    diffDays(date1: Date, date2: Date): number;
    diffHours(date1: Date, date2: Date): number;
    diffMinutes(date1: Date, date2: Date): number;
    diffSeconds(date1: Date, date2: Date): number;
    isToday(date: Date): boolean;
    isYesterday(date: Date): boolean;
    isTomorrow(date: Date): boolean;
    isFuture(date: Date): boolean;
    isPast(date: Date): boolean;
    isLeapYear(date: Date): boolean;
    getDaysInMonth(date: Date): number;
    getWeekOfYear(date: Date): number;
    getQuarter(date: Date): number;
    startOfDay(date: Date): Date;
    endOfDay(date: Date): Date;
    startOfMonth(date: Date): Date;
    endOfMonth(date: Date): Date;
    startOfWeek(date: Date, startDay?: number): Date;
    endOfWeek(date: Date, startDay?: number): Date;
    getAge(birthDate: Date): number;
    fromNow(date: Date): string;
  };

  debounce<T extends (...args: unknown[]) => void>(func: T, wait: number, options?: DebounceOptions): T;
  throttle<T extends (...args: unknown[]) => void>(func: T, limit: number, options?: ThrottleOptions): T;

  validator: {
    isEmail(str: string): boolean;
    isPhone(str: string): boolean;
    isURL(str: string): boolean;
    isIPv4(str: string): boolean;
    isIPv6(str: string): boolean;
    isIP(str: string): boolean;
    isIDCard(str: string): boolean;
    isPassport(str: string): boolean;
    isCreditCard(str: string): boolean;
    isHexColor(str: string): boolean;
    isRGB(str: string): boolean;
    isRGBA(str: string): boolean;
    isColor(str: string): boolean;
    isDate(str: string): boolean;
    isJSON(str: string): boolean;
    isEmpty(str: string): boolean;
    isWhitespace(str: string): boolean;
    isNumber(str: string): boolean;
    isInteger(str: string): boolean;
    isFloat(str: string): boolean;
    isPositive(str: string): boolean;
    isNegative(str: string): boolean;
    isAlpha(str: string): boolean;
    isAlphaNumeric(str: string): boolean;
    isChinese(str: string): boolean;
    isLength(str: string, min: number, max?: number): boolean;
    minLength(str: string, min: number): boolean;
    maxLength(str: string, max: number): boolean;
    matches(str: string, regex: RegExp): boolean;
    equals(str1: string, str2: string): boolean;
    contains(str: string, substring: string): boolean;
    notContains(str: string, substring: string): boolean;
    isArray(arr: unknown): boolean;
    arrayLength(arr: unknown[], min: number, max?: number): boolean;
    arrayMinLength(arr: unknown[], min: number): boolean;
    arrayMaxLength(arr: unknown[], max: number): boolean;
    isObject(obj: unknown): boolean;
    hasKeys(obj: Record<string, unknown>, keys: string[]): boolean;
    validate(obj: Record<string, unknown>, rules: Record<string, (string | ((value: unknown, obj: Record<string, unknown>) => boolean | string)[])[]>): {
      valid: boolean;
      errors: Record<string, string[]>;
    };
  };

  crypto: {
    md5(str: string): string;
    sha256(str: string): string;
    base64Encode(str: string): string;
    base64Decode(str: string): string;
    uuid(): string;
  };
  
  preload: {
    loadImage(url: string, options?: { crossOrigin?: string }): Promise<HTMLImageElement>;
    loadImages(urls: string[], options?: { crossOrigin?: string; parallel?: boolean }): Promise<HTMLImageElement[]>;
    loadScript(url: string, options?: { type?: string; async?: boolean; defer?: boolean }): Promise<HTMLScriptElement>;
    loadStylesheet(url: string, options?: { media?: string }): Promise<HTMLLinkElement>;
    loadFont(fontFamily: string, src: string, options?: { weight?: string; style?: string }): Promise<FontFace>;
    preload(url: string, type?: 'image' | 'script' | 'stylesheet' | 'style'): Promise<HTMLImageElement | HTMLScriptElement | HTMLLinkElement>;
    isLoaded(url: string): boolean;
    clearCache(): void;
    clearCacheByUrl(url: string): void;
  };
}

declare const kupolaUtils: KupolaUtils;

declare const stringUtils: KupolaUtils['string'];
declare const arrayUtils: KupolaUtils['array'];
declare const objectUtils: KupolaUtils['object'];
declare const numberUtils: KupolaUtils['number'];
declare const dateUtils: KupolaUtils['date'];
declare const validatorUtils: KupolaUtils['validator'];
declare const cryptoUtils: KupolaUtils['crypto'];
declare const preloadUtils: KupolaUtils['preload'];

declare function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number, options?: DebounceOptions): T;
declare function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number, options?: ThrottleOptions): T;

declare interface FormState {
  valid: boolean;
  errors: Record<string, string>;
  errorCount: number;
  loading: boolean;
  submitting: boolean;
  disabled: boolean;
}

declare class KupolaValidator {
  constructor();
  
  addValidator(name: string, callback: (value: unknown, params: unknown[]) => boolean): void;
  addAsyncValidator(name: string, callback: (value: unknown, params: unknown[], input: HTMLElement) => Promise<boolean>): void;
  
  validate(form: HTMLFormElement): boolean;
  validateAsync(form: HTMLFormElement, options?: { group?: string }): Promise<boolean>;
  validateInput(input: HTMLElement): boolean;
  validateInputAsync(input: HTMLElement): Promise<boolean>;
  validateGroup(form: HTMLFormElement, groupName: string): Promise<boolean>;
  getGroups(form: HTMLFormElement): string[];
  
  getFormState(form: HTMLFormElement): FormState;
  updateFormState(form: HTMLFormElement): void;
  setFormLoading(form: HTMLFormElement, loading: boolean): void;
  setFormSubmitting(form: HTMLFormElement, submitting: boolean): void;
  setFormDisabled(form: HTMLFormElement, disabled: boolean): void;
  resetForm(form: HTMLFormElement): void;
  
  showError(input: HTMLElement, message: string): void;
  clearError(input: HTMLElement): void;
}

declare const validator: KupolaValidator;


interface ComponentMixin {
  [key: string]: unknown;
}

declare class KupolaComponent {
  constructor(element: HTMLElement);
  
  readonly element: HTMLElement;
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  slots: Record<string, string>;
  
  $slot(name?: string): string;
  $emit<T = unknown>(eventName: string, data?: T): void;
  $on<T = unknown>(eventName: string, handler: (data: T) => void): (data: T) => void;
  $off<T = unknown>(eventName: string, handler: (data: T) => void): void;
  
  setProps(newProps: Record<string, unknown>): void;
  setState(newState: Record<string, unknown>): void;
  
  mount(): Promise<void>;
  unmount(): Promise<void>;
  
  beforeMount(): void;
  afterMount(): void;
  beforeUnmount(): void;
  afterUnmount(): void;
  updated(): void;
  render(): void;
}

declare class KupolaComponentRegistry {
  constructor();
  
  register(name: string, componentClass: typeof KupolaComponent): void;
  registerLazy(name: string, loader: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>): void;
  unregister(name: string): void;
  get(name: string): typeof KupolaComponent | undefined;
  getAsync(name: string): Promise<typeof KupolaComponent>;
  
  defineMixin(name: string, mixin: ComponentMixin): void;
  useMixin(componentClass: typeof KupolaComponent, ...mixinNames: string[]): void;
  
  bootstrap(root?: HTMLElement | Document): Promise<void>;
  destroy(): void;
}

declare class KupolaStatePersist {
  constructor();
  
  persist(key: string, options?: PersistOptions): void;
  unpersist(key: string): void;
  loadPersisted(): Record<string, unknown>;
}

declare class Heatmap {
  constructor(element: HTMLElement, options?: HeatmapOptions);
  
  render(): void;
  updateData(data: Array<{ date: string; value: number }>): void;
  setColor(color: string): void;
  destroy(): void;
}

interface VirtualListOptions<T = unknown> {
  data?: T[];
  itemHeight?: number;
  itemWidth?: number;
  bufferSize?: number;
  renderItem?: (item: T, index: number) => string;
  onItemClick?: (info: { item: T; index: number; key: string | number }) => void;
  onItemSelect?: (info: { item: T; index: number; key: string | number }) => void;
  onScroll?: (info: { scrollOffset: number; isHorizontal: boolean; dataLength: number; startIndex: number; endIndex: number }) => void;
  onScrollEnd?: (info: { scrollOffset: number; isHorizontal: boolean; dataLength: number; startIndex: number; endIndex: number }) => void;
  selectedKey?: string | number;
  keyField?: string;
  useDynamicHeight?: boolean;
  estimatedHeight?: number;
}

declare class VirtualList<T = unknown> {
  constructor(element: HTMLElement, options?: VirtualListOptions<T>);
  
  render(): void;
  update(): void;
  setData(data: T[]): void;
  addItem(item: T): void;
  removeItem(index: number): void;
  insertItem(index: number, item: T): void;
  scrollTo(index: number, behavior?: 'smooth' | 'auto'): void;
  scrollToKey(key: string | number, behavior?: 'smooth' | 'auto'): void;
  scrollToTop(behavior?: 'smooth' | 'auto'): void;
  scrollToBottom(behavior?: 'smooth' | 'auto'): void;
  select(key: string | number): void;
  getVisibleItems(): { item: T; index: number; key: string | number }[];
  getItemIndex(key: string | number): number;
  getItem(key: string | number): T | null;
  refreshCache(): void;
  destroy(): void;
}

declare const kupolaData: KupolaDataBind<Record<string, unknown>>;
declare const kupolaEvents: KupolaEventBus;

declare function initTheme(): void;
declare function initTooltip(): void;
declare function initDatepickers(): void;
declare function initTimepickers(): void;
declare function initNumberInputs(): void;
declare function initFileUploads(): void;
declare function initValidation(): void;

declare function setTheme(theme: ThemeType): void;
declare function getTheme(): ThemeType;
declare function toggleTheme(): void;

declare function setBrand(brand: BrandColor): void;
declare function getBrand(): BrandColor;
declare function createThemeToggle(): { toggleBtn: HTMLElement; container: HTMLElement };
declare function createBrandPicker(): { toggleBtn: HTMLElement; container: HTMLElement };
declare const BRAND_OPTIONS: readonly BrandOption[];

declare function showToast(options: ToastOptions | string): void;
declare function showSuccess(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
declare function showError(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
declare function showWarning(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
declare function showInfo(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;

declare function showModal(options: ModalOptions): Promise<void>;
declare function showConfirm(title: string, content: string): Promise<boolean>;
declare function showAlert(content: string, title?: string): Promise<void>;

declare function showNotification(options: NotificationOptions): void;

declare function registerComponent(name: string, componentClass: typeof KupolaComponent): void;

declare function registerLazyComponent(name: string, loader: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>): void;

declare function bootstrapComponents(root?: HTMLElement | Document): Promise<void>;

declare function defineMixin(name: string, mixin: ComponentMixin): void;

declare function useMixin(componentClass: typeof KupolaComponent, ...mixinNames: string[]): void;

interface DefineComponentOptions {
  componentClass?: typeof KupolaComponent;
  lazy?: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>;
  init?: (element: HTMLElement) => void | Promise<void>;
  cleanup?: (element: HTMLElement) => void;
  dataAttribute?: string;
  cssClass?: string;
}
declare function defineComponent(name: string, options: DefineComponentOptions): void;

declare function registerWebComponents(): void;

declare class KupolaDropdownElement extends HTMLElement {
  static get observedAttributes(): string[];
}
declare class KupolaTooltipElement extends HTMLElement {
  static get observedAttributes(): string[];
}
declare class KupolaCollapseElement extends HTMLElement {}
declare class KupolaCollapseItemElement extends HTMLElement {
  static get observedAttributes(): string[];
}
declare class KupolaDrawerElement extends HTMLElement {
  static get observedAttributes(): string[];
}
declare class KupolaModalElement extends HTMLElement {
  static get observedAttributes(): string[];
  open(): void;
  close(): void;
}

declare function createModal(options?: Record<string, unknown>): Modal;
declare function confirmModal(options: Record<string, unknown> | string): Modal;
declare function alertModal(options: Record<string, unknown> | string): Modal;

// ============================================================
// Configuration API
// ============================================================

interface KupolaPathsConfig {
  icons: string;
  base: string;
}

interface KupolaThemeConfig {
  default: ThemeType;
  brand: BrandColor;
}

interface KupolaI18nConfig {
  locale: string;
  fallbackLocale: string;
}

interface KupolaHttpConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials: boolean;
}

interface KupolaUiModalConfig {
  backdropClick: boolean;
}

interface KupolaUiDropdownConfig {
  closeOnClick: boolean;
}

interface KupolaUiDatepickerConfig {
  weekStart: number;
}

interface KupolaUiTooltipConfig {
  delay: number;
}

interface KupolaUiConfig {
  defaultSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  modal: KupolaUiModalConfig;
  dropdown: KupolaUiDropdownConfig;
  datepicker: KupolaUiDatepickerConfig;
  tooltip: KupolaUiTooltipConfig;
}

interface KupolaPerformanceConfig {
  lazyLoad: boolean;
  debounceDelay: number;
  throttleDelay: number;
  animationEnabled: boolean;
}

interface KupolaSecuritySanitizeConfig {
  enabled: boolean;
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
}

interface KupolaSecurityMaskPattern {
  regex: string;
  replace: string;
}

interface KupolaSecurityMaskConfig {
  enabled: boolean;
  patterns: Record<string, KupolaSecurityMaskPattern>;
}

interface KupolaSecuritySecureIdConfig {
  length: number;
  charset: string;
}

interface KupolaSecurityConfig {
  xssProtection: boolean;
  sanitizeHtml: KupolaSecuritySanitizeConfig;
  maskData: KupolaSecurityMaskConfig;
  secureId: KupolaSecuritySecureIdConfig;
}

interface KupolaMessageConfig {
  duration: number;
  position: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxCount: number;
}

interface KupolaNotificationConfig {
  duration: number;
  position: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface KupolaValidationConfig {
  defaultRules: string[];
  showErrors: boolean;
  trigger: 'blur' | 'input' | 'both';
}

interface KupolaComponentsConfig {
  autoInit: boolean;
  silentErrors: boolean;
}

interface KupolaConfig {
  paths: KupolaPathsConfig;
  theme: KupolaThemeConfig;
  i18n: KupolaI18nConfig;
  http: KupolaHttpConfig;
  ui: KupolaUiConfig;
  performance: KupolaPerformanceConfig;
  security: KupolaSecurityConfig;
  message: KupolaMessageConfig;
  notification: KupolaNotificationConfig;
  validation: KupolaValidationConfig;
  components: KupolaComponentsConfig;
}

declare function setConfig(options: Partial<KupolaConfig>): void;
declare function getConfig(key?: string): KupolaConfig | unknown;
declare function getIconsPath(): string;
declare function getBasePath(): string;
declare function getDefaultTheme(): ThemeType;
declare function getDefaultBrand(): BrandColor;
declare function getHttpConfig(): KupolaHttpConfig;
declare function getUiConfig(): KupolaUiConfig;
declare function getSecurityConfig(): KupolaSecurityConfig;
declare function getPerformanceConfig(): KupolaPerformanceConfig;
declare function getMessageConfig(): KupolaMessageConfig;
declare function getNotificationConfig(): KupolaNotificationConfig;
declare function getValidationConfig(): KupolaValidationConfig;

declare function cleanupAllDropdowns(): void;
declare function cleanupAllSlideCaptchas(): void;

declare function ref<T = unknown>(initialValue?: T): { value: T; _subscribers: Set<Function>; subscribe: (callback: Function) => { unsubscribe: () => void } };

declare class Modal {
  constructor(element: HTMLElement, options?: Record<string, unknown>);
  open(): void;
  close(): void;
  toggleFullscreen(): void;
  isVisible(): boolean;
  destroy(): void;
}

declare const kupolaRegistry: KupolaComponentRegistry;

declare const kupolaPersist: KupolaStatePersist;

declare const kupolaStoreManager: KupolaStoreManager;

declare function createStore<S extends object = Record<string, unknown>>(name: string, options?: StoreOptions<S>): KupolaStore<S>;

declare function getStore<S extends object = Record<string, unknown>>(name: string): KupolaStore<S> | undefined;

// ============================================================
// @kupola/depends - Declarative Data Dependencies
// ============================================================

// --- HTTP Client Plugin System ---
interface KupolaHttpResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  headers: Record<string, string>;
  url?: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

interface KupolaHttpClient {
  fetch(url: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<KupolaHttpResponse>;
}

declare function configureHttpClient(client: KupolaHttpClient): void;
declare function getHttpClient(): KupolaHttpClient['fetch'];
declare function resetHttpClient(): void;

declare class Scheduler {
  constructor();
  schedule(fn: () => void): void;
}

declare class CacheEntry<T = unknown> {
  constructor(data: T, ttl: number);
  readonly data: T;
  readonly createdAt: number;
  readonly ttl: number;
  readonly isFresh: boolean;
  readonly isStale: boolean;
}

declare class CacheManager {
  constructor();
  get<T = unknown>(key: string): CacheEntry<T> | null;
  set<T = unknown>(key: string, data: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  getStale<T = unknown>(key: string): T | null;
}

declare class DependsError extends Error {
  constructor(message: string, code: string, cause?: unknown);
  readonly code: string;
  readonly cause?: unknown;
  readonly timestamp: number;
}

type SourceType = string | ((params: Record<string, unknown>) => unknown | Promise<unknown>);

interface DepsSourceConfig {
  source: SourceType;
  cacheKey?: string;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onError?: (error: DependsError) => void;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  default?: unknown;
  sync?: boolean;
  reconnect?: boolean;
  reconnectDelay?: number;
}

interface DepRef<T = unknown> {
  data: { value: T | null };
  loading: { value: boolean };
  error: { value: string | null };
  lastUpdated: { value: number | null };
  refresh(): Promise<void>;
  setValue?(value: unknown): void;
  send?(msg: unknown): void;
}

type DepsConfig = Record<string, DepsSourceConfig | string>;
type DepsProps = Record<string, unknown | { value: unknown }>;
type DepsResult<C extends DepsConfig> = {
  [K in keyof C]: DepRef;
} & { _dispose(): void };

declare function useDeps<C extends DepsConfig>(props: DepsProps, depsConfig: C): DepsResult<C>;

declare function useQuery<T = unknown>(config: DepsSourceConfig): {
  data: { value: T | null };
  loading: { value: boolean };
  error: { value: string | null };
  refresh(): Promise<void>;
};

declare function clearCache(): void;

// ============================================================
// Table & Pagination Components
// ============================================================

interface KupolaTableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorter?: (a: T, b: T, order?: string) => number;
  fixed?: 'left' | 'right';
  render?: (value: unknown, row: T, index?: number) => string | HTMLElement;
  editable?: boolean;
  editType?: string;
  editOptions?: Array<{ value: string; label: string }>;
}

interface KupolaTableTreeOptions {
  childrenKey?: string;
  defaultExpandAll?: boolean;
}

interface KupolaTableVirtualScrollOptions {
  rowHeight: number;
  overscan?: number;
  maxHeight?: string;
}

interface KupolaTableOptions<T = Record<string, unknown>> {
  columns: KupolaTableColumn<T>[];
  rowKey?: string;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  emptyText?: string;
  loadingText?: string;
  showFilter?: boolean;
  showToolbar?: boolean;
  showExport?: boolean;
  showPageSize?: boolean;
  selection?: 'checkbox' | 'radio';
  expandable?: (row: T) => string | HTMLElement;
  editable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  multiSort?: boolean;
  tree?: KupolaTableTreeOptions;
  virtualScroll?: KupolaTableVirtualScrollOptions;
  mergeCells?: (data: T[]) => Array<{ row: number; col: number; rowSpan: number; colSpan: number }>;
  onSort?: (sorts: Array<{ key: string; order: string }>) => void;
  onFilter?: (text: string) => void;
  onRowClick?: (row: T, index: number, event: Event) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onSelect?: (selectedKeys: unknown[], selectedRows: T[]) => void;
  onExpand?: (key: unknown, isExpanded: boolean) => void;
  onEditSave?: (row: T, colKey: string, newValue: unknown, allData: T[]) => void;
  onEditCancel?: (editingCell: { row: T; colKey: string; value: unknown }) => void;
  onColumnResize?: (colKey: string, newWidth: number) => void;
  onRowDragEnd?: (movedRow: T, fromIndex: number, toIndex: number, newData: T[]) => void;
}

declare class KupolaTable<T = Record<string, unknown>> {
  constructor(element: HTMLElement | string, options?: KupolaTableOptions<T>);
  setData(data: T[] | { value: T[] | null }): void;
  setLoading(loading: boolean): void;
  setColumns(columns: KupolaTableColumn<T>[]): void;
  setPageSize(size: number): void;
  getSortState(): { key: string | null; order: string | null } | Array<{ key: string; order: string }>;
  getPage(): { current: number; pageSize: number; total: number };
  refresh(): void;
  exportCSV(filename?: string): void;
  selectAll(): void;
  deselectAll(): void;
  invertSelection(): void;
  selectRow(key: unknown): void;
  deselectRow(key: unknown): void;
  getSelectedKeys(): unknown[];
  getSelectedRows(): T[];
  destroy(): void;
}

declare function initTable<T = Record<string, unknown>>(element: HTMLElement | string, options?: KupolaTableOptions<T>): KupolaTable<T>;
declare function initAllTables(): KupolaTable[];

interface KupolaPaginationOptions {
  current?: number;
  total?: number;
  pageSize?: number;
  maxPages?: number;
  showTotal?: boolean;
  showSizeChanger?: boolean;
  pageSizes?: number[];
  simple?: boolean;
  onChange?: (page: number, pageSize: number) => void;
}

declare class KupolaPagination {
  constructor(element: HTMLElement | string, options?: KupolaPaginationOptions);
  setCurrent(page: number): void;
  setTotal(total: number): void;
  setPageSize(size: number): void;
  destroy(): void;
}

declare function initPagination(element: HTMLElement | string, options?: KupolaPaginationOptions): KupolaPagination;


declare module 'kupola' {
  export type Primitive = string | number | boolean | null | undefined;
  
  export type Reactive<T> = T extends Primitive
    ? T
    : T extends Array<infer U>
    ? Reactive<U>[]
    : T extends object
    ? { [K in keyof T]: Reactive<T[K]> }
    : T;
  
  export type ThemeType = 'dark' | 'light';
  export type BrandColor = 
    | 'zengqing'
    | 'green'
    | 'xionghuang'
    | 'jianghuang'
    | 'lanlv'
    | 'kongquelan'
    | 'meiguizi'
    | 'shihong'
    | 'shanchahong'
    | 'quhong'
    | 'roulan';
  export type BindingType = 
    | 'text'
    | 'html'
    | 'value'
    | 'checked'
    | 'disabled'
    | 'hidden'
    | 'class'
    | 'style'
    | 'attr'
    | 'src'
    | 'href'
    | 'placeholder';
  
  export interface BrandOption {
    id: BrandColor;
    name: string;
    color: string;
  }
  export interface PersistOptions {
    storage?: 'local' | 'session';
    debounce?: number;
  }

  export interface FormState {
    valid: boolean;
    errors: Record<string, string>;
    errorCount: number;
    loading: boolean;
    submitting: boolean;
    disabled: boolean;
  }

  export interface StoreOptions<S extends object = Record<string, unknown>> {
    state?: () => S;
    getters?: Record<string, (state: S) => unknown>;
    actions?: Record<string, (context: StoreContext<S>) => unknown | Promise<unknown>>;
    mutations?: Record<string, (state: S, payload?: unknown) => void>;
  }

  export interface StoreContext<S extends object = Record<string, unknown>> {
    state: S;
    commit: (type: string, payload?: unknown) => void;
    dispatch: (type: string, payload?: unknown) => unknown | Promise<unknown>;
    getters: Record<string, unknown>;
  }
  export interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top' | 'bottom' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  }
  export interface ModalOptions {
    title?: string;
    content: string | HTMLElement;
    width?: string | number;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }
  export interface NotificationOptions {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClick?: () => void;
    onClose?: () => void;
  }
  export interface DatepickerOptions {
    format?: string;
    minDate?: Date | string;
    maxDate?: Date | string;
    disabledDates?: (date: Date) => boolean;
  }
  export interface TimepickerOptions {
    format?: '12h' | '24h';
    minTime?: string;
    maxTime?: string;
  }
  export interface NumberInputOptions {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
  }
  export interface HeatmapCell {
    date: string;
    value: number;
    level: number;
    element: HTMLElement;
  }
  export interface HeatmapOptions {
    data?: Array<{ date: string; value: number }>;
    startDate?: Date;
    endDate?: Date;
    cellSize?: number;
    color?: string;
    onCellClick?: (cell: HeatmapCell) => void;
  }
  export interface VirtualListItem<T = unknown> {
    data: T;
    index: number;
    element: HTMLElement;
  }
  export interface VirtualListOptions<T = unknown> {
    data?: T[];
    itemHeight?: number;
    containerHeight?: number;
    renderItem?: (item: T, index: number) => string;
    onItemClick?: (item: VirtualListItem<T>) => void;
  }
  
  export class KupolaDataBind<T extends object = Record<string, unknown>> {
    constructor();
    
    data: Reactive<T>;
    rawData: T;
    
    set<K extends keyof T>(key: K, value: T[K], silent?: boolean): void;
    set<V = unknown>(key: string, value: V, silent?: boolean): void;
    set(data: Partial<T>, silent?: boolean): void;
    
    get<K extends keyof T>(key: K): T[K];
    get<V = unknown>(key: string): V;
    
    observe<K extends keyof T>(key: K, callback: (newValue: T[K], oldValue: T[K]) => void): void;
    observe<V = unknown>(key: string, callback: (newValue: V, oldValue: V) => void): void;
    observe(callback: (key: string, newValue: unknown, oldValue: unknown) => void): void;
    
    unobserve<K extends keyof T>(key: K, callback: (newValue: T[K], oldValue: T[K]) => void): void;
    unobserve<V = unknown>(key: string, callback: (newValue: V, oldValue: V) => void): void;
    
    computed<K extends string, R = unknown>(name: K, deps: (keyof T | string)[], callback: (...args: unknown[]) => R): void;
    
    bind(): void;
    load(data: Partial<T>): void;
    reset(): void;
    destroy(): void;
    
    persist<K extends keyof T>(key: K, options?: PersistOptions): void;
    persist(key: string, options?: PersistOptions): void;
    unpersist<K extends keyof T>(key: K): void;
    unpersist(key: string): void;
    
    snapshot(): number;
    rollback(index?: number): boolean;
    getSnapshotCount(): number;
    clearSnapshots(): void;
    
    serializeForm(formElement: HTMLFormElement): Record<string, unknown>;
    fillForm(formElement: HTMLFormElement, data: Record<string, unknown>): void;
  }
  
  export class KupolaEventBus {
    constructor();
    
    on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
    on(callback: (eventName: string, data: unknown) => void): void;
    
    off<T = unknown>(eventName: string, callback: (data: T) => void): void;
    off(callback: (eventName: string, data: unknown) => void): void;
    
    emit<T = unknown>(eventName: string, data: T): void;
    
    once<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
    once(callback: (eventName: string, data: unknown) => void): void;
    
    delegate(selector: string, eventName: string, callback: (event: Event) => void): () => void;
    undelegate(selector: string, eventName: string): void;
    
    destroy(): void;
  }
  
  export class KupolaStore<S extends object = Record<string, unknown>> {
    constructor(name: string, options?: StoreOptions<S>);
    
    readonly name: string;
    readonly state: S;
    
    commit(type: string, payload?: unknown): void;
    dispatch(type: string, payload?: unknown): unknown | Promise<unknown>;
    
    observe(callback: (newState: S, oldState: S) => void): () => void;
    unobserve(callback: (newState: S, oldState: S) => void): void;
    
    toJSON(): { name: string; state: S; getters: Record<string, unknown> };
  }
  
  export class KupolaStoreManager {
    constructor();
    
    createStore<S extends object = Record<string, unknown>>(name: string, options?: StoreOptions<S>): KupolaStore<S>;
    getStore<S extends object = Record<string, unknown>>(name: string): KupolaStore<S> | undefined;
    registerStore(store: KupolaStore): void;
    dispose(): void;
  }
  

  export interface ComponentMixin {
    [key: string]: unknown;
  }

  export class KupolaComponent {
    constructor(element: HTMLElement);
    
    readonly element: HTMLElement;
    readonly isMounted: boolean;
    readonly isDestroyed: boolean;
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    slots: Record<string, string>;
    
    $slot(name?: string): string;
    $emit<T = unknown>(eventName: string, data?: T): void;
    $on<T = unknown>(eventName: string, handler: (data: T) => void): (data: T) => void;
    $off<T = unknown>(eventName: string, handler: (data: T) => void): void;
    
    setProps(newProps: Record<string, unknown>): void;
    setState(newState: Record<string, unknown>): void;
    
    mount(): void;
    unmount(): void;
    
    beforeMount(): void;
    afterMount(): void;
    beforeUnmount(): void;
    afterUnmount(): void;
    updated(): void;
    render(): void;
  }
  
  export class KupolaComponentRegistry {
    constructor();
    
    register(name: string, componentClass: typeof KupolaComponent): void;
    registerLazy(name: string, loader: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>): void;
    unregister(name: string): void;
    get(name: string): typeof KupolaComponent | undefined;
    getAsync(name: string): Promise<typeof KupolaComponent>;
    
    defineMixin(name: string, mixin: ComponentMixin): void;
    useMixin(componentClass: typeof KupolaComponent, ...mixinNames: string[]): void;
    
    bootstrap(root?: HTMLElement | Document): Promise<void>;
    destroy(): void;
  }
  

  export class KupolaStatePersist {
    constructor();
    
    persist(key: string, options?: PersistOptions): void;
    unpersist(key: string): void;
    loadPersisted(): Record<string, unknown>;
  }
  
  export class Heatmap {
    constructor(element: HTMLElement, options?: HeatmapOptions);
    
    render(): void;
    updateData(data: Array<{ date: string; value: number }>): void;
    setColor(color: string): void;
    destroy(): void;
  }
  
  export class VirtualList<T = unknown> {
    constructor(element: HTMLElement, options?: VirtualListOptions<T>);
    
    render(): void;
    updateData(data: T[]): void;
    scrollTo(index: number): void;
    destroy(): void;
  }
  
  export const kupolaData: KupolaDataBind<Record<string, unknown>>;
  export const kupolaEvents: KupolaEventBus;
  export const kupolaRegistry: KupolaComponentRegistry;
  export const kupolaPersist: KupolaStatePersist;
  export const kupolaStoreManager: KupolaStoreManager;
  
  export class KupolaValidator {
    constructor();
    
    addValidator(name: string, callback: (value: unknown, params: unknown[]) => boolean): void;
    addAsyncValidator(name: string, callback: (value: unknown, params: unknown[], input: HTMLElement) => Promise<boolean>): void;
    
    validate(form: HTMLFormElement): boolean;
    validateAsync(form: HTMLFormElement, options?: { group?: string }): Promise<boolean>;
    validateInput(input: HTMLElement): boolean;
    validateInputAsync(input: HTMLElement): Promise<boolean>;
    validateGroup(form: HTMLFormElement, groupName: string): Promise<boolean>;
    getGroups(form: HTMLFormElement): string[];
    
    getFormState(form: HTMLFormElement): FormState;
    updateFormState(form: HTMLFormElement): void;
    setFormLoading(form: HTMLFormElement, loading: boolean): void;
    setFormSubmitting(form: HTMLFormElement, submitting: boolean): void;
    setFormDisabled(form: HTMLFormElement, disabled: boolean): void;
    resetForm(form: HTMLFormElement): void;
    
    showError(input: HTMLElement, message: string): void;
    clearError(input: HTMLElement): void;
  }
  
  export const validator: KupolaValidator;
  
  export function initTheme(): void;
  export function initTooltip(): void;
  export function initDatepickers(): void;
  export function initTimepickers(): void;
  export function initNumberInputs(): void;
  export function initFileUploads(): void;
  export function initValidation(): void;
  
  export function setTheme(theme: ThemeType): void;
  export function getTheme(): ThemeType;
  export function toggleTheme(): void;
  
  export function setBrand(brand: BrandColor): void;
  export function getBrand(): BrandColor;
  export function createThemeToggle(): { toggleBtn: HTMLElement; container: HTMLElement };
  export function createBrandPicker(): { toggleBtn: HTMLElement; container: HTMLElement };
  export const BRAND_OPTIONS: readonly BrandOption[];
  
  export function showToast(options: ToastOptions | string): void;
  export function showSuccess(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
  export function showError(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
  export function showWarning(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
  export function showInfo(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): void;
  
  export function showModal(options: ModalOptions): Promise<void>;
  export function showConfirm(title: string, content: string): Promise<boolean>;
  export function showAlert(content: string, title?: string): Promise<void>;
  
  export function showNotification(options: NotificationOptions): void;
  
  export function registerComponent(name: string, componentClass: typeof KupolaComponent): void;
  
  export function registerLazyComponent(name: string, loader: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>): void;
  
  export function bootstrapComponents(root?: HTMLElement | Document): Promise<void>;
  
  export function defineMixin(name: string, mixin: ComponentMixin): void;
  
  export function useMixin(componentClass: typeof KupolaComponent, ...mixinNames: string[]): void;

  export interface DefineComponentOptions {
    componentClass?: typeof KupolaComponent;
    lazy?: () => Promise<{ default: typeof KupolaComponent } | typeof KupolaComponent>;
    init?: (element: HTMLElement) => void | Promise<void>;
    cleanup?: (element: HTMLElement) => void;
    dataAttribute?: string;
    cssClass?: string;
  }
  export function defineComponent(name: string, options: DefineComponentOptions): void;

  export function registerWebComponents(): void;

  export class KupolaDropdownElement extends HTMLElement {
    static get observedAttributes(): string[];
  }
  export class KupolaTooltipElement extends HTMLElement {
    static get observedAttributes(): string[];
  }
  export class KupolaCollapseElement extends HTMLElement {}
  export class KupolaCollapseItemElement extends HTMLElement {
    static get observedAttributes(): string[];
  }
  export class KupolaDrawerElement extends HTMLElement {
    static get observedAttributes(): string[];
  }
  export class KupolaModalElement extends HTMLElement {
    static get observedAttributes(): string[];
    open(): void;
    close(): void;
  }

  export function createModal(options?: Record<string, unknown>): InstanceType<typeof Modal>;
  export function confirmModal(options: Record<string, unknown> | string): InstanceType<typeof Modal>;
  export function alertModal(options: Record<string, unknown> | string): InstanceType<typeof Modal>;

  export function cleanupAllDropdowns(): void;
  export function cleanupAllSlideCaptchas(): void;

  export function ref<T = unknown>(initialValue?: T): { value: T; _subscribers: Set<Function>; subscribe: (callback: Function) => { unsubscribe: () => void } };

  export class Modal {
    constructor(element: HTMLElement, options?: Record<string, unknown>);
    open(): void;
    close(): void;
    toggleFullscreen(): void;
    isVisible(): boolean;
    destroy(): void;
  }

  export function createStore<S extends object = Record<string, unknown>>(name: string, options?: StoreOptions<S>): KupolaStore<S>;
  
  export function getStore<S extends object = Record<string, unknown>>(name: string): KupolaStore<S> | undefined;
  
  // @kupola/depends

  // HTTP Client Plugin System
  export interface KupolaHttpResponse {
    ok: boolean;
    status: number;
    statusText?: string;
    headers: Record<string, string>;
    url?: string;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }

  export interface KupolaHttpClient {
    fetch(url: string, options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }): Promise<KupolaHttpResponse>;
  }

  export function configureHttpClient(client: KupolaHttpClient): void;
  export function getHttpClient(): KupolaHttpClient['fetch'];
  export function resetHttpClient(): void;

  export class Scheduler {
    constructor();
    schedule(fn: () => void): void;
  }

  export class CacheEntry<T = unknown> {
    constructor(data: T, ttl: number);
    readonly data: T;
    readonly createdAt: number;
    readonly ttl: number;
    readonly isFresh: boolean;
    readonly isStale: boolean;
  }

  export class CacheManager {
    constructor();
    get<T = unknown>(key: string): CacheEntry<T> | null;
    set<T = unknown>(key: string, data: T, ttl?: number): void;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
    getStale<T = unknown>(key: string): T | null;
  }

  export class DependsError extends Error {
    constructor(message: string, code: string, cause?: unknown);
    readonly code: string;
    readonly cause?: unknown;
    readonly timestamp: number;
  }

  export type SourceType = string | ((params: Record<string, unknown>) => unknown | Promise<unknown>);

  export interface DepsSourceConfig {
    source: SourceType;
    cacheKey?: string;
    staleTime?: number;
    retry?: number;
    retryDelay?: number;
    onError?: (error: DependsError) => void;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    default?: unknown;
    sync?: boolean;
    reconnect?: boolean;
    reconnectDelay?: number;
  }

  export interface DepRef<T = unknown> {
    data: { value: T | null };
    loading: { value: boolean };
    error: { value: string | null };
    lastUpdated: { value: number | null };
    refresh(): Promise<void>;
    setValue?(value: unknown): void;
    send?(msg: unknown): void;
  }

  export type DepsConfig = Record<string, DepsSourceConfig | string>;
  export type DepsProps = Record<string, unknown | { value: unknown }>;
  export type DepsResult<C extends DepsConfig> = {
    [K in keyof C]: DepRef;
  } & { _dispose(): void };

  export function useDeps<C extends DepsConfig>(props: DepsProps, depsConfig: C): DepsResult<C>;

  export function useQuery<T = unknown>(config: DepsSourceConfig): {
    data: { value: T | null };
    loading: { value: boolean };
    error: { value: string | null };
    refresh(): Promise<void>;
  };

  export function clearCache(): void;

  // Table & Pagination
  export { KupolaTable, KupolaTableColumn, KupolaTableOptions, KupolaPagination, KupolaPaginationOptions };
  export { initTable, initAllTables, initPagination };

  // Utils (tree-shakeable namespace exports)
  export { KupolaUtils, stringUtils, arrayUtils, objectUtils, numberUtils, dateUtils };
  export { debounce, throttle, validatorUtils, cryptoUtils, preloadUtils };

}