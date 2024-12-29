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

    // Initialize storage only once
    initialize('chatbot', env, (env) => {
        chatbotData.initialize(env);
    });

    try {
        switch (commandName) {
            case 'toggle':
                return await handleToggleChat(interaction, env);
            case 'config':
                const setting = options.find(opt => opt.name === 'setting')?.value;
                const value = options.find(opt => opt.name === 'value')?.value;
                return await handleConfig(interaction, setting, value, env);
            case 'clear':
                return await handleClearChat(interaction, env);
            case 'character':
                const character = options.find(opt => opt.name === 'character')?.value;
                return await handleCharacter(interaction, character, env);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown chat command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error('Error handling chat command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
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
