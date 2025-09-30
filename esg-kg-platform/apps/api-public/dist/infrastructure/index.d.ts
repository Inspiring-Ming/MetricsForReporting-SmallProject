export * from './graph/graphdb.client';
export * from './cache/redis.client';
export * from './validation/shacl.runner';
export * from './time/time.provider';
export * from './logging/logger';
export * from './id/iri';
import { AppConfig } from '../config/config';
import { GraphDbClient } from './graph/graphdb.client';
import { RedisClient } from './cache/redis.client';
import { ShaclRunner } from './validation/shacl.runner';
import { SystemTimeProvider, MockTimeProvider } from './time/time.provider';
import { Logger, createCommonLoggers } from './logging/logger';
export interface InfrastructureServices {
    graphdb: GraphDbClient;
    redis: RedisClient;
    shacl: ShaclRunner;
    time: SystemTimeProvider;
    logger: Logger;
    loggers: ReturnType<typeof createCommonLoggers>;
}
export declare function createGraphDbClient(config: AppConfig): GraphDbClient;
export declare function createRedisClient(config: AppConfig): RedisClient;
export declare function createShaclRunner(config: AppConfig): ShaclRunner;
export declare function createAppLogger(config: AppConfig): Logger;
export declare function createTimeProvider(): SystemTimeProvider;
export declare function createMockTimeProvider(fixedTime?: Date): MockTimeProvider;
export declare function initializeIriStrategy(): void;
export declare function setupInfrastructure(config: AppConfig): InfrastructureServices;
//# sourceMappingURL=index.d.ts.map