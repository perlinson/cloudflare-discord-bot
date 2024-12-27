export const ECONOMY_CONFIG = {
    // Rewards
    DAILY_REWARD: {
        min: 100,
        max: 500,
    },
    WEEKLY_REWARD: {
        min: 1000,
        max: 5000,
    },
    WORK_REWARD: {
        min: 50,
        max: 200,
        cooldown: 30 * 60 * 1000, // 30 minutes
    },

    // Mining
    MINING: {
        items: {
            'stone': { chance: 0.8, value: 5 },
            'iron': { chance: 0.5, value: 20 },
            'gold': { chance: 0.3, value: 50 },
            'diamond': { chance: 0.1, value: 200 },
            'emerald': { chance: 0.05, value: 500 },
        },
        cooldown: 5 * 60 * 1000, // 5 minutes
    },

    // Fishing
    FISHING: {
        items: {
            'common_fish': { chance: 0.7, value: 10 },
            'rare_fish': { chance: 0.2, value: 50 },
            'tropical_fish': { chance: 0.08, value: 150 },
            'treasure_chest': { chance: 0.02, value: 1000 },
        },
        cooldown: 3 * 60 * 1000, // 3 minutes
    },

    // Shop items
    SHOP: {
        'fishing_rod': {
            price: 1000,
            description: 'Increases fishing success rate by 20%',
            category: 'tools',
        },
        'pickaxe': {
            price: 1500,
            description: 'Increases mining success rate by 20%',
            category: 'tools',
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

    // Business types
    BUSINESSES: {
        'shop': {
            setup_cost: 5000,
            income_rate: 100,
            upgrade_cost: 2000,
            max_level: 5,
        },
        'restaurant': {
            setup_cost: 8000,
            income_rate: 150,
            upgrade_cost: 3000,
            max_level: 5,
        },
        'factory': {
            setup_cost: 15000,
            income_rate: 300,
            upgrade_cost: 5000,
            max_level: 5,
        },
    },

    // Premium benefits
    PREMIUM_BENEFITS: {
        daily_bonus: 2, // 2x daily rewards
        work_cooldown: 0.5, // 50% cooldown reduction
        business_income: 1.5, // 50% more business income
    },

    // Transfer limits
    TRANSFER: {
        min_amount: 10,
        max_amount: 1000000,
        fee_percentage: 5, // 5% transfer fee
    },


};
