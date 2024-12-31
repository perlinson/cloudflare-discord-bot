export class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 300000; // 默认 5 分钟
    this.maxSize = options.maxSize || 1000;
    this.checkInterval = options.checkInterval || 60000; // 默认 1 分钟
    this.sweepInterval = null;

    if (options.autoSweep !== false) {
      this.startSweeping();
    }
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });

    return this;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    return this;
  }

  sweep() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
    return this;
  }

  startSweeping() {
    if (this.sweepInterval) return this;

    this.sweepInterval = setInterval(() => {
      this.sweep();
    }, this.checkInterval);

    // 确保在 Node.js 环境下正确清理
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        this.stopSweeping();
      });
    }

    return this;
  }

  stopSweeping() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
    return this;
  }

  size() {
    return this.cache.size;
  }

  *entries() {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() <= item.expires) {
        yield [key, item.value];
      } else {
        this.cache.delete(key);
      }
    }
  }

  *keys() {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() <= item.expires) {
        yield key;
      } else {
        this.cache.delete(key);
      }
    }
  }

  *values() {
    for (const item of this.cache.values()) {
      if (Date.now() <= item.expires) {
        yield item.value;
      }
    }
  }

  forEach(callback) {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() <= item.expires) {
        callback(item.value, key, this);
      } else {
        this.cache.delete(key);
      }
    }
    return this;
  }
}
