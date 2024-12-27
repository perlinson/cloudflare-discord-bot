export const ONBOARDING_COMMANDS = {
    // Setup Commands
    SETUP: {
        name: 'onboarding-setup',
        description: 'Set up server onboarding',
        options: [
            {
                name: 'type',
                description: 'Type of setup',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Full Setup', value: 'full' },
                    { name: 'Channels Only', value: 'channels' },
                    { name: 'Roles Only', value: 'roles' },
                    { name: 'Verification Only', value: 'verification' },
                ],
            },
        ],
    },

    CUSTOMIZE: {
        name: 'onboarding-customize',
        description: 'Customize onboarding settings',
        options: [
            {
                name: 'setting',
                description: 'Setting to customize',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Welcome Message', value: 'welcome' },
                    { name: 'Rules', value: 'rules' },
                    { name: 'Verification', value: 'verification' },
                    { name: 'Roles', value: 'roles' },
                ],
            },
            {
                name: 'value',
                description: 'New setting value',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    // Channel Management
    CHANNEL_ADD: {
        name: 'onboarding-channel-add',
        description: 'Add an onboarding channel',
        options: [
            {
                name: 'name',
                description: 'Channel name',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'type',
                description: 'Channel type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Text', value: 'GUILD_TEXT' },
                    { name: 'News', value: 'GUILD_NEWS' },
                ],
            },
            {
                name: 'category',
                description: 'Channel category',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Information', value: 'INFORMATION' },
                    { name: 'Community', value: 'COMMUNITY' },
                ],
            },
        ],
    },

    CHANNEL_REMOVE: {
        name: 'onboarding-channel-remove',
        description: 'Remove an onboarding channel',
        options: [
            {
                name: 'channel',
                description: 'Channel to remove',
                type: 7, // CHANNEL type
                required: true,
            },
        ],
    },

    // Role Management
    ROLE_ADD: {
        name: 'onboarding-role-add',
        description: 'Add an onboarding role',
        options: [
            {
                name: 'name',
                description: 'Role name',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'color',
                description: 'Role color (hex)',
                type: 3, // STRING type
                required: false,
            },
            {
                name: 'type',
                description: 'Role type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Default', value: 'default' },
                    { name: 'Auto', value: 'auto' },
                    { name: 'Level', value: 'level' },
                ],
            },
        ],
    },

    ROLE_REMOVE: {
        name: 'onboarding-role-remove',
        description: 'Remove an onboarding role',
        options: [
            {
                name: 'role',
                description: 'Role to remove',
                type: 8, // ROLE type
                required: true,
            },
        ],
    },

    // Verification Management
    VERIFY_SETUP: {
        name: 'onboarding-verify-setup',
        description: 'Set up verification system',
        options: [
            {
                name: 'type',
                description: 'Verification type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Button', value: 'BUTTON' },
                    { name: 'Reaction', value: 'REACTION' },
                    { name: 'Captcha', value: 'CAPTCHA' },
                ],
            },
            {
                name: 'channel',
                description: 'Verification channel',
                type: 7, // CHANNEL type
                required: true,
            },
        ],
    },

    VERIFY_DISABLE: {
        name: 'onboarding-verify-disable',
        description: 'Disable verification system',
    },

    // Message Management
    MESSAGE_EDIT: {
        name: 'onboarding-message-edit',
        description: 'Edit onboarding messages',
        options: [
            {
                name: 'type',
                description: 'Message type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Welcome', value: 'welcome' },
                    { name: 'Rules', value: 'rules' },
                    { name: 'Verification', value: 'verify' },
                ],
            },
            {
                name: 'content',
                description: 'New message content',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    // Analytics
    STATS: {
        name: 'onboarding-stats',
        description: 'View onboarding statistics',
        options: [
            {
                name: 'type',
                description: 'Statistics type',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Joins', value: 'joins' },
                    { name: 'Verifications', value: 'verifications' },
                    { name: 'Messages', value: 'messages' },
                    { name: 'Roles', value: 'roles' },
                ],
            },
            {
                name: 'period',
                description: 'Time period',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Day', value: 'day' },
                    { name: 'Week', value: 'week' },
                    { name: 'Month', value: 'month' },
                ],
            },
        ],
    },

    // Premium Features
    PREMIUM: {
        name: 'onboarding-premium',
        description: 'View or activate premium features',
        options: [
            {
                name: 'action',
                description: 'Premium action',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Status', value: 'status' },
                    { name: 'Activate', value: 'activate' },
                    { name: 'Features', value: 'features' },
                ],
            },
        ],
    },
};
