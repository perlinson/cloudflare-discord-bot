import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { economyData } from './dataLoader.js';
import { ECONOMY_CONFIG } from './config.js';
import { initialize } from '../utils/storage.js';

export async function handleEconomyCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const subCommand = data.options[0];
    const commandName = subCommand.name.toLowerCase();
    const options = subCommand.options || [];
    const userId = member.user.id;

    // Initialize storage only once
    initialize('economy', env, (env) => {
        economyData.initialize(env);
    });

    try {
        switch (commandName) {
            case 'balance':
                const targetUser = options.find(opt => opt.name === 'user')?.value || userId;
                return await handleBalance(interaction, targetUser);
            case 'transfer':
                return await handleTransfer(interaction, options);
            case 'shop':
                return await handleShop(interaction);
            case 'inventory':
                const inventoryUser = options.find(opt => opt.name === 'user')?.value || userId;
                return await handleInventory(interaction, inventoryUser);
            case 'daily':
                return await handleDaily(interaction);
            case 'weekly':
                return await handleWeekly(interaction);
            case 'work':
                return await handleWork(interaction);
            case 'mine':
                return await handleMine(interaction);
            case 'fish':
                return await handleFish(interaction);
            case 'business':
                return await handleBusiness(interaction);
            case 'leaderboard':
                return await handleLeaderboard(interaction);
            default:
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Unknown economy command',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
        }
    } catch (error) {
        console.error('Error handling economy command:', error);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `Error: ${error.message}`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }
}

async function handleBalance(interaction, targetUser) {
    const { guild_id, member } = interaction;
    const userId = member.user.id;

    const balance = await economyData.getUserBalance(targetUser, guild_id);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '💰 Balance',
                description: `The balance of <@${targetUser}> is: ${balance} coins`,
                color: parseInt(ECONOMY_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleTransfer(interaction, options) {
    const { guild_id, data, member } = interaction;
    const userId = member.user.id;
    const targetId = options.find(opt => opt.name === 'user')?.value;
    const amount = options.find(opt => opt.name === 'amount')?.value;

    if (economyData.isRateLimited(userId, 'transfer')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: ECONOMY_CONFIG.errors.rateLimit,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    try {
        // Deduct from sender
        await economyData.updateUserBalance(userId, guild_id, -amount);
        // Add to receiver
        await economyData.updateUserBalance(targetId, guild_id, amount);
        // Create transaction record
        await economyData.createTransaction(userId, guild_id, 'transfer', amount, { targetId });

        economyData.incrementRateLimit(userId, 'transfer');

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `✅ Successfully transferred ${amount} coins to <@${targetId}>`,
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

async function handleShop(interaction) {
    const { guild_id, data } = interaction;
    const subcommand = data.options[0].name;

    switch (subcommand) {
        case 'list': {
            const items = await economyData.getShopItems(guild_id);

            if (items.length === 0) {
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'The shop is currently empty.',
                        flags: InteractionResponseFlags.EPHEMERAL,
                    },
                };
            }

            const itemList = items.map(
                item => `• ${item.name} - ${item.price} coins\n${item.description}`
            ).join('\n\n');

            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [{
                        title: '🏪 Shop',
                        description: itemList,
                        color: parseInt(ECONOMY_CONFIG.ui.colors.info.replace('#', ''), 16),
                    }],
                    flags: InteractionResponseFlags.EPHEMERAL,
                },
            };
        }

        case 'buy': {
            const { member } = interaction;
            const userId = member.user.id;
            const itemId = data.options[0].options.find(opt => opt.name === 'item')?.value;

            try {
                const items = await economyData.getShopItems(guild_id);
                const item = items.find(i => i.id === itemId);
                if (!item) {
                    throw new Error('Item not found');
                }

                // Check if user has enough money
                const balance = await economyData.getUserBalance(userId, guild_id);
                if (balance < item.price) {
                    throw new Error('Insufficient funds');
                }

                // Process purchase
                await economyData.updateUserBalance(userId, guild_id, -item.price);
                await economyData.addUserItem(userId, guild_id, item);
                await economyData.createTransaction(userId, guild_id, 'purchase', -item.price, { itemId });

                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: `✅ Successfully purchased ${item.name}`,
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

async function handleInventory(interaction, targetUser) {
    const { guild_id, member } = interaction;
    const userId = member.user.id;

    const items = await economyData.getUserItems(targetUser, guild_id);

    if (items.length === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `The inventory of <@${targetUser}> is empty.`,
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    const itemList = items.map(
        item => `• ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`
    ).join('\n');

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '🎒 Inventory',
                description: itemList,
                color: parseInt(ECONOMY_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleDaily(interaction) {
    const { guild_id, member } = interaction;
    const userId = member.user.id;

    if (economyData.isRateLimited(userId, 'daily')) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'You have already claimed your daily reward. Try again tomorrow!',
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        };
    }

    try {
        const amount = ECONOMY_CONFIG.rewards.daily;
        await economyData.updateUserBalance(userId, guild_id, amount);
        await economyData.createTransaction(userId, guild_id, 'daily', amount);

        economyData.incrementRateLimit(userId, 'daily');

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `✅ You received ${amount} coins as your daily reward!`,
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

async function handleStats(interaction) {
    const { guild_id, data } = interaction;
    const period = data.options.find(opt => opt.name === 'period')?.value || 'day';

    try {
        const stats = await economyData.getEconomyStats(guild_id, period);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: '📊 Economy Statistics',
                    fields: [
                        {
                            name: 'Transactions',
                            value: stats.transactionCount.toString(),
                            inline: true,
                        },
                        {
                            name: 'Items',
                            value: stats.itemCount.toString(),
                            inline: true,
                        },
                        {
                            name: 'Rewards',
                            value: stats.rewardCount.toString(),
                            inline: true,
                        },
                    ],
                    color: parseInt(ECONOMY_CONFIG.ui.colors.info.replace('#', ''), 16),
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
