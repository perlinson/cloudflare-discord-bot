export class CloudflareKV {
    constructor(namespace) {
        this.namespace = namespace;
    }

    async get(key) {
        try {
            return await this.namespace.get(key);
        } catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null;
        }
    }

    async put(key, value) {
        try {
            await this.namespace.put(key, value);
            return true;
        } catch (error) {
            console.error(`Error putting key ${key}:`, error);
            return false;
        }
    }

    async delete(key) {
        try {
            await this.namespace.delete(key);
            return true;
        } catch (error) {
            console.error(`Error deleting key ${key}:`, error);
            return false;
        }
    }

    async list(options = {}) {
        try {
            return await this.namespace.list(options);
        } catch (error) {
            console.error('Error listing keys:', error);
            return { keys: [] };
        }
    }
}
