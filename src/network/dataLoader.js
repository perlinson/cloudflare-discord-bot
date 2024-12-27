import { NETWORK_CONFIG } from './config.js';
import { createStorageManager } from '../storage/index.js';

class NetworkDataLoader {
    constructor() {
        this.storage = null;
        // Temporary data (kept in memory)
        this.pendingConnections = new Map(); // server -> pending connections
        this.messageQueue = new Map(); // server -> queued messages
        this.rateLimit = new Map(); // server -> rate limit data
    }

    initialize(env) {
        this.storage = createStorageManager(env);
    }

    // Connection Management
    async getConnections(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.connections || [];
    }

    async addConnection(serverId, targetId) {
        const guild = await this.storage.getGuild(serverId);
        const connections = [...(guild?.connections || []), {
            targetId,
            connectedAt: Date.now(),
            status: 'active',
        }];
        await this.storage.updateGuild(serverId, { connections });

        // Track event
        await this.storage.trackEvent(serverId, 'network_connect', { targetId });
    }

    async removeConnection(serverId, targetId) {
        const guild = await this.storage.getGuild(serverId);
        const connections = (guild?.connections || []).filter(conn => conn.targetId !== targetId);
        await this.storage.updateGuild(serverId, { connections });

        // Track event
        await this.storage.trackEvent(serverId, 'network_disconnect', { targetId });
    }

    // Channel Management
    async getNetworkChannels(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.networkChannels || [];
    }

    async addNetworkChannel(serverId, channelData) {
        const guild = await this.storage.getGuild(serverId);
        const channels = [...(guild?.networkChannels || []), {
            ...channelData,
            addedAt: Date.now(),
        }];
        await this.storage.updateGuild(serverId, { networkChannels: channels });

        // Track event
        await this.storage.trackEvent(serverId, 'network_channel_add', channelData);
    }

    async removeNetworkChannel(serverId, channelId) {
        const guild = await this.storage.getGuild(serverId);
        const channels = (guild?.networkChannels || []).filter(channel => channel.id !== channelId);
        await this.storage.updateGuild(serverId, { networkChannels: channels });

        // Track event
        await this.storage.trackEvent(serverId, 'network_channel_remove', { channelId });
    }

    // Message Management
    async createNetworkMessage(messageData) {
        const { id, serverId, channelId, content, author, attachments } = messageData;

        // Store message in D1
        await this.storage.createMessage({
            id,
            guild_id: serverId,
            channel_id: channelId,
            author_id: author.id,
            content,
            type: 'network',
        });

        // Store attachments in R2 if any
        if (attachments?.length > 0) {
            for (const attachment of attachments) {
                const key = `network/${serverId}/${id}/${attachment.name}`;
                await this.storage.r2.uploadFile(key, attachment.file, {
                    messageId: id,
                    fileName: attachment.name,
                    fileType: attachment.type,
                });
            }
        }

        // Track event
        await this.storage.trackEvent(serverId, 'network_message_send', {
            messageId: id,
            channelId,
            hasAttachments: attachments?.length > 0,
        });
    }

    async editNetworkMessage(messageId, serverId, content) {
        const message = await this.storage.getMessage(messageId, serverId);
        if (!message) return false;

        // Update message
        await this.storage.updateMessage(messageId, serverId, { content });

        // Track event
        await this.storage.trackEvent(serverId, 'network_message_edit', {
            messageId,
            channelId: message.channel_id,
        });

        return true;
    }

    async deleteNetworkMessage(messageId, serverId) {
        const message = await this.storage.getMessage(messageId, serverId);
        if (!message) return false;

        // Delete message
        await this.storage.deleteMessage(messageId, serverId);

        // Delete attachments if any
        const attachments = await this.storage.r2.listFiles(`network/${serverId}/${messageId}/`);
        if (attachments.length > 0) {
            await this.storage.r2.deleteMany(attachments.map(att => att.key));
        }

        // Track event
        await this.storage.trackEvent(serverId, 'network_message_delete', {
            messageId,
            channelId: message.channel_id,
        });

        return true;
    }

    // Permission Management
    async getNetworkRoles(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.networkRoles || [];
    }

    async setNetworkRole(serverId, roleData) {
        const guild = await this.storage.getGuild(serverId);
        const roles = [...(guild?.networkRoles || [])];
        const existingIndex = roles.findIndex(role => role.id === roleData.id);

        if (existingIndex >= 0) {
            roles[existingIndex] = {
                ...roleData,
                updatedAt: Date.now(),
            };
        } else {
            roles.push({
                ...roleData,
                addedAt: Date.now(),
            });
        }

        await this.storage.updateGuild(serverId, { networkRoles: roles });

        // Track event
        await this.storage.trackEvent(serverId, 'network_role_set', roleData);
    }

    async removeNetworkRole(serverId, roleId) {
        const guild = await this.storage.getGuild(serverId);
        const roles = (guild?.networkRoles || []).filter(role => role.id !== roleId);
        await this.storage.updateGuild(serverId, { networkRoles: roles });

        // Track event
        await this.storage.trackEvent(serverId, 'network_role_remove', { roleId });
    }

    // Settings Management
    async getNetworkSettings(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.networkSettings || {};
    }

    async updateNetworkSettings(serverId, settings) {
        const guild = await this.storage.getGuild(serverId);
        const networkSettings = {
            ...(guild?.networkSettings || {}),
            ...settings,
            updatedAt: Date.now(),
        };
        await this.storage.updateGuild(serverId, { networkSettings });

        // Track event
        await this.storage.trackEvent(serverId, 'network_settings_update', settings);
    }

    // Analytics
    async getNetworkStats(serverId, period = 'day') {
        const stats = {
            messages: await this.storage.getAnalytics(serverId, 'network_message_send', period),
            connections: await this.storage.getAnalytics(serverId, 'network_connect', period),
            channels: await this.storage.getAnalytics(serverId, 'network_channel_add', period),
        };

        return {
            messageCount: stats.messages?.length || 0,
            connectionCount: stats.connections?.length || 0,
            channelCount: stats.channels?.length || 0,
            history: {
                messages: stats.messages || [],
                connections: stats.connections || [],
                channels: stats.channels || [],
            },
        };
    }

    // Premium Features
    async isPremiumServer(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.premium_until ? guild.premium_until > Date.now() : false;
    }

    // Rate Limiting
    isRateLimited(serverId, action) {
        const limits = this.rateLimit.get(serverId) || {};
        const limit = limits[action];
        if (!limit) return false;

        const now = Date.now();
        return limit.count >= NETWORK_CONFIG.rateLimit[action] && 
               now - limit.timestamp < NETWORK_CONFIG.rateLimitDuration;
    }

    incrementRateLimit(serverId, action) {
        const limits = this.rateLimit.get(serverId) || {};
        const limit = limits[action] || { count: 0, timestamp: Date.now() };

        const now = Date.now();
        if (now - limit.timestamp >= NETWORK_CONFIG.rateLimitDuration) {
            limit.count = 1;
            limit.timestamp = now;
        } else {
            limit.count++;
        }

        limits[action] = limit;
        this.rateLimit.set(serverId, limits);
    }

    // Cleanup
    async cleanup() {
        const now = Date.now();

        // Clean up pending connections
        for (const [serverId, data] of this.pendingConnections.entries()) {
            if (now - data.timestamp > 300000) { // 5 minutes
                this.pendingConnections.delete(serverId);
            }
        }

        // Clean up rate limits
        for (const [serverId, limits] of this.rateLimit.entries()) {
            let hasExpired = true;
            for (const action in limits) {
                if (now - limits[action].timestamp < NETWORK_CONFIG.rateLimitDuration) {
                    hasExpired = false;
                    break;
                }
            }
            if (hasExpired) {
                this.rateLimit.delete(serverId);
            }
        }

        // Clean up storage
        await this.storage.cleanup();
    }
}

// Create and export a singleton instance
export const networkData = new NetworkDataLoader();
