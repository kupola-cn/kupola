// SPDX-License-Identifier: MIT
/**
 * @kupola/ai-adapter — Unit of Work
 *
 * 支持事务性操作，批量操作可以一键全部撤销。
 */

export class UnitOfWork {
  constructor(engine) {
    this.engine = engine;
    this.actions = [];
    this.results = [];
    this._committed = false;
    this._rolledBack = false;
  }

  add(type, params) {
    if (this._committed) {
      throw new Error('Cannot add actions to a committed UnitOfWork');
    }
    this.actions.push({ type, params });
    return this;
  }

  async commit() {
    if (this._committed) {
      throw new Error('UnitOfWork already committed');
    }

    this.results = [];
    let successCount = 0;

    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      try {
        const result = await this.engine.execute({
          type: action.type,
          params: action.params,
          engine: 'action',
        });
        this.results.push(result);
        if (result.success) {successCount++;}
      } catch (error) {
        this.results.push({ success: false, error: error.message });
        await this.rollback();
        return {
          success: false,
          error: `Action ${i} failed: ${error.message}`,
          results: this.results,
          successCount,
          total: this.actions.length,
        };
      }
    }

    this._committed = true;
    return {
      success: true,
      results: this.results,
      successCount,
      total: this.actions.length,
    };
  }

  async rollback() {
    if (this._rolledBack) {return { success: true };}

    const undoResults = [];
    for (let i = this.results.length - 1; i >= 0; i--) {
      const result = this.results[i];
      if (result.success && result.undoable !== false) {
        try {
          const undoResult = await this.engine.undo();
          undoResults.push({ index: i, success: undoResult.success });
        } catch (error) {
          undoResults.push({ index: i, success: false, error: error.message });
        }
      }
    }

    this._rolledBack = true;
    return {
      success: undoResults.every(r => r.success),
      undoResults,
    };
  }

  get isCommitted() {
    return this._committed;
  }

  get isRolledBack() {
    return this._rolledBack;
  }

  get size() {
    return this.actions.length;
  }
}
