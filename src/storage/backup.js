import { createStorageManager } from './index.js';

export class StorageBackup {
    constructor(env) {
        this.storage = createStorageManager(env);
        this.logger = this.storage.logger;
        this.r2 = env.BACKUP_BUCKET; // R2 bucket for backups
    }

    async createBackup(guildId) {
        try {
            this.logger.info(`Starting backup for guild ${guildId}`);
            const timestamp = new Date().toISOString();
            const backupData = await this.gatherBackupData(guildId);
            
            // Store backup in R2
            const key = `backups/${guildId}/${timestamp}.json`;
            await this.r2.put(key, JSON.stringify(backupData), {
                customMetadata: {
                    guildId,
                    timestamp,
                    type: 'full'
                }
            });

            // Store backup metadata in D1
            await this.storage.query(
                'INSERT INTO backups (guild_id, timestamp, type, location) VALUES (?, ?, ?, ?)',
                [guildId, timestamp, 'full', key]
            );

            this.logger.info(`Completed backup for guild ${guildId}`);
            return { success: true, key };
        } catch (error) {
            this.logger.error('Backup failed:', error);
            throw error;
        }
    }

    async gatherBackupData(guildId) {
        const [
            guild,
            messages,
            connections,
            economyData,
            chatbotData
        ] = await Promise.all([
            this.storage.getGuild(guildId),
            this.storage.getMessages(guildId),
            this.storage.getConnections(guildId),
            this.gatherEconomyData(guildId),
            this.gatherChatbotData(guildId)
        ]);

        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            guild,
            messages,
            connections,
            economy: economyData,
            chatbot: chatbotData
        };
    }

    async gatherEconomyData(guildId) {
        const [balances, items, transactions] = await Promise.all([
            this.storage.query('SELECT * FROM balances WHERE guild_id = ?', [guildId]),
            this.storage.query('SELECT * FROM items WHERE guild_id = ?', [guildId]),
            this.storage.query('SELECT * FROM transactions WHERE guild_id = ?', [guildId])
        ]);

        return { balances, items, transactions };
    }

    async gatherChatbotData(guildId) {
        return {
            conversations: await this.storage.getMessages(guildId, null, 'chatbot'),
            settings: (await this.storage.getGuild(guildId))?.chatbotSettings
        };
    }

    async restoreBackup(guildId, backupKey) {
        try {
            this.logger.info(`Starting restore for guild ${guildId} from ${backupKey}`);

            // Get backup from R2
            const backup = await this.r2.get(backupKey);
            if (!backup) {
                throw new Error('Backup not found');
            }

            const backupData = JSON.parse(await backup.text());

            // Verify backup data
            if (!this.verifyBackupData(backupData)) {
                throw new Error('Invalid backup data');
            }

            // Restore data
            await this.restoreGuildData(guildId, backupData);

            this.logger.info(`Completed restore for guild ${guildId}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Restore failed:', error);
            throw error;
        }
    }

    verifyBackupData(data) {
        const requiredFields = ['version', 'timestamp', 'guild', 'messages', 'connections', 'economy', 'chatbot'];
        return requiredFields.every(field => field in data);
    }

    async restoreGuildData(guildId, backupData) {
        // Start transaction
        const tx = await this.storage.beginTransaction();
        try {
            // Restore guild data
            await this.storage.updateGuild(guildId, backupData.guild);

            // Restore messages
            for (const msg of backupData.messages) {
                await this.storage.createMessage(msg);
            }

            // Restore connections
            for (const conn of backupData.connections) {
                await this.storage.createConnection(conn);
            }

            // Restore economy data
            await this.restoreEconomyData(guildId, backupData.economy);

            // Restore chatbot data
            for (const msg of backupData.chatbot.conversations) {
                await this.storage.createMessage(msg);
            }

            // Commit transaction
            await tx.commit();
        } catch (error) {
            // Rollback on error
            await tx.rollback();
            throw error;
        }
    }

    async restoreEconomyData(guildId, economyData) {
        // Restore balances
        for (const balance of economyData.balances) {
            await this.storage.query(
                'INSERT INTO balances (guild_id, user_id, amount) VALUES (?, ?, ?)',
                [guildId, balance.user_id, balance.amount]
            );
        }

        // Restore items
        for (const item of economyData.items) {
            await this.storage.query(
                'INSERT INTO items (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, ?)',
                [guildId, item.user_id, item.item_id, item.quantity]
            );
        }

        // Restore transactions
        for (const tx of economyData.transactions) {
            await this.storage.query(
                'INSERT INTO transactions (guild_id, user_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?)',
                [guildId, tx.user_id, tx.type, tx.amount, tx.metadata]
            );
        }
    }

    async listBackups(guildId) {
        const backups = await this.storage.query(
            'SELECT * FROM backups WHERE guild_id = ? ORDER BY timestamp DESC',
            [guildId]
        );

        return backups.map(backup => ({
            ...backup,
            url: this.r2.getSignedUrl(backup.location, { expiresIn: 3600 }) // 1 hour signed URL
        }));
    }

    async scheduleBackup(guildId, schedule) {
        // Schedule using Cloudflare Cron Triggers
        // This will be called by the Cloudflare Worker on the specified schedule
        await this.storage.query(
            'INSERT INTO backup_schedules (guild_id, schedule, last_run) VALUES (?, ?, ?)',
            [guildId, schedule, null]
        );
    }

    async cleanupOldBackups(guildId, retentionDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Get old backups
        const oldBackups = await this.storage.query(
            'SELECT * FROM backups WHERE guild_id = ? AND timestamp < ?',
            [guildId, cutoffDate.toISOString()]
        );

        // Delete from R2 and database
        for (const backup of oldBackups) {
            await this.r2.delete(backup.location);
            await this.storage.query(
                'DELETE FROM backups WHERE id = ?',
                [backup.id]
            );
        }

        this.logger.info(`Cleaned up ${oldBackups.length} old backups for guild ${guildId}`);
    }
}
