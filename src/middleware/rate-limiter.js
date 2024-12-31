import { Logger } from '../utils/logger.js';

const logger = new Logger({ prefix: 'RateLimiter' });

export class RateLimiter {
  constructor(kv) {
    this.kv = kv;
  }

  async isRateLimited(key, limit, window) {
    try {
      const now = Date.now();
      const windowKey = `ratelimit:${key}:${Math.floor(now / window)}`;
      
      let count = 0;
      try {
        const value = await this.kv.get(windowKey);
        count = value ? parseInt(value) : 0;
      } catch (error) {
        logger.error('Error reading rate limit:', error);
        return false; // Fail open on errors
      }
      
      if (count >= limit) {
        logger.warn('Rate limit exceeded:', { key, count, limit });
        return true;
      }
      
      try {
        await this.kv.put(windowKey, (count + 1).toString(), { expirationTtl: window / 1000 });
      } catch (error) {
        logger.error('Error updating rate limit:', error);
      }
      
      return false;
    } catch (error) {
      logger.error('Error in rate limiter:', error);
      return false; // Fail open on errors
    }
  }
}