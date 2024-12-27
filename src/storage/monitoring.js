import { createStorageManager } from './index.js';

export class StorageMonitoring {
    constructor(env) {
        this.storage = createStorageManager(env);
        this.logger = this.storage.logger;
    }

    // Monitoring metrics
    async trackMetric(name, value, tags = {}) {
        try {
            // Store metric in Cloudflare Analytics Engine
            await this.storage.query(
                'INSERT INTO globalcord_metrics (name, value, tags, timestamp) VALUES (?, ?, ?, ?)',
                [name, value, JSON.stringify(tags), new Date().toISOString()]
            );
        } catch (error) {
            this.logger.error('Error tracking metric:', error);
        }
    }

    // Performance monitoring
    async trackPerformance(operation, duration, metadata = {}) {
        await this.trackMetric('operation_duration', duration, {
            operation,
            ...metadata
        });
    }

    // Error tracking
    async trackError(error, metadata = {}) {
        await this.trackMetric('error', 1, {
            type: error.name,
            message: error.message,
            stack: error.stack,
            ...metadata
        });
    }

    // Resource usage monitoring
    async trackResourceUsage(resource, usage, metadata = {}) {
        await this.trackMetric(`resource_usage_${resource}`, usage, metadata);
    }

    // Rate limiting monitoring
    async trackRateLimit(userId, action, metadata = {}) {
        await this.trackMetric('rate_limit', 1, {
            userId,
            action,
            ...metadata
        });
    }

    // System health checks
    async checkSystemHealth() {
        const checks = await Promise.allSettled([
            this.checkDatabaseConnection(),
            this.checkKVConnection(),
            this.checkR2Connection(),
            this.checkAPILatency()
        ]);

        const health = {
            status: 'healthy',
            checks: {},
            timestamp: new Date().toISOString()
        };

        checks.forEach((check, index) => {
            const checkName = ['database', 'kv', 'r2', 'api'][index];
            if (check.status === 'fulfilled') {
                health.checks[checkName] = check.value;
            } else {
                health.checks[checkName] = {
                    status: 'error',
                    error: check.reason.message
                };
                health.status = 'degraded';
            }
        });

        // Store health check results
        await this.storage.query(
            'INSERT INTO globalcord_health_checks (status, checks, timestamp) VALUES (?, ?, ?)',
            [health.status, JSON.stringify(health.checks), health.timestamp]
        );

        return health;
    }

    async checkDatabaseConnection() {
        const start = Date.now();
        try {
            await this.storage.query('SELECT 1');
            return {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }

    async checkKVConnection() {
        const start = Date.now();
        try {
            await this.storage.kv.get('health_check');
            return {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }

    async checkR2Connection() {
        const start = Date.now();
        try {
            await this.storage.r2.head('health_check');
            return {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }

    async checkAPILatency() {
        const start = Date.now();
        try {
            await fetch('https://discord.com/api/v10/gateway');
            return {
                status: 'healthy',
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }

    // Alert system
    async createAlert(type, message, severity = 'info', metadata = {}) {
        await this.storage.query(
            'INSERT INTO globalcord_alerts (type, message, severity, metadata, timestamp) VALUES (?, ?, ?, ?, ?)',
            [type, message, severity, JSON.stringify(metadata), new Date().toISOString()]
        );

        // If critical alert, notify immediately
        if (severity === 'critical') {
            await this.notifyAlert({
                type,
                message,
                severity,
                metadata,
                timestamp: new Date().toISOString()
            });
        }
    }

    async notifyAlert(alert) {
        // Send to Discord webhook
        const webhookUrl = this.storage.env.ALERT_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: `🚨 ${alert.type}`,
                            description: alert.message,
                            color: this.getAlertColor(alert.severity),
                            fields: Object.entries(alert.metadata).map(([key, value]) => ({
                                name: key,
                                value: value.toString(),
                                inline: true
                            })),
                            timestamp: alert.timestamp
                        }]
                    })
                });
            } catch (error) {
                this.logger.error('Error sending alert to webhook:', error);
            }
        }
    }

    getAlertColor(severity) {
        const colors = {
            info: 0x3498db,
            warning: 0xf1c40f,
            error: 0xe74c3c,
            critical: 0xc0392b
        };
        return colors[severity] || colors.info;
    }

    // Analytics
    async getMetrics(filter = {}, period = '24h') {
        const query = `
            SELECT name, 
                   AVG(value) as avg_value,
                   MAX(value) as max_value,
                   MIN(value) as min_value,
                   COUNT(*) as count
            FROM globalcord_metrics
            WHERE timestamp >= datetime('now', '-${period}')
            ${filter.name ? "AND name = ?" : ""}
            ${filter.tags ? "AND json_extract(tags, ?) = ?" : ""}
            GROUP BY name
        `;

        const params = [];
        if (filter.name) params.push(filter.name);
        if (filter.tags) {
            params.push(`$.${filter.tags.key}`);
            params.push(filter.tags.value);
        }

        return await this.storage.query(query, params);
    }

    async getAlerts(severity = null, period = '24h') {
        const query = `
            SELECT *
            FROM globalcord_alerts
            WHERE timestamp >= datetime('now', '-${period}')
            ${severity ? "AND severity = ?" : ""}
            ORDER BY timestamp DESC
        `;

        const params = severity ? [severity] : [];
        return await this.storage.query(query, params);
    }

    async getHealthHistory(period = '24h') {
        const query = `
            SELECT *
            FROM globalcord_health_checks
            WHERE timestamp >= datetime('now', '-${period}')
            ORDER BY timestamp DESC
        `;

        return await this.storage.query(query);
    }
}
