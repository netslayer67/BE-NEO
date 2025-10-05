"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }
    set(key, data, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { data, expiresAt });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    // Clean expired items
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}
// Export singleton instance
exports.cacheService = new CacheService();
// Clean up expired cache items every 10 minutes
setInterval(() => {
    exports.cacheService.cleanup();
}, 10 * 60 * 1000);
