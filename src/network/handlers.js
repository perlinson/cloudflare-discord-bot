import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { NETWORK_CONFIG } from './config.js';
import { networkData } from './dataLoader.js';

export async function handleNetworkCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const commandName = data.name.toLowerCase();
    const userId = member.user.id;

    // Initialize storage
    networkData.initialize(env);

    try {
        switch (commandName) {
            case 'connect':
                return await handleConnect(interaction);
            case 'disconnect':
                return await handleDisconnect(interaction);
            case 'channels':
                return await handleChannels(interaction);
            case 'settings':
                return await handleSettings(interaction);
            case 'stats':
                return await handleStats(interaction);
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
        console.error('Error handling network command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleConnect(interaction) {
    const { guild_id, data } = interaction;
    const targetId = data.options.find(opt => opt.name === 'server')?.value;

    if (networkData.isRateLimited(guild_id, 'connect')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: NETWORK_CONFIG.errors.rateLimit,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    try {
        await networkData.addConnection(guild_id, targetId);
        networkData.incrementRateLimit(guild_id, 'connect');

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '✅ Successfully connected to the server!',
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

async function handleDisconnect(interaction) {
    const { guild_id, data } = interaction;
    const targetId = data.options.find(opt => opt.name === 'server')?.value;

    try {
        await networkData.removeConnection(guild_id, targetId);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: '✅ Successfully disconnected from the server.',
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

async function handleChannels(interaction) {
    const { guild_id, data } = interaction;
    const subcommand = data.options[0].name;

    switch (subcommand) {
        case 'add': {
            const channelId = data.options[0].options.find(opt => opt.name === 'channel')?.value;
            const name = data.options[0].options.find(opt => opt.name === 'name')?.value;

            try {
                await networkData.addNetworkChannel(guild_id, {
                    id: channelId,
                    name,
                });

                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `✅ Successfully added channel <#${channelId}> to the network.`,
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

        case 'remove': {
            const channelId = data.options[0].options.find(opt => opt.name === 'channel')?.value;

            try {
                await networkData.removeNetworkChannel(guild_id, channelId);

                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `✅ Successfully removed channel <#${channelId}> from the network.`,
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

        case 'list': {
            const channels = await networkData.getNetworkChannels(guild_id);

            if (channels.length === 0) {
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'No network channels configured.',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
            }

            const channelList = channels.map(
                channel => `• <#${channel.id}> (${channel.name})`
            ).join('\n');

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '📝 Network Channels',
                        description: channelList,
                        color: parseInt(NETWORK_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
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

async function handleSettings(interaction) {
    const { guild_id, data } = interaction;
    const subcommand = data.options[0].name;

    switch (subcommand) {
        case 'view': {
            const settings = await networkData.getNetworkSettings(guild_id);
            const isPremium = await networkData.isPremiumServer(guild_id);

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '⚙️ Network Settings',
                        fields: [
                            {
                                name: 'Premium Status',
                                value: isPremium ? '✅ Active' : '❌ Inactive',
                                inline: true,
                            },
                            {
                                name: 'Auto-Connect',
                                value: settings.autoConnect ? '✅ Enabled' : '❌ Disabled',
                                inline: true,
                            },
                            {
                                name: 'Message Format',
                                value: settings.messageFormat || 'Default',
                                inline: true,
                            },
                        ],
                        color: parseInt(NETWORK_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
        }

        case 'update': {
            const setting = data.options[0].options.find(opt => opt.name === 'setting')?.value;
            const value = data.options[0].options.find(opt => opt.name === 'value')?.value;

            try {
                await networkData.updateNetworkSettings(guild_id, {
                    [setting]: value,
                });

                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `✅ Successfully updated ${setting} setting to ${value}.`,
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

async function handleStats(interaction) {
    const { guild_id, data } = interaction;
    const period = data.options.find(opt => opt.name === 'period')?.value || 'day';

    try {
        const stats = await networkData.getNetworkStats(guild_id, period);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '📊 Network Statistics',
                    fields: [
                        {
                            name: 'Messages',
                            value: stats.messageCount.toString(),
                            inline: true,
                        },
                        {
                            name: 'Connections',
                            value: stats.connectionCount.toString(),
                            inline: true,
                        },
                        {
                            name: 'Channels',
                            value: stats.channelCount.toString(),
                            inline: true,
                        },
                    ],
                    color: parseInt(NETWORK_CONFIG.ui.colors.info.replace('#', ''), 16),
                }],
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
