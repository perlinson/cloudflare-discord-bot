import { CommandBuilder } from '../../utils/CommandBuilder.js';

export const ImageCommands = {
  IMAGE: new CommandBuilder()
    .setName('image')
    .setDescription('AI image generation commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Generate an image from a text description')
        .addStringOption(option =>
          option
            .setName('prompt')
            .setDescription('Text description of the image you want to generate')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('style')
            .setDescription('Style preset to use')
            .setRequired(false)
            .setChoices([
                { name: 'Anime', value: 'anime' },
                { name: 'Realistic', value: 'realistic' },
                { name: 'Fantasy', value: 'fantasy' },
                { name: 'Cyberpunk', value: 'cyberpunk' }
            ])
        )
        .addStringOption(option =>
          option
            .setName('negative')
            .setDescription('Things to avoid in the generated image')
            .setRequired(false)
        )
    )
}