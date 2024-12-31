export function isValidSnowflake(id) {
  return /^\d{17,19}$/.test(id);
}

export function isValidHex(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    throw new Error('Permissions must be an array');
  }

  const validPermissions = [
    'CREATE_INSTANT_INVITE',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'MANAGE_GUILD',
    'ADD_REACTIONS',
    'VIEW_AUDIT_LOG',
    'PRIORITY_SPEAKER',
    'STREAM',
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'SEND_TTS_MESSAGES',
    'MANAGE_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'READ_MESSAGE_HISTORY',
    'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS',
    'VIEW_GUILD_INSIGHTS',
    'CONNECT',
    'SPEAK',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS',
    'MOVE_MEMBERS',
    'USE_VAD',
    'CHANGE_NICKNAME',
    'MANAGE_NICKNAMES',
    'MANAGE_ROLES',
    'MANAGE_WEBHOOKS',
    'MANAGE_EMOJIS',
  ];

  for (const permission of permissions) {
    if (!validPermissions.includes(permission)) {
      throw new Error(`Invalid permission: ${permission}`);
    }
  }

  return true;
}

export function validateCommandOptions(options) {
  if (!Array.isArray(options)) {
    throw new Error('Options must be an array');
  }

  const validOptionTypes = [
    'SUB_COMMAND',
    'SUB_COMMAND_GROUP',
    'STRING',
    'INTEGER',
    'BOOLEAN',
    'USER',
    'CHANNEL',
    'ROLE',
    'MENTIONABLE',
    'NUMBER',
  ];

  for (const option of options) {
    if (!option.name || typeof option.name !== 'string') {
      throw new Error('Option name is required and must be a string');
    }

    if (!option.description || typeof option.description !== 'string') {
      throw new Error('Option description is required and must be a string');
    }

    if (!validOptionTypes.includes(option.type)) {
      throw new Error(`Invalid option type: ${option.type}`);
    }
  }

  return true;
}
