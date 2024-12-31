export class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.intervals = new Map();
    this.timeouts = new Map();
  }

  // 定时任务
  schedule(name, cronExpression, task) {
    if (this.tasks.has(name)) {
      throw new Error(`Task ${name} already exists`);
    }

    const schedule = this._parseCronExpression(cronExpression);
    const taskInfo = {
      name,
      cronExpression,
      task,
      schedule,
      nextRun: this._getNextRunTime(schedule),
      running: false,
    };

    this.tasks.set(name, taskInfo);
    this._scheduleTask(taskInfo);

    return taskInfo;
  }

  // 取消定时任务
  unschedule(name) {
    const taskInfo = this.tasks.get(name);
    if (taskInfo) {
      clearTimeout(taskInfo.timeout);
      this.tasks.delete(name);
    }
  }

  // 立即执行任务
  async runTask(name) {
    const taskInfo = this.tasks.get(name);
    if (!taskInfo) {
      throw new Error(`Task ${name} not found`);
    }

    if (taskInfo.running) {
      throw new Error(`Task ${name} is already running`);
    }

    try {
      taskInfo.running = true;
      await taskInfo.task();
    } finally {
      taskInfo.running = false;
      taskInfo.lastRun = new Date();
      taskInfo.nextRun = this._getNextRunTime(taskInfo.schedule);
      this._scheduleTask(taskInfo);
    }
  }

  // 设置间隔执行
  setInterval(name, callback, interval) {
    if (this.intervals.has(name)) {
      throw new Error(`Interval ${name} already exists`);
    }

    const id = setInterval(callback, interval);
    this.intervals.set(name, id);
    return id;
  }

  // 清除间隔执行
  clearInterval(name) {
    const id = this.intervals.get(name);
    if (id) {
      clearInterval(id);
      this.intervals.delete(name);
    }
  }

  // 设置延时执行
  setTimeout(name, callback, delay) {
    if (this.timeouts.has(name)) {
      throw new Error(`Timeout ${name} already exists`);
    }

    const id = setTimeout(() => {
      this.timeouts.delete(name);
      callback();
    }, delay);

    this.timeouts.set(name, id);
    return id;
  }

  // 清除延时执行
  clearTimeout(name) {
    const id = this.timeouts.get(name);
    if (id) {
      clearTimeout(id);
      this.timeouts.delete(name);
    }
  }

  // 获取所有任务
  getTasks() {
    return Array.from(this.tasks.values());
  }

  // 获取特定任务
  getTask(name) {
    return this.tasks.get(name);
  }

  // 内部方法：解析 cron 表达式
  _parseCronExpression(expression) {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    return {
      minute: this._parseField(parts[0], 0, 59),
      hour: this._parseField(parts[1], 0, 23),
      dayOfMonth: this._parseField(parts[2], 1, 31),
      month: this._parseField(parts[3], 1, 12),
      dayOfWeek: this._parseField(parts[4], 0, 6),
    };
  }

  // 内部方法：解析 cron 字段
  _parseField(field, min, max) {
    if (field === '*') {
      return { type: 'all' };
    }

    if (field.includes('/')) {
      const [start, step] = field.split('/');
      return {
        type: 'step',
        start: start === '*' ? min : parseInt(start),
        step: parseInt(step),
      };
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return {
        type: 'range',
        start: parseInt(start),
        end: parseInt(end),
      };
    }

    if (field.includes(',')) {
      return {
        type: 'list',
        values: field.split(',').map(v => parseInt(v)),
      };
    }

    return {
      type: 'value',
      value: parseInt(field),
    };
  }

  // 内部方法：获取下次运行时间
  _getNextRunTime(schedule) {
    const now = new Date();
    const next = new Date(now);

    // 简单实现，实际应该更复杂
    next.setSeconds(0);
    next.setMilliseconds(0);

    if (schedule.minute.type === 'value') {
      next.setMinutes(schedule.minute.value);
    }

    if (schedule.hour.type === 'value') {
      next.setHours(schedule.hour.value);
    }

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  // 内部方法：调度任务
  _scheduleTask(taskInfo) {
    const now = new Date();
    const delay = taskInfo.nextRun.getTime() - now.getTime();

    taskInfo.timeout = setTimeout(() => {
      this.runTask(taskInfo.name);
    }, delay);
  }
}
