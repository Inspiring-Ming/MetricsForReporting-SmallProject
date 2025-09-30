import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export class RedisConnectionError extends DomainError {
    code = 'REDIS_CONNECTION_ERROR';
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
}
export class RedisCacheError extends DomainError {
    code = 'REDIS_CACHE_ERROR';
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export class RedisClient {
    client = null;
    keyPrefix;
    connected = false;
    constructor(config) {
        this.keyPrefix = config.keyPrefix || 'esg-kg:';
    }
    async connect() {
        try {
            this.connected = true;
        }
        catch (error) {
            throw new RedisConnectionError(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async disconnect() {
        try {
            if (this.client) {
                this.client = null;
            }
            this.connected = false;
        }
        catch (error) {
            throw new RedisCacheError(`Failed to disconnect from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    isConnected() {
        return this.connected;
    }
    async get(key) {
        try {
            this.ensureConnected();
            const fullKey = this.getFullKey(key);
            const cached = await this.simulateGet(fullKey);
            if (!cached) {
                return null;
            }
            const entry = JSON.parse(cached);
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                await this.delete(key);
                return null;
            }
            return entry.value;
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to get cache value for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            this.ensureConnected();
            const fullKey = this.getFullKey(key);
            const entry = {
                value,
                createdAt: Date.now()
            };
            if (ttlSeconds) {
                entry.expiresAt = Date.now() + (ttlSeconds * 1000);
            }
            await this.simulateSet(fullKey, JSON.stringify(entry), ttlSeconds);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to set cache value for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async delete(key) {
        try {
            this.ensureConnected();
            const fullKey = this.getFullKey(key);
            return await this.simulateDelete(fullKey);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to delete cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async exists(key) {
        try {
            this.ensureConnected();
            const value = await this.get(key);
            return value !== null;
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to check existence of cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async clear(pattern) {
        try {
            this.ensureConnected();
            const searchPattern = pattern ? this.getFullKey(pattern) : `${this.keyPrefix}*`;
            return await this.simulateClear(searchPattern);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to clear cache with pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async mget(keys) {
        try {
            this.ensureConnected();
            const promises = keys.map(key => this.get(key));
            return await Promise.all(promises);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to get multiple cache values: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async mset(entries) {
        try {
            this.ensureConnected();
            const promises = entries.map(entry => this.set(entry.key, entry.value, entry.ttlSeconds));
            await Promise.all(promises);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new RedisCacheError(`Failed to set multiple cache values: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    generateQueryKey(sparql, params) {
        const normalized = sparql.replace(/\s+/g, ' ').trim();
        const paramsString = params ? JSON.stringify(params) : '';
        const hash = this.simpleHash(normalized + paramsString);
        return `query:${hash}`;
    }
    generateMetricKey(metricId, params) {
        const paramsString = params ? JSON.stringify(params) : '';
        const hash = this.simpleHash(paramsString);
        return `metric:${metricId}:${hash}`;
    }
    ensureConnected() {
        if (!this.connected) {
            throw new RedisConnectionError('Redis client is not connected');
        }
    }
    getFullKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    simpleHash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    async simulateGet(_key) {
        return null;
    }
    async simulateSet(_key, _value, _ttlSeconds) {
    }
    async simulateDelete(_key) {
        return false;
    }
    async simulateClear(_pattern) {
        return 0;
    }
}
//# sourceMappingURL=redis.client.js.map