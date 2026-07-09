import '../js/component.js';
import '../js/registry.js';
import '../js/router.js';
import '../js/http.js';
import '../js/initializer.js';
import '../js/kupola-core.js';
import '../js/kupola-lifecycle.js';
import '../js/utils.js';
import '../js/data-bind.js';
import '../js/theme.js';
import '../js/dropdown.js';
import '../js/select.js';
import '../js/datepicker.js';
import '../js/timepicker.js';
import '../js/slider.js';
import '../js/carousel.js';
import '../js/drawer.js';
import '../js/modal.js';
import '../js/dialog.js';
import '../js/notification.js';
import '../js/message.js';
import '../js/fileupload.js';
import '../js/collapse.js';
import '../js/color-picker.js';
import '../js/calendar.js';
import '../js/dynamic-tags.js';
import '../js/image-preview.js';
import '../js/tag.js';
import '../js/statcard.js';
import '../js/heatmap.js';
import '../js/tooltip.js';
import '../js/validation.js';
import '../js/virtual-list.js';
import '../js/kupola-devtools.js';
import '../js/icons.js';
import '../js/countdown.js';
import '../js/numberinput.js';
import '../js/slide-captcha.js';
import '../js/composition-api.js';
import '../js/form.js';
import '../js/test-utils.js';
import '../js/i18n.js';
import '../js/global-events.js';
import '../js/security.js';
import '../js/error-handler.js';
import '../js/performance.js';

export const KupolaComponent = window.KupolaComponent;
export const KupolaComponentRegistry = window.KupolaComponentRegistry;
export const KupolaRouter = window.KupolaRouter;
export const KupolaHttp = window.KupolaHttp;
export const KupolaStatePersist = window.KupolaStatePersist;
export const KupolaLifecycle = window.KupolaLifecycle;
export const KupolaPluginManager = window.KupolaPluginManager;
export const KupolaDevTools = window.KupolaDevTools;

export const kupolaRegistry = window.kupolaRegistry;
export const kupolaPersist = window.kupolaPersist;
export const kupolaLifecycle = window.kupolaLifecycle;
export const kupolaPluginManager = window.kupolaPluginManager;
export const KupolaUtils = window.KupolaUtils;

export const createRouter = window.createRouter;
export const createHttp = window.createHttp;
export const createLifecycle = window.createLifecycle;
export const createStore = window.createStore;
export const getStore = window.getStore;
export const registerComponent = window.registerComponent;
export const registerLazyComponent = window.registerLazyComponent;
export const bootstrapComponents = window.bootstrapComponents;
export const defineMixin = window.defineMixin;
export const useMixin = window.useMixin;

export const initTheme = window.initTheme;
export const setTheme = window.setTheme;
export const getTheme = window.getTheme;
export const setBrand = window.setBrand;
export const getBrand = window.getBrand;

export const initDropdowns = window.initDropdowns;
export const initSelects = window.initSelects;
export const initDatePickers = window.initDatePickers;
export const initTimePickers = window.initTimePickers;
export const initSliders = window.initSliders;
export const initCarousels = window.initCarousels;
export const initDrawers = window.initDrawers;
export const initModals = window.initModals;
export const initDialogs = window.initDialogs;
export const initNotifications = window.initNotifications;
export const initMessages = window.initMessages;
export const initFileUploads = window.initFileUploads;
export const initCollapses = window.initCollapses;
export const initColorPickers = window.initColorPickers;
export const initCalendars = window.initCalendars;
export const initDynamicTags = window.initDynamicTags;
export const initImagePreviews = window.initImagePreviews;
export const initTags = window.initTags;
export const initStatCards = window.initStatCards;
export const initHeatmaps = window.initHeatmaps;
export const initTooltips = window.initTooltips;
export const initValidation = window.initValidation;
export const initVirtualLists = window.initVirtualLists;
export const initIcons = window.initIcons;
export const initCountdowns = window.initCountdowns;
export const initNumberInputs = window.initNumberInputs;
export const initSlideCaptchas = window.initSlideCaptchas;

export const setup = window.setup;
export const ref = window.ref;
export const reactive = window.reactive;
export const onMounted = window.onMounted;
export const onUnmounted = window.onUnmounted;
export const onUpdated = window.onUpdated;
export const watch = window.watch;
export const computed = window.computed;

export const KupolaForm = window.KupolaForm;
export const useForm = window.useForm;
export const createForm = window.createForm;

export const KupolaTestUtils = window.KupolaTestUtils;
export const testUtils = window.testUtils;

export const KupolaI18n = window.KupolaI18n;
export const kupolaI18n = window.kupolaI18n;
export const createI18n = window.createI18n;
export const t = window.t;
export const n = window.n;
export const setLocale = window.setLocale;
export const getLocale = window.getLocale;
export const formatDate = window.formatDate;
export const formatNumber = window.formatNumber;
export const formatCurrency = window.formatCurrency;

export const GlobalEventManager = window.GlobalEventManager;
export const globalEvents = window.globalEvents;
export const on = window.on;
export const off = window.off;
export const once = window.once;
export const clearScope = window.clearScope;

export const KupolaSecurity = window.KupolaSecurity;
export const kupolaSecurity = window.kupolaSecurity;

export const KupolaErrorHandler = window.KupolaErrorHandler;
export const kupolaErrorHandler = window.kupolaErrorHandler;

export const KupolaPerformance = window.KupolaPerformance;
export const kupolaPerformance = window.kupolaPerformance;

export default {
  KupolaComponent,
  KupolaComponentRegistry,
  KupolaRouter,
  KupolaHttp,
  KupolaStatePersist,
  KupolaLifecycle,
  KupolaPluginManager,
  KupolaDevTools,
  KupolaSecurity,
  KupolaErrorHandler,
  KupolaPerformance,
  kupolaRegistry,
  kupolaPersist,
  kupolaLifecycle,
  kupolaPluginManager,
  kupolaSecurity,
  kupolaErrorHandler,
  kupolaPerformance,
  KupolaUtils,
  createRouter,
  createHttp,
  createLifecycle,
  createStore,
  getStore,
  registerComponent,
  registerLazyComponent,
  bootstrapComponents,
  defineMixin,
  useMixin,
  initTheme,
  setTheme,
  getTheme,
  setBrand,
  getBrand,
  initDropdowns,
  initSelects,
  initDatePickers,
  initTimePickers,
  initSliders,
  initCarousels,
  initDrawers,
  initModals,
  initDialogs,
  initNotifications,
  initMessages,
  initFileUploads,
  initCollapses,
  initColorPickers,
  initCalendars,
  initDynamicTags,
  initImagePreviews,
  initTags,
  initStatCards,
  initHeatmaps,
  initTooltips,
  initValidation,
  initVirtualLists,
  initIcons,
  initCountdowns,
  initNumberInputs,
  initSlideCaptchas,
  setup,
  ref,
  reactive,
  onMounted,
  onUnmounted,
  onUpdated,
  watch,
  computed,
  KupolaForm,
  useForm,
  createForm,
  KupolaTestUtils,
  testUtils,
  KupolaI18n,
  kupolaI18n,
  createI18n,
  t,
  n,
  setLocale,
  getLocale,
  formatDate,
  formatNumber,
  formatCurrency,
  GlobalEventManager,
  globalEvents,
  on,
  off,
  once,
  clearScope
};