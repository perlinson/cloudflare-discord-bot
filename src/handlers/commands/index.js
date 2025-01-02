import { InteractionResponseTypes } from '../../api/discord/client/constants.js';
import { DiscordClient } from '../../api/discord/client/index.js';
import { CommandBuilder } from '../../api/discord/utils/CommandBuilder.js';
import { EmbedBuilder } from '../../api/discord/utils/EmbedBuilder.js';
import { ComponentBuilder } from '../../api/discord/utils/ComponentBuilder.js';

export class CommandHandler {
  static async handle(interaction, client, env) {
    const { data: { name, options } } = interaction;

    try {
      switch (name) {
        case 'ping':
          return this.handlePing(interaction);

        case 'help':
          return this.handleHelp(interaction);

        case 'config':
          return this.handleConfig(interaction, env);

        // 添加更多命令处理...

        default:
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: `Unknown command: ${name}`,
              flags: 64, // EPHEMERAL
            },
          };
      }
    } catch (error) {
      console.error(`Error handling command ${name}:`, error);
      return {
        type: InteractionResponseTypes.CHANNEL_MESSAGE,
        data: {
          content: 'An error occurred while processing your command.',
          flags: 64, // EPHEMERAL
        },
      };
    }
  }

  static async handlePing(interaction) {
    return {
      type: InteractionResponseTypes.CHANNEL_MESSAGE,
      data: {
        content: '🏓 Pong!',
        flags: 64, // EPHEMERAL
      },
    };
  }

  static async handleHelp(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Bot Commands')
      .setDescription('Here are all available commands:')
      .addField('/ping', 'Check if the bot is alive')
      .addField('/help', 'Show this help message')
      .addField('/config', 'Manage bot configuration')
      .setColor('#00ff00')
      .toJSON();

    return {
      type: InteractionResponseTypes.CHANNEL_MESSAGE,
      data: {
        embeds: [embed],
        flags: 64, // EPHEMERAL
      },
    };
  }

  static async handleConfig(interaction, env) {
    const subcommand = interaction.data.options[0];
    const { name: subcommandName, options } = subcommand;

    switch (subcommandName) {
      case 'view': {
        // 这里应该从 KV 或 D1 获取配置
        const config = await env.KV.get('botConfig', { type: 'json' }) || {};
        
        const embed = new EmbedBuilder()
          .setTitle('Bot Configuration')
          .setDescription('```json\n' + JSON.stringify(config, null, 2) + '\n```')
          .setColor('#00ff00')
          .toJSON();

        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            embeds: [embed],
            flags: 64, // EPHEMERAL
          },
        };
      }

      case 'set': {
        const key = options.find(opt => opt.name === 'key').value;
        const value = options.find(opt => opt.name === 'value').value;

        try {
          // 获取当前配置
          const config = await env.KV.get('botConfig', { type: 'json' }) || {};
          
          // 更新配置
          config[key] = value;
          
          // 保存配置
          await env.KV.put('botConfig', JSON.stringify(config));

          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: `Configuration updated successfully!\n\`${key}\` = \`${value}\``,
              flags: 64, // EPHEMERAL
            },
          };
        } catch (error) {
          console.error('Error updating config:', error);
          return {
            type: InteractionResponseTypes.CHANNEL_MESSAGE,
            data: {
              content: 'Failed to update configuration.',
              flags: 64, // EPHEMERAL
            },
          };
        }
      }

      default:
        return {
          type: InteractionResponseTypes.CHANNEL_MESSAGE,
          data: {
            content: `Unknown subcommand: ${subcommandName}`,
            flags: 64, // EPHEMERAL
          },
        };
    }
  }

  // 注册命令到 Discord
  static async registerCommands(env) {
    const client = new DiscordClient(env.DISCORD_TOKEN);

    const commands = [
      new CommandBuilder()
        .setName('ping')
        .setDescription('Check if the bot is alive')
        .toJSON(),

      new CommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
        .toJSON(),

      new CommandBuilder()
        .setName('config')
        .setDescription('Manage bot configuration')
        .addSubcommand(subcommand =>
          subcommand
            .setName('view')
            .setDescription('View current configuration')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('set')
            .setDescription('Set a configuration value')
            .addStringOption(option =>
              option
                .setName('key')
                .setDescription('Configuration key')
                .setRequired(true)
            )
            .addStringOption(option =>
              option
                .setName('value')
                .setDescription('Configuration value')
                .setRequired(true)
            )
        )
        .toJSON(),
    ];

    try {
      await client.commands.bulkOverwriteGlobalCommands(
        env.DISCORD_APPLICATION_ID,
        commands
      );
      console.log('Commands registered successfully');
    } catch (error) {
      console.error('Failed to register commands:', error);
      throw error;
    }
  }
}
