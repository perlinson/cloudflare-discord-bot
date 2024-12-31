import { CommandBuilder } from '../../utils/CommandBuilder.js';

export const EconomyCommands = {
  ECONOMY: new CommandBuilder()
    .setName('economy')
    .setDescription('Economy related commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('balance')
        .setDescription('Check your or another user\'s balance')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to check balance for')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('daily')
        .setDescription('Collect your daily reward')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('weekly')
        .setDescription('Collect your weekly reward')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('work')
        .setDescription('Work to earn some coins')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Check your inventory')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('shop')
        .setDescription('View the item shop')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('transfer')
        .setDescription('Transfer coins to another user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to transfer coins to')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Amount of coins to transfer')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .toJSON(),
};
