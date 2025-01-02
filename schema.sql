drop table globalcord_users;
drop table globalcord_guilds;
drop table globalcord_analytics;
drop table globalcord_messages;
drop table globalcord_verifications;
drop table globalcord_transactions;
drop table globalcord_rate_limits;
drop table generated_images;

-- Users table
CREATE TABLE IF NOT EXISTS globalcord_users (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    verified_at INTEGER,
    roles TEXT,
    settings TEXT,
    balance INTEGER DEFAULT 0,
    items TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Guilds table
CREATE TABLE IF NOT EXISTS globalcord_guilds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    settings TEXT,
    channels TEXT,
    roles TEXT,
    shop_items TEXT,
    premium_until INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Analytics table
CREATE TABLE IF NOT EXISTS globalcord_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Messages table
CREATE TABLE IF NOT EXISTS globalcord_messages (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT,
    type TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Verification table
CREATE TABLE IF NOT EXISTS globalcord_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    status TEXT NOT NULL,
    method TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
);

-- Economy Transactions table
CREATE TABLE IF NOT EXISTS globalcord_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    metadata TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Rate Limits table
CREATE TABLE IF NOT EXISTS globalcord_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_reset INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Image generation tables
CREATE TABLE IF NOT EXISTS generated_images (
    run_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    interaction_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    original_url TEXT NOT NULL,
    r2_url TEXT NOT NULL,
    prompt TEXT,
    parameters TEXT
);

-- Users Table (Economy)
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    last_daily TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, guild_id)
);

-- Transactions Table (Economy)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    metadata TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Shop Items Table (Economy)
CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- User Items Table (Economy)
CREATE TABLE IF NOT EXISTS user_items (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, guild_id, item_id),
    FOREIGN KEY (item_id) REFERENCES shop_items(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_globalcord_messages_guild_type ON globalcord_messages(guild_id, type);
CREATE INDEX IF NOT EXISTS idx_globalcord_analytics_guild_type ON globalcord_analytics(guild_id, event_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_guild_id ON generated_images(guild_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at);
CREATE INDEX IF NOT EXISTS idx_users_user_id_guild_id ON users(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_guild_id ON transactions(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_guild_id ON shop_items(guild_id);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id_guild_id_item_id ON user_items(user_id, guild_id, item_id);
