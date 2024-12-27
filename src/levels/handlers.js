import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { levelsDataLoader } from './dataLoader.js';
import { LEVELS_CONFIG } from './config.js';

export async function handleLevelsCommands(interaction, env) {
    const { type, data, member, channel_id, guild_id } = interaction;
    const commandName = data.name.toLowerCase();

    switch (commandName) {
        case 'rank':
            return handleRankCommand(interaction, env);
        case 'leaderboard':
            return handleLeaderboardCommand(interaction, env);
        case 'levelconfig':
            return handleLevelConfigCommand(interaction, env);
        case 'xpchannel':
            return handleXPChannelCommand(interaction, env);
        case 'xprole':
            return handleXPRoleCommand(interaction, env);
        case 'givexp':
            return handleGiveXPCommand(interaction, env);
        default:
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Unknown level command',
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
    }
}

async function handleRankCommand(interaction, env) {
    const { data, member, guild_id } = interaction;
    const targetUser = data.options?.[0]?.value || member.user.id;
    const userData = levelsDataLoader.getUserXP(targetUser);
    const level = levelsDataLoader.calculateLevel(userData.xp);
    const rank = levelsDataLoader.getRankTitle(level);
    const nextLevelXP = levelsDataLoader.calculateXPForLevel(level + 1);
    const progress = ((userData.xp - levelsDataLoader.calculateXPForLevel(level)) / 
                     (nextLevelXP - levelsDataLoader.calculateXPForLevel(level)) * 100).toFixed(1);

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

async function handleLeaderboardCommand(interaction, env) {
    const { data, guild_id } = interaction;
    const page = (data.options?.[0]?.value || 1) - 1;
    const perPage = 10;
    const leaderboard = levelsDataLoader.getLeaderboard(perPage * (page + 1))
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
    const settings = levelsDataLoader.getGuildSettings(guild_id);

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

    levelsDataLoader.updateGuildSettings(guild_id, settings);

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
    const settings = levelsDataLoader.getGuildSettings(guild_id);

    if (action === 'add') {
        if (!settings.xpChannels.includes(channelId)) {
            settings.xpChannels.push(channelId);
        }
    } else {
        settings.xpChannels = settings.xpChannels.filter(id => id !== channelId);
    }

    levelsDataLoader.updateGuildSettings(guild_id, settings);

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
    const settings = levelsDataLoader.getGuildSettings(guild_id);

    if (action === 'add') {
        if (!settings.xpRoles.includes(roleId)) {
            settings.xpRoles.push(roleId);
        }
    } else {
        settings.xpRoles = settings.xpRoles.filter(id => id !== roleId);
    }

    levelsDataLoader.updateGuildSettings(guild_id, settings);

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

    const oldData = levelsDataLoader.getUserXP(targetUser);
    const oldLevel = levelsDataLoader.calculateLevel(oldData.xp);
    
    levelsDataLoader.addXP(targetUser, amount);
    
    const newData = levelsDataLoader.getUserXP(targetUser);
    const newLevel = levelsDataLoader.calculateLevel(newData.xp);

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
    const settings = levelsDataLoader.getGuildSettings(guild_id);
    
    // Check if XP is enabled
    if (!settings.xpEnabled) return;
    
    // Check if channel is allowed
    if (settings.xpChannels.length > 0 && !settings.xpChannels.includes(channel_id)) return;
    
    // Check cooldown
    const userData = levelsDataLoader.getUserXP(author.id);
    const now = Date.now();
    if (userData.lastXpGain && (now - userData.lastXpGain) < (LEVELS_CONFIG.xpCooldown * 1000)) return;
    
    // Calculate random XP amount
    const xpAmount = Math.floor(
        Math.random() * (LEVELS_CONFIG.maxXPPerMessage - LEVELS_CONFIG.minXPPerMessage + 1) +
        LEVELS_CONFIG.minXPPerMessage
    );
    
    // Apply XP multiplier
    const multiplier = levelsDataLoader.getXPMultiplier(author.id, guild_id);
    const totalXP = Math.floor(xpAmount * multiplier);
    
    // Get old level
    const oldLevel = levelsDataLoader.calculateLevel(userData.xp);
    
    // Add XP
    const newData = levelsDataLoader.addXP(author.id, totalXP);
    
    // Check for level up
    const newLevel = levelsDataLoader.calculateLevel(newData.xp);
    if (newLevel > oldLevel) {
        const reward = levelsDataLoader.calculateReward(newLevel);
        const oldRank = levelsDataLoader.getRankTitle(oldLevel);
        const newRank = levelsDataLoader.getRankTitle(newLevel);
        
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
