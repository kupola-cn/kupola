import type { Destroyable } from './common.js';

// ============================================================
// Display Components
// ============================================================

// Tag
export interface TagOptions {
  label?: string;
  color?: string;
  closable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
}
export interface TagInstance extends Destroyable {
  setLabel(label: string): void;
}
export function Tag(options?: TagOptions): TagInstance;

// Badge
export interface BadgeOptions {
  count?: number;
  dot?: boolean;
  overflowCount?: number;
  color?: string;
  showZero?: boolean;
}
export interface BadgeInstance extends Destroyable {
  setCount(count: number): void;
}
export function Badge(options?: BadgeOptions): BadgeInstance;

// Divider
export interface DividerOptions {
  type?: 'horizontal' | 'vertical';
  text?: string;
  textAlign?: 'left' | 'center' | 'right';
  dashed?: boolean;
}
export interface DividerInstance extends Destroyable {}
export function Divider(options?: DividerOptions): DividerInstance;

// Collapse
export interface CollapseItem {
  key: string | number;
  title: string;
  content?: unknown;
  [key: string]: unknown;
}
export interface CollapseOptions {
  items?: CollapseItem[];
  accordion?: boolean;
  defaultOpen?: (string | number)[];
  onChange?: (activeKeys: (string | number)[]) => void;
  onSelect?: (item: CollapseItem) => void;
}
export interface CollapseInstance {
  element: DocumentFragment;
  toggle(key: string | number): void;
  open(key: string | number): void;
  close(key: string | number): void;
  getActiveKeys(): (string | number)[];
  destroy(): void;
}
export function Collapse(options?: CollapseOptions): CollapseInstance;

// Timeline
export interface TimelineItem {
  content: string;
  color?: string;
  icon?: string;
  label?: string;
}
export interface TimelineOptions {
  items?: TimelineItem[];
  mode?: 'left' | 'right' | 'alternate';
}
export interface TimelineInstance extends Destroyable {
  setItems(items: TimelineItem[]): void;
}
export function Timeline(options?: TimelineOptions): TimelineInstance;

// Kbd
export interface KbdOptions {
  key: string;
  size?: 'sm' | 'md';
}
export interface KbdInstance extends Destroyable {}
export function Kbd(options?: KbdOptions): KbdInstance;

// Avatar
export interface AvatarOptions {
  src?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  accent?: boolean;
}
export interface AvatarInstance extends Destroyable {}
export function Avatar(options?: AvatarOptions): AvatarInstance;

// Statcard
export interface StatcardOptions {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  description?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: string;
}
export interface StatcardInstance extends Destroyable {
  setValue(value: string | number): void;
}
export function Statcard(options?: StatcardOptions): StatcardInstance;

// Tree
export interface TreeNode {
  key?: string | number;
  title?: string;
  label?: string;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: string;
  badge?: string | number;
}
export interface TreeOptions {
  data?: TreeNode[];
  checkable?: boolean;
  lined?: boolean;
  compact?: boolean;
  expandAll?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandKeys?: (string | number)[];
  defaultCheckedKeys?: (string | number)[];
  defaultSelectedKeys?: (string | number)[];
  selectedKey?: string | number;
  onSelect?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onCheck?: (keys: (string | number)[], nodes: TreeNode[]) => void;
  onExpand?: (keys: (string | number)[]) => void;
  onToggle?: (node: TreeNode, expanded: boolean) => void;
}
export interface TreeInstance {
  element: DocumentFragment;
  setData(data: TreeNode[]): void;
  getSelected(): TreeNode | null;
  getSelectedKeys(): (string | number)[];
  getCheckedKeys(): (string | number)[];
  getExpandedKeys(): (string | number)[];
  expandAll(): void;
  collapseAll(): void;
  selectKey(key: string | number): void;
  select(key: string | number): void;
  checkKey(key: string | number): void;
  uncheckKey(key: string | number): void;
  toggleCheck(key: string | number): void;
  expand(key: string | number): void;
  collapse(key: string | number): void;
  destroy(): void;
}
export function Tree(options?: TreeOptions): TreeInstance;

// Carousel
export interface CarouselOptions {
  items?: Array<string | number>;
  autoPlay?: boolean;
  autoplay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  onChange?: (index: number) => void;
}
export interface CarouselInstance {
  element: DocumentFragment;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  getCurrent(): number;
  destroy(): void;
}
export function Carousel(options?: CarouselOptions): CarouselInstance;

