import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { chatbotData } from './dataLoader.js';
import { CHATBOT_CONFIG } from './config.js';
import { initialize } from '../utils/storage.js';

export async function handleChatCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const subCommand = data.options[0];
    const commandName = subCommand.name.toLowerCase();
    const options = subCommand.options || [];
    const userId = member.user.id;

    // 首先发送一个延迟响应
    const response = {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            flags: InteractionResponseFlags.EPHEMERAL
        }
    };

    // Initialize storage only once
    initialize('chatbot', env, (env) => {
        chatbotData.initialize(env);
    });

    try {
        let result;
        switch (commandName) {
            case 'toggle':
                result = await handleToggleChat(interaction, env);
                break;
            case 'config':
                const setting = options.find(opt => opt.name === 'setting')?.value;
                const value = options.find(opt => opt.name === 'value')?.value;
                result = await handleConfig(interaction, setting, value, env);
                break;
            case 'clear':
                result = await handleClearChat(interaction, env);
                break;
            case 'character':
                const character = options.find(opt => opt.name === 'character')?.value;
                result = await handleCharacter(interaction, character, env);
                break;
            default:
                result = {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown chat command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }

        // 使用 webhook 发送最终结果
        const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}/messages/@original`;
        const webhookResponse = await fetch(webhookUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result.data),
        });

        if (!webhookResponse.ok) {
            throw new Error(`Failed to send webhook response: ${webhookResponse.status}`);
        }

        return response;
    } catch (error) {
        console.error('Error handling chat command:', error);
        
        // 如果出错，更新原始消息
        const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}/messages/@original`;
        await fetch(webhookUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            }),
        });

        return response;
    }
}

async function handleToggleChat(interaction, env) {
    const { guild_id, data, member } = interaction;
    const userId = member.user.id;

    if (chatbotData.isRateLimited(userId, 'togglechat')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: CHATBOT_CONFIG.errors.rateLimit,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    try {
        const isEnabled = chatbotData.isChannelEnabled(guild_id);
        
        if (isEnabled) {
            chatbotData.disableChannel(guild_id);
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '🤖 Chatbot has been disabled in this channel.',
                },
            };
        } else {
            chatbotData.setChannelEnabled(guild_id);
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '🤖 Chatbot has been enabled in this channel! You can now chat with me.',
                },
            };
        }
    } catch (error) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleConfig(interaction, setting, value, env) {
    const { guild_id, data } = interaction;

    try {
        await chatbotData.updateConfig(guild_id, { [setting]: value });

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '✅ Settings updated successfully',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    } catch (error) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleClearChat(interaction, env) {
    const { guild_id, data } = interaction;
    const userId = data.user.id;

    chatbotData.clearConversation(userId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: '🗑️ Your chat history has been cleared.',
        },
    };
}

async function handleCharacter(interaction, character, env) {
    const { guild_id, data } = interaction;
    const userId = data.user.id;

    if (!CHATBOT_CONFIG.characters[character]) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '❌ Invalid character selected.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    chatbotData.updateUserSettings(userId, { character });
    const characterConfig = CHATBOT_CONFIG.characters[character];

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Character changed to ${characterConfig.name}!\n${characterConfig.greeting}`,
        },
    };
}

export async function handleChatbotMessage(message, env) {
    return await chatHandler.handleMessage(message, env);
}

export async function handleChatbotButton(interaction, env) {
    return await chatHandler.handleButtonClick(interaction, env);
}
