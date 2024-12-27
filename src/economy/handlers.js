import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { ECONOMY_CONFIG } from './config.js';
import { economyData } from './dataLoader.js';

export async function handleEconomyCommands(interaction, env) {
    const { type, data, member, guild_id } = interaction;
    const commandName = data.name.toLowerCase();
    const userId = member.user.id;

    // Initialize storage
    economyData.initialize(env);

    try {
        switch (commandName) {
            case 'balance':
                return await handleBalance(interaction);
            case 'transfer':
                return await handleTransfer(interaction);
            case 'shop':
                return await handleShop(interaction);
            case 'inventory':
                return await handleInventory(interaction);
            case 'daily':
                return await handleDaily(interaction);
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

async function handleBalance(interaction) {
    const { guild_id, member } = interaction;
    const userId = member.user.id;

    const balance = await economyData.getUserBalance(userId, guild_id);

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [{
                title: '💰 Balance',
                description: `Your current balance: ${balance} coins`,
                color: parseInt(ECONOMY_CONFIG.ui.colors.info.replace('#', ''), 16),
            }],
            flags: InteractionResponseFlags.EPHEMERAL,
        },
    };
}

async function handleTransfer(interaction) {
    const { guild_id, data, member } = interaction;
    const userId = member.user.id;
    const targetId = data.options.find(opt => opt.name === 'user')?.value;
    const amount = data.options.find(opt => opt.name === 'amount')?.value;

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

async function handleInventory(interaction) {
    const { guild_id, member } = interaction;
    const userId = member.user.id;

    const items = await economyData.getUserItems(userId, guild_id);

    if (items.length === 0) {
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'Your inventory is empty.',
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
