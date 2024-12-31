import { CommandBuilder } from '../../utils/CommandBuilder.js';

export const ChatbotCommands = {
  CHATBOT: new CommandBuilder()
    .setName('chatbot')
    .setDescription('Chatbot configuration and interaction')
    .addSubcommand(subcommand =>
      subcommand
        .setName('settings')
        .setDescription('Configure chatbot settings')
        .addStringOption(option =>
          option
            .setName('setting')
            .setDescription('Setting to change')
            .setRequired(true)
            .setChoices([
                { name: 'Language', value: 'language' },
                { name: 'Personality', value: 'personality' },
                { name: 'Memory', value: 'memory' },
                { name: 'Reactions', value: 'reactions' }
            ])
        )
        .addStringOption(option =>
          option
            .setName('value')
            .setDescription('New value for the setting')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('chat')
        .setDescription('Chat with the bot')
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('Message to send to the bot')
            .setRequired(true)
        )
    )
}