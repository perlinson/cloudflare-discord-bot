export const ONBOARDING_CONFIG = {
    // Welcome Settings
    welcome: {
        messages: [
            "Hey {user}, welcome to {server}! 👋",
            "Welcome aboard {user}! Glad to have you in {server}! 🎉",
            "Welcome to {server}, {user}! Let's get you started! 🚀",
        ],
        defaultChannel: 'welcome',
        embed: {
            color: '#3498db',
            thumbnail: true,
            footer: true,
        },
    },

    // Channel Settings
    channels: {
        required: [
            {
                name: 'welcome',
                type: 'GUILD_TEXT',
                topic: 'Welcome new members!',
            },
            {
                name: 'rules',
                type: 'GUILD_TEXT',
                topic: 'Server rules and guidelines',
            },
            {
                name: 'announcements',
                type: 'GUILD_NEWS',
                topic: 'Server announcements',
            },
        ],
        optional: [
            {
                name: 'introductions',
                type: 'GUILD_TEXT',
                topic: 'Introduce yourself!',
            },
            {
                name: 'roles',
                type: 'GUILD_TEXT',
                topic: 'Get your roles here',
            },
        ],
        categories: [
            {
                name: 'INFORMATION',
                channels: ['welcome', 'rules', 'announcements'],
            },
            {
                name: 'COMMUNITY',
                channels: ['introductions', 'roles'],
            },
        ],
    },

    // Role Settings
    roles: {
        default: {
            name: 'Member',
            color: '#2ecc71',
            hoist: true,
            mentionable: false,
        },
        autoroles: [
            {
                name: 'Unverified',
                color: '#95a5a6',
                hoist: true,
                mentionable: false,
                temporary: true,
            },
        ],
        levels: [
            {
                name: 'Level 5',
                color: '#e74c3c',
                requirement: 5,
            },
            {
                name: 'Level 10',
                color: '#e67e22',
                requirement: 10,
            },
            {
                name: 'Level 20',
                color: '#f1c40f',
                requirement: 20,
            },
        ],
    },

    // Verification Settings
    verification: {
        enabled: true,
        type: 'BUTTON', // BUTTON, REACTION, or CAPTCHA
        timeout: 1800000, // 30 minutes
        message: "Click the button below to verify yourself!",
        button: {
            label: "Verify",
            style: "SUCCESS",
            emoji: "✅",
        },
    },

    // Rules Settings
    rules: {
        enabled: true,
        format: 'EMBED', // EMBED or TEXT
        sections: [
            {
                title: "1. Be Respectful",
                content: "Treat everyone with respect. Harassment, hate speech, and discrimination will not be tolerated.",
            },
            {
                title: "2. No NSFW Content",
                content: "Keep all content family-friendly. No NSFW or explicit content allowed.",
            },
            {
                title: "3. No Spam",
                content: "Do not spam messages, emojis, or mentions. This includes advertising without permission.",
            },
            {
                title: "4. Use Appropriate Channels",
                content: "Keep conversations in their appropriate channels.",
            },
            {
                title: "5. Follow Discord TOS",
                content: "Follow Discord's Terms of Service and Community Guidelines.",
            },
        ],
        footer: "Breaking these rules may result in warnings, mutes, or bans.",
    },

    // Message Settings
    messages: {
        join: {
            enabled: true,
            channel: 'welcome',
            private: true,
        },
        leave: {
            enabled: true,
            channel: 'mod-logs',
            private: false,
        },
        verify: {
            enabled: true,
            channel: 'welcome',
            private: true,
        },
    },

    // Premium Features
    premium: {
        customWelcome: true,
        customRoles: true,
        advancedVerification: true,
        customRules: true,
        analytics: true,
    },

    // Analytics Settings
    analytics: {
        tracking: [
            'joins',
            'leaves',
            'verifications',
            'messages',
            'roles',
        ],
        retention: 2592000000, // 30 days
    },

    // UI Settings
    ui: {
        colors: {
            success: '#2ecc71',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f1c40f',
        },
        emojis: {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
            verify: '🔰',
            rules: '📜',
            roles: '🎭',
        },
    },

    // Error Messages
    errors: {
        permissions: {
            bot: "I don't have the required permissions to perform this action.",
            user: "You don't have permission to use this command.",
        },
        setup: {
            channels: "Failed to create required channels.",
            roles: "Failed to create required roles.",
            permissions: "Failed to set up permissions.",
        },
        verification: {
            timeout: "Verification timed out. Please try again.",
            failed: "Verification failed. Please contact a moderator.",
        },
    },
};
