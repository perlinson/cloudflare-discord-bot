import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { imageService } from './service.js';
import { initialize } from '../utils/storage.js';

const DEFAULT_PARAMS = {
    aspect_ratio: '1:1 square 1024x1024',
    sampler: 'euler',
    scheduler: 'simple',
    steps: 20,
    guidance: 3.5,
    seed: Math.floor(Math.random() * 1000000)
};

export async function handleImageCommands(interaction, env) {
    console.log('Received interaction:', JSON.stringify(interaction, null, 2));
    console.log('Environment variables:', {
        hasComfyKey: !!env.COMFY_DEPLOY_API_KEY,
        hasAppId: !!env.APP_ID,
        appId: env.APP_ID,
        envKeys: Object.keys(env)
    });
    const { type, data, member, guild_id } = interaction;
    console.log('Command data:', JSON.stringify(data, null, 2));
    
    const subCommand = data.options[0];
    console.log('Subcommand:', JSON.stringify(subCommand, null, 2));
    
    const commandName = subCommand.name.toLowerCase();
    const options = subCommand.options || [];
    console.log('Options:', JSON.stringify(options, null, 2));
    
    const userId = member.user.id;

    // Initialize storage only once
    initialize('imageai', env, (env) => {
        imageService.initialize(env);
    });

    try {
        switch (commandName) {
            case 'generate':
                return await handleGenerate(interaction, options, env);
            case 'queue':
                return await handleQueue(interaction);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown image command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error('Error handling image command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleGenerate(interaction, options, env) {
    try {
        console.log('Generate options:', JSON.stringify(options, null, 2));
        
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

        console.log('Parsed params:', JSON.stringify(params, null, 2));

        // 验证必填参数
        if (!params.prompt) {
            console.log('Missing prompt parameter');
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '❌ Please provide a prompt for image generation.',
                },
            };
        }

        // 确保 imageService 已初始化
        if (!imageService.cd) {
            console.log('Initializing imageService');
            imageService.initialize(env);
        }

        // 发送初始响应
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

        // 异步启动图像生成
        const channelId = interaction.channel_id;
        const messageId = interaction.id;
        
        console.log('Starting async image generation with:', {
            channelId,
            messageId,
            params
        });

        // 使用 queueMicrotask 来确保在返回响应后执行
        // queueMicrotask(async () => {
            
        // });

        try {
            console.log('Calling imageService.generateImage');
            // 开始生成图像
            const runId = await imageService.generateImage(params, channelId, messageId);
            console.log('Generation started with runId:', runId);
        } catch (error) {
            console.error('Error in async image generation:', error);
            // 发送错误消息到 Discord
            try {
                const errorMessage = new FormData();
                errorMessage.append('content', `❌ Error generating image: ${error.message}`);
                console.log('Sending error message to Discord');
                await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${env.DISCORD_TOKEN}`,
                    },
                    body: errorMessage,
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }

        console.log('Returning initial response');
        return response;
    } catch (error) {
        console.error('Error in handleGenerate:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
            },
        };
    }
}

async function handleQueue(interaction) {
    const runningTasks = imageService.getRunningTasks();
    
    if (runningTasks.length === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '✨ No tasks in the queue',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const taskList = runningTasks.map(task => {
        const elapsedTime = imageService.getElapsedTime(task.runId);
        return `• Task ${task.runId}: Running for ${elapsedTime}s`;
    }).join('\n');

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🎨 Generation Queue',
                description: taskList,
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}
