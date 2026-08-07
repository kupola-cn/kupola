// SPDX-License-Identifier: MIT
import {
  FormVariant,
  SchemaForm,
  checkbox,
  createFormScope,
  date,
  email,
  field,
  radio,
  registerFormField,
  schema,
  schemaSubmit,
  select,
  text,
  validateSchema,
} from '@kupola/components';
import { html, render } from '@kupola/platform';

describe('SchemaForm', () => {
  async function mount(component) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    host.appendChild(component.element);
    await new Promise(resolve => setTimeout(resolve, 0));
    return host;
  }

  async function mountTemplate(template) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const view = render(template, host);
    await new Promise(resolve => setTimeout(resolve, 0));
    return { host, view };
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('normalizes select option sources', () => {
    const userSchema = schema({
      role: select('角色', { 管理员: 1, 编辑: 2, 用户: 3 }).activateValue(2),
      status: select('状态', [
        [ '活跃', 'active' ],
        [ '禁用', 'inactive' ],
      ]).activate('active'),
      level: select('等级', [ '初级', '高级' ]).activateIndex(1),
    });

    expect(userSchema.fields[0].options.map(option => option.value)).toEqual([ 1, 2, 3 ]);
    expect(userSchema.fields[0].value).toBe(2);
    expect(userSchema.fields[1].options[0]).toMatchObject({ label: '活跃', value: 'active' });
    expect(userSchema.fields[2].value).toBe('高级');
  });

  test('submits typed select values', async () => {
    const onSubmit = jest.fn();
    const view = SchemaForm({
      schema: schema({
        name: text('姓名').required(),
        role: select('角色', { 管理员: 1, 编辑: 2, 用户: 3 }).activateValue(2),
      }),
      onSubmit,
    });

    const host = await mount(view);
    host.querySelector('[name="name"]').value = 'Alice';
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Alice', role: 2 });
    view.destroy();
  });

  test('applies variant constants and renders broader native input types', async () => {
    const view = SchemaForm({
      schema: schema({
        birthday: date('生日'),
      }),
      variant: FormVariant.Drawer,
      density: 'dense',
      classes: { root: 'profile-form' },
    });

    const host = await mount(view);
    const form = host.querySelector('form');
    expect(form.classList.contains('ds-schema-form--drawer')).toBe(true);
    expect(form.classList.contains('ds-schema-form--density-dense')).toBe(true);
    expect(form.classList.contains('profile-form')).toBe(true);
    expect(host.querySelector('[name="birthday"]').type).toBe('date');
    view.destroy();
  });

  test('setData and getData preserve select value types', async () => {
    let formApi = null;
    const view = SchemaForm({
      schema: schema({
        role: select('角色', { 管理员: 1, 编辑: 2, 用户: 3 }),
      }),
      values: { role: 3 },
      onReady: api => {
        formApi = api;
      },
    });

    const host = await mount(view);
    expect(host.querySelector('[name="role"]').value).toBe('2');
    expect(formApi.getData()).toEqual({ role: 3 });
    formApi.setData({ role: 1 });
    expect(host.querySelector('[name="role"]').value).toBe('0');
    expect(formApi.getData()).toEqual({ role: 1 });
    view.destroy();
  });

  test('preserves typed radio and checkbox values', async () => {
    const onSubmit = jest.fn();
    const view = SchemaForm({
      schema: schema({
        status: radio('状态', { 活跃: 'active', 禁用: 'inactive' }).activate('inactive'),
        permissions: checkbox('权限', { 查看: 1, 编辑: 2 }).value([ 1 ]),
      }),
      onSubmit,
    });

    const host = await mount(view);
    host.querySelector('input[name="permissions"][value="1"]').checked = true;
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit.mock.calls[0][0]).toEqual({
      status: 'inactive',
      permissions: [ 1, 2 ],
    });
    view.destroy();
  });

  test('supports registered custom field renderers', async () => {
    const destroy = jest.fn();
    const unregister = registerFormField('token-picker', {
      render(customField, context) {
        return html`
          <label class="${context.fieldClassName}"${context.rootAttrs}>
            <span class="${context.labelClassName}">${customField.label}</span>
            <input data-kupola-ignore name="${customField.name}" />
          </label>
        `;
      },
      mount({ root }) {
        const input = root.querySelector('input');
        return {
          getValue: () => input.value,
          setValue: value => { input.value = String(value ?? ''); },
          destroy,
        };
      },
    });

    let formApi = null;
    const view = SchemaForm({
      schema: schema({
        token: field('token-picker', '令牌'),
      }),
      values: { token: 'abc' },
      onReady: api => {
        formApi = api;
      },
    });

    const host = await mount(view);
    expect(host.querySelector('[name="token"]').value).toBe('abc');
    expect(formApi.getData()).toEqual({ token: 'abc' });
    formApi.setData({ token: 'xyz' });
    expect(formApi.getData()).toEqual({ token: 'xyz' });
    view.destroy();
    unregister();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test('binds schema validation to a freely composed view', async () => {
    const onSubmit = jest.fn();
    const onInvalid = jest.fn();
    const form = createFormScope(schema({
      name: text('姓名').required(),
      role: select('角色', { 管理员: 1, 编辑: 2 }).activateValue(2),
      status: select('状态', { 活跃: 'active', 禁用: 'inactive' }).activate('active'),
    }), {
      variant: FormVariant.Dialog,
      onSubmit,
      onInvalid,
    });
    const template = html`
      <form class="${form.rootClass('custom-form')}" novalidate onsubmit="${form.submit}">
        <section class="custom-layout">
          ${form.field('name')}
          <div class="custom-layout__row">
            ${form.field('role')}
            ${form.field('status')}
          </div>
        </section>
        ${form.actions({ submitText: '保存' })}
      </form>
    `;

    const { host, view } = await mountTemplate(template);
    expect(host.querySelector('form').classList.contains('ds-schema-form--dialog')).toBe(true);
    expect(host.querySelector('form').classList.contains('custom-form')).toBe(true);
    expect(host.querySelectorAll('.custom-layout__row [data-schema-field]')).toHaveLength(2);

    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ds-message__content').textContent).toBe('请填写姓名');

    host.querySelector('[name="name"]').value = 'Alice';
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'Alice', role: 2, status: 'active' });
    form.destroy();
    view.destroy();
  });

  test('mounts and destroys custom field controllers in a form scope', async () => {
    const destroy = jest.fn();
    const unregister = registerFormField('token-scope-picker', {
      render(customField, context) {
        return html`
          <label class="${context.fieldClassName}"${context.rootAttrs}>
            <span class="${context.labelClassName}">${customField.label}</span>
            <input data-kupola-ignore name="${customField.name}" value="${customField.value ?? ''}" />
          </label>
        `;
      },
      mount({ root }) {
        const input = root.querySelector('input');
        return {
          getValue: () => input.value,
          setValue: value => { input.value = String(value ?? ''); },
          validate: value => value ? true : '请选择令牌',
          destroy,
        };
      },
    });
    const form = createFormScope(schema({
      token: field('token-scope-picker', '令牌'),
    }), {
      values: { token: 'abc' },
    });
    const template = html`
      <div class="scope-host">
        <form class="${form.rootClass()}" novalidate onsubmit="${form.submit}">
          ${form.field('token')}
          ${form.actions()}
        </form>
      </div>
    `;

    const { host, view } = await mountTemplate(template);
    form.mount(host.querySelector('.scope-host'));
    expect(form.getData()).toEqual({ token: 'abc' });
    form.setData({ token: 'xyz' });
    expect(form.getData()).toEqual({ token: 'xyz' });
    form.destroy();
    view.destroy();
    unregister();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test('binds native k-field controls through schemaSubmit', async () => {
    const onSubmit = jest.fn();
    const userSchema = schema({
      name: text('姓名').required(),
      email: email('邮箱').required(),
      role: select('角色', { 管理员: 1, 编辑: 2 }).activateValue(2),
    });
    const template = html`
      <form novalidate onsubmit="${schemaSubmit(userSchema, onSubmit)}">
        <label class="ds-form-field">
          <input k-field="name" />
        </label>
        <label class="ds-form-field">
          <input k-field="email" />
        </label>
        <label class="ds-form-field">
          <select k-field="role"></select>
        </label>
      </form>
    `;

    const { host, view } = await mountTemplate(template);
    expect(host.querySelector('[name="name"]').type).toBe('text');
    expect(host.querySelector('[name="email"]').type).toBe('email');
    expect(host.querySelector('[name="role"]').options).toHaveLength(2);
    expect(host.querySelector('[name="role"]').value).toBe('1');

    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('.ds-message__content').textContent).toBe('请填写姓名');

    host.querySelector('[name="name"]').value = 'Alice';
    host.querySelector('[name="email"]').value = 'alice@example.com';
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      role: 2,
    });
    view.destroy();
  });

  test('upgrades k-input and k-select tags from schema fields', async () => {
    const onSubmit = jest.fn();
    const userSchema = schema({
      name: text('姓名').required(),
      role: select('角色', { 管理员: 1, 编辑: 2 }).activateValue(1),
    });
    const template = html`
      <form novalidate onsubmit="${schemaSubmit(userSchema, onSubmit)}">
        <k-input k-field="name"></k-input>
        <k-select k-field="role"></k-select>
      </form>
    `;

    const { host, view } = await mountTemplate(template);
    expect(host.querySelector('k-input .ds-input input[name="name"]')).not.toBeNull();
    expect(host.querySelector('k-select .ds-select')).not.toBeNull();
    expect(host.querySelector('k-select input[type="hidden"][name="role"]').value).toBe('0');

    host.querySelector('[name="name"]').value = 'Alice';
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice', role: 1 }, expect.any(Object), expect.any(Event));
    view.destroy();
  });

  test('binds custom k-field tags through a hidden form value', async () => {
    const onSubmit = jest.fn();
    const userSchema = schema({
      orgId: text('组织').required(),
    });
    const template = html`
      <form novalidate onsubmit="${userSchema.submit(onSubmit)}">
        <org-picker k-field="orgId"></org-picker>
      </form>
    `;

    const { host, view } = await mountTemplate(template);
    const picker = host.querySelector('org-picker');
    picker.value = 'org-42';
    picker.dispatchEvent(new Event('change', { bubbles: true }));
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).toHaveBeenCalledWith({ orgId: 'org-42' }, expect.any(Object), expect.any(Event));
    view.destroy();
  });

  test('validates schema data without a DOM form', () => {
    const result = validateSchema(schema({
      name: text('姓名').required(),
      email: email('邮箱').required(),
    }), {
      name: 'Alice',
      email: 'bad',
    });

    expect(result.valid).toBe(false);
    expect(result.firstError).toMatchObject({
      name: 'email',
      rule: 'email',
      message: '请输入有效邮箱',
    });
  });

  test('blocks invalid submit and shows message feedback', async () => {
    const onSubmit = jest.fn();
    const onInvalid = jest.fn();
    const view = SchemaForm({
      schema: schema({
        name: text('姓名').required(),
        email: email('邮箱').required(),
      }),
      onSubmit,
      onInvalid,
    });

    const host = await mount(view);
    expect(host.querySelector('form').noValidate).toBe(true);
    host.querySelector('[name="email"]').value = 'bad';
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll('.ds-form-error')).toHaveLength(2);
    expect(document.querySelector('.ds-message__content').textContent).toBe('请填写姓名');
    view.destroy();
  });
});
