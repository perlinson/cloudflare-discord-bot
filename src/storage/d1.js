// D1 Storage Layer
export class D1Storage {
    constructor(D1_DATABASE) {
        this.db = D1_DATABASE;
    }

    // Schema Management
    async initializeTables() {
        try {
            // Users Table
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS globalcord_users (
                    id TEXT PRIMARY KEY,
                    guild_id TEXT NOT NULL,
                    joined_at INTEGER NOT NULL,
                    verified_at INTEGER,
                    roles TEXT,
                    settings TEXT,
                    created_at INTEGER DEFAULT (unixepoch()),
                    updated_at INTEGER DEFAULT (unixepoch())
                )
            `).run();

            // Guilds Table
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS globalcord_guilds (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    settings TEXT,
                    channels TEXT,
                    roles TEXT,
                    premium_until INTEGER,
                    created_at INTEGER DEFAULT (unixepoch()),
                    updated_at INTEGER DEFAULT (unixepoch())
                )
            `).run();

            // Analytics Table
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS globalcord_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT,
                    created_at INTEGER DEFAULT (unixepoch())
                )
            `).run();

            // Messages Table
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS globalcord_messages (
                    id TEXT PRIMARY KEY,
                    guild_id TEXT NOT NULL,
                    channel_id TEXT NOT NULL,
                    author_id TEXT NOT NULL,
                    content TEXT,
                    type TEXT,
                    created_at INTEGER DEFAULT (unixepoch()),
                    updated_at INTEGER DEFAULT (unixepoch())
                )
            `).run();

            // Verification Table
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS globalcord_verifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    method TEXT NOT NULL,
                    attempts INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (unixepoch()),
                    completed_at INTEGER
                )
            `).run();

            return true;
        } catch (error) {
            console.error('Error initializing tables:', error);
            return false;
        }
    }

    // User Operations
    async getUser(userId, guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM globalcord_users WHERE id = ? AND guild_id = ?');
            const user = await stmt.get(userId, guildId);
            return user ? {
                ...user,
                roles: JSON.parse(user.roles || '[]'),
                settings: JSON.parse(user.settings || '{}')
            } : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async createUser(userData) {
        try {
            const { id, guild_id, roles = [], settings = {} } = userData;
            const stmt = this.db.prepare(`
                INSERT INTO globalcord_users (id, guild_id, joined_at, roles, settings)
                VALUES (?, ?, ?, ?, ?)
            `);
            await stmt.run(
                id,
                guild_id,
                Date.now(),
                JSON.stringify(roles),
                JSON.stringify(settings)
            );
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    }

    // Guild Operations
    async getGuild(guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM globalcord_guilds WHERE id = ?');
            const guild = await stmt.get(guildId);
            return guild ? {
                ...guild,
                settings: JSON.parse(guild.settings || '{}'),
                channels: JSON.parse(guild.channels || '[]'),
                roles: JSON.parse(guild.roles || '[]')
            } : null;
        } catch (error) {
            console.error('Error getting guild:', error);
            return null;
        }
    }

    async updateGuild(guildId, data) {
        try {
            const updates = [];
            const values = [];
            for (const [key, value] of Object.entries(data)) {
                updates.push(`${key} = ?`);
                values.push(typeof value === 'object' ? JSON.stringify(value) : value);
            }
            values.push(guildId);

            const stmt = this.db.prepare(`
                UPDATE globalcord_guilds 
                SET ${updates.join(', ')}, updated_at = unixepoch()
                WHERE id = ?
            `);
            await stmt.run(...values);
            return true;
        } catch (error) {
            console.error('Error updating guild:', error);
            return false;
        }
    }

    // Analytics Operations
    async trackEvent(guildId, eventType, eventData = {}) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO globalcord_analytics (guild_id, event_type, event_data)
                VALUES (?, ?, ?)
            `);
            await stmt.run(guildId, eventType, JSON.stringify(eventData));
            return true;
        } catch (error) {
            console.error('Error tracking event:', error);
            return false;
        }
    }

    async getAnalytics(guildId, eventType, period = 'day') {
        try {
            const periods = {
                day: 86400,
                week: 604800,
                month: 2592000
            };

            const stmt = this.db.prepare(`
                SELECT event_type, event_data, created_at
                FROM globalcord_analytics
                WHERE guild_id = ?
                AND event_type = ?
                AND created_at >= unixepoch() - ?
                ORDER BY created_at DESC
            `);

            const events = await stmt.all(guildId, eventType, periods[period]);
            return events.map(event => ({
                ...event,
                event_data: JSON.parse(event.event_data)
            }));
        } catch (error) {
            console.error('Error getting analytics:', error);
            return [];
        }
    }

    // Message Operations
    async getMessage(messageId, guildId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM globalcord_messages 
                WHERE id = ? AND guild_id = ?
            `);
            return await stmt.get(messageId, guildId);
        } catch (error) {
            console.error('Error getting message:', error);
            return null;
        }
    }

    async createMessage(messageData) {
        try {
            const { id, guild_id, channel_id, author_id, content, type } = messageData;
            const stmt = this.db.prepare(`
                INSERT INTO globalcord_messages (id, guild_id, channel_id, author_id, content, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            await stmt.run(id, guild_id, channel_id, author_id, content, type);
            return true;
        } catch (error) {
            console.error('Error creating message:', error);
            return false;
        }
    }

    // Verification Operations
    async createVerification(userId, guildId, method) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO globalcord_verifications (user_id, guild_id, status, method)
                VALUES (?, ?, 'pending', ?)
            `);
            await stmt.run(userId, guildId, method);
            return true;
        } catch (error) {
            console.error('Error creating verification:', error);
            return false;
        }
    }

    async updateVerification(userId, guildId, status) {
        try {
            const stmt = this.db.prepare(`
                UPDATE globalcord_verifications
                SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN unixepoch() ELSE NULL END
                WHERE user_id = ? AND guild_id = ? AND status = 'pending'
            `);
            await stmt.run(status, status, userId, guildId);
            return true;
        } catch (error) {
            console.error('Error updating verification:', error);
            return false;
        }
    }

    // Cleanup Operations
    async cleanup() {
        try {
            // Clean up old analytics data
            await this.db.prepare(`
                DELETE FROM globalcord_analytics
                WHERE created_at < unixepoch() - 2592000 -- 30 days
            `).run();

            // Clean up old verification attempts
            await this.db.prepare(`
                DELETE FROM globalcord_verifications
                WHERE status = 'pending'
                AND created_at < unixepoch() - 86400 -- 24 hours
            `).run();

            return true;
        } catch (error) {
            console.error('Error in cleanup:', error);
            return false;
        }
    }
}
