// SPDX-License-Identifier: MIT
import { Heatmap } from '@kupola/components';

describe('Heatmap', () => {
  const sampleData = [
    { date: '2024-01-15', value: 5 },
    { date: '2024-01-16', value: 10 },
    { date: '2024-01-17', value: 0 },
    { date: '2024-01-18', value: 20 },
  ];

  const defaultOpts = {
    data: sampleData,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    color: '#22c55e',
  };

  // ── Rendering ──
  describe('rendering', () => {
    test('creates root element with ds-heatmap class', () => {
      const hm = Heatmap(defaultOpts);
      expect(hm.element.classList.contains('ds-heatmap')).toBe(true);
      hm.destroy();
    });

    test('renders header when title provided', () => {
      const hm = Heatmap({ ...defaultOpts, title: 'Contributions' });
      const header = hm.element.querySelector('.ds-heatmap__header');
      expect(header).not.toBeNull();
      const title = hm.element.querySelector('.ds-heatmap__title');
      expect(title.textContent).toBe('Contributions');
      hm.destroy();
    });

    test('renders subtitle', () => {
      const hm = Heatmap({ ...defaultOpts, title: 'T', subtitle: 'Last year' });
      const sub = hm.element.querySelector('.ds-heatmap__subtitle');
      expect(sub).not.toBeNull();
      expect(sub.textContent).toBe('Last year');
      hm.destroy();
    });

    test('does not render header when no title', () => {
      const hm = Heatmap(defaultOpts);
      const header = hm.element.querySelector('.ds-heatmap__header');
      expect(header).toBeNull();
      hm.destroy();
    });

    test('renders body', () => {
      const hm = Heatmap(defaultOpts);
      const body = hm.element.querySelector('.ds-heatmap__body');
      expect(body).not.toBeNull();
      hm.destroy();
    });

    test('renders weekday labels', () => {
      const hm = Heatmap(defaultOpts);
      const labels = hm.element.querySelectorAll('.ds-heatmap__weekday-label');
      expect(labels.length).toBeGreaterThan(0);
      hm.destroy();
    });

    test('renders grid with week columns', () => {
      const hm = Heatmap(defaultOpts);
      const columns = hm.element.querySelectorAll('.ds-heatmap__week-column');
      expect(columns.length).toBeGreaterThan(0);
      hm.destroy();
    });

    test('renders cells with data attributes', () => {
      const hm = Heatmap(defaultOpts);
      const cells = hm.element.querySelectorAll('.ds-heatmap__cell[data-date]');
      expect(cells.length).toBeGreaterThan(0);
      hm.destroy();
    });

    test('renders legend', () => {
      const hm = Heatmap(defaultOpts);
      const legend = hm.element.querySelector('.ds-heatmap__legend');
      expect(legend).not.toBeNull();
      const legendCells = hm.element.querySelectorAll('.ds-heatmap__legend-cell');
      expect(legendCells.length).toBe(6); // levels 0-5
      hm.destroy();
    });

    test('renders tooltip element', () => {
      const hm = Heatmap(defaultOpts);
      const tooltip = hm.element.querySelector('.ds-heatmap__tooltip');
      expect(tooltip).not.toBeNull();
      hm.destroy();
    });
  });

  // ── Data ──
  describe('data', () => {
    test('renders cells for date range', () => {
      const hm = Heatmap(defaultOpts);
      const cells = hm.element.querySelectorAll('.ds-heatmap__cell[data-date]');
      // Jan 1-31 = 31 days
      expect(cells.length).toBe(31);
      hm.destroy();
    });

    test('cell has correct value for known date', () => {
      const hm = Heatmap(defaultOpts);
      const cell = hm.element.querySelector('.ds-heatmap__cell[data-date="2024-01-15"]');
      expect(cell).not.toBeNull();
      expect(cell.dataset.value).toBe('5');
      hm.destroy();
    });

    test('cell has value 0 for date without data', () => {
      const hm = Heatmap(defaultOpts);
      const cell = hm.element.querySelector('.ds-heatmap__cell[data-date="2024-01-01"]');
      expect(cell).not.toBeNull();
      expect(cell.dataset.value).toBe('0');
      hm.destroy();
    });
  });

  // ── updateData ──
  describe('updateData()', () => {
    test('re-renders with new data', () => {
      const hm = Heatmap(defaultOpts);
      const newData = [ { date: '2024-01-15', value: 99 } ];
      hm.updateData(newData);
      const cell = hm.element.querySelector('.ds-heatmap__cell[data-date="2024-01-15"]');
      expect(cell).not.toBeNull();
      expect(cell.dataset.value).toBe('99');
      hm.destroy();
    });
  });

  // ── onCellClick ──
  describe('onCellClick', () => {
    test('fires callback when cell clicked', () => {
      const onClick = jest.fn();
      const hm = Heatmap({ ...defaultOpts, onCellClick: onClick });
      const cell = hm.element.querySelector('.ds-heatmap__cell[data-date="2024-01-15"]');
      cell.click();
      expect(onClick).toHaveBeenCalledWith({ date: '2024-01-15', value: 5 });
      hm.destroy();
    });
  });

  // ── destroy ──
  describe('destroy()', () => {
    test('removes element from DOM', () => {
      const container = document.createElement('div');
      const hm = Heatmap(defaultOpts);
      container.appendChild(hm.element);
      document.body.appendChild(container);
      expect(document.querySelector('.ds-heatmap')).not.toBeNull();
      hm.destroy();
      expect(document.querySelector('.ds-heatmap')).toBeNull();
      document.body.innerHTML = '';
    });
  });
});
