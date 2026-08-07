import type { Destroyable } from './common.js';

// ============================================================
// Table Component
// ============================================================

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title?: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorter?: (a: unknown, b: unknown, order: string) => number;
  render?: (value: unknown, row: T) => string | HTMLElement | import('@kupola/platform').TemplateResult;
  fixed?: 'left' | 'right';
  editable?: boolean;
  filterFn?: (value: unknown, filterText: string) => boolean;
}

export interface TableOptions<T = Record<string, unknown>> {
  data?: T[];
  columns: TableColumn<T>[];
  rowKey?: string;
  striped?: boolean;
  compact?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  selection?: 'checkbox' | 'radio';
  expandable?: (row: T) => string | HTMLElement | import('@kupola/platform').TemplateResult;
  editable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  tree?: { childrenKey?: string; defaultExpandAll?: boolean };
  virtualScroll?: {
    rowHeight: number;
    overscan?: number;
    height?: number | string;
    viewportHeight?: number | string;
    visibleRows?: number;
  };
  mergeCells?: (data: T[]) => Array<{ row: number; col: number; rowSpan: number; colSpan: number }>;
  showFilter?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyText?: string;
  loadingText?: string;
  multiSort?: boolean;
  onSort?: (sorts: Array<{ key: string; order: string }>) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T, key: unknown) => void;
  onFilter?: (text: string) => void;
  onSelect?: (keys: unknown[], rows: T[]) => void;
  onExpand?: (key: unknown, expanded: boolean) => void;
  onEditSave?: (row: T, colKey: string) => void;
  onEditCancel?: () => void;
  onRowDragEnd?: (fromKey: unknown, toKey: unknown) => void;
  onColumnResize?: (colKey: string, width: number) => void;
}

export interface TableInstance<T = Record<string, unknown>> extends Destroyable {
  setData(data: T[]): void;
  setLoading(loading: boolean): void;
  getData(): T[];
  getProcessedData(): T[];
  getSelectedRows(): T[];
  getSelectedKeys(): unknown[];
  selectRow(key: unknown): void;
  deselectRow(key: unknown): void;
  selectAll(): void;
  deselectAll(): void;
  toggleExpand(key: unknown): void;
  expandAll(): void;
  collapseAll(): void;
  setSort(key: string, order?: 'asc' | 'desc'): void;
  clearSort(): void;
  setPage(page: number): void;
  setPageSize(size: number): void;
  setFilterText(text: string): void;
  getFilterText(): string;
  exportCSV(): string;
  refresh(): void;
}
export function Table<T = Record<string, unknown>>(options?: TableOptions<T>): TableInstance<T>;

export function TableView<T = Record<string, unknown>>(options: {
  data?: T[] | { value: T[] };
  columns: TableColumn<T>[];
  ariaLabel?: string;
  className?: string;
  options?: Omit<TableOptions<T>, 'data' | 'columns'>;
}): import('@kupola/platform').ComponentInstance;

export function FormView(options: {
  className?: string;
  options?: FormOptions;
  onSubmit?: (data: Record<string, unknown>, form: FormInstance, event: SubmitEvent) => void;
}, children?: unknown): import('@kupola/platform').ComponentInstance;
