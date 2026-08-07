// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Capability Builder
 *
 * Fluent API 构建能力注册配置，提升开发者体验。
 */

export class CapabilityBuilder {
  constructor(registry, engine, type) {
    this.registry = registry;
    this.config = {
      engine,
      type,
      paramsSchema: {},
      roles: [],
      permissions: [],
    };
  }

  label(text) {
    this.config.label = text;
    return this;
  }

  description(text) {
    this.config.description = text;
    return this;
  }

  params(schema) {
    this.config.paramsSchema = schema;
    return this;
  }

  param(name, rule) {
    this.config.paramsSchema[name] = rule;
    return this;
  }

  roles(list) {
    this.config.roles = Array.isArray(list) ? list : [ list ];
    return this;
  }

  permissions(list) {
    this.config.permissions = Array.isArray(list) ? list : [ list ];
    return this;
  }

  handler(fn) {
    this.config.handler = fn;
    return this;
  }

  confirm(value = true) {
    this.config.confirm = value;
    return this;
  }

  undo(fn) {
    this.config.undo = fn;
    return this;
  }

  retries(count) {
    this.config.retries = count;
    return this;
  }

  exposeToAI(value = true) {
    this.config.exposeToAI = value;
    return this;
  }

  dependsOn(list) {
    this.config.dependsOn = Array.isArray(list) ? list : [ list ];
    return this;
  }

  build() {
    return this.registry.register(this.config);
  }
}
