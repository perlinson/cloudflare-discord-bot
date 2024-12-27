import { CHATBOT_CONFIG } from './config.js';
import { createStorageManager } from '../storage/index.js';

class ChatbotDataLoader {
    constructor() {
        this.storage = null;
        this.conversations = new Map(); // Temporary conversation cache
        this.rateLimit = new Map(); // Rate limit data
    }

    initialize(env) {
        this.storage = createStorageManager(env);
    }

    // Conversation Management
    async getConversation(userId, serverId) {
        const key = `${serverId}_${userId}`;
        
        // Check cache first
        if (this.conversations.has(key)) {
            return this.conversations.get(key);
        }

        // Get from storage
        const messages = await this.storage.getMessages(serverId, userId, 'chatbot', 10);
        const conversation = {
            messages,
            lastUpdated: Date.now(),
        };

        // Update cache
        this.conversations.set(key, conversation);
        return conversation;
    }

    async addMessage(userId, serverId, message) {
        const key = `${serverId}_${userId}`;
        
        // Create message in storage
        await this.storage.createMessage({
            id: crypto.randomUUID(),
            guild_id: serverId,
            channel_id: null,
            author_id: userId,
            content: message,
            type: 'chatbot',
        });

        // Update cache
        const conversation = await this.getConversation(userId, serverId);
        conversation.messages.push({
            role: 'user',
            content: message,
            timestamp: Date.now(),
        });
        conversation.lastUpdated = Date.now();
        this.conversations.set(key, conversation);

        // Track event
        await this.storage.trackEvent(serverId, 'chatbot_message', {
            userId,
            type: 'user',
            length: message.length,
        });
    }

    async addResponse(userId, serverId, response) {
        const key = `${serverId}_${userId}`;
        
        // Create message in storage
        await this.storage.createMessage({
            id: crypto.randomUUID(),
            guild_id: serverId,
            channel_id: null,
            author_id: 'bot',
            content: response,
            type: 'chatbot',
        });

        // Update cache
        const conversation = await this.getConversation(userId, serverId);
        conversation.messages.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
        });
        conversation.lastUpdated = Date.now();
        this.conversations.set(key, conversation);

        // Track event
        await this.storage.trackEvent(serverId, 'chatbot_message', {
            userId,
            type: 'bot',
            length: response.length,
        });
    }

    // Settings Management
    async getChatbotSettings(serverId) {
        const guild = await this.storage.getGuild(serverId);
        return guild?.chatbotSettings || {};
    }

    async updateChatbotSettings(serverId, settings) {
        const guild = await this.storage.getGuild(serverId);
        const chatbotSettings = {
            ...(guild?.chatbotSettings || {}),
            ...settings,
            updatedAt: Date.now(),
        };

        await this.storage.updateGuild(serverId, { chatbotSettings });

        // Track event
        await this.storage.trackEvent(serverId, 'chatbot_settings_update', settings);
    }

    // Analytics
    async getChatbotStats(serverId, period = 'day') {
        const stats = {
            messages: await this.storage.getAnalytics(serverId, 'chatbot_message', period),
            settings: await this.storage.getAnalytics(serverId, 'chatbot_settings_update', period),
        };

        // Calculate user vs bot messages
        const userMessages = stats.messages?.filter(msg => msg.data.type === 'user') || [];
        const botMessages = stats.messages?.filter(msg => msg.data.type === 'bot') || [];

        return {
            messageCount: stats.messages?.length || 0,
            userMessageCount: userMessages.length,
            botMessageCount: botMessages.length,
            averageUserLength: userMessages.reduce((sum, msg) => sum + msg.data.length, 0) / userMessages.length || 0,
            averageBotLength: botMessages.reduce((sum, msg) => sum + msg.data.length, 0) / botMessages.length || 0,
            history: {
                messages: stats.messages || [],
                settings: stats.settings || [],
            },
        };
    }

    // Rate Limiting
    isRateLimited(userId, action) {
        const limits = this.rateLimit.get(userId) || {};
        const limit = limits[action];
        if (!limit) return false;

        const now = Date.now();
        return limit.count >= CHATBOT_CONFIG.rateLimit[action] && 
               now - limit.timestamp < CHATBOT_CONFIG.rateLimitDuration;
    }

    incrementRateLimit(userId, action) {
        const limits = this.rateLimit.get(userId) || {};
        const limit = limits[action] || { count: 0, timestamp: Date.now() };

        const now = Date.now();
        if (now - limit.timestamp >= CHATBOT_CONFIG.rateLimitDuration) {
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

        // Clean up conversations cache
        for (const [key, conversation] of this.conversations.entries()) {
            if (now - conversation.lastUpdated > 300000) { // 5 minutes
                this.conversations.delete(key);
            }
        }

        // Clean up rate limits
        for (const [userId, limits] of this.rateLimit.entries()) {
            let hasExpired = true;
            for (const action in limits) {
                if (now - limits[action].timestamp < CHATBOT_CONFIG.rateLimitDuration) {
                    hasExpired = false;
                    break;
                }
            }
            if (hasExpired) {
                this.rateLimit.delete(userId);
            }
        }

        // Clean up storage
        await this.storage.cleanup();
    }
}

// Create and export a singleton instance
export const chatbotData = new ChatbotDataLoader();
