export const NETWORK_CONFIG = {
    // Network Settings
    network: {
        maxConnections: 10, // Maximum number of connections per server
        connectionTimeout: 300000, // 5 minutes timeout for connection requests
        messageDelay: 1000, // 1 second delay between messages
        maxMessageLength: 2000, // Maximum message length
        maxAttachments: 1, // Maximum number of attachments per message
        maxAttachmentSize: 8388608, // 8MB max attachment size
    },

    // Channel Settings
    channel: {
        types: ['text', 'announcement'], // Supported channel types
        maxChannels: 5, // Maximum number of channels per server
        nameLengthLimit: 100, // Maximum channel name length
        topicLengthLimit: 1024, // Maximum channel topic length
    },

    // Permission Settings
    permissions: {
        roles: {
            ADMIN: 'network_admin',
            MODERATOR: 'network_mod',
            MEMBER: 'network_member',
        },
        levels: {
            admin: ['manage_network', 'manage_channels', 'manage_messages', 'ban_users'],
            moderator: ['manage_messages', 'timeout_users'],
            member: ['send_messages', 'read_messages'],
        },
    },

    // Message Settings
    message: {
        types: {
            TEXT: 'text',
            IMAGE: 'image',
            FILE: 'file',
            EMBED: 'embed',
            REPLY: 'reply',
        },
        filters: {
            blockedWords: [], // Words to filter out
            blockedDomains: [], // Domains to filter out
            maxMentions: 5, // Maximum number of mentions per message
            maxLines: 10, // Maximum number of lines per message
        },
        cooldowns: {
            user: 1000, // 1 second per user
            channel: 500, // 0.5 seconds per channel
            attachment: 5000, // 5 seconds for attachments
        },
    },

    // Webhook Settings
    webhook: {
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
        timeout: 5000, // 5 seconds
        batchSize: 10, // Number of messages to batch
        headers: {
            'User-Agent': 'Discord-Network-Bot',
            'Content-Type': 'application/json',
        },
    },

    // Premium Features
    premium: {
        maxConnections: 25,
        maxChannels: 10,
        maxAttachments: 3,
        maxAttachmentSize: 104857600, // 100MB
        customWebhooks: true,
        advancedAnalytics: true,
        priorityDelivery: true,
    },

    // Analytics Settings
    analytics: {
        metrics: [
            'messages_sent',
            'messages_received',
            'connections_made',
            'active_users',
            'bandwidth_used',
            'errors',
        ],
        intervals: {
            realtime: 60000, // 1 minute
            hourly: 3600000, // 1 hour
            daily: 86400000, // 1 day
        },
        retention: {
            realtime: 86400000, // 1 day
            hourly: 604800000, // 7 days
            daily: 2592000000, // 30 days
        },
    },

    // Security Settings
    security: {
        ratelimits: {
            messages: {
                points: 5,
                duration: 60000, // 1 minute
            },
            connections: {
                points: 3,
                duration: 3600000, // 1 hour
            },
            webhooks: {
                points: 10,
                duration: 60000, // 1 minute
            },
        },
        encryption: {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 12,
            tagLength: 16,
        },
        verification: {
            required: true,
            timeout: 86400000, // 24 hours
            minAge: 604800000, // 7 days (server age)
            minMembers: 50,
        },
    },

    // Error Messages
    errors: {
        connection: {
            timeout: 'Connection request timed out.',
            limit: 'Maximum number of connections reached.',
            invalid: 'Invalid connection target.',
            exists: 'Connection already exists.',
        },
        channel: {
            limit: 'Maximum number of channels reached.',
            invalid: 'Invalid channel configuration.',
            exists: 'Channel already exists.',
        },
        message: {
            length: 'Message exceeds maximum length.',
            cooldown: 'Please wait before sending another message.',
            filtered: 'Message contains filtered content.',
            failed: 'Failed to send message.',
        },
        permission: {
            denied: 'You do not have permission to perform this action.',
            invalid: 'Invalid permission configuration.',
        },
        webhook: {
            failed: 'Webhook delivery failed.',
            invalid: 'Invalid webhook configuration.',
        },
        premium: {
            required: 'This feature requires premium status.',
        },
    },

    // UI Settings
    ui: {
        colors: {
            connected: '#2ecc71', // Green
            disconnected: '#e74c3c', // Red
            pending: '#f1c40f', // Yellow
            info: '#3498db', // Blue
        },
        icons: {
            connected: '🔗',
            disconnected: '❌',
            pending: '⏳',
            message: '💬',
            attachment: '📎',
            settings: '⚙️',
        },
        embeds: {
            maxFields: 25,
            maxFieldLength: 1024,
            maxDescriptionLength: 4096,
        },
    },
};
