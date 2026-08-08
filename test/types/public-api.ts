import {
  $, $$, createApp, defineScope, destroyWalk, mount, setHtmlSanitizer, walkOnce,
  type AsyncEventHandler,
  type DirectiveDefinition,
  type EventHandler,
  type MaybePromise,
  type MaybeSignal,
  type MountOptions,
  type PageView,
  type ReactiveValue,
  type TemplateChild,
  type View,
  type ViewChild,
} from '@kupola/platform';
import { walkAuto } from '@kupola/platform/directives';
import {
  clearIcons as clearConfiguredIcons,
  getIcon as getConfiguredIcon,
  registerIcons as registerConfiguredIcons,
} from '@kupola/components/icon-config';
import {
  createIconResolver as createSubpathIconResolver,
  createKupolaIconProvider as createSubpathKupolaIconProvider,
  setupUi as setupSubpathUi,
} from '@kupola/components/ui';
import { Panel as PanelSubpath } from '@kupola/components/panel';
import {
  batch,
  computed,
  createScheduler,
  effect,
  effectScope,
  nextTick,
  onScopeDispose,
  reactive,
  setErrorHandler,
  signal,
  watch,
} from '@kupola/core';
import {
  enableProfiler,
  getProfileReport,
} from '@kupola/core/devtools';
import { html as templateHtml } from '@kupola/platform/template';
import { render as renderSubpath } from '@kupola/platform/render';
import { defineComponent as defineSubpathComponent } from '@kupola/platform/component';
import { setTheme as setSubpathTheme } from '@kupola/platform/theme';
import { lazyComponent as lazySubpathComponent } from '@kupola/platform/lazy';
import { ErrorBoundary } from '@kupola/platform/errors';
import { createAuthContext as createSubpathAuthContext } from '@kupola/auth/context';
import { createHttpGuard as createSubpathHttpGuard } from '@kupola/auth/http';
import { registerPermissionDirective } from '@kupola/auth/directive';
import {
  Carousel,
  Calendar,
  Countdown,
  DatePicker,
  Dialog,
  Dropdown,
  DynamicTags,
  Drawer,
  Input,
  Message,
  Modal,
  Notification,
  Pagination,
  Panel,
  Tooltip,
  VirtualList,
  Heatmap,
  Tabs,
  TextArea,
  Tree,
  type MessageOptions,
} from '@kupola/components';
import {
  PermissionDirective,
  processPermissionDirectives,
} from '@kupola/auth/directive';
import {
  SchemaForm,
  email,
  schema as schemaFormSchema,
  schemaSubmit,
  select,
  text,
  validateSchema,
  type SchemaFormApi,
  type SchemaSubmit,
  type SchemaValidationResult,
} from '@kupola/components/schemaform';
import type {
  NavigationGuardResult,
  RouteLocationInput,
  RouteParams,
  RouteQuery,
} from '@kupola/router';

const typedSignal = signal(1);
const typedComputed = computed(() => typedSignal.value + 1);
const typedState = reactive({ value: 1 });
const typedMaybeSignal: MaybeSignal<number> = typedSignal;
const typedReactiveValue: ReactiveValue<number> = () => typedComputed.value;
const typedMaybePromise: MaybePromise<number> = Promise.resolve(typedReactiveValue());
void typedMaybeSignal;
void typedMaybePromise;
const typedScheduler = createScheduler({ name: 'types', maxJobs: 100 });
const stopTypedEffect = effect(() => { typedState.value; }, { scheduler: typedScheduler });
const stopTypedWatch = watch(() => typedState.value, () => {}, { flush: 'post' });
const typedScope = effectScope();
typedScope.run(() => onScopeDispose(() => {}));
batch(() => { typedSignal.value = typedComputed.value; });
void nextTick();
setErrorHandler(null);
enableProfiler();
getProfileReport();
void templateHtml;
void renderSubpath;
void defineSubpathComponent;
void setSubpathTheme;
void lazySubpathComponent;
void ErrorBoundary;
void createSubpathAuthContext;
void createSubpathHttpGuard;
void registerPermissionDirective;
void PermissionDirective;
void processPermissionDirectives;
registerConfiguredIcons({ custom: '<svg></svg>' });
void getConfiguredIcon('custom');
clearConfiguredIcons();
void createSubpathIconResolver;
void createSubpathKupolaIconProvider;
void setupSubpathUi;
const typedTemplateChild: TemplateChild = [ templateHtml`<span>child</span>` ];
const typedViewChild: ViewChild = () => typedTemplateChild;
const typedView: View<{ title: string; content: ViewChild }> = ({ title, content }) => templateHtml`<h1>${title}</h1>${content}`;
const typedPageView: PageView<{ title: string; content: ViewChild }> = typedView;
const typedClickHandler: EventHandler<MouseEvent> = event => event.preventDefault();
const typedSubmitHandler: AsyncEventHandler<SubmitEvent> = async event => { event.preventDefault(); };
void typedPageView({ title: 'Typed view', content: typedViewChild });
void typedClickHandler;
void typedSubmitHandler;
type CreateUserInput = {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
};
const typedUserSchema = schemaFormSchema<CreateUserInput>({
  name: text('Name').required(),
  email: email('Email').required(),
  role: select('Role', [ 'Admin', 'User' ]).activateIndex(1),
  status: select('Status', { Active: 'active', Inactive: 'inactive' }).activate('active'),
});
const typedUserSubmit: SchemaSubmit<CreateUserInput> = (data, form, event) => {
  data.email.toLowerCase();
  form.setData({ status: 'active' });
  event.preventDefault();
};
const typedSchemaSubmit = schemaSubmit(typedUserSchema, typedUserSubmit);
const typedSchemaResult: SchemaValidationResult<CreateUserInput> = validateSchema(typedUserSchema, {
  name: 'Ada',
  email: 'ada@example.com',
  role: 'User',
  status: 'active',
});
const typedSchemaApiConsumer = (form: SchemaFormApi<CreateUserInput>) => form.getData().status;
void typedSchemaSubmit;
void typedSchemaResult.firstError?.name;
void typedSchemaApiConsumer;
SchemaForm<CreateUserInput>({ schema: typedUserSchema, onSubmit: typedUserSubmit }).destroy();
const typedRouteParams: RouteParams = { id: '1' };
const typedRouteQuery: RouteQuery = { tab: 'profile' };
const typedRouteLocation: RouteLocationInput = { name: 'user.detail', params: typedRouteParams, query: typedRouteQuery };
const typedGuardResult: NavigationGuardResult = { path: '/login', query: typedRouteQuery };
void typedRouteLocation;
void typedGuardResult;
const typedNotification = Notification.info({ title: 'Typed', message: 'Ready', duration: 0 });
typedNotification.element.remove();
typedNotification.close();
const typedPagination = Pagination({ total: 100, showSizeChanger: true, pageSizeOptions: [ 10, 25 ] });
typedPagination.setCurrent(2);
typedPagination.setPageSize(25);
typedPagination.getTotal();
typedPagination.destroy();
const typedMessageOptions: MessageOptions = { duration: 0, position: 'bottom-right', maxCount: 3 };
const typedMessage = Message(typedMessageOptions);
typedMessage.show('Typed message', 'success', { duration: 1000 })?.close();
typedMessage.info('Typed info')?.element.remove();
typedMessage.destroy();
const typedCountdown = Countdown({ target: new Date(), onTick: remaining => { void remaining; } });
typedCountdown.stop();
typedCountdown.start(Date.now() + 1000);
typedCountdown.destroy();
const typedCarousel = Carousel({ items: [ 'one', 2 ], autoPlay: true, showIndicators: false });
typedCarousel.goTo(1);
typedCarousel.getCurrent();
typedCarousel.destroy();
const tooltipTarget = document.createElement('button');
const typedTooltip = Tooltip({ target: tooltipTarget, content: 'Typed', trigger: 'focus' });
typedTooltip.show();
typedTooltip.hide();
typedTooltip.destroy();
const typedModal = Modal({ width: 480, maskClosable: false }, templateHtml`<p>Modal</p>`);
typedModal.open();
typedModal.isVisible();
typedModal.close();
typedModal.destroy();
const typedDrawer = Drawer({ placement: 'left', width: 320 }, templateHtml`<p>Drawer</p>`);
typedDrawer.open();
typedDrawer.isOpen();
typedDrawer.close();
typedDrawer.destroy();
const typedPanel = Panel({
  title: 'Typed panel',
  subtitle: 'Panel body',
  density: 'compact',
  bodyPadding: 'none',
  bodyScrollable: true,
  actions: templateHtml`<button type="button">Action</button>`,
}, templateHtml`<p>Content</p>`);
typedPanel.update({ title: 'Updated panel' });
typedPanel.destroy();
const typedPanelSubpath = PanelSubpath({ title: 'Subpath panel' }, templateHtml`<p>Content</p>`);
typedPanelSubpath.destroy();
const typedDatePicker = DatePicker({
  value: new Date(),
  format: 'DD/MM/YYYY',
  onChange: (dateString, date) => { void dateString; void date; },
});
typedDatePicker.open();
typedDatePicker.setValue('26/07/2026');
typedDatePicker.getValue();
typedDatePicker.clear();
typedDatePicker.destroy();
const typedDropdown = Dropdown({
  trigger: 'hover',
  items: [ { label: 'One', value: 'one' }, { divider: true }, { text: 'Two' } ],
  onSelect: selection => { void selection.item; },
});
typedDropdown.open();
typedDropdown.isOpen();
typedDropdown.close();
typedDropdown.destroy();
const typedTags = DynamicTags({ tags: [ 'one' ], maxCount: 3, disabled: false });
typedTags.setTags([ 'one', 'two' ]);
typedTags.addTag('three');
typedTags.removeTag('one');
typedTags.destroy();
const typedVirtualList = VirtualList({
  data: [ { id: 1 } ],
  height: 320,
  onItemClick: item => { void item.id; },
});
typedVirtualList.setData([ { id: 2 } ]);
typedVirtualList.scrollTo(0);
typedVirtualList.destroy();
const typedCalendar = Calendar({
  currentDate: '2026-07-26',
  onSelect: selection => { void selection.dateStr; },
});
typedCalendar.setViewMode('week');
typedCalendar.getRange();
typedCalendar.destroy();
const typedHeatmap = Heatmap({
  data: [ { date: '2026-07-26', value: 1 } ],
  onCellClick: item => { void item.value; },
});
typedHeatmap.updateData([]);
typedHeatmap.destroy();
const typedInput = Input({ clearable: true, readonly: false, status: 'success' });
typedInput.clear();
typedInput.blur();
typedInput.destroy();
const typedTextarea = TextArea({ autosize: true, showCount: true, resize: 'none' });
typedTextarea.setValue('Typed');
typedTextarea.blur();
typedTextarea.destroy();
const typedTabs = Tabs({
  tabs: [ { key: 'overview', title: 'Overview', content: templateHtml`<p>Overview</p>` } ],
  type: 'card',
  onClose: key => { void key; },
});
typedTabs.addTab({ key: 'details', label: 'Details', content: 'Details' });
typedTabs.setActive('details');
typedTabs.removeTab('overview');
typedTabs.destroy();
const typedTree = Tree({
  data: [ { key: 'root', title: 'Root', children: [ { key: 1, label: 'Child' } ] } ],
  checkable: true,
  defaultExpandKeys: [ 'root' ],
  onSelect: (keys, nodes) => { void keys; void nodes; },
});
typedTree.selectKey(1);
typedTree.checkKey(1);
typedTree.expandAll();
typedTree.getSelectedKeys();
typedTree.getCheckedKeys();
typedTree.getExpandedKeys();
typedTree.destroy();
void Dialog.confirm({ title: 'Typed', type: 'warning' });
void Dialog.alert({ content: 'Typed alert' });
stopTypedEffect();
stopTypedWatch();
typedScope.stop();
typedState.dispose?.();
typedScheduler.reset();

const root = document.createElement('section');
const typedDirective: DirectiveDefinition = {
  mount(element, binding) {
    element.setAttribute('data-binding', binding.value);
  },
};
const typedMountOptions: MountOptions = {
  sanitizer: value => value,
  customDirectives: { 'k-typed': typedDirective },
};
mount(templateHtml`<div k-typed="value"></div>`, root, typedMountOptions).destroy();
createApp(templateHtml`<div k-typed="value"></div>`, typedMountOptions).destroy();

setHtmlSanitizer((html, element) => {
  element.setAttribute('data-sanitized', 'true');
  return html;
});
setHtmlSanitizer(null);

defineScope('typedPage', ({ $, $$, on, patch, update, watch }) => ({
  count: 0,
  filters: { query: '' },
  mounted() {
    $('button');
    $$<HTMLInputElement>('input');
    on('click', '.row', (event, element) => {
      event.preventDefault();
      element.classList.add('active');
    });
    watch(() => this.count, () => {});
    update<number>('count', value => value + 1);
    patch<{ query: string }>('filters', { query: 'kupola' });
  },
}));

const view = walkOnce(root, { autoDestroy: true });
view.$('button');
view.$$<HTMLButtonElement>('button');
view.destroy();
walkAuto(root).destroy();
destroyWalk(root);
