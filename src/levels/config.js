export const LEVELS_CONFIG = {
    // XP Settings
    baseXP: 100, // Base XP needed for first level
    xpMultiplier: 1.5, // XP multiplier for each level
    minXPPerMessage: 15, // Minimum XP per message
    maxXPPerMessage: 25, // Maximum XP per message
    xpCooldown: 60, // Cooldown in seconds between XP gains
    
    // Level Rewards
    baseReward: 100, // Base coins reward for leveling up
    rewardMultiplier: 1.2, // Reward multiplier for each level
    
    // Rank Titles
    rankTitles: {
        1: 'Novice',
        5: 'Apprentice',
        10: 'Adept',
        15: 'Expert',
        20: 'Master',
        25: 'Grand Master',
        30: 'Legend',
        40: 'Mythical',
        50: 'Divine',
        60: 'Immortal',
        70: 'Transcendent',
        80: 'Celestial',
        90: 'Cosmic',
        100: 'Universal',
    },
    
    // Level Up Messages
    levelUpMessages: [
        'Congratulations {user}! You\'ve reached level {level}!',
        'Amazing work {user}! You are now level {level}!',
        'Keep it up {user}! You\'ve advanced to level {level}!',
        'Incredible {user}! You\'ve achieved level {level}!',
        'Outstanding {user}! Welcome to level {level}!',
    ],
    
    // XP Boosts
    boosts: {
        premium: 1.5, // 50% more XP for premium users
        event: 2.0, // Double XP during events
        weekend: 1.25, // 25% more XP on weekends
    },
    
    // Embed Colors
    colors: {
        levelUp: '#2ecc71', // Green
        profile: '#3498db', // Blue
        leaderboard: '#9b59b6', // Purple
    },
};
