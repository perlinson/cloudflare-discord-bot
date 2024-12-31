import { InteractionResponseType } from 'discord-interactions';
import { ImageGenerationService } from './service.js';
import { InteractionsAPI } from '../../resources/interactions.js';
import { DiscordClient } from '../../client/index.js';
import { MessagesAPI } from '../../resources/messages.js';

const DEFAULT_PARAMS = {
  aspect_ratio: '1:1 square 1024x1024',
  sampler: 'euler',
  scheduler: 'simple',
  steps: 8,
  guidance: 3.5,
  seed: 0
};

export async function handleImageCommands(interaction, env) {
  const imageService = new ImageGenerationService(env);
  imageService.initialize(env);
  const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
  const interactionsApi = new InteractionsAPI(client);
  const messagesApi = new MessagesAPI(client);
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

        // await messagesApi.send(interaction.channel_id, 'Generating image...');
        // await interactionsApi.reply(interaction.id, interaction.token, 'Generating image...');

        // Return deferred response immediately
        const response = {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 0
          }
        };

        const options = subcommand.options;
        const generateResponse = await handleGenerate(interaction, options, env, imageService);

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

// async function handleGenerate(interaction, options, env, imageService) {
//   try {
//       console.log('Generate options:', JSON.stringify(options, null, 2));
      
//       // 解析参数，处理数组形式的选项
//       const getOptionValue = (name) => {
//           if (Array.isArray(options)) {
//               return options.find(opt => opt.name === name)?.value;
//           }
//           return options[name];
//       };

//       const params = {
//           prompt: getOptionValue('prompt'),
//           aspect_ratio: getOptionValue('aspect_ratio') || DEFAULT_PARAMS.aspect_ratio,
//           seed: getOptionValue('seed') || DEFAULT_PARAMS.seed,
//           steps: getOptionValue('steps') || DEFAULT_PARAMS.steps,
//           sampler: getOptionValue('sampler') || DEFAULT_PARAMS.sampler,
//           scheduler: getOptionValue('scheduler') || DEFAULT_PARAMS.scheduler,
//           guidance: getOptionValue('guidance') || DEFAULT_PARAMS.guidance,
//       };

//       console.log('Parsed params:', JSON.stringify(params, null, 2));

//       // 验证必填参数
//       if (!params.prompt) {
//           console.log('Missing prompt parameter');
//           return {
//               type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//               data: {
//                   content: '❌ Please provide a prompt for image generation.',
//               },
//           };
//       }

//       // 确保 imageService 已初始化
//       if (!imageService.cd) {
//           console.log('Initializing imageService');
//           imageService.initialize(env);
//       }

//       // 发送初始响应
//       const response = {
//           type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//           data: {
//               content: '🎨 Starting image generation...',
//               embeds: [{
//                   title: 'Generation Parameters',
//                   fields: Object.entries(params)
//                       .filter(([key]) => key !== 'prompt')
//                       .map(([key, value]) => ({
//                           name: key,
//                           value: value.toString(),
//                           inline: true
//                       })),
//                   description: `**Prompt:** ${params.prompt}`
//               }]
//           },
//       };

//       // 异步启动图像生成
//       const channelId = interaction.channel_id;
//       const messageId = interaction.id;
      
//       console.log('Starting async image generation with:', {
//           channelId,
//           messageId,
//           params
//       });

//       // 使用 queueMicrotask 来确保在返回响应后执行
//       // queueMicrotask(async () => {
          
//       // });

//       try {
//           console.log('Calling imageService.generateImage');
//           // 开始生成图像
//           const runId = await imageService.generateImage(params, channelId, messageId);
//           console.log('Generation started with runId:', runId);
//       } catch (error) {
//           console.error('Error in async image generation:', error);
//           // 发送错误消息到 Discord
//           try {
//               const errorMessage = new FormData();
//               errorMessage.append('content', `❌ Error generating image: ${error.message}`);
//               console.log('Sending error message to Discord');
//               await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
//                   method: 'POST',
//                   headers: {
//                       'Authorization': `Bot ${env.DISCORD_TOKEN}`,
//                   },
//                   body: errorMessage,
//               });
//           } catch (sendError) {
//               console.error('Error sending error message:', sendError);
//           }
//       }

//       console.log('Returning initial response');
//       return response;
//   } catch (error) {
//       console.error('Error in handleGenerate:', error);
//       return {
//           type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
//           data: {
//               content: `❌ Error: ${error.message}`,
//           },
//       };
//   }
// }

async function handleGenerate(interaction, options, env, imageService) {
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


    // 开始生成图片
    const result = await imageService.generateImage(params);

    // 2. 在后台处理长时间任务
    const channelId = interaction.channel_id;
    const client = new DiscordClient(env.DISCORD_TOKEN, {}, env);
    const messagesAPI = new MessagesAPI(client);

    // 创建一个异步任务
    (async () => {
      try {
        // 发送初始进度消息
        const progressMsg = await messagesAPI.send(channelId, {
          content: '⏳ Preparing image generation...',
        });

        

        // 更新消息为完成状态
        await messagesAPI.edit(channelId, progressMsg.id, {
          content: '✨ Image generated!',
          embeds: [{
            image: {
              url: result.imageUrl
            }
          }]
        });
      } catch (error) {
        console.error('Image generation failed:', error);
        await messagesAPI.send(channelId, {
          content: '❌ Failed to generate image: ' + error.message,
        });
      }
    })();

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
