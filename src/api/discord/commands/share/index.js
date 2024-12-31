import { CommandBuilder } from '../../utils/CommandBuilder.js';

export const ShareCommands = {
  SHARE: new CommandBuilder()
    .setName('share')
    .setDescription('Content sharing commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('reddit')
        .setDescription('Share content from Reddit')
        .addStringOption(option =>
          option
            .setName('subreddit')
            .setDescription('Subreddit to fetch from')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('category')
            .setDescription('Content category')
            .setRequired(false)
            .setChoices([
                { name: 'Hot', value: 'hot' },
                { name: 'New', value: 'new' },
                { name: 'Top', value: 'top' },
                { name: 'Rising', value: 'rising' }
            ])
        )
    )
}