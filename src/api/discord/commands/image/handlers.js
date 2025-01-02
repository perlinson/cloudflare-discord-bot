import { InteractionResponseType } from 'discord-interactions';
import { ImageGenerationService } from './service.js';

const DEFAULT_PARAMS = {
  aspect_ratio: '1:1 square 1024x1024',
  sampler: 'euler',
  scheduler: 'simple',
  steps: 8,
  guidance: 3.5,
  seed: 0
};

export async function handleImageCommands(interaction, client, env) {
  const imageService = new ImageGenerationService(env);
  imageService.initialize(env);
  const subcommand = interaction.data.options?.[0];

  if (!subcommand) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '请提供有效的命令！',
        flags: 64
      }
    };
  }

  try {
    switch (subcommand.name) {
      case 'generate': {
        const options = subcommand.options;
        const generateResponse = await handleGenerate(interaction, options, client, env, imageService);
        return generateResponse;
      }

      case 'history': {
        const history = await imageService.repository.getImageHistory(interaction.member.user.id);
        if (history.length === 0) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '您还没有生成过任何图片！',
              flags: 64
            }
          };
        }

        const content = history
          .map((item, index) => `${index + 1}. ${item.prompt}`)
          .join('\n');

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `您的生成历史：\n${content}`,
            flags: 64
          }
        };
      }

      default:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '未知的命令！',
            flags: 64
          }
        };
    }
  } catch (error) {
    console.error('[Image] Error handling command:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '处理命令时发生错误！',
        flags: 64
      }
    };
  }
}

async function handleGenerate(interaction, options, client, env, imageService) {
  try {
    // console.log('Generate options:', JSON.stringify(options, null, 2));
    
    // 解析参数，处理数组形式的选项
    const getOptionValue = (name) => {
      if (Array.isArray(options)) {
        return options.find(opt => opt.name === name)?.value;
      }
      return options[name];
    };

    const params = {
      prompt: getOptionValue('prompt'),
      aspect_ratio: getOptionValue('aspect_ratio') || DEFAULT_PARAMS.aspect_ratio,
      seed: getOptionValue('seed') || DEFAULT_PARAMS.seed,
      steps: getOptionValue('steps') || DEFAULT_PARAMS.steps,
      sampler: getOptionValue('sampler') || DEFAULT_PARAMS.sampler,
      scheduler: getOptionValue('scheduler') || DEFAULT_PARAMS.scheduler,
      guidance: getOptionValue('guidance') || DEFAULT_PARAMS.guidance,
    };

    // 验证必填参数
    if (!params.prompt) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Please provide a prompt for image generation.',
        },
      };
    }

    // 1. 立即返回一个响应
    const response = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '🎨 Starting image generation...',
        embeds: [{
          title: 'Generation Parameters',
          fields: Object.entries(params)
            .filter(([key]) => key !== 'prompt')
            .map(([key, value]) => ({
              name: key,
              value: value.toString(),
              inline: true
            })),
          description: `**Prompt:** ${params.prompt}`
        }]
      },
    };

    console.log('interaction:', interaction);

    // 开始生成图片
    await imageService.generateImage(params, interaction.application_id, interaction.token, interaction.member.user.id, interaction.guild_id);

    return response;
  } catch (error) {
    console.error('Error in handleGenerate:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ An error occurred while processing your request.',
      },
    };
  }
}
