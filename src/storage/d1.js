// D1 Storage Layer
export class D1Storage {
    constructor(D1_DATABASE) {
        this.db = D1_DATABASE;
        this.logger = console;
    }

    // Helper Methods
    async query(sql, params = []) {
        try {
            this.logger.debug(`[D1Storage] Executing query: ${sql} with params:`, params);
            const stmt = this.db.prepare(sql);
            return await stmt.bind(...params).run();
        } catch (error) {
            this.logger.error('[D1Storage] Query error:', error);
            throw error;
        }
    }

    async get(sql, params = []) {
        try {
            this.logger.debug(`[D1Storage] Executing get query: ${sql} with params:`, params);
            return await this.db.prepare(sql).bind(...params).first();
        } catch (error) {
            this.logger.error('[D1Storage] Get query error:', error);
            throw error;
        }
    }

    async all(sql, params = []) {
        try {
            this.logger.debug(`[D1Storage] Executing all query: ${sql} with params:`, params);
            return await this.db.prepare(sql).bind(...params).all();
        } catch (error) {
            this.logger.error('[D1Storage] All query error:', error);
            throw error;
        }
    }

    async run(sql, params = []) {
        try {
            this.logger.debug(`[D1Storage] Executing run query: ${sql} with params:`, params);
            return await this.db.prepare(sql).bind(...params).run();
        } catch (error) {
            this.logger.error('[D1Storage] Run query error:', error);
            throw error;
        }
    }

    // Economy Operations
    async getBalance(userId, guildId) {
        try {
            const result = await this.get(
                'SELECT balance FROM users WHERE user_id = ? AND guild_id = ?',
                [userId, guildId]
            );
            return result ? result.balance : 0;
        } catch (error) {
            this.logger.error('[D1Storage] Error getting balance:', error);
            throw error;
        }
    }

    async updateBalance(userId, guildId, amount) {
        try {
            await this.run(
                `UPDATE users 
                SET balance = balance + ?, 
                    updated_at = unixepoch() 
                WHERE user_id = ? AND guild_id = ?`,
                [amount, userId, guildId]
            );
            return true;
        } catch (error) {
            this.logger.error('[D1Storage] Error updating balance:', error);
            throw error;
        }
    }

    async getItems(userId, guildId) {
        try {
            return await this.all(
                `SELECT ui.*, si.name, si.description, si.price 
                FROM user_items ui 
                JOIN shop_items si ON ui.item_id = si.id 
                WHERE ui.user_id = ? AND ui.guild_id = ?`,
                [userId, guildId]
            );
        } catch (error) {
            this.logger.error('[D1Storage] Error getting items:', error);
            throw error;
        }
    }

    async updateItems(userId, guildId, items) {
        try {
            const stmt = this.db.prepare(
                `INSERT OR REPLACE INTO user_items 
                (user_id, guild_id, item_id, quantity, updated_at) 
                VALUES (?, ?, ?, ?, unixepoch())`
            );
            
            for (const item of items) {
                await stmt.bind(userId, guildId, item.id, item.quantity).run();
            }
            return true;
        } catch (error) {
            this.logger.error('[D1Storage] Error updating items:', error);
            throw error;
        }
    }

    async createTransaction(userId, guildId, type, amount, metadata = {}) {
        try {
            await this.run(
                `INSERT INTO transactions 
                (user_id, guild_id, type, amount, metadata) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, guildId, type, amount, JSON.stringify(metadata)]
            );
            return true;
        } catch (error) {
            this.logger.error('[D1Storage] Error creating transaction:', error);
            throw error;
        }
    }

    async getTransactions(userId, guildId) {
        try {
            return await this.all(
                'SELECT * FROM transactions WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
                [userId, guildId]
            );
        } catch (error) {
            this.logger.error('[D1Storage] Error getting transactions:', error);
            throw error;
        }
    }
}
