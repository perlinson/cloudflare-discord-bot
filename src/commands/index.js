export const COMMANDS = {
    // Economy Group
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
                name: 'inventory',
                description: 'Check your inventory',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'shop',
                description: 'View the item shop',
                type: 1, // SUB_COMMAND
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
        ],
    },

    // Chat Bot Group
    CHAT: {
        name: 'chat',
        description: 'Chat bot related commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'toggle',
                description: 'Enable or disable chatbot in the current channel',
                type: 1, // SUB_COMMAND
                default_member_permissions: '32', // MANAGE_CHANNELS permission
            },
            {
                name: 'config',
                description: 'Configure chatbot settings',
                type: 1, // SUB_COMMAND
                default_member_permissions: '32', // MANAGE_CHANNELS permission
                options: [
                    {
                        name: 'setting',
                        description: 'Setting to configure',
                        type: 3, // STRING type
                        required: true,
                        choices: [
                            {
                                name: 'character',
                                value: 'character',
                            },
                            {
                                name: 'cooldown',
                                value: 'cooldown',
                            },
                            {
                                name: 'reactions',
                                value: 'reactions',
                            },
                        ],
                    },
                    {
                        name: 'value',
                        description: 'New value for the setting',
                        type: 3, // STRING type
                        required: true,
                    },
                ],
            },
            {
                name: 'clear',
                description: 'Clear chat history with the bot',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'character',
                description: 'Change the chatbot\'s character',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'character',
                        description: 'Character to switch to',
                        type: 3, // STRING type
                        required: true,
                    },
                ],
            },
        ],
    },

    // Image AI Group
    IMAGE: {
        name: 'image',
        description: 'AI image generation commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'generate',
                description: 'Generate an image from a text description',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'prompt',
                        description: 'Text description of the image you want to generate',
                        type: 3, // STRING type
                        required: true,
                    },
                    {
                        name: 'style',
                        description: 'Style preset to use',
                        type: 3, // STRING type
                        required: false,
                        choices: [
                            {
                                name: 'Anime',
                                value: 'anime',
                            },
                            {
                                name: 'Realistic',
                                value: 'realistic',
                            },
                            {
                                name: 'Fantasy',
                                value: 'fantasy',
                            },
                            {
                                name: 'Cyberpunk',
                                value: 'cyberpunk',
                            },
                        ],
                    },
                    {
                        name: 'negative',
                        description: 'Things to avoid in the image (Premium)',
                        type: 3, // STRING type
                        required: false,
                    },
                ],
            },
            {
                name: 'styles',
                description: 'View available style presets and their descriptions',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'queue',
                description: 'View your pending image generations',
                type: 1, // SUB_COMMAND
            },
        ],
    },

    // Level System Group
    LEVEL: {
        name: 'level',
        description: 'Level system commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'rank',
                description: 'View your or another user\'s rank',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'user',
                        description: 'User to check rank for',
                        type: 6, // USER type
                        required: false,
                    },
                ],
            },
            {
                name: 'leaderboard',
                description: 'View the server\'s level leaderboard',
                type: 1, // SUB_COMMAND
            },
            {
                name: 'rewards',
                description: 'View available level rewards',
                type: 1, // SUB_COMMAND
            },
        ],
    },

    // Network Group
    NETWORK: {
        name: 'network',
        description: 'Network and server management commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'connect',
                description: 'Connect to another server',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'code',
                        description: 'Connection code from the other server',
                        type: 3, // STRING type
                        required: true,
                    },
                ],
            },
            {
                name: 'disconnect',
                description: 'Disconnect from a connected server',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'server',
                        description: 'Server to disconnect from',
                        type: 3, // STRING type
                        required: true,
                    },
                ],
            },
            {
                name: 'list',
                description: 'List connected servers',
                type: 1, // SUB_COMMAND
            },
        ],
    },

    // Share Group
    SHARE: {
        name: 'share',
        description: 'Content sharing commands',
        type: 1, // CHAT_INPUT
        options: [
            {
                name: 'file',
                description: 'Share a file across servers',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'file',
                        description: 'File to share',
                        type: 11, // ATTACHMENT type
                        required: true,
                    },
                    {
                        name: 'description',
                        description: 'Description of the file',
                        type: 3, // STRING type
                        required: false,
                    },
                ],
            },
            {
                name: 'text',
                description: 'Share text across servers',
                type: 1, // SUB_COMMAND
                options: [
                    {
                        name: 'content',
                        description: 'Text content to share',
                        type: 3, // STRING type
                        required: true,
                    },
                ],
            },
        ],
    },
};
