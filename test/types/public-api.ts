import {
  $, $$, createApp, defineScope, destroyWalk, mount, setHtmlSanitizer, walkOnce,
  type DirectiveDefinition, type MountOptions,
} from '@kupola/platform';
import { walkAuto } from '@kupola/platform/directives';
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

const typedSignal = signal(1);
const typedComputed = computed(() => typedSignal.value + 1);
const typedState = reactive({ value: 1 });
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
