export const SHARE_CONFIG = {
    // Server Settings
    server: {
        maxServers: 10, // Maximum number of servers a user can share
        updateCooldown: 3600000, // 1 hour cooldown between server updates
        minMembers: 10, // Minimum members required to share a server
        maxDescription: 1000, // Maximum description length
        maxTags: 5, // Maximum number of tags
        maxInvites: 3, // Maximum number of invite links per server
    },

    // Customization Settings
    customization: {
        themes: {
            default: {
                name: 'Default',
                colors: {
                    primary: '#3498db',
                    secondary: '#2ecc71',
                    accent: '#e74c3c',
                    background: '#2c3e50',
                },
            },
            dark: {
                name: 'Dark',
                colors: {
                    primary: '#34495e',
                    secondary: '#2c3e50',
                    accent: '#e74c3c',
                    background: '#1a1a1a',
                },
            },
            light: {
                name: 'Light',
                colors: {
                    primary: '#ecf0f1',
                    secondary: '#bdc3c7',
                    accent: '#e74c3c',
                    background: '#ffffff',
                },
            },
        },
        badges: {
            verified: {
                name: 'Verified',
                emoji: '✅',
                description: 'Server has been verified by our team',
            },
            partner: {
                name: 'Partner',
                emoji: '🤝',
                description: 'Official partner server',
            },
            featured: {
                name: 'Featured',
                emoji: '⭐',
                description: 'Currently featured on the server list',
            },
            premium: {
                name: 'Premium',
                emoji: '💎',
                description: 'Server has premium features enabled',
            },
        },
    },

    // Preview Settings
    preview: {
        maxBannerSize: 2097152, // 2MB
        maxIconSize: 1048576, // 1MB
        supportedFormats: ['png', 'jpg', 'jpeg', 'gif'],
        dimensions: {
            banner: {
                width: 960,
                height: 540,
            },
            icon: {
                width: 256,
                height: 256,
            },
        },
    },

    // Categories
    categories: {
        gaming: {
            name: 'Gaming',
            emoji: '🎮',
            description: 'Gaming communities',
        },
        social: {
            name: 'Social',
            emoji: '💬',
            description: 'Social and chat communities',
        },
        education: {
            name: 'Education',
            emoji: '📚',
            description: 'Educational communities',
        },
        technology: {
            name: 'Technology',
            emoji: '💻',
            description: 'Technology and programming communities',
        },
        entertainment: {
            name: 'Entertainment',
            emoji: '🎭',
            description: 'Entertainment and media communities',
        },
        creative: {
            name: 'Creative',
            emoji: '🎨',
            description: 'Art and creative communities',
        },
        music: {
            name: 'Music',
            emoji: '🎵',
            description: 'Music communities',
        },
        community: {
            name: 'Community',
            emoji: '👥',
            description: 'General community servers',
        },
    },

    // Search Settings
    search: {
        maxResults: 25,
        minQueryLength: 3,
        maxQueryLength: 50,
        sortOptions: ['members', 'created', 'updated', 'name'],
        filterOptions: ['category', 'tags', 'features', 'badges'],
    },

    // Premium Features
    premium: {
        maxServers: 25,
        maxDescription: 2000,
        maxTags: 10,
        maxInvites: 10,
        customBanner: true,
        customTheme: true,
        analytics: true,
        prioritySupport: true,
    },

    // UI Settings
    ui: {
        colors: {
            success: '#2ecc71', // Green
            error: '#e74c3c', // Red
            warning: '#f1c40f', // Yellow
            info: '#3498db', // Blue
        },
        thumbnailSize: 128,
        maxCardsPerPage: 12,
        maxPaginationButtons: 5,
    },

    // Error Messages
    errors: {
        notFound: 'Server not found.',
        noPermission: 'You do not have permission to perform this action.',
        invalidInvite: 'Invalid invite link.',
        cooldown: 'Please wait before updating server information.',
        premium: 'This feature is only available for premium users.',
        maintenance: 'This feature is currently under maintenance.',
    },
};
