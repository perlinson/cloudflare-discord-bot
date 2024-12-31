import { LogLevels } from '../config/constants.js';

export class Logger {
  constructor(options = {}) {
    this.prefix = options.prefix || '';
    this.level = options.level || LogLevels.INFO;
  }

  _log(level, message, ...args) {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevels).find(key => LogLevels[key] === level);
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    
    console.log(
      `${timestamp} ${levelName} ${prefix}:`,
      typeof message === 'string' ? message : JSON.stringify(message),
      ...args
    );
  }

  error(message, ...args) {
    this._log(LogLevels.ERROR, message, ...args);
  }

  warn(message, ...args) {
    this._log(LogLevels.WARN, message, ...args);
  }

  info(message, ...args) {
    this._log(LogLevels.INFO, message, ...args);
  }

  debug(message, ...args) {
    this._log(LogLevels.DEBUG, message, ...args);
  }

  trace(message, ...args) {
    this._log(LogLevels.TRACE, message, ...args);
  }
}
