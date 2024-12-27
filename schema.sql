-- Users table
CREATE TABLE IF NOT EXISTS globalcord_users (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guilds table
CREATE TABLE IF NOT EXISTS globalcord_guilds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    settings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS globalcord_messages (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id),
    FOREIGN KEY (author_id) REFERENCES globalcord_users(id)
);

-- Connections table
CREATE TABLE IF NOT EXISTS globalcord_connections (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id),
    FOREIGN KEY (user_id) REFERENCES globalcord_users(id)
);

-- Economy tables
CREATE TABLE IF NOT EXISTS globalcord_balances (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id),
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id),
    FOREIGN KEY (user_id) REFERENCES globalcord_users(id)
);

CREATE TABLE IF NOT EXISTS globalcord_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id),
    FOREIGN KEY (user_id) REFERENCES globalcord_users(id)
);

CREATE TABLE IF NOT EXISTS globalcord_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id),
    FOREIGN KEY (user_id) REFERENCES globalcord_users(id)
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS globalcord_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id)
);

CREATE TABLE IF NOT EXISTS globalcord_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    tags TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup metadata
CREATE TABLE IF NOT EXISTS globalcord_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata TEXT,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id)
);

CREATE TABLE IF NOT EXISTS globalcord_backup_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    schedule TEXT NOT NULL,
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES globalcord_guilds(id)
);

-- Health monitoring
CREATE TABLE IF NOT EXISTS globalcord_health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL,
    checks TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS globalcord_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    metadata TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_globalcord_messages_guild_type ON globalcord_messages(guild_id, type);
CREATE INDEX IF NOT EXISTS idx_globalcord_connections_guild_user ON globalcord_connections(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_globalcord_events_guild_type ON globalcord_events(guild_id, type);
CREATE INDEX IF NOT EXISTS idx_globalcord_metrics_name_timestamp ON globalcord_metrics(name, timestamp);
CREATE INDEX IF NOT EXISTS idx_globalcord_backups_guild_timestamp ON globalcord_backups(guild_id, timestamp);
