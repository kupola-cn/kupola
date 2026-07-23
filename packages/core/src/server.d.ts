import type { TemplateInstance, TemplateResult } from './index';

export function renderToString(tpl: TemplateResult): string;
export function hydrate(tpl: TemplateResult, container: Element): TemplateInstance;
