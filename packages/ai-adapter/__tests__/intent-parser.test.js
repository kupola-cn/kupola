// SPDX-License-Identifier: MIT
import { IntentParser, RuleBasedParser } from '../src/intent-parser.js';

describe('RuleBasedParser', () => {
  let parser;

  beforeEach(() => {
    parser = RuleBasedParser.createDefault();
  });

  describe('Chinese patterns', () => {
    it('should parse query commands', () => {
      const r = parser.parse('查询张三出勤');
      expect(r.engine).toBe('query');
      expect(r.type).toBe('search');
      expect(r.params.keyword).toBe('张三出勤');
    });

    it('should parse 查看 as query', () => {
      const r = parser.parse('查看工资表');
      expect(r.engine).toBe('query');
    });

    it('should parse create commands', () => {
      const r = parser.parse('添加员工张三');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('create');
      expect(r.params.description).toBe('员工张三');
    });

    it('should parse 新增 as create', () => {
      const r = parser.parse('新增部门');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('create');
    });

    it('should parse delete commands', () => {
      const r = parser.parse('删除员工李四');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('delete');
    });

    it('should parse update commands', () => {
      const r = parser.parse('把张三工资调为4000');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('update');
      expect(r.params.target).toBe('张三工资');
      expect(r.params.value).toBe('4000');
    });

    it('should parse flow execute commands', () => {
      const r = parser.parse('执行发工资条');
      expect(r.engine).toBe('flow');
      expect(r.type).toBe('execute');
      expect(r.params.name).toBe('发工资条');
    });

    it('should parse 运行流程 command', () => {
      const r = parser.parse('运行流程月末统计');
      expect(r.engine).toBe('flow');
      expect(r.type).toBe('execute');
    });

    it('should parse flow define commands', () => {
      const r = parser.parse('新建流程发工资条');
      expect(r.engine).toBe('flow');
      expect(r.type).toBe('define');
    });
  });

  describe('English patterns', () => {
    it('should parse search commands', () => {
      const r = parser.parse('search employees');
      expect(r.engine).toBe('query');
      expect(r.params.keyword).toBe('employees');
    });

    it('should parse add commands', () => {
      const r = parser.parse('add employee John');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('create');
    });

    it('should parse delete commands', () => {
      const r = parser.parse('delete employee John');
      expect(r.engine).toBe('action');
      expect(r.type).toBe('delete');
    });

    it('should parse run commands', () => {
      const r = parser.parse('run payroll');
      expect(r.engine).toBe('flow');
      expect(r.type).toBe('execute');
    });
  });

  describe('unrecognized', () => {
    it('should return unknown for unmatched input', () => {
      const r = parser.parse('hello world');
      expect(r.engine).toBe('unknown');
    });

    it('should trim whitespace', () => {
      const r = parser.parse('  查询张三  ');
      expect(r.engine).toBe('query');
      expect(r.params.keyword).toBe('张三');
    });
  });

  describe('custom rules', () => {
    it('should support adding custom rules', () => {
      const p = new RuleBasedParser();
      p.addRule(/^help$/i, () => ({
        engine: 'system',
        type: 'help',
        params: {},
      }));

      const r = p.parse('help');
      expect(r.engine).toBe('system');
      expect(r.type).toBe('help');
    });
  });
});

describe('IntentParser', () => {
  describe('with AI backend', () => {
    it('should use AI parser when available', async () => {
      const ai = jest.fn().mockResolvedValue({
        engine: 'query',
        type: 'custom',
        params: { x: 1 },
      });
      const parser = new IntentParser({ ai });

      const result = await parser.parse('anything');

      expect(ai).toHaveBeenCalled();
      expect(result.engine).toBe('query');
      expect(result.type).toBe('custom');
    });

    it('should fallback to rule-based on AI error', async () => {
      const ai = jest.fn().mockRejectedValue(new Error('AI down'));
      const parser = new IntentParser({ ai, fallback: RuleBasedParser.createDefault() });

      const result = await parser.parse('查询张三');

      expect(result.engine).toBe('query');
    });
  });

  describe('without AI backend', () => {
    it('should use fallback parser with default rules', async () => {
      const parser = new IntentParser({ fallback: RuleBasedParser.createDefault() });

      const result = await parser.parse('查询张三');

      expect(result.engine).toBe('query');
    });

    it('should return unknown engine for unmatched input with default parser', async () => {
      const parser = new IntentParser({ fallback: RuleBasedParser.createDefault() });

      const result = await parser.parse('random text');

      expect(result.engine).toBe('unknown');
      expect(result.type).toBe('unrecognized');
    });

    it('should use empty RuleBasedParser when no fallback provided', async () => {
      const parser = new IntentParser(); // empty fallback — no rules

      const result = await parser.parse('查询张三');

      // Empty parser returns unknown engine, but has valid engine+type fields
      expect(result.engine).toBe('unknown');
    });
  });

  describe('context', () => {
    it('should store parsed commands in context', async () => {
      const parser = new IntentParser();

      await parser.parse('查询张三');
      await parser.parse('添加员工');

      const history = parser.getHistory();
      expect(history.length).toBe(2);
    });

    it('should evict old context when maxContext exceeded', async () => {
      const parser = new IntentParser({ maxContext: 2 });

      await parser.parse('查询 a');
      await parser.parse('查询 b');
      await parser.parse('查询 c');

      expect(parser.context.length).toBe(2);
    });

    it('should include raw input in result', async () => {
      const parser = new IntentParser();

      const result = await parser.parse('查询张三');

      expect(result.raw).toBe('查询张三');
    });
  });

  describe('clearContext', () => {
    it('should clear all context', async () => {
      const parser = new IntentParser();
      await parser.parse('查询张三');

      parser.clearContext();

      expect(parser.getHistory().length).toBe(0);
    });
  });

  describe('invalid command structure', () => {
    it('should return unknown when AI returns invalid structure', async () => {
      const ai = jest.fn().mockResolvedValue({ foo: 'bar' });
      const parser = new IntentParser({ ai });

      const result = await parser.parse('test');

      expect(result.engine).toBe('unknown');
    });

    it('should return unknown when AI returns null', async () => {
      const ai = jest.fn().mockResolvedValue(null);
      const parser = new IntentParser({ ai });

      const result = await parser.parse('test');

      expect(result.engine).toBe('unknown');
    });
  });
});
