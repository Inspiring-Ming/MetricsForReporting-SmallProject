export * from './graph/graphdb.client';
export * from './cache/redis.client';
export * from './validation/shacl.runner';
export * from './time/time.provider';
export * from './logging/logger';
export * from './id/iri';
import { GraphDbClient } from './graph/graphdb.client';
import { RedisClient } from './cache/redis.client';
import { ShaclRunner } from './validation/shacl.runner';
import { SystemTimeProvider, MockTimeProvider } from './time/time.provider';
import { ESGIriStrategy } from './id/iri';
import { createLoggerFromConfig, createCommonLoggers } from './logging/logger';
export function createGraphDbClient(config) {
    return new GraphDbClient(config.graphdb);
}
export function createRedisClient(config) {
    return new RedisClient(config.redis);
}
export function createShaclRunner(config) {
    return new ShaclRunner(config.shacl);
}
export function createAppLogger(config) {
    return createLoggerFromConfig({
        logLevel: config.logLevel,
        logFormat: config.logFormat,
        logTimestamp: 'true',
        logColors: config.nodeEnv !== 'production' ? 'true' : 'false',
        nodeEnv: config.nodeEnv
    });
}
export function createTimeProvider() {
    return new SystemTimeProvider({
        timezone: 'UTC',
        defaultFormat: 'ISO'
    });
}
export function createMockTimeProvider(fixedTime) {
    return new MockTimeProvider(fixedTime);
}
export function initializeIriStrategy() {
    ESGIriStrategy.initialize();
}
export function setupInfrastructure(config) {
    const logger = createAppLogger(config);
    const loggers = createCommonLoggers(logger);
    return {
        graphdb: createGraphDbClient(config),
        redis: createRedisClient(config),
        shacl: createShaclRunner(config),
        time: createTimeProvider(),
        logger,
        loggers
    };
}
//# sourceMappingURL=index.js.map