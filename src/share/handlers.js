import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { SHARE_CONFIG } from './config.js';
import { shareData } from './dataLoader.js';

export async function handleShareCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const subCommand = data.options[0];
    const commandName = subCommand.name.toLowerCase();
    const options = subCommand.options || [];
    const userId = member.user.id;

    try {
        switch (commandName) {
            case 'file':
                const file = options.find(opt => opt.name === 'file')?.value;
                const description = options.find(opt => opt.name === 'description')?.value;
                return await handleFileShare(interaction, file, description, env);
            case 'text':
                const content = options.find(opt => opt.name === 'content')?.value;
                return await handleTextShare(interaction, content, env);
            case 'share':
                return await handleShare(interaction);
            case 'update':
                return await handleUpdate(interaction);
            case 'remove':
                return await handleRemove(interaction);
            case 'preview':
                return await handlePreview(interaction);
            case 'search':
                return await handleSearch(interaction);
            case 'serverinfo':
                return await handleServerInfo(interaction);
            case 'customize':
                return await handleCustomize(interaction);
            case 'bump':
                return await handleBump(interaction);
            case 'analytics':
                return await handleAnalytics(interaction);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown server list command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error(`Error handling server list command ${commandName}:`, error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `❌ Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleShare(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;
    const description = interaction.data.options.find(opt => opt.name === 'description')?.value;
    const category = interaction.data.options.find(opt => opt.name === 'category')?.value;
    const tags = interaction.data.options.find(opt => opt.name === 'tags')?.value?.split(',').map(tag => tag.trim());

    // Check if user can add more servers
    if (!shareData.canAddServer(userId)) {
        throw new Error('You have reached the maximum number of servers you can share.');
    }

    // Get guild information
    const guild = await getGuildInfo(guildId);
    if (!guild) {
        throw new Error('Failed to fetch server information.');
    }

    // Check member count
    if (guild.memberCount < SHARE_CONFIG.server.minMembers) {
        throw new Error(`Server must have at least ${SHARE_CONFIG.server.minMembers} members to be listed.`);
    }

    // Validate data
    const serverData = {
        name: guild.name,
        description,
        category,
        tags: tags || [],
        ownerId: userId,
        icon: guild.icon,
        banner: guild.banner,
        memberCount: guild.memberCount,
        features: guild.features,
        invites: [], // Will be populated later
    };

    const errors = shareData.validateServerData(serverData);
    if (errors.length > 0) {
        throw new Error(`Invalid server data: ${errors.join(', ')}`);
    }

    // Add server to the list
    shareData.addServer(guildId, serverData);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Server Added',
                description: 'Your server has been added to the server list!',
                fields: [
                    {
                        name: 'Name',
                        value: serverData.name,
                        inline: true,
                    },
                    {
                        name: 'Category',
                        value: SHARE_CONFIG.categories[category].name,
                        inline: true,
                    },
                    {
                        name: 'Members',
                        value: serverData.memberCount.toString(),
                        inline: true,
                    },
                ],
                color: parseInt(SHARE_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleUpdate(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;
    const description = interaction.data.options.find(opt => opt.name === 'description')?.value;
    const category = interaction.data.options.find(opt => opt.name === 'category')?.value;
    const tags = interaction.data.options.find(opt => opt.name === 'tags')?.value?.split(',').map(tag => tag.trim());

    // Check if server is listed
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed. Use /share to add it first.');
    }

    // Check ownership
    if (server.ownerId !== userId) {
        throw new Error('You do not own this server listing.');
    }

    // Check cooldown
    if (!shareData.checkUpdateCooldown(guildId)) {
        throw new Error(SHARE_CONFIG.errors.cooldown);
    }

    // Update data
    const updates = {};
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (tags) updates.tags = tags;

    // Validate updates
    const errors = shareData.validateServerData({ ...server, ...updates });
    if (errors.length > 0) {
        throw new Error(`Invalid update data: ${errors.join(', ')}`);
    }

    // Apply updates
    shareData.updateServer(guildId, updates);
    shareData.updateCooldown(guildId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Server Updated',
                description: 'Your server listing has been updated!',
                color: parseInt(SHARE_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleRemove(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;

    // Check if server is listed
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed.');
    }

    // Check ownership
    if (server.ownerId !== userId) {
        throw new Error('You do not own this server listing.');
    }

    // Remove server
    shareData.removeServer(guildId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Server Removed',
                description: 'Your server has been removed from the server list.',
                color: parseInt(SHARE_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handlePreview(interaction) {
    const guildId = interaction.guild_id;

    // Get server listing
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed.');
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [createServerEmbed(server)],
        },
    };
}

async function handleSearch(interaction) {
    const query = interaction.data.options.find(opt => opt.name === 'query')?.value;
    const category = interaction.data.options.find(opt => opt.name === 'category')?.value;
    const sort = interaction.data.options.find(opt => opt.name === 'sort')?.value;

    // Validate query
    if (query.length < SHARE_CONFIG.search.minQueryLength) {
        throw new Error(`Search query must be at least ${SHARE_CONFIG.search.minQueryLength} characters long.`);
    }

    // Perform search
    const results = shareData.searchServers(query, {
        category,
        sort,
        page: 1,
        perPage: SHARE_CONFIG.search.maxResults,
    });

    if (results.length === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'No servers found matching your search.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🔍 Search Results',
                description: `Found ${results.length} servers matching "${query}"`,
                fields: results.slice(0, 10).map(server => ({
                    name: server.name,
                    value: `${server.description.substring(0, 100)}...\n` +
                        `Category: ${SHARE_CONFIG.categories[server.category].name}\n` +
                        `Members: ${server.memberCount}`,
                })),
                color: parseInt(SHARE_CONFIG.ui.colors.info.replace('#', ''), 16),
                footer: {
                    text: results.length > 10 ? 'Showing first 10 results' : undefined,
                },
            }],
        },
    };
}

async function handleServerInfo(interaction) {
    const guildId = interaction.guild_id;
    const targetServer = interaction.data.options?.find(opt => opt.name === 'server')?.value || guildId;

    // Get server listing
    const server = shareData.getServer(targetServer);
    if (!server) {
        throw new Error('Server not found.');
    }

    // Track view
    shareData.trackView(targetServer);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [createServerEmbed(server, true)],
        },
    };
}

async function handleCustomize(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;

    // Check premium status
    if (!shareData.isPremiumUser(userId)) {
        throw new Error(SHARE_CONFIG.errors.premium);
    }

    // Check if server is listed
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed.');
    }

    // Check ownership
    if (server.ownerId !== userId) {
        throw new Error('You do not own this server listing.');
    }

    const theme = interaction.data.options.find(opt => opt.name === 'theme')?.value;
    const banner = interaction.data.options.find(opt => opt.name === 'banner')?.value;

    // Update customization
    const updates = {};
    if (theme) updates.theme = theme;
    if (banner) {
        // Validate banner URL
        try {
            const response = await fetch(banner);
            if (!response.ok) throw new Error('Invalid banner URL');
            const contentType = response.headers.get('content-type');
            if (!contentType.startsWith('image/')) throw new Error('URL must point to an image');
        } catch (error) {
            throw new Error('Invalid banner URL');
        }
        updates.banner = banner;
    }

    shareData.updateServer(guildId, updates);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '✅ Customization Updated',
                description: 'Your server listing customization has been updated!',
                color: parseInt(SHARE_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleBump(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;

    // Check premium status
    if (!shareData.isPremiumUser(userId)) {
        throw new Error(SHARE_CONFIG.errors.premium);
    }

    // Check if server is listed
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed.');
    }

    // Check ownership
    if (server.ownerId !== userId) {
        throw new Error('You do not own this server listing.');
    }

    // Track bump
    shareData.trackBump(guildId);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '⬆️ Server Bumped',
                description: 'Your server has been bumped to the top of the list!',
                color: parseInt(SHARE_CONFIG.ui.colors.success.replace('#', ''), 16),
            }],
        },
    };
}

async function handleAnalytics(interaction) {
    const userId = interaction.member.user.id;
    const guildId = interaction.guild_id;
    const period = interaction.data.options?.find(opt => opt.name === 'period')?.value || 'day';

    // Check premium status
    if (!shareData.isPremiumUser(userId)) {
        throw new Error(SHARE_CONFIG.errors.premium);
    }

    // Check if server is listed
    const server = shareData.getServer(guildId);
    if (!server) {
        throw new Error('Server is not listed.');
    }

    // Check ownership
    if (server.ownerId !== userId) {
        throw new Error('You do not own this server listing.');
    }

    // Get analytics
    const analytics = shareData.getAnalytics(guildId, period);
    if (!analytics) {
        throw new Error('No analytics data available.');
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '📊 Server Analytics',
                fields: [
                    {
                        name: 'Views',
                        value: analytics.views.toString(),
                        inline: true,
                    },
                    {
                        name: 'Clicks',
                        value: analytics.clicks.toString(),
                        inline: true,
                    },
                    {
                        name: 'Bumps',
                        value: analytics.bumps.toString(),
                        inline: true,
                    },
                ],
                color: parseInt(SHARE_CONFIG.ui.colors.info.replace('#', ''), 16),
                footer: {
                    text: `Stats for the last ${period}`,
                },
            }],
        },
    };
}

// Helper Functions
function createServerEmbed(server, detailed = false) {
    const embed = {
        title: server.name,
        description: server.description,
        thumbnail: {
            url: server.icon,
        },
        fields: [
            {
                name: 'Category',
                value: SHARE_CONFIG.categories[server.category].name,
                inline: true,
            },
            {
                name: 'Members',
                value: server.memberCount.toString(),
                inline: true,
            },
        ],
        color: parseInt(SHARE_CONFIG.ui.colors.info.replace('#', ''), 16),
    };

    if (server.tags.length > 0) {
        embed.fields.push({
            name: 'Tags',
            value: server.tags.join(', '),
            inline: true,
        });
    }

    if (detailed) {
        embed.fields.push(
            {
                name: 'Views',
                value: server.views.toString(),
                inline: true,
            },
            {
                name: 'Created',
                value: `<t:${Math.floor(server.createdAt / 1000)}:R>`,
                inline: true,
            },
            {
                name: 'Last Updated',
                value: `<t:${Math.floor(server.updatedAt / 1000)}:R>`,
                inline: true,
            }
        );

        if (server.features.length > 0) {
            embed.fields.push({
                name: 'Features',
                value: server.features.join(', '),
            });
        }
    }

    if (server.banner) {
        embed.image = {
            url: server.banner,
        };
    }

    return embed;
}

async function getGuildInfo(guildId) {
    // This function should be implemented to fetch guild information from Discord
    // For now, return a mock implementation
    return {
        name: 'Test Server',
        memberCount: 100,
        icon: null,
        banner: null,
        features: [],
    };
}

async function handleFileShare(interaction, file, description, env) {
    // Implement file share logic here
}

async function handleTextShare(interaction, content, env) {
    // Implement text share logic here
}
