import { ECONOMY_CONFIG } from './config.js';
import { createStorageManager } from '../storage/index.js';

class EconomyDataLoader {
    constructor() {
        this.storage = null;
        this.transactions = new Map(); // Temporary transaction cache
        this.rateLimit = new Map(); // Rate limit data
    }

    initialize(env) {
        this.storage = createStorageManager(env);
    }

    // User Balance Management
    async getUserBalance(userId, serverId) {
        const user = await this.storage.getUser(userId, serverId);
        return user?.balance || 0;
    }

    async updateUserBalance(userId, serverId, amount) {
        const user = await this.storage.getUser(userId, serverId);
        const newBalance = (user?.balance || 0) + amount;
        
        if (newBalance < 0) {
            throw new Error('Insufficient funds');
        }

        await this.storage.updateUser(userId, serverId, { balance: newBalance });
        
        // Track transaction
        await this.storage.trackEvent(serverId, 'economy_transaction', {
            userId,
            amount,
            newBalance,
            timestamp: Date.now(),
        });

        return newBalance;
    }

    // Item Management
    async getUserItems(userId, serverId) {
        const user = await this.storage.getUser(userId, serverId);
        return user?.items || [];
    }

    async addUserItem(userId, serverId, item) {
        const user = await this.storage.getUser(userId, serverId);
        const items = [...(user?.items || []), {
            ...item,
            acquiredAt: Date.now(),
        }];

        await this.storage.updateUser(userId, serverId, { items });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_item_acquire', {
            userId,
            itemId: item.id,
            itemName: item.name,
        });
    }

    async removeUserItem(userId, serverId, itemId) {
        const user = await this.storage.getUser(userId, serverId);
        const items = (user?.items || []).filter(item => item.id !== itemId);
        
        await this.storage.updateUser(userId, serverId, { items });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_item_remove', {
            userId,
            itemId,
        });
    }

    // Shop Management
    async getShopItems(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.shopItems || [];
    }

    async addShopItem(serverId, item) {
        const guild = await this.storage.getGuild(serverId);
        const items = [...(guild?.shopItems || []), {
            ...item,
            addedAt: Date.now(),
        }];

        await this.storage.updateGuild(serverId, { shopItems: items });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_shop_item_add', item);
    }

    async removeShopItem(serverId, itemId) {
        const guild = await this.storage.getGuild(serverId);
        const items = (guild?.shopItems || []).filter(item => item.id !== itemId);
        
        await this.storage.updateGuild(serverId, { shopItems: items });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_shop_item_remove', { itemId });
    }

    // Transaction Management
    async createTransaction(userId, serverId, type, amount, details = {}) {
        const transaction = {
            id: crypto.randomUUID(),
            userId,
            type,
            amount,
            details,
            timestamp: Date.now(),
        };

        // Store transaction in D1
        await this.storage.createTransaction({
            ...transaction,
            guild_id: serverId,
        });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_transaction_create', {
            transactionId: transaction.id,
            type,
            amount,
        });

        return transaction;
    }

    async getUserTransactions(userId, serverId, limit = 10) {
        return await this.storage.getTransactions(serverId, userId, limit);
    }

    // Reward Management
    async getRewards(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.rewards || [];
    }

    async addReward(serverId, reward) {
        const guild = await this.storage.getGuild(serverId);
        const rewards = [...(guild?.rewards || []), {
            ...reward,
            addedAt: Date.now(),
        }];

        await this.storage.updateGuild(serverId, { rewards });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_reward_add', reward);
    }

    async removeReward(serverId, rewardId) {
        const guild = await this.storage.getGuild(serverId);
        const rewards = (guild?.rewards || []).filter(reward => reward.id !== rewardId);
        
        await this.storage.updateGuild(serverId, { rewards });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_reward_remove', { rewardId });
    }

    // Settings Management
    async getEconomySettings(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.economySettings || {};
    }

    async updateEconomySettings(serverId, settings) {
        const guild = await this.storage.getGuild(serverId);
        const economySettings = {
            ...(guild?.economySettings || {}),
            ...settings,
            updatedAt: Date.now(),
        };

        await this.storage.updateGuild(serverId, { economySettings });

        // Track event
        await this.storage.trackEvent(serverId, 'economy_settings_update', settings);
    }

    // Analytics
    async getEconomyStats(serverId, period = 'day') {
        const stats = {
            transactions: await this.storage.getAnalytics(serverId, 'economy_transaction', period),
            items: await this.storage.getAnalytics(serverId, 'economy_item_acquire', period),
            rewards: await this.storage.getAnalytics(serverId, 'economy_reward_add', period),
        };

        return {
            transactionCount: stats.transactions?.length || 0,
            itemCount: stats.items?.length || 0,
            rewardCount: stats.rewards?.length || 0,
            history: {
                transactions: stats.transactions || [],
                items: stats.items || [],
                rewards: stats.rewards || [],
            },
        };
    }

    // Rate Limiting
    isRateLimited(userId, action) {
        const limits = this.rateLimit.get(userId) || {};
        const limit = limits[action];
        if (!limit) return false;

        const now = Date.now();
        return limit.count >= ECONOMY_CONFIG.rateLimit[action] && 
               now - limit.timestamp < ECONOMY_CONFIG.rateLimitDuration;
    }

    incrementRateLimit(userId, action) {
        const limits = this.rateLimit.get(userId) || {};
        const limit = limits[action] || { count: 0, timestamp: Date.now() };

        const now = Date.now();
        if (now - limit.timestamp >= ECONOMY_CONFIG.rateLimitDuration) {
            limit.count = 1;
            limit.timestamp = now;
        } else {
            limit.count++;
        }

        limits[action] = limit;
        this.rateLimit.set(userId, limits);
    }

    // Cleanup
    async cleanup() {
        const now = Date.now();

        // Clean up rate limits
        for (const [userId, limits] of this.rateLimit.entries()) {
            let hasExpired = true;
            for (const action in limits) {
                if (now - limits[action].timestamp < ECONOMY_CONFIG.rateLimitDuration) {
                    hasExpired = false;
                    break;
                }
            }
            if (hasExpired) {
                this.rateLimit.delete(userId);
            }
        }

        // Clean up transactions cache
        for (const [key, transaction] of this.transactions.entries()) {
            if (now - transaction.timestamp > 300000) { // 5 minutes
                this.transactions.delete(key);
            }
        }

        // Clean up storage
        await this.storage.cleanup();
    }
}

// Create and export a singleton instance
export const economyData = new EconomyDataLoader();
