export const InteractionTypes = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
};

export const InteractionResponseTypes = {
  PONG: 1,
  CHANNEL_MESSAGE: 4,
  DEFERRED_CHANNEL_MESSAGE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
};

export const ButtonStyles = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
};

export const ComponentTypes = {
  ACTION_ROW: 1,
  BUTTON: 2,
  SELECT_MENU: 3,
  TEXT_INPUT: 4,
};

export const TextInputStyles = {
  SHORT: 1,
  PARAGRAPH: 2,
};

export const LogLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

export const CacheKeys = {
  GUILD_CONFIG: 'guild:config:',
  USER_PROFILE: 'user:profile:',
  COMMAND_COOLDOWN: 'cooldown:command:',
};

export const DatabaseTables = {
  USERS: 'users',
  GUILDS: 'guilds',
  ECONOMY: 'economy',
  LEVELS: 'levels',
  TICKETS: 'tickets',
  FEEDBACK: 'feedback',
};
