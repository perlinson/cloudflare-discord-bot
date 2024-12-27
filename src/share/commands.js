export const SHARE_COMMANDS = {
    SHARE: {
        name: 'share',
        description: 'Share your server on the server list',
        options: [
            {
                name: 'description',
                description: 'Description of your server',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'category',
                description: 'Category of your server',
                type: 3, // STRING type
                required: true,
                choices: [
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Social', value: 'social' },
                    { name: 'Education', value: 'education' },
                    { name: 'Technology', value: 'technology' },
                    { name: 'Entertainment', value: 'entertainment' },
                    { name: 'Creative', value: 'creative' },
                    { name: 'Music', value: 'music' },
                    { name: 'Community', value: 'community' },
                ],
            },
            {
                name: 'tags',
                description: 'Tags for your server (comma-separated)',
                type: 3, // STRING type
                required: false,
            },
        ],
    },

    UPDATE: {
        name: 'update',
        description: 'Update your server information',
        options: [
            {
                name: 'description',
                description: 'New description of your server',
                type: 3, // STRING type
                required: false,
            },
            {
                name: 'category',
                description: 'New category of your server',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Social', value: 'social' },
                    { name: 'Education', value: 'education' },
                    { name: 'Technology', value: 'technology' },
                    { name: 'Entertainment', value: 'entertainment' },
                    { name: 'Creative', value: 'creative' },
                    { name: 'Music', value: 'music' },
                    { name: 'Community', value: 'community' },
                ],
            },
            {
                name: 'tags',
                description: 'New tags for your server (comma-separated)',
                type: 3, // STRING type
                required: false,
            },
        ],
    },

    REMOVE: {
        name: 'remove',
        description: 'Remove your server from the server list',
    },

    PREVIEW: {
        name: 'preview',
        description: 'Preview how your server appears on the server list',
    },

    SEARCH: {
        name: 'search',
        description: 'Search for servers on the server list',
        options: [
            {
                name: 'query',
                description: 'Search query',
                type: 3, // STRING type
                required: true,
            },
            {
                name: 'category',
                description: 'Filter by category',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Gaming', value: 'gaming' },
                    { name: 'Social', value: 'social' },
                    { name: 'Education', value: 'education' },
                    { name: 'Technology', value: 'technology' },
                    { name: 'Entertainment', value: 'entertainment' },
                    { name: 'Creative', value: 'creative' },
                    { name: 'Music', value: 'music' },
                    { name: 'Community', value: 'community' },
                ],
            },
            {
                name: 'sort',
                description: 'Sort results by',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Members', value: 'members' },
                    { name: 'Created', value: 'created' },
                    { name: 'Updated', value: 'updated' },
                    { name: 'Name', value: 'name' },
                ],
            },
        ],
    },

    INFO: {
        name: 'serverinfo',
        description: 'View detailed information about a server',
        options: [
            {
                name: 'server',
                description: 'Server name or ID',
                type: 3, // STRING type
                required: false,
            },
        ],
    },

    CUSTOMIZE: {
        name: 'customize',
        description: 'Customize your server listing (Premium)',
        options: [
            {
                name: 'theme',
                description: 'Theme for your server listing',
                type: 3, // STRING type
                required: false,
                choices: [
                    { name: 'Default', value: 'default' },
                    { name: 'Dark', value: 'dark' },
                    { name: 'Light', value: 'light' },
                ],
            },
            {
                name: 'banner',
                description: 'Banner image URL',
                type: 3, // STRING type
                required: false,
            },
        ],
    },

    BUMP: {
        name: 'bump',
        description: 'Bump your server to the top of the list (Premium)',
    },

    ANALYTICS: {
        name: 'analytics',
        description: 'View server listing analytics (Premium)',
        options: [
            {
                name: 'period',
                description: 'Time period for analytics',
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
};
