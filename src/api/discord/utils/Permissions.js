export class Permissions {
  static FLAGS = {
    CREATE_INSTANT_INVITE: 1n << 0n,
    KICK_MEMBERS: 1n << 1n,
    BAN_MEMBERS: 1n << 2n,
    ADMINISTRATOR: 1n << 3n,
    MANAGE_CHANNELS: 1n << 4n,
    MANAGE_GUILD: 1n << 5n,
    ADD_REACTIONS: 1n << 6n,
    VIEW_AUDIT_LOG: 1n << 7n,
    PRIORITY_SPEAKER: 1n << 8n,
    STREAM: 1n << 9n,
    VIEW_CHANNEL: 1n << 10n,
    SEND_MESSAGES: 1n << 11n,
    SEND_TTS_MESSAGES: 1n << 12n,
    MANAGE_MESSAGES: 1n << 13n,
    EMBED_LINKS: 1n << 14n,
    ATTACH_FILES: 1n << 15n,
    READ_MESSAGE_HISTORY: 1n << 16n,
    MENTION_EVERYONE: 1n << 17n,
    USE_EXTERNAL_EMOJIS: 1n << 18n,
    VIEW_GUILD_INSIGHTS: 1n << 19n,
    CONNECT: 1n << 20n,
    SPEAK: 1n << 21n,
    MUTE_MEMBERS: 1n << 22n,
    DEAFEN_MEMBERS: 1n << 23n,
    MOVE_MEMBERS: 1n << 24n,
    USE_VAD: 1n << 25n,
    CHANGE_NICKNAME: 1n << 26n,
    MANAGE_NICKNAMES: 1n << 27n,
    MANAGE_ROLES: 1n << 28n,
    MANAGE_WEBHOOKS: 1n << 29n,
    MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
    USE_APPLICATION_COMMANDS: 1n << 31n,
    REQUEST_TO_SPEAK: 1n << 32n,
    MANAGE_EVENTS: 1n << 33n,
    MANAGE_THREADS: 1n << 34n,
    CREATE_PUBLIC_THREADS: 1n << 35n,
    CREATE_PRIVATE_THREADS: 1n << 36n,
    USE_EXTERNAL_STICKERS: 1n << 37n,
    SEND_MESSAGES_IN_THREADS: 1n << 38n,
    USE_EMBEDDED_ACTIVITIES: 1n << 39n,
    MODERATE_MEMBERS: 1n << 40n,
  };

  constructor(permissions = 0n) {
    this.bitfield = BigInt(permissions);
  }

  has(permission, checkAdmin = true) {
    if (checkAdmin && this.has(Permissions.FLAGS.ADMINISTRATOR, false)) return true;
    
    const bit = BigInt(permission);
    return (this.bitfield & bit) === bit;
  }

  add(...permissions) {
    let total = 0n;
    for (const permission of permissions) {
      total |= BigInt(permission);
    }
    this.bitfield |= total;
    return this;
  }

  remove(...permissions) {
    let total = 0n;
    for (const permission of permissions) {
      total |= BigInt(permission);
    }
    this.bitfield &= ~total;
    return this;
  }

  serialize() {
    const serialized = {};
    for (const [flag, bit] of Object.entries(Permissions.FLAGS)) {
      serialized[flag] = this.has(bit, false);
    }
    return serialized;
  }

  toArray() {
    return Object.entries(Permissions.FLAGS)
      .filter(([, bit]) => this.has(bit, false))
      .map(([flag]) => flag);
  }

  static resolve(permission) {
    if (permission instanceof Permissions) return permission.bitfield;
    if (typeof permission === 'string') return Permissions.FLAGS[permission];
    if (typeof permission === 'bigint') return permission;
    if (Array.isArray(permission)) {
      return permission.reduce((total, p) => total | Permissions.resolve(p), 0n);
    }
    throw new TypeError('INVALID_TYPE', 'permission', 'PermissionResolvable');
  }
}
