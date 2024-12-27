export const LEVELS_COMMANDS = {
    RANK: {
        name: 'rank',
        description: 'View your or another user\'s rank',
        options: [
            {
                name: 'user',
                description: 'User to check rank for',
                type: 6, // USER type
                required: false,
            },
        ],
    },
    LEADERBOARD: {
        name: 'leaderboard',
        description: 'View the server\'s XP leaderboard',
        options: [
            {
                name: 'page',
                description: 'Page number to view',
                type: 4, // INTEGER type
                required: false,
            },
        ],
    },
    LEVELCONFIG: {
        name: 'levelconfig',
        description: 'Configure level system settings',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
        options: [
            {
                name: 'setting',
                description: 'Setting to configure',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'XP Enabled',
                        value: 'xp_enabled',
                    },
                    {
                        name: 'Level Up Channel',
                        value: 'level_up_channel',
                    },
                    {
                        name: 'Level Up Message',
                        value: 'level_up_message',
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
    XP_CHANNEL: {
        name: 'xpchannel',
        description: 'Add or remove a channel from XP gain',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
        options: [
            {
                name: 'action',
                description: 'Action to perform',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'Add',
                        value: 'add',
                    },
                    {
                        name: 'Remove',
                        value: 'remove',
                    },
                ],
            },
            {
                name: 'channel',
                description: 'Channel to add or remove',
                type: 7, // CHANNEL type
                required: true,
            },
        ],
    },
    XP_ROLE: {
        name: 'xprole',
        description: 'Add or remove a role from XP gain',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
        options: [
            {
                name: 'action',
                description: 'Action to perform',
                type: 3, // STRING type
                required: true,
                choices: [
                    {
                        name: 'Add',
                        value: 'add',
                    },
                    {
                        name: 'Remove',
                        value: 'remove',
                    },
                ],
            },
            {
                name: 'role',
                description: 'Role to add or remove',
                type: 8, // ROLE type
                required: true,
            },
        ],
    },
    GIVE_XP: {
        name: 'givexp',
        description: 'Give XP to a user',
        default_member_permissions: '8', // ADMINISTRATOR permission
        options: [
            {
                name: 'user',
                description: 'User to give XP to',
                type: 6, // USER type
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount of XP to give',
                type: 4, // INTEGER type
                required: true,
            },
        ],
    },
};
