import { EventEmitter } from './EventEmitter.js';

export class StateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.state = new Map();
    this.history = options.history ? [] : null;
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this.logger = options.logger;
  }

  // 获取状态
  get(key, defaultValue) {
    return this.state.has(key) ? this.state.get(key) : defaultValue;
  }

  // 设置状态
  set(key, value) {
    const oldValue = this.state.get(key);
    
    // 如果值没有变化，不做任何操作
    if (this._isEqual(oldValue, value)) {
      return false;
    }

    // 记录历史
    if (this.history !== null) {
      this.history.push({
        timestamp: Date.now(),
        type: 'set',
        key,
        oldValue,
        newValue: value,
      });

      // 限制历史记录长度
      while (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    }

    // 更新状态
    this.state.set(key, value);

    // 触发事件
    this.emit('stateChange', { key, oldValue, newValue: value });
    this.emit(`stateChange:${key}`, value, oldValue);

    return true;
  }

  // 批量更新状态
  batchUpdate(updates) {
    const changes = new Map();
    
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.state.get(key);
      if (!this._isEqual(oldValue, value)) {
        changes.set(key, { oldValue, newValue: value });
        this.state.set(key, value);
      }
    }

    if (changes.size > 0) {
      // 记录历史
      if (this.history !== null) {
        this.history.push({
          timestamp: Date.now(),
          type: 'batchUpdate',
          changes: Array.from(changes.entries()).map(([key, { oldValue, newValue }]) => ({
            key,
            oldValue,
            newValue,
          })),
        });

        // 限制历史记录长度
        while (this.history.length > this.maxHistoryLength) {
          this.history.shift();
        }
      }

      // 触发事件
      this.emit('batchStateChange', changes);
      for (const [key, { oldValue, newValue }] of changes.entries()) {
        this.emit(`stateChange:${key}`, newValue, oldValue);
      }
    }

    return changes.size > 0;
  }

  // 删除状态
  delete(key) {
    if (!this.state.has(key)) {
      return false;
    }

    const oldValue = this.state.get(key);

    // 记录历史
    if (this.history !== null) {
      this.history.push({
        timestamp: Date.now(),
        type: 'delete',
        key,
        oldValue,
      });

      // 限制历史记录长度
      while (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    }

    // 删除状态
    this.state.delete(key);

    // 触发事件
    this.emit('stateChange', { key, oldValue, newValue: undefined });
    this.emit(`stateChange:${key}`, undefined, oldValue);

    return true;
  }

  // 清空状态
  clear() {
    if (this.state.size === 0) {
      return false;
    }

    const oldState = new Map(this.state);

    // 记录历史
    if (this.history !== null) {
      this.history.push({
        timestamp: Date.now(),
        type: 'clear',
        oldState: Array.from(oldState.entries()),
      });

      // 限制历史记录长度
      while (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    }

    // 清空状态
    this.state.clear();

    // 触发事件
    this.emit('clear', oldState);
    for (const [key, oldValue] of oldState.entries()) {
      this.emit(`stateChange:${key}`, undefined, oldValue);
    }

    return true;
  }

  // 获取状态快照
  snapshot() {
    return new Map(this.state);
  }

  // 从快照恢复
  restore(snapshot) {
    const changes = new Map();

    // 计算变化
    for (const [key, value] of snapshot.entries()) {
      const oldValue = this.state.get(key);
      if (!this._isEqual(oldValue, value)) {
        changes.set(key, { oldValue, newValue: value });
      }
    }

    for (const key of this.state.keys()) {
      if (!snapshot.has(key)) {
        changes.set(key, { oldValue: this.state.get(key), newValue: undefined });
      }
    }

    if (changes.size === 0) {
      return false;
    }

    // 记录历史
    if (this.history !== null) {
      this.history.push({
        timestamp: Date.now(),
        type: 'restore',
        changes: Array.from(changes.entries()).map(([key, { oldValue, newValue }]) => ({
          key,
          oldValue,
          newValue,
        })),
      });

      // 限制历史记录长度
      while (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    }

    // 更新状态
    this.state = new Map(snapshot);

    // 触发事件
    this.emit('restore', changes);
    for (const [key, { oldValue, newValue }] of changes.entries()) {
      this.emit(`stateChange:${key}`, newValue, oldValue);
    }

    return true;
  }

  // 获取历史记录
  getHistory() {
    return this.history ? [...this.history] : null;
  }

  // 监听特定状态变化
  watch(key, callback) {
    this.on(`stateChange:${key}`, callback);
    return () => this.off(`stateChange:${key}`, callback);
  }

  // 内部方法：比较两个值是否相等
  _isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(key => this._isEqual(a[key], b[key]));
    }

    return false;
  }
}
