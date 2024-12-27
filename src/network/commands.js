export const NETWORK_COMMANDS = {
    // Connection Management
    CONNECT: {
        name: 'network-connect',
        description: 'Connect to another server',
        options: [
            {
                name: 'server',
                description: 'Server ID to connect to',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'channel',
                description: 'Channel to use for connection',
                type: 7, // CHANNEL type
                required: true,
            },
        ],
    },

    DISCONNECT: {
        name: 'network-disconnect',
        description: 'Disconnect from a server',
        options: [
            {
                name: 'server',
                description: 'Server ID to disconnect from',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    LIST: {
        name: 'network-list',
        description: 'List all connected servers',
    },

    // Channel Management
    CHANNEL_ADD: {
        name: 'network-channel-add',
        description: 'Add a channel to the network',
        options: [
            {
                name: 'channel',
                description: 'Channel to add',
                type: 7, // CHANNEL type
                required: true,
            },
            {
                name: 'type',
                description: 'Channel type',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Text', value: 'text' },
                    { name: 'Announcement', value: 'announcement' },
                ],
            },
        ],
    },

    CHANNEL_REMOVE: {
        name: 'network-channel-remove',
        description: 'Remove a channel from the network',
        options: [
            {
                name: 'channel',
                description: 'Channel to remove',
                type: 7, // CHANNEL type
                required: true,
            },
        ],
    },

    CHANNEL_LIST: {
        name: 'network-channel-list',
        description: 'List all network channels',
    },

    // Permission Management
    ROLE_SET: {
        name: 'network-role-set',
        description: 'Set network role permissions',
        options: [
            {
                name: 'role',
                description: 'Role to set permissions for',
                type: 8, // ROLE type
                required: true,
            },
            {
                name: 'level',
                description: 'Permission level',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Admin', value: 'admin' },
                    { name: 'Moderator', value: 'moderator' },
                    { name: 'Member', value: 'member' },
                ],
            },
        ],
    },

    ROLE_REMOVE: {
        name: 'network-role-remove',
        description: 'Remove network role permissions',
        options: [
            {
                name: 'role',
                description: 'Role to remove permissions from',
                type: 8, // ROLE type
                required: true,
            },
        ],
    },

    // Message Management
    MESSAGE_SEND: {
        name: 'network-send',
        description: 'Send a message to all connected servers',
        options: [
            {
                name: 'message',
                description: 'Message to send',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'channel',
                description: 'Channel to send to',
                type: 7, // CHANNEL type
                required: false,
            },
        ],
    },

    MESSAGE_EDIT: {
        name: 'network-edit',
        description: 'Edit a network message',
        options: [
            {
                name: 'message',
                description: 'Message ID to edit',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'content',
                description: 'New message content',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    MESSAGE_DELETE: {
        name: 'network-delete',
        description: 'Delete a network message',
        options: [
            {
                name: 'message',
                description: 'Message ID to delete',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    // Settings Management
    SETTINGS: {
        name: 'network-settings',
        description: 'Configure network settings',
        options: [
            {
                name: 'setting',
                description: 'Setting to configure',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Auto Accept', value: 'auto_accept' },
                    { name: 'Message Filter', value: 'message_filter' },
                    { name: 'Webhook Mode', value: 'webhook_mode' },
                    { name: 'Analytics', value: 'analytics' },
                ],
            },
            {
                name: 'value',
                description: 'Setting value',
                type: 3, // STRING type
                required: true,
            },
        ],
    },

    // Analytics
    STATS: {
        name: 'network-stats',
        description: 'View network statistics',
        options: [
            {
                name: 'type',
                description: 'Statistics type',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Messages', value: 'messages' },
                    { name: 'Connections', value: 'connections' },
                    { name: 'Users', value: 'users' },
                    { name: 'Bandwidth', value: 'bandwidth' },
                ],
            },
            {
                name: 'period',
                description: 'Time period',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Hour', value: 'hour' },
                    { name: 'Day', value: 'day' },
                    { name: 'Week', value: 'week' },
                    { name: 'Month', value: 'month' },
                ],
            },
        ],
    },

    // Premium Features
    PREMIUM: {
        name: 'network-premium',
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
