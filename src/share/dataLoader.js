import { SHARE_CONFIG } from './config.js';

class ShareDataLoader {
    constructor() {
        this.servers = new Map();
        this.userServers = new Map();
        this.serverUpdates = new Map();
        this.analytics = new Map();
    }

    // Server Management
    getServer(serverId) {
        return this.servers.get(serverId);
    }

    addServer(serverId, data) {
        this.servers.set(serverId, {
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            views: 0,
            clicks: 0,
            bumps: 0,
        });

        // Update user's server list
        const userServers = this.userServers.get(data.ownerId) || [];
        if (!userServers.includes(serverId)) {
            userServers.push(serverId);
            this.userServers.set(data.ownerId, userServers);
        }
    }

    updateServer(serverId, data) {
        const server = this.getServer(serverId);
        if (server) {
            this.servers.set(serverId, {
                ...server,
                ...data,
                updatedAt: Date.now(),
            });
            return true;
        }
        return false;
    }

    removeServer(serverId) {
        const server = this.getServer(serverId);
        if (server) {
            // Remove from servers map
            this.servers.delete(serverId);

            // Remove from user's server list
            const userServers = this.userServers.get(server.ownerId) || [];
            const index = userServers.indexOf(serverId);
            if (index !== -1) {
                userServers.splice(index, 1);
                this.userServers.set(server.ownerId, userServers);
            }

            // Remove analytics
            this.analytics.delete(serverId);

            return true;
        }
        return false;
    }

    // User Server Management
    getUserServers(userId) {
        return (this.userServers.get(userId) || [])
            .map(serverId => this.getServer(serverId))
            .filter(Boolean);
    }

    canAddServer(userId) {
        const userServers = this.userServers.get(userId) || [];
        const maxServers = this.isPremiumUser(userId) ?
            SHARE_CONFIG.premium.maxServers :
            SHARE_CONFIG.server.maxServers;
        return userServers.length < maxServers;
    }

    // Update Cooldown Management
    checkUpdateCooldown(serverId) {
        const lastUpdate = this.serverUpdates.get(serverId);
        if (!lastUpdate) return true;
        return Date.now() - lastUpdate >= SHARE_CONFIG.server.updateCooldown;
    }

    updateCooldown(serverId) {
        this.serverUpdates.set(serverId, Date.now());
    }

    // Search and Filtering
    searchServers(query, options = {}) {
        const servers = Array.from(this.servers.values());
        let results = servers;

        // Text search
        if (query) {
            const searchText = query.toLowerCase();
            results = results.filter(server =>
                server.name.toLowerCase().includes(searchText) ||
                server.description.toLowerCase().includes(searchText) ||
                server.tags.some(tag => tag.toLowerCase().includes(searchText))
            );
        }

        // Category filter
        if (options.category) {
            results = results.filter(server => server.category === options.category);
        }

        // Tags filter
        if (options.tags) {
            const searchTags = options.tags.map(tag => tag.toLowerCase());
            results = results.filter(server =>
                server.tags.some(tag => searchTags.includes(tag.toLowerCase()))
            );
        }

        // Features filter
        if (options.features) {
            results = results.filter(server =>
                options.features.every(feature => server.features.includes(feature))
            );
        }

        // Badges filter
        if (options.badges) {
            results = results.filter(server =>
                options.badges.every(badge => server.badges.includes(badge))
            );
        }

        // Sorting
        if (options.sort) {
            switch (options.sort) {
                case 'members':
                    results.sort((a, b) => b.memberCount - a.memberCount);
                    break;
                case 'created':
                    results.sort((a, b) => b.createdAt - a.createdAt);
                    break;
                case 'updated':
                    results.sort((a, b) => b.updatedAt - a.updatedAt);
                    break;
                case 'name':
                    results.sort((a, b) => a.name.localeCompare(b.name));
                    break;
            }
        }

        // Pagination
        if (options.page && options.perPage) {
            const start = (options.page - 1) * options.perPage;
            results = results.slice(start, start + options.perPage);
        }

        return results;
    }

    // Analytics
    trackView(serverId) {
        const server = this.getServer(serverId);
        if (server) {
            server.views++;
            this.updateAnalytics(serverId, 'view');
        }
    }

    trackClick(serverId) {
        const server = this.getServer(serverId);
        if (server) {
            server.clicks++;
            this.updateAnalytics(serverId, 'click');
        }
    }

    trackBump(serverId) {
        const server = this.getServer(serverId);
        if (server) {
            server.bumps++;
            this.updateAnalytics(serverId, 'bump');
        }
    }

    getAnalytics(serverId, period = 'day') {
        const analytics = this.analytics.get(serverId);
        if (!analytics) return null;

        const now = Date.now();
        const periods = {
            day: 86400000, // 24 hours
            week: 604800000, // 7 days
            month: 2592000000, // 30 days
        };

        const cutoff = now - periods[period];
        return Object.fromEntries(
            Object.entries(analytics)
                .map(([key, events]) => [
                    key,
                    events.filter(timestamp => timestamp >= cutoff).length
                ])
        );
    }

    updateAnalytics(serverId, eventType) {
        if (!this.analytics.has(serverId)) {
            this.analytics.set(serverId, {
                views: [],
                clicks: [],
                bumps: [],
            });
        }

        const serverAnalytics = this.analytics.get(serverId);
        serverAnalytics[eventType].push(Date.now());

        // Cleanup old analytics
        const monthAgo = Date.now() - 2592000000;
        Object.keys(serverAnalytics).forEach(key => {
            serverAnalytics[key] = serverAnalytics[key].filter(timestamp => timestamp >= monthAgo);
        });
    }

    // Premium Status
    isPremiumUser(userId) {
        // This should be implemented based on your premium system
        return false;
    }

    // Validation
    validateServerData(data) {
        const errors = [];

        if (!data.description || data.description.length > SHARE_CONFIG.server.maxDescription) {
            errors.push('Invalid description length');
        }

        if (!SHARE_CONFIG.categories[data.category]) {
            errors.push('Invalid category');
        }

        if (data.tags) {
            if (data.tags.length > SHARE_CONFIG.server.maxTags) {
                errors.push('Too many tags');
            }
        }

        if (data.invites) {
            if (data.invites.length > SHARE_CONFIG.server.maxInvites) {
                errors.push('Too many invite links');
            }
        }

        return errors;
    }
}

// Create and export a singleton instance
export const shareData = new ShareDataLoader();
