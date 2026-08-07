// SPDX-License-Identifier: MIT
import {
  FormVariant,
  SchemaForm,
  checkbox,
  createFormScope,
  date,
  email,
  field,
  getFormFieldRenderer,
  number,
  password,
  radio,
  registerFormField,
  schema,
  schemaSubmit,
  select,
  switchField,
  text,
  textarea,
  time,
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

describe('SchemaForm field factories', () => {
  test('typed factories build the expected field types and rules', () => {
    expect(text('Name').build('name').type).toBe('text');
    expect(email('Mail').build('mail').rules.email).toBe(true);
    expect(password('Pwd').build('pwd').type).toBe('password');
    expect(number('N').build('n').rules.number).toBe(true);
    expect(date('D').build('d').type).toBe('date');
    expect(time('T').build('t').type).toBe('time');
    expect(textarea('A').build('a').type).toBe('textarea');
    expect(select('S', [ { label: 'A', value: 1 } ]).build('s').options[0].value).toBe(1);
    expect(radio('R', [ [ 'X', 'x' ] ]).build('r').options[0].domValue).toBe('0');
    expect(checkbox('C').build('c').type).toBe('checkbox');
    expect(switchField('W').build('w').type).toBe('switch');
  });

  test('builder chains apply name, rules, and messages', () => {
    const built = field('text', 'Label')
      .name('alias')
      .required('必填')
      .minlength(3, '太短')
      .build();
    expect(built.name).toBe('alias');
    expect(built.rules.required).toBe(true);
    expect(built.messages.required).toBe('必填');
    expect(built.messages.minlength).toBe('太短');
  });
});

describe('SchemaForm schema construction', () => {
  test('rejects duplicate field names', () => {
    expect(() => schema({ a: text('A'), b: text('B').name('a') }))
      .toThrow('duplicate field name');
  });

  test('rejects duplicate schemaIds', () => {
    expect(() => schema([
      { name: 'a', type: 'text', schemaId: 'x' },
      { name: 'b', type: 'text', schemaId: 'x' },
    ])).toThrow('duplicate schemaId');
  });

  test('freezes the schema and exposes bind/submit/validate', () => {
    const formSchema = schema({ name: text('Name') });
    expect(Object.isFrozen(formSchema)).toBe(true);
    expect(typeof formSchema.bind).toBe('function');
    expect(typeof formSchema.submit).toBe('function');
    expect(typeof formSchema.validate).toBe('function');
  });
});

describe('SchemaForm validation rules', () => {
  const formSchema = schema({
    name: text('Name').required('请填写姓名'),
    mail: email('邮箱'),
    phone: field('text', 'Phone').rule('phone', true),
    url: field('text', 'URL').rule('url', true),
    age: number('Age'),
    code: field('text', 'Code').rule('pattern', '^[A-Z]{3}$', '格式错'),
    length: field('text', 'Length').rule('minlength', 4, '太短').rule('maxlength', 6, '太长'),
    range: number('Range').rule('min', 5, '太小').rule('max', 10, '太大'),
  });

  test('passes valid data', () => {
    const result = validateSchema(formSchema, {
      name: 'Kupola',
      mail: 'a@b.com',
      phone: '13800138000',
      url: 'https://kupola.cn',
      age: 30,
      code: 'ABC',
      length: 'abcde',
      range: 7,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('reports the first failing rule per field with messages', () => {
    const result = validateSchema(formSchema, {
      name: ' ',
      mail: 'nope',
      phone: '12',
      url: 'not-a-url',
      age: 'x',
      code: 'ab',
      length: 'ab',
      range: 2,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(8);
    expect(result.firstError.name).toBe('name');
    expect(result.errors.find(e => e.name === 'mail').message).toBe('请输入有效邮箱');
    expect(result.errors.find(e => e.name === 'code').message).toBe('格式错');
  });

  test('supports custom rule functions', () => {
    const custom = schema({ n: field('text', 'N').rule('even', value => value % 2 === 0, '必须偶数') });
    expect(validateSchema(custom, { n: 3 }).valid).toBe(false);
    expect(validateSchema(custom, { n: 4 }).valid).toBe(true);
  });

  test('required rejects empty strings, arrays, and false', () => {
    const s = schema({ v: field('text', 'V').required() });
    expect(validateSchema(s, { v: 0 }).valid).toBe(true);
    expect(validateSchema(s, { v: ' ' }).valid).toBe(false);
    expect(validateSchema(s, { v: false }).valid).toBe(false);
    expect(validateSchema(s, { v: [] }).valid).toBe(false);
  });
});

describe('SchemaForm registry and scope', () => {
  test('registerFormField returns an unregister function', () => {
    const unregister = registerFormField('custom-sf-test', () => 'x');
    expect(getFormFieldRenderer('custom-sf-test')).toBeDefined();
    unregister();
    expect(getFormFieldRenderer('custom-sf-test')).toBe(getFormFieldRenderer('text'));
  });

  test('createFormScope throws for unknown fields', () => {
    const scope = createFormScope({ name: text('Name') });
    expect(() => scope.field('missing')).toThrow('unknown field');
  });

  test('renders fields and actions with submit/cancel text', async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const scope = createFormScope(
      { name: text('Name') },
      { submitText: '保存', cancelText: '取消', onSubmit, onCancel },
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    const view = render(html`<form>${scope.field('name')}${scope.actions()}</form>`, host);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(host.querySelector('input[name="name"]')).not.toBeNull();
    expect(host.querySelector('button[type="submit"]').textContent).toBe('保存');
    expect(host.querySelector('button[type="button"]').textContent).toBe('取消');
    view.destroy();
  });

  test('select fields use the themed Select and keep typed values', () => {
    const scope = createFormScope({
      fruit: select('Fruit', [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
      ]),
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(html`<form>${scope.field('fruit')}</form>`, host);
    scope.mount(host.querySelector('form'));

    const formEl = host.querySelector('form');
    expect(formEl.querySelector('select')).toBeNull();
    const dsSelect = formEl.querySelector('.ds-schema-form__select-host .ds-select');
    expect(dsSelect).toBeTruthy();

    dsSelect.querySelector('.ds-select__trigger')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.querySelectorAll('.ds-select__item')[1]
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(scope.getData().fruit).toBe('banana');

    scope.setData({ fruit: 'apple' });
    expect(scope.getData().fruit).toBe('apple');
    scope.destroy();
  });

  test('multiple select keeps an array of typed values', () => {
    const scope = createFormScope({
      tags: select('Tags', [
        { label: 'A', value: 1 },
        { label: 'B', value: 2 },
      ], { multiple: true }),
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(html`<form>${scope.field('tags')}</form>`, host);
    scope.mount(host.querySelector('form'));

    const dsSelect = host.querySelector('.ds-schema-form__select-host .ds-select');
    dsSelect.querySelector('.ds-select__trigger')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const items = document.querySelectorAll('.ds-select__item');
    items[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(scope.getData().tags).toEqual([ 1, 2 ]);
    scope.destroy();
  });
});
