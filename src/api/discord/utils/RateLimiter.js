export class RateLimiter {
  constructor(options = {}) {
    this.limits = new Map();
    this.defaultLimit = options.limit || 5;
    this.defaultWindow = options.window || 1000; // 毫秒
    this.defaultGlobalLimit = options.globalLimit;
    this.defaultGlobalWindow = options.globalWindow;
    
    // 全局速率限制
    if (this.defaultGlobalLimit) {
      this.globalTokens = this.defaultGlobalLimit;
      this.globalLastRefill = Date.now();
      this.globalQueue = [];
    }
  }

  async acquire(key, limit = this.defaultLimit, window = this.defaultWindow) {
    // 检查全局限制
    if (this.defaultGlobalLimit) {
      await this._waitForGlobalToken();
    }

    // 获取或创建桶
    let bucket = this.limits.get(key);
    if (!bucket) {
      bucket = {
        tokens: limit,
        lastRefill: Date.now(),
        limit,
        window,
        queue: [],
      };
      this.limits.set(key, bucket);
    }

    // 补充令牌
    this._refillBucket(bucket);

    // 如果没有可用令牌，等待
    if (bucket.tokens <= 0) {
      await new Promise(resolve => {
        bucket.queue.push(resolve);
      });
    }

    // 消耗令牌
    bucket.tokens--;

    return {
      remaining: bucket.tokens,
      reset: bucket.lastRefill + bucket.window,
    };
  }

  _refillBucket(bucket) {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / bucket.window) * bucket.limit;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;

      // 处理等待队列
      while (bucket.queue.length > 0 && bucket.tokens > 0) {
        const resolve = bucket.queue.shift();
        bucket.tokens--;
        resolve();
      }
    }
  }

  async _waitForGlobalToken() {
    // 补充全局令牌
    const now = Date.now();
    const timePassed = now - this.globalLastRefill;
    const tokensToAdd = Math.floor(timePassed / this.defaultGlobalWindow) * this.defaultGlobalLimit;

    if (tokensToAdd > 0) {
      this.globalTokens = Math.min(this.defaultGlobalLimit, this.globalTokens + tokensToAdd);
      this.globalLastRefill = now;

      // 处理全局等待队列
      while (this.globalQueue.length > 0 && this.globalTokens > 0) {
        const resolve = this.globalQueue.shift();
        this.globalTokens--;
        resolve();
      }
    }

    // 如果没有全局令牌可用，等待
    if (this.globalTokens <= 0) {
      await new Promise(resolve => {
        this.globalQueue.push(resolve);
      });
    } else {
      this.globalTokens--;
    }
  }

  async removeLimit(key) {
    this.limits.delete(key);
  }

  async clearLimits() {
    this.limits.clear();
  }

  getRemainingTokens(key) {
    const bucket = this.limits.get(key);
    if (!bucket) return this.defaultLimit;

    this._refillBucket(bucket);
    return bucket.tokens;
  }

  getResetTime(key) {
    const bucket = this.limits.get(key);
    if (!bucket) return Date.now();

    return bucket.lastRefill + bucket.window;
  }
}
