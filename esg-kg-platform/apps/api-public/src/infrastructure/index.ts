/**
 * Infrastructure Layer - External systems and technical concerns
 * 
 * This module exports all infrastructure components including:
 * - GraphDB client for knowledge graph operations
 * - Redis client for caching
 * - SHACL validator for RDF data validation  
 * - Time providers for system time abstraction
 */

// Graph Database
export * from './graph/graphdb.client';
export * from './graph/knowledge-graph-navigation.adapter';

// Caching
export * from './cache/redis.client';

// Validation
export * from './validation/shacl.runner';

// Time Management
export * from './time/time.provider';

// Logging
export * from './logging/logger';

// IRI Generation
export * from './id/iri';

// Infrastructure factory functions that accept config via dependency injection
import { AppConfig } from '../config/config';
import { GraphDbClient } from './graph/graphdb.client';
import { RedisClient } from './cache/redis.client';
import { ShaclRunner } from './validation/shacl.runner';
import { SystemTimeProvider, MockTimeProvider } from './time/time.provider';
import { ESGIriStrategy } from './id/iri';
import { Logger, createLoggerFromConfig, createCommonLoggers } from './logging/logger';

/**
 * Infrastructure setup function that accepts configuration
 */
export interface InfrastructureServices {
  graphdb: GraphDbClient;
  redis: RedisClient;
  shacl: ShaclRunner;
  time: SystemTimeProvider;
  logger: Logger;
  loggers: ReturnType<typeof createCommonLoggers>;
}

/**
 * Create GraphDB client with provided config
 */
export function createGraphDbClient(config: AppConfig): GraphDbClient {
  return new GraphDbClient(config.graphdb);
}

/**
 * Create Redis client with provided config
 */
export function createRedisClient(config: AppConfig): RedisClient {
  return new RedisClient(config.redis);
}

/**
 * Create SHACL runner with provided config
 */
export function createShaclRunner(config: AppConfig): ShaclRunner {
  return new ShaclRunner(config.shacl);
}

/**
 * Create logger with provided config
 */
export function createAppLogger(config: AppConfig): Logger {
  return createLoggerFromConfig({
    logLevel: config.logLevel,
    logFormat: config.logFormat,
    logTimestamp: 'true', // Always enable timestamps in backend
    logColors: config.nodeEnv !== 'production' ? 'true' : 'false',
    nodeEnv: config.nodeEnv
  });
}

/**
 * Create time provider with application config
 */
export function createTimeProvider(): SystemTimeProvider {
  return new SystemTimeProvider({
    timezone: 'UTC', // Always use UTC in backend
    defaultFormat: 'ISO'
  });
}

/**
 * Create mock time provider for testing
 */
export function createMockTimeProvider(fixedTime?: Date): MockTimeProvider {
  return new MockTimeProvider(fixedTime);
}

/**
 * Initialize IRI strategy with application config
 */
export function initializeIriStrategy(): void {
  ESGIriStrategy.initialize();
}

/**
 * Setup infrastructure services with provided configuration
 */
export function setupInfrastructure(config: AppConfig): InfrastructureServices {
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