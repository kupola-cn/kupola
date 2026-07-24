import {
  $, $$, defineScope, destroyWalk, setHtmlSanitizer, walkOnce,
} from '@kupola/kupola';
import { walkAuto } from '@kupola/kupola/directives';

const root = document.createElement('section');

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
