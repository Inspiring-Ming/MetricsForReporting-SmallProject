export interface CacheKey {
    key: string;
    ttl: number;
}
export interface CachePort {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    mset(entries: Array<{
        key: string;
        value: unknown;
        ttl: number;
    }>): Promise<boolean>;
    mget<T>(keys: string[]): Promise<Array<T | null>>;
    clearByPattern(pattern: string): Promise<number>;
    getStats(): Promise<{
        hitRate: number;
        missRate: number;
        keyCount: number;
    }>;
}
//# sourceMappingURL=cache.port.d.ts.map