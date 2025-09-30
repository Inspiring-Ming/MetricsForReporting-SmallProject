/**
 * Cache key generation and management
 */
export interface CacheKey {
  key: string;
  ttl: number; // Time to live in seconds
}

/**
 * Outbound port for caching operations
 * Defines the contract for caching data to improve performance
 */
export interface CachePort {
  /**
   * Get cached value by key
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set cache value with TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<boolean>;

  /**
   * Delete cache entry
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if cache key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set multiple cache entries
   */
  mset(entries: Array<{ key: string; value: unknown; ttl: number }>): Promise<boolean>;

  /**
   * Get multiple cache entries
   */
  mget<T>(keys: string[]): Promise<Array<T | null>>;

  /**
   * Clear cache entries matching pattern
   */
  clearByPattern(pattern: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    hitRate: number;
    missRate: number;
    keyCount: number;
  }>;
}