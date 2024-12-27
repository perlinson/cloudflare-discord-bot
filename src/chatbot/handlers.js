import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { CHATBOT_CONFIG } from './config.js';
import { chatbotData } from './dataLoader.js';

export async function handleChatbotCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const commandName = data.name.toLowerCase();
    const userId = member.user.id;

    // Initialize storage
    chatbotData.initialize(env);

    try {
        switch (commandName) {
            case 'togglechat':
                return await handleToggleChat(interaction);
            case 'chatconfig':
                return await handleChatConfig(interaction);
            case 'clearchat':
                return await handleClearChat(interaction);
            case 'character':
                return await handleCharacterChange(interaction);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error('Error handling chatbot command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleToggleChat(interaction) {
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

async function handleChatConfig(interaction) {
    const { guild_id, data } = interaction;
    const subcommand = data.options[0].name;

    switch (subcommand) {
        case 'view': {
            const settings = await chatbotData.getConfig(guild_id);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '⚙️ Chatbot Settings',
                        fields: Object.entries(settings).map(([key, value]) => ({
                            name: key,
                            value: value.toString(),
                            inline: true,
                        })),
                        color: parseInt(CHATBOT_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
        }

        case 'update': {
            const settings = {};
            for (const option of data.options[0].options) {
                settings[option.name] = option.value;
            }

            await chatbotData.updateConfig(guild_id, settings);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '✅ Settings updated successfully',
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
        }

        default:
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Unknown subcommand',
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
    }
}

async function handleClearChat(interaction) {
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

async function handleCharacterChange(interaction) {
    const { guild_id, data } = interaction;
    const userId = data.user.id;
    const character = data.options[0].value;

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
