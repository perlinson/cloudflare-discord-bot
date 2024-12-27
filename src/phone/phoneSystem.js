import { KVStorage } from '../storage/kv.js';

export class PhoneSystem {
    constructor(kv) {
        this.kv = kv;
        this.prefix = 'phone:';
        this.connections = new Map();
    }

    async initialize() {
        await this.loadConnections();
    }

    async loadConnections() {
        try {
            const data = await this.kv.get(`${this.prefix}connections`);
            if (data) {
                this.connections = new Map(Object.entries(JSON.parse(data)));
            }
        } catch (error) {
            console.error('Error loading connections:', error);
        }
    }

    async saveConnections() {
        try {
            const data = Object.fromEntries(this.connections);
            await this.kv.put(`${this.prefix}connections`, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving connections:', error);
        }
    }

    async connect(channelId, userId) {
        this.connections.set(channelId, {
            userId,
            timestamp: Date.now()
        });
        await this.saveConnections();
    }

    async disconnect(channelId) {
        this.connections.delete(channelId);
        await this.saveConnections();
    }

    isConnected(channelId) {
        return this.connections.has(channelId);
    }

    getConnection(channelId) {
        return this.connections.get(channelId);
    }

    getAllConnections() {
        return Array.from(this.connections.entries()).map(([channelId, data]) => ({
            channelId,
            ...data
        }));
    }

    async cleanup(maxAge = 24 * 60 * 60 * 1000) { // Default: 24 hours
        const now = Date.now();
        let cleaned = 0;

        for (const [channelId, data] of this.connections.entries()) {
            if (now - data.timestamp > maxAge) {
                this.connections.delete(channelId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            await this.saveConnections();
        }

        return cleaned;
    }
}

export const phoneSystem = new PhoneSystem(new KVStorage());
