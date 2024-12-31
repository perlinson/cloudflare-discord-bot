export const ECONOMY_CONFIG = {
    // Rewards
    DAILY_REWARD: {
        amount: 100,
        cooldown: 24, // 24 hours in milliseconds
    },

    // UI Colors
    ui: {
        colors: {
            primary: '#5865F2',   // Discord Blue
            success: '#57F287',   // Green
            warning: '#FEE75C',   // Yellow
            error: '#ED4245',     // Red
            info: '#5865F2',      // Blue
        },
    },

    // Shop Items
    SHOP: {
        'fishing_rod': {
            price: 1000,
            description: 'A basic fishing rod for catching fish',
            category: 'tools',
        },
        'pickaxe': {
            price: 1500,
            description: 'A sturdy pickaxe for mining resources',
            category: 'tools',
        },
        'sword': {
            price: 2000,
            description: 'A sharp sword for combat',
            category: 'weapons',
        },
        'shield': {
            price: 1800,
            description: 'A strong shield for defense',
            category: 'weapons',
        },
        'business_license': {
            price: 5000,
            description: 'Required to start a business',
            category: 'special',
        },
        'premium_pass': {
            price: 10000,
            description: 'Get premium benefits for 30 days',
            category: 'special',
        },
    },

    // Transfer Settings
    TRANSFER: {
        min_amount: 1,
        max_amount: 1000000,
        fee_percentage: 0, // No transfer fee for now
    },

    // Rate Limits
    RATE_LIMITS: {
        transfer: {
            max_per_day: 10,
            reset_period: 24 * 60 * 60 * 1000, // 24 hours
        },
    },

    // Error Messages
    errors: {
        insufficientFunds: '❌ You do not have enough coins for this transaction.',
        invalidAmount: '❌ Please specify a valid amount between {min} and {max} coins.',
        rateLimit: '⏰ You have reached the maximum number of transfers for today. Please try again tomorrow.',
        generalError: '❌ An error occurred while processing your request. Please try again later.',
    },
};
