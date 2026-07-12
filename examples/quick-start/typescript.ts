/**
 * Kupola TypeScript Example
 * Demonstrates the real public API of @kupola/kupola
 */
import { 
  // Data-binding
  kupolaData, ref, createStore, getStore,
  KupolaDataBind, KupolaEventBus,
  // Theme
  setTheme, getTheme, setBrand, getBrand,
  // Components
  KupolaComponent, registerComponent, bootstrapComponents,
  // Modal & Dialog
  Modal, createModal, confirmModal, alertModal,
  Dialog, Message, Notification,
  // Form
  KupolaForm, initFormValidation, validateForm,
  // Table
  KupolaTable, initTable,
  // Dropdown
  Dropdown, initDropdowns, cleanupDropdown,
  // Utils
  debounce, throttle, stringUtils, dateUtils,
  // Icons
  svg, renderIcon,
  // Global Events
  globalEvents, on, off, emit,
  // Lifecycle
  createLifecycle,
  // i18n
  createI18n, t, setLocale, getLocale,
  // Types
  type ThemeType,
} from 'kupola';

// ── Data-binding ──────────────────────────────────

interface User {
  name: string;
  age: number;
  active: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

const typedData = kupolaData as KupolaDataBind<{ user: User; counter: number }>;

const userData = typedData.data.user = {
  name: 'John',
  age: 25,
  active: true,
  firstName: 'John',
  lastName: 'Doe',
};

userData.name = 'Jane';
userData.age = 26;

typedData.observe<string>('user.name', (newValue, oldValue) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

typedData.computed<string>('user.fullName', ['user.firstName', 'user.lastName'], (first, last) => {
  return `${first || ''} ${last || ''}`.trim();
});

// ── Ref (reactive primitive) ──────────────────────

const count = ref(0);
count.value = 1;
console.log('Count:', count.value);

// ── Store ─────────────────────────────────────────

const userStore = createStore('users', {
  list: [] as User[],
  loading: false,
});

console.log('Store state:', userStore.getState());

// ── Global Events ─────────────────────────────────

on<User>('user:updated', (data) => {
  console.log('User updated:', data);
});

emit<User>('user:updated', { name: 'Jane', age: 25, active: true });

// ── Theme & Brand ─────────────────────────────────

setTheme('light');
console.log('Current theme:', getTheme());

setBrand('zengqing');
console.log('Current brand:', getBrand());

// ── Message & Notification ────────────────────────

Message.success('Operation completed!');
Message.error('Something went wrong.');

Notification.show({
  title: 'New Message',
  content: 'You have a new message from Jane.',
  type: 'info',
  duration: 5000,
});

// ── Modal ─────────────────────────────────────────

confirmModal({
  title: 'Confirm',
  content: 'Are you sure?',
  onConfirm: () => {
    console.log('Confirmed');
  },
  onCancel: () => {
    console.log('Cancelled');
  },
});

// ── Utils ─────────────────────────────────────────

const debouncedSearch = debounce((query: string) => {
  console.log('Searching:', query);
}, 300);

debouncedSearch('hello');

const throttledScroll = throttle(() => {
  console.log('Scroll handler');
}, 200);

console.log(stringUtils.capitalize('hello'));    // 'Hello'
console.log(stringUtils.camelCase('hello-world')); // 'helloWorld'

console.log(dateUtils.formatDate(new Date(), 'yyyy-MM-dd'));

// ── Icons ─────────────────────────────────────────

const iconSvg = svg('check', { width: 16, height: 16 });
console.log('Icon SVG:', iconSvg);

const rendered = renderIcon('settings', { width: 20, height: 20 });
console.log('Rendered icon:', rendered);

// ── Lifecycle ─────────────────────────────────────

const lifecycle = createLifecycle({
  onInit() {
    console.log('Component initialized');
  },
  onDestroy() {
    console.log('Component destroyed');
  },
});

// ── i18n ──────────────────────────────────────────

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': { greeting: '你好，{name}！' },
    'en': { greeting: 'Hello, {name}!' },
  },
});

setLocale('zh-CN');
console.log(t('greeting', { name: 'Kupola' }));

// ── Custom Component ──────────────────────────────

class CounterComponent extends KupolaComponent {
  state = { count: 0 };

  beforeMount() {
    console.log('CounterComponent: beforeMount');
  }

  afterMount() {
    console.log('CounterComponent: afterMount');
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <div class="ds-card" style="padding: 16px;">
        <div class="ds-text-lg font-bold mb-2">Count: ${this.state.count}</div>
        <button class="ds-btn ds-btn--primary">Increment</button>
      </div>
    `;
  }

  increment() {
    this.setState({ count: this.state.count + 1 });
  }
}

class WelcomeComponent extends KupolaComponent {
  afterMount() {
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <div class="ds-card" style="padding: 16px;">
        <div class="ds-text-lg font-bold">Welcome to Kupola!</div>
        <div class="ds-text-sm text-muted mt-1">This is a demo component.</div>
      </div>
    `;
  }
}

registerComponent('counter', CounterComponent);
registerComponent('welcome', WelcomeComponent);

bootstrapComponents();

console.log('All Kupola features loaded successfully!');
import { 
  kupolaData, 
  kupolaEvents, 
  kupolaRegistry,
  kupolaPersist,
  KupolaDataBind,
  KupolaComponent,
  KupolaComponentRegistry,
  KupolaRouter,
  KupolaHttp,
  setTheme, 
  setBrand, 
  showToast, 
  showModal,
  createRouter,
  createHttp,
  registerComponent,
  bootstrapComponents,
  type ThemeType,
  type BrandColor,
  type ToastOptions,
  type RouteConfig,
  type HttpResponse,
  type PersistOptions
} from 'kupola';

interface Address {
  city: string;
  street: string;
}

interface User {
  name: string;
  age: number;
  active: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  address?: Address;
}

interface UsersResponse {
  list: User[];
  total: number;
  page: number;
}

interface LoginResponse {
  token: string;
  user: User;
}

const typedData = kupolaData as KupolaDataBind<{ user: User; counter: number; theme: ThemeType }>;
const userData = typedData.data.user = {
  name: 'John',
  age: 25,
  active: true,
  firstName: 'John',
  lastName: 'Doe',
  address: {
    city: 'Beijing',
    street: 'Main Street'
  }
};

userData.name = 'Jane';
userData.age = 26;
userData.address.city = 'Shanghai';

typedData.observe<string>('user.name', (newValue, oldValue) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

typedData.observe<string>('user.address.city', (newValue, oldValue) => {
  console.log(`City changed from ${oldValue} to ${newValue}`);
});

typedData.computed<string>('user.fullName', ['user.firstName', 'user.lastName'], (first, last) => {
  return `${first || ''} ${last || ''}`.trim();
});

kupolaEvents.on<User>('user:updated', (data) => {
  console.log('User updated:', data);
});

kupolaEvents.emit<User>('user:updated', { name: 'Jane', age: 25, active: true });

setTheme('light');

setBrand('zengqing');

showToast('Hello, Kupola!');

showToast({
  message: 'Success!',
  type: 'success',
  duration: 3000,
  position: 'top-right'
});

showModal({
  title: 'Confirm',
  content: 'Are you sure?',
  showCancel: true,
  onConfirm: () => {
    console.log('Confirmed');
  }
});

const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: 'home', name: 'Home' },
    { path: '/about', component: 'about', name: 'About' },
    { path: '/users/:id', component: 'user', name: 'User' }
  ]
});

router.beforeEach((to, from) => {
  console.log(`Navigating from ${from?.name || 'unknown'} to ${to.name}`);
});

router.afterEach((to) => {
  console.log(`Navigated to ${to.name}`);
});

router.push('/about');

const http = createHttp({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.get<UsersResponse>('/users', { params: { page: 1, limit: 10 } }).then((response) => {
  console.log(response.data.list);
});

http.post<LoginResponse>('/login', { username: 'admin', password: 'password' }).then((response) => {
  http.setToken(response.data.token);
});

http.interceptors.request = (config) => {
  console.log('Request:', config.url);
  return config;
};

http.interceptors.response = <T>(response: HttpResponse<T>) => {
  console.log('Response:', response.status);
  return response;
};

const customDataBind = new KupolaDataBind<User>();
customDataBind.data.name = 'Custom User';
customDataBind.data.age = 30;
customDataBind.data.active = true;

customDataBind.observe('name', (newValue: string, oldValue: string) => {
  console.log(`Custom user name changed: ${oldValue} -> ${newValue}`);
});

typedData.set('counter', 0);

typedData.persist('counter', { storage: 'local', debounce: 500 });

typedData.observe<number>('counter', (newValue) => {
  console.log('Counter:', newValue);
});

typedData.set('counter', 1);
typedData.set('counter', 2);

class CounterComponent extends KupolaComponent {
  constructor(element: HTMLElement) {
    super(element);
    this.state = { count: parseInt(this.props.initialCount as string) || 0 };
  }

  beforeMount() {
    console.log('CounterComponent: beforeMount');
  }

  afterMount() {
    console.log('CounterComponent: afterMount');
    this.render();
  }

  beforeUnmount() {
    console.log('CounterComponent: beforeUnmount');
  }

  afterUnmount() {
    console.log('CounterComponent: afterUnmount');
  }

  render() {
    this.element.innerHTML = `
      <div class="ds-card" style="padding: 16px;">
        <div class="ds-text-lg font-bold mb-2">Count: ${this.state.count}</div>
        <button class="ds-btn ds-btn--primary" onclick="this.closest('[data-component]').__kupolaInstance.increment()">Increment</button>
      </div>
    `;
  }

  increment() {
    this.setState({ count: (this.state.count as number) + 1 });
  }
}

class WelcomeComponent extends KupolaComponent {
  beforeMount() {
    console.log('WelcomeComponent: beforeMount');
  }

  afterMount() {
    console.log('WelcomeComponent: afterMount');
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <div class="ds-card" style="padding: 16px;">
        <div class="ds-text-lg font-bold">Welcome to Kupola!</div>
        <div class="ds-text-sm text-muted mt-1">This is a demo component using the component system.</div>
      </div>
    `;
  }
}

registerComponent('counter', CounterComponent);
registerComponent('welcome', WelcomeComponent);

bootstrapComponents();

console.log('All Kupola features loaded successfully!');
