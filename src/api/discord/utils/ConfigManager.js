export class ConfigManager {
  constructor(options = {}) {
    this.data = new Map();
    this.defaults = options.defaults || {};
    this.validators = new Map();
    this.transformers = new Map();
    this.persistenceProvider = options.persistenceProvider;
    this.autoSave = options.autoSave !== false;
    this.logger = options.logger;

    // 初始化默认值
    this.loadDefaults();
  }

  // 加载默认配置
  loadDefaults() {
    for (const [key, value] of Object.entries(this.defaults)) {
      this.set(key, value, { skipValidation: true });
    }
  }

  // 获取配置值
  get(key, defaultValue) {
    if (!this.data.has(key)) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      return this.defaults[key];
    }
    return this.data.get(key);
  }

  // 设置配置值
  set(key, value, options = {}) {
    const { skipValidation = false, skipTransform = false } = options;

    // 验证
    if (!skipValidation && this.validators.has(key)) {
      const validator = this.validators.get(key);
      if (!validator(value)) {
        throw new Error(`Invalid value for config key: ${key}`);
      }
    }

    // 转换
    let transformedValue = value;
    if (!skipTransform && this.transformers.has(key)) {
      const transformer = this.transformers.get(key);
      transformedValue = transformer(value);
    }

    this.data.set(key, transformedValue);

    // 自动保存
    if (this.autoSave && this.persistenceProvider) {
      this.save().catch(err => {
        this.logger?.error('Failed to auto-save config:', err);
      });
    }

    return this;
  }

  // 删除配置值
  delete(key) {
    const deleted = this.data.delete(key);
    
    if (deleted && this.autoSave && this.persistenceProvider) {
      this.save().catch(err => {
        this.logger?.error('Failed to auto-save config after deletion:', err);
      });
    }

    return deleted;
  }

  // 检查配置值是否存在
  has(key) {
    return this.data.has(key);
  }

  // 获取所有配置
  getAll() {
    return Object.fromEntries(this.data);
  }

  // 批量设置配置
  setAll(config, options = {}) {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value, options);
    }
    return this;
  }

  // 重置为默认值
  reset(key) {
    if (key) {
      if (key in this.defaults) {
        return this.set(key, this.defaults[key]);
      }
      return this.delete(key);
    }

    this.data.clear();
    this.loadDefaults();
    return this;
  }

  // 添加验证器
  addValidator(key, validator) {
    this.validators.set(key, validator);
    return this;
  }

  // 添加转换器
  addTransformer(key, transformer) {
    this.transformers.set(key, transformer);
    return this;
  }

  // 保存配置
  async save() {
    if (!this.persistenceProvider) {
      throw new Error('No persistence provider configured');
    }

    try {
      await this.persistenceProvider.save(this.getAll());
    } catch (error) {
      this.logger?.error('Failed to save config:', error);
      throw error;
    }
  }

  // 加载配置
  async load() {
    if (!this.persistenceProvider) {
      throw new Error('No persistence provider configured');
    }

    try {
      const data = await this.persistenceProvider.load();
      this.setAll(data, { skipValidation: true });
    } catch (error) {
      this.logger?.error('Failed to load config:', error);
      throw error;
    }
  }

  // 观察配置变化
  observe(key, callback) {
    const originalSet = this.set.bind(this);
    this.set = (k, v, options = {}) => {
      const oldValue = this.get(k);
      const result = originalSet(k, v, options);
      if (k === key && oldValue !== v) {
        callback(v, oldValue);
      }
      return result;
    };
  }

  // 创建配置命名空间
  namespace(prefix) {
    return {
      get: (key, defaultValue) => this.get(`${prefix}.${key}`, defaultValue),
      set: (key, value, options) => this.set(`${prefix}.${key}`, value, options),
      delete: (key) => this.delete(`${prefix}.${key}`),
      has: (key) => this.has(`${prefix}.${key}`),
    };
  }
}
