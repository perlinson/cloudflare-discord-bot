import { ONBOARDING_CONFIG } from './config.js';
import { createStorageManager } from '../storage/index.js';

class OnboardingDataLoader {
    constructor() {
        this.storage = null;
        // Temporary Data (kept in memory)
        this.pendingVerifications = new Map(); // user -> verification data
        this.activeSetups = new Map(); // server -> setup status
    }

    initialize(env) {
        this.storage = createStorageManager(env);
    }

    // Settings Management
    async getSettings(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.settings || {};
    }

    async updateSettings(serverId, newSettings) {
        const guild = await this.storage.getGuild(serverId);
        const settings = {
            ...(guild?.settings || {}),
            ...newSettings,
        };
        return await this.storage.updateGuild(serverId, { settings });
    }

    // Channel Management
    async getChannels(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.channels || [];
    }

    async addChannel(serverId, channelData) {
        const guild = await this.storage.getGuild(serverId);
        const channels = [...(guild?.channels || []), {
            ...channelData,
            addedAt: Date.now(),
        }];
        return await this.storage.updateGuild(serverId, { channels });
    }

    async removeChannel(serverId, channelId) {
        const guild = await this.storage.getGuild(serverId);
        const channels = (guild?.channels || []).filter(channel => channel.id !== channelId);
        return await this.storage.updateGuild(serverId, { channels });
    }

    // Role Management
    async getRoles(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.roles || [];
    }

    async addRole(serverId, roleData) {
        const guild = await this.storage.getGuild(serverId);
        const roles = [...(guild?.roles || []), {
            ...roleData,
            addedAt: Date.now(),
        }];
        return await this.storage.updateGuild(serverId, { roles });
    }

    async removeRole(serverId, roleId) {
        const guild = await this.storage.getGuild(serverId);
        const roles = (guild?.roles || []).filter(role => role.id !== roleId);
        return await this.storage.updateGuild(serverId, { roles });
    }

    // Message Management
    async getMessage(serverId, type) {
        const message = await this.storage.getMessage(type, serverId);
        return message?.content;
    }

    async setMessage(serverId, type, content) {
        return await this.storage.createMessage({
            id: `${type}:${serverId}`,
            guild_id: serverId,
            channel_id: 'system',
            author_id: 'system',
            content,
            type,
        });
    }

    // Verification Management
    async startVerification(userId, serverId) {
        const timeout = ONBOARDING_CONFIG.verification.timeout;
        this.pendingVerifications.set(userId, {
            serverId,
            startedAt: Date.now(),
            expiresAt: Date.now() + timeout,
        });

        return await this.storage.createVerification(userId, serverId, 'pending');
    }

    async completeVerification(userId, serverId) {
        // Remove from pending
        this.pendingVerifications.delete(userId);

        // Update verification status
        await this.storage.updateVerification(userId, serverId, 'completed');

        // Track analytics
        await this.storage.trackEvent(serverId, 'verification', { userId });

        // Update user
        const user = await this.storage.getUser(userId, serverId);
        if (user) {
            user.verified_at = Date.now();
            await this.storage.updateUser(userId, serverId, user);
        }
    }

    async isVerified(userId, serverId) {
        const user = await this.storage.getUser(userId, serverId);
        return !!user?.verified_at;
    }

    isPending(userId) {
        const verification = this.pendingVerifications.get(userId);
        if (!verification) return false;
        return Date.now() < verification.expiresAt;
    }

    // Setup Management
    startSetup(serverId, type) {
        this.activeSetups.set(serverId, {
            type,
            startedAt: Date.now(),
            steps: [],
        });
    }

    updateSetup(serverId, step, status) {
        const setup = this.activeSetups.get(serverId);
        if (setup) {
            setup.steps.push({
                step,
                status,
                timestamp: Date.now(),
            });
            this.activeSetups.set(serverId, setup);
        }
    }

    completeSetup(serverId) {
        const setup = this.activeSetups.get(serverId);
        if (setup) {
            // Track setup completion
            this.storage.trackEvent(serverId, 'setup_complete', {
                type: setup.type,
                steps: setup.steps,
            });
            this.activeSetups.delete(serverId);
            return setup;
        }
        return null;
    }

    // Analytics Management
    async trackMetric(serverId, metric, value = 1) {
        return await this.storage.trackEvent(serverId, metric, { value });
    }

    async getAnalytics(serverId, metric, period = 'day') {
        return await this.storage.getAnalytics(serverId, metric, period);
    }

    // Premium Features
    async isPremiumServer(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.premium_until ? guild.premium_until > Date.now() : false;
    }

    // Cleanup
    async cleanup() {
        const now = Date.now();

        // Clean up expired verifications
        for (const [userId, data] of this.pendingVerifications.entries()) {
            if (now > data.expiresAt) {
                this.pendingVerifications.delete(userId);
            }
        }

        // Clean up old setups
        for (const [serverId, data] of this.activeSetups.entries()) {
            if (now - data.startedAt > 3600000) { // 1 hour timeout
                this.activeSetups.delete(serverId);
            }
        }

        // Clean up storage
        await this.storage.cleanup();
    }
}

// Create and export a singleton instance
export const onboardingData = new OnboardingDataLoader();
