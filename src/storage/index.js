import { KVStorage } from './kv.js';
import { D1Storage } from './d1.js';
import { R2Storage } from './r2.js';
import { StorageMigration } from './migration.js';
import { StorageBackup } from './backup.js';
import { StorageMonitoring } from './monitoring.js';

export class StorageManager {
    constructor(env) {
        this.env = env;
        this.kv = new KVStorage(env.KV);
        this.d1 = new D1Storage(env.D1);
        this.r2 = new R2Storage(env.R2);
        
        // Initialize components
        this.migration = new StorageMigration(env);
        this.backup = new StorageBackup(env);
        this.monitoring = new StorageMonitoring(env);
        
        // Setup logging
        this.logger = {
            info: (message, ...args) => this.log('info', message, ...args),
            error: (message, ...args) => this.log('error', message, ...args),
            warn: (message, ...args) => this.log('warn', message, ...args),
            debug: (message, ...args) => this.log('debug', message, ...args)
        };
    }

    async log(level, message, ...args) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            args: args.length > 0 ? args : undefined
        };

        // Store in Analytics Engine
        await this.monitoring.trackMetric('log', 1, {
            level,
            message: typeof message === 'string' ? message : JSON.stringify(message)
        });

        // If error, track it specifically
        if (level === 'error') {
            await this.monitoring.trackError(
                message instanceof Error ? message : new Error(message),
                { args }
            );
        }

        // Console output for development
        console[level](message, ...args);
    }

    // Database operations with monitoring
    async query(sql, params = []) {
        const start = Date.now();
        try {
            const result = await this.d1.query(sql, params);
            await this.monitoring.trackPerformance('db_query', Date.now() - start, {
                sql,
                params: JSON.stringify(params)
            });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'db_query',
                sql,
                params: JSON.stringify(params)
            });
            throw error;
        }
    }

    // KV operations with monitoring
    async kvGet(key) {
        const start = Date.now();
        try {
            const value = await this.kv.get(key);
            await this.monitoring.trackPerformance('kv_get', Date.now() - start, { key });
            return value;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'kv_get',
                key
            });
            throw error;
        }
    }

    async kvPut(key, value, options = {}) {
        const start = Date.now();
        try {
            await this.kv.setWithCache(key, value, options);
            await this.monitoring.trackPerformance('kv_put', Date.now() - start, {
                key,
                options: JSON.stringify(options)
            });
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'kv_put',
                key,
                options: JSON.stringify(options)
            });
            throw error;
        }
    }

    // R2 operations with monitoring
    async r2Get(key) {
        const start = Date.now();
        try {
            const object = await this.r2.getFile(key);
            await this.monitoring.trackPerformance('r2_get', Date.now() - start, { key });
            return object;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'r2_get',
                key
            });
            throw error;
        }
    }

    async r2Put(key, value, options = {}) {
        const start = Date.now();
        try {
            await this.r2.uploadFile(key, value, options);
            await this.monitoring.trackPerformance('r2_put', Date.now() - start, {
                key,
                options: JSON.stringify(options)
            });
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'r2_put',
                key,
                options: JSON.stringify(options)
            });
            throw error;
        }
    }

    // High-level operations
    async getUser(userId, guildId) {
        const start = Date.now();
        try {
            // Try KV cache first
            const cacheKey = KVStorage.generateKey('user', userId, guildId);
            const cached = await this.kvGet(cacheKey);
            if (cached) {
                await this.monitoring.trackPerformance('get_user', Date.now() - start, { userId, guildId });
                return cached;
            }

            // Fallback to D1
            const user = await this.d1.getUser(userId, guildId);
            if (user) {
                // Cache for future use
                await this.kvPut(cacheKey, user);
            }
            await this.monitoring.trackPerformance('get_user', Date.now() - start, { userId, guildId });
            return user;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'get_user',
                userId,
                guildId
            });
            throw error;
        }
    }

    async createUser(userData) {
        const start = Date.now();
        try {
            // Store in D1
            const success = await this.d1.createUser(userData);
            if (success) {
                // Cache in KV
                const cacheKey = KVStorage.generateKey('user', userData.id, userData.guild_id);
                await this.kvPut(cacheKey, userData);
            }
            await this.monitoring.trackPerformance('create_user', Date.now() - start, { userId: userData.id });
            return success;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'create_user',
                userId: userData.id
            });
            throw error;
        }
    }

    async getGuild(guildId) {
        const start = Date.now();
        try {
            // Try KV cache first
            const cacheKey = KVStorage.generateKey('guild', guildId);
            const cached = await this.kvGet(cacheKey);
            if (cached) {
                await this.monitoring.trackPerformance('get_guild', Date.now() - start, { guildId });
                return cached;
            }

            // Fallback to D1
            const guild = await this.d1.getGuild(guildId);
            if (guild) {
                // Cache for future use
                await this.kvPut(cacheKey, guild);
            }
            await this.monitoring.trackPerformance('get_guild', Date.now() - start, { guildId });
            return guild;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'get_guild',
                guildId
            });
            throw error;
        }
    }

    async updateGuild(guildId, data) {
        const start = Date.now();
        try {
            // Update in D1
            const success = await this.d1.updateGuild(guildId, data);
            if (success) {
                // Update KV cache
                const cacheKey = KVStorage.generateKey('guild', guildId);
                const guild = await this.d1.getGuild(guildId);
                if (guild) {
                    await this.kvPut(cacheKey, guild);
                }
            }
            await this.monitoring.trackPerformance('update_guild', Date.now() - start, { guildId });
            return success;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'update_guild',
                guildId
            });
            throw error;
        }
    }

    async getMessage(messageId, guildId) {
        const start = Date.now();
        try {
            // Messages are stored in D1 only
            const message = await this.d1.getMessage(messageId, guildId);
            await this.monitoring.trackPerformance('get_message', Date.now() - start, { messageId, guildId });
            return message;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'get_message',
                messageId,
                guildId
            });
            throw error;
        }
    }

    async createMessage(messageData) {
        const start = Date.now();
        try {
            const message = await this.d1.createMessage(messageData);
            await this.monitoring.trackPerformance('create_message', Date.now() - start, { messageId: messageData.id });
            return message;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'create_message',
                messageId: messageData.id
            });
            throw error;
        }
    }

    async uploadFile(type, id, file, metadata = {}) {
        const start = Date.now();
        try {
            const key = R2Storage.generateKey(type, id, file.name);
            const result = await this.r2Put(key, file, metadata);
            await this.monitoring.trackPerformance('upload_file', Date.now() - start, { type, id, filename: file.name });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'upload_file',
                type,
                id,
                filename: file.name
            });
            throw error;
        }
    }

    async getFile(type, id, filename) {
        const start = Date.now();
        try {
            const key = R2Storage.generateKey(type, id, filename);
            const file = await this.r2Get(key);
            await this.monitoring.trackPerformance('get_file', Date.now() - start, { type, id, filename });
            return file;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'get_file',
                type,
                id,
                filename
            });
            throw error;
        }
    }

    async deleteFile(type, id, filename) {
        const start = Date.now();
        try {
            const key = R2Storage.generateKey(type, id, filename);
            const result = await this.r2.deleteFile(key);
            await this.monitoring.trackPerformance('delete_file', Date.now() - start, { type, id, filename });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'delete_file',
                type,
                id,
                filename
            });
            throw error;
        }
    }

    async trackEvent(guildId, eventType, eventData = {}) {
        const start = Date.now();
        try {
            // Store in D1
            const result = await this.d1.trackEvent(guildId, eventType, eventData);
            await this.monitoring.trackPerformance('track_event', Date.now() - start, { guildId, eventType });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'track_event',
                guildId,
                eventType
            });
            throw error;
        }
    }

    async getAnalytics(guildId, eventType, period = 'day') {
        const start = Date.now();
        try {
            // Try KV cache first
            const cacheKey = KVStorage.generateKey('analytics', guildId, `${eventType}:${period}`);
            const cached = await this.kvGet(cacheKey);
            if (cached) {
                await this.monitoring.trackPerformance('get_analytics', Date.now() - start, { guildId, eventType, period });
                return cached;
            }

            // Fallback to D1
            const analytics = await this.d1.getAnalytics(guildId, eventType, period);
            if (analytics) {
                // Cache for a short period
                await this.kvPut(cacheKey, analytics, { ttl: 300 }); // 5 minutes
            }
            await this.monitoring.trackPerformance('get_analytics', Date.now() - start, { guildId, eventType, period });
            return analytics;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'get_analytics',
                guildId,
                eventType,
                period
            });
            throw error;
        }
    }

    async createVerification(userId, guildId, method) {
        const start = Date.now();
        try {
            const result = await this.d1.createVerification(userId, guildId, method);
            await this.monitoring.trackPerformance('create_verification', Date.now() - start, { userId, guildId, method });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'create_verification',
                userId,
                guildId,
                method
            });
            throw error;
        }
    }

    async updateVerification(userId, guildId, status) {
        const start = Date.now();
        try {
            const result = await this.d1.updateVerification(userId, guildId, status);
            await this.monitoring.trackPerformance('update_verification', Date.now() - start, { userId, guildId, status });
            return result;
        } catch (error) {
            await this.monitoring.trackError(error, {
                operation: 'update_verification',
                userId,
                guildId,
                status
            });
            throw error;
        }
    }

    // Transaction support
    async beginTransaction() {
        return await this.d1.beginTransaction();
    }

    async commit() {
        return await this.d1.commit();
    }

    async rollback() {
        return await this.d1.rollback();
    }

    // Cleanup operations
    async cleanup() {
        try {
            // Clean up old data
            await this.backup.cleanupOldBackups();
            
            // Run health check
            const health = await this.monitoring.checkSystemHealth();
            if (health.status !== 'healthy') {
                await this.monitoring.createAlert(
                    'system_health',
                    'System health check failed',
                    'warning',
                    health.checks
                );
            }
        } catch (error) {
            this.logger.error('Cleanup failed:', error);
        }
    }
}

export function createStorageManager(env) {
    return new StorageManager(env);
}
