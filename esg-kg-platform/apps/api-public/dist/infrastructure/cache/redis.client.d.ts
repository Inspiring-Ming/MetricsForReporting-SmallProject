import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export interface RedisConfig {
    url: string;
    password?: string;
    db?: number;
    connectTimeout?: number;
    commandTimeout?: number;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    keyPrefix?: string;
}
export interface CacheEntry<T = any> {
    value: T;
    expiresAt?: number;
    createdAt: number;
}
export declare class RedisConnectionError extends DomainError {
    readonly code = "REDIS_CONNECTION_ERROR";
    readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;
}
export declare class RedisCacheError extends DomainError {
    readonly code = "REDIS_CACHE_ERROR";
    readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export declare class RedisClient {
    private client;
    private readonly keyPrefix;
    private connected;
    constructor(config: RedisConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    clear(pattern?: string): Promise<number>;
    mget<T>(keys: string[]): Promise<Array<T | null>>;
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttlSeconds?: number;
    }>): Promise<void>;
    generateQueryKey(sparql: string, params?: Record<string, any>): string;
    generateMetricKey(metricId: string, params?: Record<string, any>): string;
    private ensureConnected;
    private getFullKey;
    private simpleHash;
    private simulateGet;
    private simulateSet;
    private simulateDelete;
    private simulateClear;
}
//# sourceMappingURL=redis.client.d.ts.map