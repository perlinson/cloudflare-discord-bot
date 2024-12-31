export class Logger {
  static LogLevels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4,
  };

  constructor(options = {}) {
    this.level = options.level || Logger.LogLevels.INFO;
    this.prefix = options.prefix || '';
    this.timestamps = options.timestamps !== false;
    this.colors = options.colors !== false;
    this.outputs = options.outputs || [console];
    this.format = options.format || this._defaultFormat.bind(this);
  }

  error(...args) {
    if (this.level >= Logger.LogLevels.ERROR) {
      this._log('ERROR', ...args);
    }
  }

  warn(...args) {
    if (this.level >= Logger.LogLevels.WARN) {
      this._log('WARN', ...args);
    }
  }

  info(...args) {
    if (this.level >= Logger.LogLevels.INFO) {
      this._log('INFO', ...args);
    }
  }

  debug(...args) {
    if (this.level >= Logger.LogLevels.DEBUG) {
      this._log('DEBUG', ...args);
    }
  }

  trace(...args) {
    if (this.level >= Logger.LogLevels.TRACE) {
      this._log('TRACE', ...args);
    }
  }

  setLevel(level) {
    this.level = level;
  }

  addOutput(output) {
    this.outputs.push(output);
  }

  removeOutput(output) {
    const index = this.outputs.indexOf(output);
    if (index !== -1) {
      this.outputs.splice(index, 1);
    }
  }

  _log(level, ...args) {
    const message = this.format(level, args);
    
    for (const output of this.outputs) {
      switch (level) {
        case 'ERROR':
          output.error?.(message) ?? output.log?.(message);
          break;
        case 'WARN':
          output.warn?.(message) ?? output.log?.(message);
          break;
        case 'INFO':
          output.info?.(message) ?? output.log?.(message);
          break;
        case 'DEBUG':
        case 'TRACE':
          output.debug?.(message) ?? output.log?.(message);
          break;
      }
    }
  }

  _defaultFormat(level, args) {
    const parts = [];

    // 添加时间戳
    if (this.timestamps) {
      parts.push(this._getTimestamp());
    }

    // 添加前缀
    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    // 添加日志级别
    parts.push(this._colorize(`[${level}]`, this._getLevelColor(level)));

    // 处理参数
    const messages = args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      }
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      return JSON.stringify(arg, null, 2);
    });

    parts.push(...messages);

    return parts.join(' ');
  }

  _getTimestamp() {
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  _colorize(text, color) {
    if (!this.colors) return text;

    const colors = {
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      gray: '\x1b[90m',
      reset: '\x1b[0m',
    };

    return `${colors[color]}${text}${colors.reset}`;
  }

  _getLevelColor(level) {
    switch (level) {
      case 'ERROR': return 'red';
      case 'WARN': return 'yellow';
      case 'INFO': return 'green';
      case 'DEBUG': return 'blue';
      case 'TRACE': return 'gray';
      default: return 'reset';
    }
  }
}
