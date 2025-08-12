/**
 * Redis caching layer for store operations
 */

const redis = require('redis');

class StoreCache {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.init();
    }

    /**
     * Initialize Redis connection
     */
    async init() {
        try {
            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        // End reconnecting on a specific error and flush all commands with a individual error
                        return new Error('The server refused the connection');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        // End reconnecting after a specific timeout and flush all commands with a individual error
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        // End reconnecting with built in error
                        return undefined;
                    }
                    // Reconnect after
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.warn('⚠️  Redis connection error:', err.message);
                this.isConnected = false;
            });

            this.client.on('end', () => {
                console.log('ℹ️  Redis disconnected');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.warn('⚠️  Redis connection failed, using database-only mode:', error.message);
            this.isConnected = false;
        }
    }

    /**
     * Get store data from cache
     */
    async getStore(storeId) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const cached = await this.client.get(`store:${storeId}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set store data in cache
     */
    async setStore(storeId, data, ttl = 3600) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.setex(`store:${storeId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Invalidate store cache
     */
    async invalidateStore(storeId) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.del(`store:${storeId}`);
            return true;
        } catch (error) {
            console.error('Cache invalidate error:', error);
            return false;
        }
    }

    /**
     * Get store analytics from cache
     */
    async getStoreAnalytics(storeId) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const cached = await this.client.get(`analytics:${storeId}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache analytics get error:', error);
            return null;
        }
    }

    /**
     * Set store analytics in cache
     */
    async setStoreAnalytics(storeId, data, ttl = 1800) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.setex(`analytics:${storeId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache analytics set error:', error);
            return false;
        }
    }

    /**
     * Get store settings from cache
     */
    async getStoreSettings(storeId) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const cached = await this.client.get(`settings:${storeId}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache settings get error:', error);
            return null;
        }
    }

    /**
     * Set store settings in cache
     */
    async setStoreSettings(storeId, data, ttl = 7200) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.setex(`settings:${storeId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache settings set error:', error);
            return false;
        }
    }

    /**
     * Get store theme from cache
     */
    async getStoreTheme(storeId) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const cached = await this.client.get(`theme:${storeId}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache theme get error:', error);
            return null;
        }
    }

    /**
     * Set store theme in cache
     */
    async setStoreTheme(storeId, data, ttl = 7200) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.setex(`theme:${storeId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache theme set error:', error);
            return false;
        }
    }

    /**
     * Get user stores from cache
     */
    async getUserStores(userId) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const cached = await this.client.get(`user_stores:${userId}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache user stores get error:', error);
            return null;
        }
    }

    /**
     * Set user stores in cache
     */
    async setUserStores(userId, data, ttl = 1800) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.setex(`user_stores:${userId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache user stores set error:', error);
            return false;
        }
    }

    /**
     * Invalidate user stores cache
     */
    async invalidateUserStores(userId) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.del(`user_stores:${userId}`);
            return true;
        } catch (error) {
            console.error('Cache user stores invalidate error:', error);
            return false;
        }
    }

    /**
     * Get store discovery results from cache
     */
    async getStoreDiscovery(query) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const key = `discovery:${JSON.stringify(query)}`;
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache discovery get error:', error);
            return null;
        }
    }

    /**
     * Set store discovery results in cache
     */
    async setStoreDiscovery(query, data, ttl = 900) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const key = `discovery:${JSON.stringify(query)}`;
            await this.client.setex(key, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache discovery set error:', error);
            return false;
        }
    }

    /**
     * Invalidate all store-related cache
     */
    async invalidateAllStoreCache(storeId) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const keys = [
                `store:${storeId}`,
                `analytics:${storeId}`,
                `settings:${storeId}`,
                `theme:${storeId}`
            ];

            await Promise.all(keys.map(key => this.client.del(key)));
            return true;
        } catch (error) {
            console.error('Cache invalidate all error:', error);
            return false;
        }
    }

    /**
     * Clear all cache (for testing or maintenance)
     */
    async clearAllCache() {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.flushdb();
            return true;
        } catch (error) {
            console.error('Cache clear all error:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!this.isConnected) {
            return null;
        }

        try {
            const info = await this.client.info();
            const keys = await this.client.dbSize();
            return {
                connected: this.isConnected,
                keys,
                info
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return null;
        }
    }

    /**
     * Close Redis connection
     */
    async close() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

// Create singleton instance
const storeCache = new StoreCache();

module.exports = storeCache; 