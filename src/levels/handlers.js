import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { levelsDataLoader } from './dataLoader.js';
import { LEVELS_CONFIG } from './config.js';
import { initialize } from '../utils/storage.js';

export async function handleLevelCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const subCommand = data.options[0];
    const commandName = subCommand.name.toLowerCase();
    const options = subCommand.options || [];
    const userId = member.user.id;

    // Initialize storage only once
    initialize('levels', env, (env) => {
        levelsDataLoader.initialize(env);
    });

    try {
        switch (commandName) {
            case 'rank':
                const targetUser = options.find(opt => opt.name === 'user')?.value || userId;
                return await handleRank(interaction, targetUser, env);
            case 'leaderboard':
                return await handleLeaderboard(interaction, env);
            case 'rewards':
                return await handleRewards(interaction, env);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown level command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error('Error handling level command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleRank(interaction, targetUser, env) {
    const { data, member, guild_id } = interaction;
    const userData = levelsData.getUserXP(targetUser);
    const level = levelsData.calculateLevel(userData.xp);
    const rank = levelsData.getRankTitle(level);
    const nextLevelXP = levelsData.calculateXPForLevel(level + 1);
    const progress = ((userData.xp - levelsData.calculateXPForLevel(level)) / 
                     (nextLevelXP - levelsData.calculateXPForLevel(level)) * 100).toFixed(1);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: `${targetUser === member.user.id ? 'Your' : 'User\'s'} Rank`,
                color: parseInt(LEVELS_CONFIG.colors.profile.replace('#', ''), 16),
                fields: [
                    {
                        name: 'Level',
                        value: level.toString(),
                        inline: true,
                    },
                    {
                        name: 'Rank',
                        value: rank,
                        inline: true,
                    },
                    {
                        name: 'XP',
                        value: `${userData.xp} / ${nextLevelXP} (${progress}%)`,
                        inline: true,
                    },
                ],
            }],
        },
    };
}

async function handleLeaderboard(interaction, env) {
    const { data, guild_id } = interaction;
    const page = (data.options?.[0]?.value || 1) - 1;
    const perPage = 10;
    const leaderboard = levelsData.getLeaderboard(perPage * (page + 1))
        .slice(page * perPage);

    const embed = {
        title: '🏆 XP Leaderboard',
        color: parseInt(LEVELS_CONFIG.colors.leaderboard.replace('#', ''), 16),
        description: leaderboard.map((entry, index) => 
            `${page * perPage + index + 1}. <@${entry.userId}> - Level ${entry.level} (${entry.xp} XP) - ${entry.rank}`
        ).join('\n'),
    };

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds: [embed] },
    };
}

async function handleRewards(interaction, env) {
    // TO DO: implement rewards handling
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: 'Rewards are not implemented yet.',
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleLevelConfigCommand(interaction, env) {
    const { data, member, guild_id } = interaction;
    if (!member.permissions.includes('MANAGE_CHANNELS')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need the Manage Channels permission to use this command.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const setting = data.options[0].value;
    const value = data.options[1].value;
    const settings = levelsData.getGuildSettings(guild_id);

    switch (setting) {
        case 'xp_enabled':
            settings.xpEnabled = value.toLowerCase() === 'true';
            break;
        case 'level_up_channel':
            settings.levelUpChannel = value === 'none' ? null : value;
            break;
        case 'level_up_message':
            settings.levelUpMessage = value.toLowerCase() === 'true';
            break;
    }

    levelsData.updateGuildSettings(guild_id, settings);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Level system ${setting} has been updated to: ${value}`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleXPChannelCommand(interaction, env) {
    const { data, member, guild_id } = interaction;
    if (!member.permissions.includes('MANAGE_CHANNELS')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need the Manage Channels permission to use this command.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const action = data.options[0].value;
    const channelId = data.options[1].value;
    const settings = levelsData.getGuildSettings(guild_id);

    if (action === 'add') {
        if (!settings.xpChannels.includes(channelId)) {
            settings.xpChannels.push(channelId);
        }
    } else {
        settings.xpChannels = settings.xpChannels.filter(id => id !== channelId);
    }

    levelsData.updateGuildSettings(guild_id, settings);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Channel has been ${action}ed ${action === 'add' ? 'to' : 'from'} XP gain channels.`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleXPRoleCommand(interaction, env) {
    const { data, member, guild_id } = interaction;
    if (!member.permissions.includes('MANAGE_CHANNELS')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need the Manage Channels permission to use this command.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const action = data.options[0].value;
    const roleId = data.options[1].value;
    const settings = levelsData.getGuildSettings(guild_id);

    if (action === 'add') {
        if (!settings.xpRoles.includes(roleId)) {
            settings.xpRoles.push(roleId);
        }
    } else {
        settings.xpRoles = settings.xpRoles.filter(id => id !== roleId);
    }

    levelsData.updateGuildSettings(guild_id, settings);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `✅ Role has been ${action}ed ${action === 'add' ? 'to' : 'from'} XP gain roles.`,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleGiveXPCommand(interaction, env) {
    const { data, member, guild_id } = interaction;
    if (!member.permissions.includes('ADMINISTRATOR')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You need the Administrator permission to use this command.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const targetUser = data.options[0].value;
    const amount = data.options[1].value;

    if (amount <= 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'XP amount must be positive.',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const oldData = levelsData.getUserXP(targetUser);
    const oldLevel = levelsData.calculateLevel(oldData.xp);
    
    levelsData.addXP(targetUser, amount);
    
    const newData = levelsData.getUserXP(targetUser);
    const newLevel = levelsData.calculateLevel(newData.xp);

    let response = `✅ Added ${amount} XP to <@${targetUser}>.`;
    if (newLevel > oldLevel) {
        response += `\nThey leveled up to level ${newLevel}!`;
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: response,
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

export async function handleMessage(message, env) {
    const { guild_id, channel_id, author } = message;
    
    // Skip if author is a bot
    if (author.bot) return;

    // Get guild settings
    const settings = levelsData.getGuildSettings(guild_id);
    
    // Check if XP is enabled
    if (!settings.xpEnabled) return;
    
    // Check if channel is allowed
    if (settings.xpChannels.length > 0 && !settings.xpChannels.includes(channel_id)) return;
    
    // Check cooldown
    const userData = levelsData.getUserXP(author.id);
    const now = Date.now();
    if (userData.lastXpGain && (now - userData.lastXpGain) < (LEVELS_CONFIG.xpCooldown * 1000)) return;
    
    // Calculate random XP amount
    const xpAmount = Math.floor(
        Math.random() * (LEVELS_CONFIG.maxXPPerMessage - LEVELS_CONFIG.minXPPerMessage + 1) +
        LEVELS_CONFIG.minXPPerMessage
    );
    
    // Apply XP multiplier
    const multiplier = levelsData.getXPMultiplier(author.id, guild_id);
    const totalXP = Math.floor(xpAmount * multiplier);
    
    // Get old level
    const oldLevel = levelsData.calculateLevel(userData.xp);
    
    // Add XP
    const newData = levelsData.addXP(author.id, totalXP);
    
    // Check for level up
    const newLevel = levelsData.calculateLevel(newData.xp);
    if (newLevel > oldLevel) {
        const reward = levelsData.calculateReward(newLevel);
        const oldRank = levelsData.getRankTitle(oldLevel);
        const newRank = levelsData.getRankTitle(newLevel);
        
        // Create level up message
        const levelUpMessage = LEVELS_CONFIG.levelUpMessages[
            Math.floor(Math.random() * LEVELS_CONFIG.levelUpMessages.length)
        ].replace('{user}', `<@${author.id}>`).replace('{level}', newLevel);
        
        const embed = {
            title: '🎉 Level Up!',
            description: levelUpMessage,
            color: parseInt(LEVELS_CONFIG.colors.levelUp.replace('#', ''), 16),
            fields: [
                {
                    name: 'New Level',
                    value: newLevel.toString(),
                    inline: true,
                },
                {
                    name: 'Reward',
                    value: `${reward} coins`,
                    inline: true,
                },
            ],
        };

        if (oldRank !== newRank) {
            embed.fields.push({
                name: 'New Rank',
                value: `${oldRank} → ${newRank}`,
                inline: true,
            });
        }

        // Send level up message
        if (settings.levelUpMessage) {
            const channelId = settings.levelUpChannel || channel_id;
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                },
            };
        }
    }
}
