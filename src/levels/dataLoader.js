import { LEVELS_CONFIG } from './config.js';

export class LevelsDataLoader {
    constructor(kv) {
        this.kv = kv;
        this.prefix = 'levels:';
    }

    async initialize() {
        // No initialization needed for Cloudflare KV
    }

    async loadJson(key) {
        try {
            const data = await this.kv.get(key);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return {};
        }
    }

    async saveJson(key, data) {
        try {
            await this.kv.put(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    }

    // XP Management
    async getUserXP(userId) {
        const xpData = await this.loadJson(`${this.prefix}xp`);
        return xpData[userId] || { xp: 0, lastXpGain: null };
    }

    async addXP(userId, xpAmount) {
        const xpData = await this.loadJson(`${this.prefix}xp`);
        if (!xpData[userId]) {
            xpData[userId] = { xp: 0, lastXpGain: null };
        }
        xpData[userId].xp += xpAmount;
        xpData[userId].lastXpGain = Date.now();
        await this.saveJson(`${this.prefix}xp`, xpData);
        return xpData[userId];
    }

    // Level Calculations
    calculateLevel(xp) {
        if (xp < LEVELS_CONFIG.baseXP) {
            return 1;
        }
        return Math.floor(1 + Math.log(xp / LEVELS_CONFIG.baseXP) / Math.log(LEVELS_CONFIG.xpMultiplier));
    }

    calculateXPForLevel(level) {
        if (level <= 1) {
            return 0;
        }
        return Math.floor(LEVELS_CONFIG.baseXP * Math.pow(LEVELS_CONFIG.xpMultiplier, level - 1));
    }

    // Rank Management
    getRankTitle(level) {
        let highestRank = 'Novice';
        for (const [rankLevel, title] of Object.entries(LEVELS_CONFIG.rankTitles)) {
            if (level >= parseInt(rankLevel)) {
                highestRank = title;
            } else {
                break;
            }
        }
        return highestRank;
    }

    // Reward Management
    calculateReward(level) {
        return Math.floor(LEVELS_CONFIG.baseReward * Math.pow(LEVELS_CONFIG.rewardMultiplier, level - 1));
    }

    // Leaderboard
    async getLeaderboard(limit = 10) {
        const xpData = await this.loadJson(`${this.prefix}xp`);
        return Object.entries(xpData)
            .map(([userId, data]) => ({
                userId,
                xp: data.xp,
                level: this.calculateLevel(data.xp),
                rank: this.getRankTitle(this.calculateLevel(data.xp)),
            }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, limit);
    }

    // Settings Management
    async getGuildSettings(guildId) {
        const settings = await this.loadJson(`${this.prefix}settings`);
        return settings[guildId] || {
            xpEnabled: true,
            xpChannels: [], // Empty array means all channels
            xpRoles: [], // Empty array means all roles
            levelUpChannel: null, // null means same channel as message
            levelUpMessage: true,
        };
    }

    async updateGuildSettings(guildId, newSettings) {
        const settings = await this.loadJson(`${this.prefix}settings`);
        settings[guildId] = {
            ...settings[guildId],
            ...newSettings,
        };
        await this.saveJson(`${this.prefix}settings`, settings);
    }

    // XP Boost Management
    async getXPMultiplier(userId, guildId) {
        let multiplier = 1;

        // Check premium status
        if (await this.isPremiumUser(userId)) {
            multiplier *= LEVELS_CONFIG.boosts.premium;
        }

        // Check if it's weekend
        const now = new Date();
        if (now.getDay() === 0 || now.getDay() === 6) {
            multiplier *= LEVELS_CONFIG.boosts.weekend;
        }

        // Check if there's an active event
        if (await this.isEventActive(guildId)) {
            multiplier *= LEVELS_CONFIG.boosts.event;
        }

        return multiplier;
    }

    // Helper Methods
    async isPremiumUser(userId) {
        // This should be implemented based on your premium system
        return false;
    }

    async isEventActive(guildId) {
        // This should be implemented based on your event system
        return false;
    }
}

export const levelsDataLoader = new LevelsDataLoader();
