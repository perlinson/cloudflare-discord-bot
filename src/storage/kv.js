// KV Storage Layer
export class KVStorage {
    constructor(KV_NAMESPACE) {
        this.kv = KV_NAMESPACE;
    }

    // Key Generation
    static generateKey(type, id, subType = '') {
        return `${type}:${id}${subType ? `:${subType}` : ''}`;
    }

    // Basic Operations
    async get(key) {
        try {
            const value = await this.kv.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, options = {}) {
        try {
            const stringValue = JSON.stringify(value);
            await this.kv.put(key, stringValue, options);
            return true;
        } catch (error) {
            console.error(`Error setting key ${key}:`, error);
            return false;
        }
    }

    async delete(key) {
        try {
            await this.kv.delete(key);
            return true;
        } catch (error) {
            console.error(`Error deleting key ${key}:`, error);
            return false;
        }
    }

    // List Operations
    async list(prefix) {
        try {
            const list = await this.kv.list({ prefix });
            return list.keys;
        } catch (error) {
            console.error(`Error listing keys with prefix ${prefix}:`, error);
            return [];
        }
    }

    // Batch Operations
    async getMany(keys) {
        try {
            const promises = keys.map(key => this.get(key));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in batch get:', error);
            return [];
        }
    }

    async setMany(entries) {
        try {
            const promises = entries.map(([key, value]) => this.set(key, value));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in batch set:', error);
            return [];
        }
    }

    // Cache Operations
    async getWithCache(key, ttl = 3600) {
        try {
            const value = await this.get(key);
            if (value) {
                // Refresh TTL
                await this.set(key, value, { expirationTtl: ttl });
            }
            return value;
        } catch (error) {
            console.error(`Error in getWithCache for key ${key}:`, error);
            return null;
        }
    }

    async setWithCache(key, value, ttl = 3600) {
        try {
            return await this.set(key, value, { expirationTtl: ttl });
        } catch (error) {
            console.error(`Error in setWithCache for key ${key}:`, error);
            return false;
        }
    }
}
