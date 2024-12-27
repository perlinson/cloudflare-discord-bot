import { createStorageManager } from './index.js';

export class StorageMigration {
    constructor(env) {
        this.storage = createStorageManager(env);
        this.logger = this.storage.logger;
    }

    async migrateGuildData(oldGuildId, newGuildId) {
        try {
            this.logger.info(`Starting guild data migration from ${oldGuildId} to ${newGuildId}`);
            
            // Get all data for old guild
            const oldGuild = await this.storage.getGuild(oldGuildId);
            if (!oldGuild) {
                throw new Error('Source guild not found');
            }

            // Create new guild with old data
            await this.storage.updateGuild(newGuildId, oldGuild);
            
            // Migrate related data
            await Promise.all([
                this.migrateMessages(oldGuildId, newGuildId),
                this.migrateConnections(oldGuildId, newGuildId),
                this.migrateEconomyData(oldGuildId, newGuildId),
                this.migrateChatbotData(oldGuildId, newGuildId)
            ]);

            this.logger.info(`Completed guild data migration from ${oldGuildId} to ${newGuildId}`);
            return true;
        } catch (error) {
            this.logger.error('Guild migration failed:', error);
            throw error;
        }
    }

    async migrateMessages(oldGuildId, newGuildId) {
        const messages = await this.storage.getMessages(oldGuildId);
        for (const msg of messages) {
            msg.guild_id = newGuildId;
            await this.storage.createMessage(msg);
        }
    }

    async migrateConnections(oldGuildId, newGuildId) {
        const connections = await this.storage.getConnections(oldGuildId);
        for (const conn of connections) {
            conn.guild_id = newGuildId;
            await this.storage.createConnection(conn);
        }
    }

    async migrateEconomyData(oldGuildId, newGuildId) {
        // Migrate balances
        const balances = await this.storage.query(
            'SELECT * FROM globalcord_balances WHERE guild_id = ?',
            [oldGuildId]
        );
        for (const balance of balances) {
            balance.guild_id = newGuildId;
            await this.storage.query(
                'INSERT INTO globalcord_balances (guild_id, user_id, amount) VALUES (?, ?, ?)',
                [balance.guild_id, balance.user_id, balance.amount]
            );
        }

        // Migrate items
        const items = await this.storage.query(
            'SELECT * FROM globalcord_items WHERE guild_id = ?',
            [oldGuildId]
        );
        for (const item of items) {
            item.guild_id = newGuildId;
            await this.storage.query(
                'INSERT INTO globalcord_items (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, ?)',
                [item.guild_id, item.user_id, item.item_id, item.quantity]
            );
        }
    }

    async migrateChatbotData(oldGuildId, newGuildId) {
        const conversations = await this.storage.getMessages(oldGuildId, null, 'chatbot');
        for (const msg of conversations) {
            msg.guild_id = newGuildId;
            await this.storage.createMessage(msg);
        }
    }

    // Utility function to verify migration
    async verifyMigration(oldGuildId, newGuildId) {
        const oldGuild = await this.storage.getGuild(oldGuildId);
        const newGuild = await this.storage.getGuild(newGuildId);

        const verification = {
            guild: this.compareObjects(oldGuild, newGuild, ['id', 'guild_id']),
            messages: await this.verifyCollection('messages', oldGuildId, newGuildId),
            connections: await this.verifyCollection('connections', oldGuildId, newGuildId),
            economy: await this.verifyEconomyData(oldGuildId, newGuildId),
            chatbot: await this.verifyCollection('messages', oldGuildId, newGuildId, 'chatbot')
        };

        return verification;
    }

    compareObjects(obj1, obj2, excludeKeys = []) {
        const filtered1 = Object.fromEntries(
            Object.entries(obj1).filter(([key]) => !excludeKeys.includes(key))
        );
        const filtered2 = Object.fromEntries(
            Object.entries(obj2).filter(([key]) => !excludeKeys.includes(key))
        );
        return JSON.stringify(filtered1) === JSON.stringify(filtered2);
    }

    async verifyCollection(collection, oldGuildId, newGuildId, type = null) {
        const oldItems = type 
            ? await this.storage.getMessages(oldGuildId, null, type)
            : await this.storage[`get${collection.charAt(0).toUpperCase() + collection.slice(1)}`](oldGuildId);
        const newItems = type
            ? await this.storage.getMessages(newGuildId, null, type)
            : await this.storage[`get${collection.charAt(0).toUpperCase() + collection.slice(1)}`](newGuildId);

        return {
            countMatch: oldItems.length === newItems.length,
            oldCount: oldItems.length,
            newCount: newItems.length
        };
    }

    async verifyEconomyData(oldGuildId, newGuildId) {
        const oldBalances = await this.storage.query(
            'SELECT COUNT(*) as count FROM globalcord_balances WHERE guild_id = ?',
            [oldGuildId]
        );
        const newBalances = await this.storage.query(
            'SELECT COUNT(*) as count FROM globalcord_balances WHERE guild_id = ?',
            [newGuildId]
        );

        const oldItems = await this.storage.query(
            'SELECT COUNT(*) as count FROM globalcord_items WHERE guild_id = ?',
            [oldGuildId]
        );
        const newItems = await this.storage.query(
            'SELECT COUNT(*) as count FROM globalcord_items WHERE guild_id = ?',
            [newGuildId]
        );

        return {
            balances: {
                countMatch: oldBalances[0].count === newBalances[0].count,
                oldCount: oldBalances[0].count,
                newCount: newBalances[0].count
            },
            items: {
                countMatch: oldItems[0].count === newItems[0].count,
                oldCount: oldItems[0].count,
                newCount: newItems[0].count
            }
        };
    }
}
