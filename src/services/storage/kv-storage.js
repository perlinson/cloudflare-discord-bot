export class KVStorage {
  constructor(namespace) {
    this.namespace = namespace;
  }

  async get(key, options = {}) {
    try {
      const value = await this.namespace.get(key, options);
      return options.type === 'json' ? JSON.parse(value) : value;
    } catch (error) {
      console.error(`Error getting key ${key} from KV:`, error);
      return null;
    }
  }

  async put(key, value, options = {}) {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.namespace.put(key, stringValue, options);
      return true;
    } catch (error) {
      console.error(`Error putting key ${key} to KV:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.namespace.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key} from KV:`, error);
      return false;
    }
  }

  async list(options = {}) {
    try {
      return await this.namespace.list(options);
    } catch (error) {
      console.error('Error listing keys from KV:', error);
      return { keys: [] };
    }
  }
}
