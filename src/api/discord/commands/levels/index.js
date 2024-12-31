import { CommandBuilder } from '../../utils/CommandBuilder.js';

export const LevelCommands = {
  LEVEL: new CommandBuilder()
    .setName('level')
    .setDescription('Level system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('rank')
        .setDescription('Check your or another user\'s rank')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to check rank for')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View the server\'s level leaderboard')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Page number to view')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rewards')
        .setDescription('View available level rewards')
    )
    .toJSON(),
};
