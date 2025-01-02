export const API_VERSION = '10';
export const DISCORD_API_URL = 'https://discord.com/api';

export const Endpoints = {
  // Discord API endpoints (using official API)
  GLOBAL_COMMANDS: (applicationId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/applications/${applicationId}/commands`,
  GUILD_COMMANDS: (applicationId, guildId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/applications/${applicationId}/guilds/${guildId}/commands`,
  CHANNELS: (channelId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/channels/${channelId}`,
  CHANNEL_MESSAGES: (channelId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/channels/${channelId}/messages`,
  CHANNEL_MESSAGE: (channelId, messageId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/channels/${channelId}/messages/${messageId}`,
  CHANNEL_PINS: (channelId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/channels/${channelId}/pins`,
  GUILD: (guildId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/guilds/${guildId}`,
  GUILD_MEMBERS: (guildId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/guilds/${guildId}/members`,
  GUILD_MEMBER: (guildId, userId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/guilds/${guildId}/members/${userId}`,
  GUILD_ROLES: (guildId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/guilds/${guildId}/roles`,
  GUILD_ROLE: (guildId, roleId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/guilds/${guildId}/roles/${roleId}`,
  USERS: `${DISCORD_API_URL}/v${API_VERSION}/users`,
  USER: (userId) => 
    `${DISCORD_API_URL}/v${API_VERSION}/users/${userId}`,
  USER_DM: `${DISCORD_API_URL}/v${API_VERSION}/users/@me/channels`,

  // Interaction endpoints (using custom server)
  INTERACTION_CALLBACK: (interactionId, token) => 
    `${DISCORD_API_URL}/v${API_VERSION}/interactions/${interactionId}/${token}/callback`,
  INTERACTION_FOLLOWUP: (applicationId, token) => 
    `${DISCORD_API_URL}/v${API_VERSION}/webhooks/${applicationId}/${token}`,
  INTERACTION_RESPONSE: (applicationId, token) => 
    `${DISCORD_API_URL}/v${API_VERSION}/webhooks/${applicationId}/${token}/messages/@original`,
};

export const InteractionResponseTypes = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
};

export const InteractionResponseFlags = {
  EPHEMERAL: 1 << 6,
};

export const InteractionTypes = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
};

export const MessageFlags = {
  CROSSPOSTED: 1 << 0,
  IS_CROSSPOST: 1 << 1,
  SUPPRESS_EMBEDS: 1 << 2,
  SOURCE_MESSAGE_DELETED: 1 << 3,
  URGENT: 1 << 4,
  HAS_THREAD: 1 << 5,
  EPHEMERAL: 1 << 6,
  LOADING: 1 << 7,
};

export const RateLimits = {
  MESSAGES: {
    SEND: 5,  // 每5秒
    BULK_DELETE: 30, // 每30秒
  },
  GUILD: {
    UPDATE: 60, // 每60秒
  },
  CHANNEL: {
    UPDATE: 30, // 每30秒
  },
};
