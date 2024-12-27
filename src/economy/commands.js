export const ECONOMY_COMMANDS = {
    BALANCE: {
        name: 'balance',
        description: 'Check your or another user\'s balance',
        options: [
            {
                name: 'user',
                description: 'User to check balance for',
                type: 6, // USER type
                required: false,
            },
        ],
    },
    DAILY: {
        name: 'daily',
        description: 'Collect your daily reward',
    },
    WEEKLY: {
        name: 'weekly',
        description: 'Collect your weekly reward',
    },
    WORK: {
        name: 'work',
        description: 'Work to earn some coins',
    },
    MINE: {
        name: 'mine',
        description: 'Go mining for resources',
    },
    FISH: {
        name: 'fish',
        description: 'Go fishing for rewards',
    },
    INVENTORY: {
        name: 'inventory',
        description: 'Check your inventory',
        options: [
            {
                name: 'user',
                description: 'User to check inventory for',
                type: 6, // USER type
                required: false,
            },
        ],
    },
    SHOP: {
        name: 'shop',
        description: 'View the item shop',
    },
    BUY: {
        name: 'buy',
        description: 'Buy an item from the shop',
        options: [
            {
                name: 'item',
                description: 'Item to buy',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount to buy',
                type: 4, // INTEGER type
                required: false,
            },
        ],
    },
    SELL: {
        name: 'sell',
        description: 'Sell an item from your inventory',
        options: [
            {
                name: 'item',
                description: 'Item to sell',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount to sell',
                type: 4, // INTEGER type
                required: false,
            },
        ],
    },
    BUSINESS: {
        name: 'business',
        description: 'Manage your business',
        options: [
            {
                name: 'action',
                description: 'Action to perform',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'view',
                        value: 'view',
                    },
                    {
                        name: 'collect',
                        value: 'collect',
                    },
                    {
                        name: 'upgrade',
                        value: 'upgrade',
                    },
                ],
            },
        ],
    },
    TRANSFER: {
        name: 'transfer',
        description: 'Transfer coins to another user',
        options: [
            {
                name: 'user',
                description: 'User to transfer to',
                type: 6, // USER type
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount to transfer',
                type: 4, // INTEGER type
                required: true,
            },
        ],
    },
    LEADERBOARD: {
        name: 'leaderboard',
        description: 'View the richest users',
    },
};
