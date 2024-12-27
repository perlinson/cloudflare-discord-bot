export const PHONE_COMMANDS = {
    CALL: {
        name: 'call',
        description: 'Start a phone call with another server',
    },
    HANGUP: {
        name: 'hangup',
        description: 'End your current phone call',
    },
    SETPHONE: {
        name: 'setphone',
        description: 'Set the current channel as the phone channel',
        default_member_permissions: '32', // MANAGE_CHANNELS permission
    },
    PHONE_INFO: {
        name: 'phoneinfo',
        description: 'Get information about the phone system',
    },
    CALL_STATS: {
        name: 'callstats',
        description: 'View your call statistics',
    },
    BLOCK: {
        name: 'block',
        description: 'Block a user from calling you',
        options: [
            {
                name: 'user',
                description: 'The user to block',
                type: 6, // USER type
                required: true,
            },
        ],
    },
    UNBLOCK: {
        name: 'unblock',
        description: 'Unblock a user from calling you',
        options: [
            {
                name: 'user',
                description: 'The user to unblock',
                type: 6, // USER type
                required: true,
            },
        ],
    },
};
