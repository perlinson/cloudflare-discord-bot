export const ECONOMY_COMMANDS = {
    ECONOMY: {
        name: 'economy',
        description: 'Economy related commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'balance',
                description: 'Check your or another user\'s balance',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'user',
                        description: 'User to check balance for',
                        type: 6, // USER type
                        required: false,
                    },
                ],
            },
            {
                name: 'daily',
                description: 'Collect your daily reward',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'weekly',
                description: 'Collect your weekly reward',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'work',
                description: 'Work to earn some coins',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'mine',
                description: 'Go mining for resources',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'fish',
                description: 'Go fishing for rewards',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'inventory',
                description: 'Check your inventory',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'user',
                        description: 'User to check inventory for',
                        type: 6, // USER type
                        required: false,
                    },
                ],
            },
            {
                name: 'shop',
                description: 'View the item shop',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'buy',
                description: 'Buy an item from the shop',
                type: 1, // SUB_COMMAND
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
            {
                name: 'sell',
                description: 'Sell an item from your inventory',
                type: 1, // SUB_COMMAND
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
            {
                name: 'transfer',
                description: 'Transfer coins to another user',
                type: 1, // SUB_COMMAND
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
            {
                name: 'business',
                description: 'Manage your business',
                type: 1, // SUB_COMMAND
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
            {
                name: 'leaderboard',
                description: 'View the richest users',
                type: 1, // SUB_COMMAND
            },
        ],
    },
};
