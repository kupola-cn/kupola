/**
 * Kupola — Main entry point. Re-exports all public APIs.
 * @module kupola
 * @example
 * import { useDeps, ref, configureHttpClient, initTheme } from 'kupola';
 */

import { KupolaLifecycle, createLifecycle, kupolaLifecycle } from '../js/kupola-lifecycle.js';
import { KupolaUtils, stringUtils, arrayUtils, objectUtils, numberUtils, dateUtils, debounce, throttle, validatorUtils, cryptoUtils, preloadUtils } from '../js/utils.js';
import { 
  KupolaDataBind, KupolaEventBus, KupolaStore, KupolaStoreManager,
  kupolaData, kupolaEvents, kupolaStoreManager, createStore, getStore, ref
} from '../js/data-bind.js';
import { 
  initTheme, setTheme, getTheme, setBrand, getBrand,
  createThemeToggle, createBrandPicker, BRAND_OPTIONS
} from '../js/theme.js';
import { setConfig, getConfig, getIconsPath, getBasePath, getDefaultTheme, getDefaultBrand } from '../js/kupola-config.js';
import { ComponentInitializerRegistry, kupolaInitializer } from '../js/initializer.js';
import { 
  KupolaComponent, applyMixin,
  KupolaComponentRegistry,
  kupolaRegistry,
  kupolaBootstrap,
  registerComponent,
  registerLazyComponent,
  bootstrapComponents,
  defineMixin,
  useMixin,
  defineComponent
} from '../js/kupola-core.js';

import { 
  KupolaI18n, kupolaI18n, createI18n, 
  t, n, setLocale, getLocale,
  formatDate, formatNumber, formatCurrency 
} from '../js/i18n.js';
import { Dropdown, initDropdown, initDropdowns, cleanupDropdown, cleanupAllDropdowns } from '../js/dropdown.js';
import { Select, initSelect, initSelects, cleanupSelect } from '../js/select.js';
import { Datepicker, initDatepicker, initDatepickers, cleanupDatepicker } from '../js/datepicker.js';
import { Timepicker, initTimepicker, initTimepickers, cleanupTimepicker } from '../js/timepicker.js';
import { Slider, initSlider, initSliders, cleanupSlider } from '../js/slider.js';
import { Carousel, initCarousel, initCarousels, cleanupCarousel } from '../js/carousel.js';
import { Drawer, initDrawer, initDrawers, cleanupDrawer } from '../js/drawer.js';
import { Modal, initModals, initModal, cleanupModal, createModal, confirmModal, alertModal } from '../js/modal.js';
import { Dialog } from '../js/dialog.js';
import { Notification, initNotifications } from '../js/notification.js';
import { Message, initMessages } from '../js/message.js';
import { FileUpload, initFileUploads, initFileUpload, cleanupFileUpload } from '../js/fileupload.js';
import { Collapse, initCollapses, initCollapse, cleanupCollapse } from '../js/collapse.js';
import { ColorPicker, initColorPicker, initColorPickers, cleanupColorPicker } from '../js/color-picker.js';
import { Calendar, initCalendars, initCalendar, cleanupCalendar } from '../js/calendar.js';
import { DynamicTags, initDynamicTagsAll, initDynamicTags, cleanupDynamicTags } from '../js/dynamic-tags.js';
import { ImagePreview, initImagePreview, showImagePreview } from '../js/image-preview.js';
import { Tag, initTags, initTag, cleanupTag } from '../js/tag.js';
import { StatCard, initStatCards, initStatCard, cleanupStatCard } from '../js/statcard.js';
import { Heatmap, initHeatmaps, initHeatmap, cleanupHeatmap } from '../js/heatmap.js';
import { Tooltip, initTooltip, initTooltips, cleanupTooltip } from '../js/tooltip.js';
import { KupolaValidator, validator } from '../js/validation.js';
import { VirtualList, initVirtualList, cleanupVirtualList } from '../js/virtual-list.js';

import { Icons, svg, render as renderIcon, PATHS } from '../js/icons.js';
import { Countdown, initCountdowns, initCountdown, cleanupCountdown } from '../js/countdown.js';
import { NumberInput, initNumberInputs, initNumberInput, cleanupNumberInput } from '../js/numberinput.js';
import { SlideCaptcha, initSlideCaptchas, cleanupSlideCaptcha, cleanupAllSlideCaptchas } from '../js/slide-captcha.js';
import { KupolaForm, initFormValidation, getFormInstance, validateForm } from '../js/form.js';

import { GlobalEvents, globalEvents, on, once, off, emit, emitGlobal, offByScope, offAll, getListenerCount } from '../js/global-events.js';

import { useDeps, useQuery, clearCache, Scheduler, CacheManager, CacheEntry, DependsError, DependsSource, FetchedSource, StorageSource, RouteSource, FunctionSource, StaticSource, WebSocketSource, createSource, configureHttpClient, getHttpClient, resetHttpClient } from '../js/depends.js';
import { KupolaTable, initTable, initAllTables } from '../js/table.js';
import { KupolaPagination, initPagination } from '../js/pagination.js';
import { registerWebComponents } from '../js/web-components.js';


export { KupolaComponent, applyMixin };
export { KupolaComponentRegistry };
export { KupolaLifecycle, createLifecycle, kupolaLifecycle };
export { KupolaUtils };
export { stringUtils, arrayUtils, objectUtils, numberUtils, dateUtils, debounce, throttle, validatorUtils, cryptoUtils, preloadUtils };
export { KupolaDataBind, KupolaEventBus, KupolaStore, KupolaStoreManager };
export { kupolaData, kupolaEvents, kupolaStoreManager, createStore, getStore };
export { initTheme, setTheme, getTheme, setBrand, getBrand, createThemeToggle, createBrandPicker, BRAND_OPTIONS };
export { ComponentInitializerRegistry, kupolaInitializer };
export { kupolaRegistry, kupolaBootstrap };
export { registerComponent, registerLazyComponent, bootstrapComponents };
export { defineMixin, useMixin, defineComponent };

export { Dropdown, initDropdown, initDropdowns, cleanupDropdown, cleanupAllDropdowns };
export { Select, initSelect, initSelects, cleanupSelect };
export { Datepicker, initDatepicker, initDatepickers, cleanupDatepicker };
export { Timepicker, initTimepicker, initTimepickers, cleanupTimepicker };
export { Slider, initSlider, initSliders, cleanupSlider };
export { Carousel, initCarousel, initCarousels, cleanupCarousel };
export { Drawer, initDrawer, initDrawers, cleanupDrawer };
export { Modal, initModals, initModal, cleanupModal, createModal, confirmModal, alertModal };
export { Dialog };
export { Notification, initNotifications };
export { Message, initMessages };
export { FileUpload, initFileUploads, initFileUpload, cleanupFileUpload };
export { Collapse, initCollapses, initCollapse, cleanupCollapse };
export { ColorPicker, initColorPicker, initColorPickers, cleanupColorPicker };
export { Calendar, initCalendars, initCalendar, cleanupCalendar };
export { DynamicTags, initDynamicTagsAll, initDynamicTags, cleanupDynamicTags };
export { ImagePreview, initImagePreview, showImagePreview };
export { Tag, initTags, initTag, cleanupTag };
export { StatCard, initStatCards, initStatCard, cleanupStatCard };
export { Heatmap, initHeatmaps, initHeatmap, cleanupHeatmap };
export { Tooltip, initTooltip, initTooltips, cleanupTooltip };
export { KupolaValidator, validator };
export { VirtualList, initVirtualList, cleanupVirtualList };
export { Icons, svg, renderIcon, PATHS };
export { Countdown, initCountdowns, initCountdown, cleanupCountdown };
export { NumberInput, initNumberInputs, initNumberInput, cleanupNumberInput };
export { SlideCaptcha, initSlideCaptchas, cleanupSlideCaptcha, cleanupAllSlideCaptchas };
export { KupolaForm, initFormValidation, getFormInstance, validateForm };
export { GlobalEvents, globalEvents, on, once, off, emit, emitGlobal, offByScope, offAll, getListenerCount };
export { useDeps, useQuery, clearCache, configureHttpClient, getHttpClient, resetHttpClient };
export { Scheduler, CacheManager, CacheEntry, DependsError };
export { DependsSource, FetchedSource, StorageSource, RouteSource, FunctionSource, StaticSource, WebSocketSource, createSource };
export { KupolaTable, initTable, initAllTables };
export { KupolaPagination, initPagination };
export { ref };
export { registerWebComponents };

export { 
  KupolaI18n, kupolaI18n, createI18n, 
  t, n, setLocale, getLocale,
  formatDate, formatNumber, formatCurrency 
};

export { setConfig, getConfig, getIconsPath, getBasePath, getDefaultTheme, getDefaultBrand };
