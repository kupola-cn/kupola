import type { RenderOptions, TemplateInstance, TemplateResult } from './platform.d.ts';

export function renderToString(tpl: TemplateResult): string;
export function hydrate(
  tpl: TemplateResult,
  container: Element,
  options?: RenderOptions
): TemplateInstance;
