import { EconomyCommands } from './economy/index.js';
import { ImageCommands } from './image/index.js';
import { LevelCommands } from './levels/index.js';
import { ChatbotCommands } from './chatbot/index.js';
import { ShareCommands } from './share/index.js';

// Export all commands
export const Commands = {
  ...EconomyCommands,
  ...ImageCommands,
  ...LevelCommands,
  ...ChatbotCommands,
  ...ShareCommands,
};

// Command handlers map
const handlers = {
  economy: async (interaction, env, ctx) => {
    const subcommand = interaction.data.options[0];
    switch (subcommand.name) {
      case 'balance':
        return handleBalanceCommand(interaction, subcommand, env);
      case 'daily':
        return handleDailyCommand(interaction, env);
      case 'weekly':
        return handleWeeklyCommand(interaction, env);
      case 'work':
        return handleWorkCommand(interaction, env);
      case 'inventory':
        return handleInventoryCommand(interaction, env);
      case 'shop':
        return handleShopCommand(interaction, env);
      case 'transfer':
        return handleTransferCommand(interaction, subcommand, env);
      default:
        throw new Error(`Unknown subcommand: ${subcommand.name}`);
    }
  },

  image: async (interaction, env, ctx) => {
    const subcommand = interaction.data.options[0];
    switch (subcommand.name) {
      case 'generate':
        return handleImageGenerateCommand(interaction, subcommand, env);
      case 'styles':
        return handleImageStylesCommand(interaction, env);
      case 'queue':
        return handleImageQueueCommand(interaction, env);
      default:
        throw new Error(`Unknown subcommand: ${subcommand.name}`);
    }
  },

  level: async (interaction, env, ctx) => {
    const subcommand = interaction.data.options[0];
    switch (subcommand.name) {
      case 'rank':
        return handleRankCommand(interaction, subcommand, env);
      case 'leaderboard':
        return handleLeaderboardCommand(interaction, subcommand, env);
      case 'rewards':
        return handleRewardsCommand(interaction, env);
      default:
        throw new Error(`Unknown subcommand: ${subcommand.name}`);
    }
  },

  chatbot: async (interaction, env, ctx) => {
    const subcommand = interaction.data.options[0];
    switch (subcommand.name) {
      case 'settings':
        return handleChatbotSettingsCommand(interaction, subcommand, env);
      case 'clear':
        return handleChatbotClearCommand(interaction, env);
      case 'character':
        return handleChatbotCharacterCommand(interaction, subcommand, env);
      default:
        throw new Error(`Unknown subcommand: ${subcommand.name}`);
    }
  },

  share: async (interaction, env, ctx) => {
    const subcommand = interaction.data.options[0];
    switch (subcommand.name) {
      case 'reddit':
        return handleRedditShareCommand(interaction, subcommand, env);
      default:
        throw new Error(`Unknown subcommand: ${subcommand.name}`);
    }
  },
};

// Main command handler
export async function handleCommand(interaction, env, ctx) {
  const { name } = interaction.data;
  const handler = handlers[name];

  if (!handler) {
    throw new Error(`Unknown command: ${name}`);
  }

  return handler(interaction, env, ctx);
}
