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
} from 'nimbus';

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
