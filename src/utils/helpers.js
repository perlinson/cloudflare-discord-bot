// 时间相关工具函数
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

export function parseTimeString(timeString) {
  const regex = /^(\d+)([dhms])$/;
  const matches = timeString.match(regex);
  if (!matches) return null;

  const [, value, unit] = matches;
  const multipliers = {
    'd': 24 * 60 * 60 * 1000,
    'h': 60 * 60 * 1000,
    'm': 60 * 1000,
    's': 1000,
  };

  return parseInt(value) * multipliers[unit];
}

// 数字相关工具函数
export function formatNumber(number) {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.log10(Math.abs(number)) / 3 | 0;
  if (tier === 0) return number;
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  return scaled.toFixed(1) + suffix;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 字符串相关工具函数
export function truncate(str, length) {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function escapeMarkdown(text) {
  const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1');
  return unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1');
}

// 数组相关工具函数
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 对象相关工具函数
export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
}

export function omit(obj, keys) {
  return Object.keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

// 权限相关工具函数
export function hasPermission(member, permission) {
  if (member.permissions.includes('ADMINISTRATOR')) return true;
  return member.permissions.includes(permission);
}

export function calculatePermissions(roles) {
  let permissions = new Set();
  for (const role of roles) {
    for (const permission of role.permissions) {
      permissions.add(permission);
    }
  }
  return Array.from(permissions);
}

// 错误处理工具函数
export class APIError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

export function handleError(error) {
  if (error instanceof APIError) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  console.error('Unexpected error:', error);
  return {
    error: true,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    status: 500,
  };
}
