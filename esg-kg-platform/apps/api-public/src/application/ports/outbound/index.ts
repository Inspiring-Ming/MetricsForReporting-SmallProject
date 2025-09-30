/**
 * Outbound Ports - External Dependencies
 * 
 * These interfaces define the contracts for external systems and services
 * that the application depends on. They represent the "driven" side of the
 * hexagonal architecture - what the application needs from the outside world.
 */

export * from './metric-repository.port';
export * from './knowledge-graph.port';
export * from './computation-executor.port';
export * from './cache.port';
export * from './id-generator.port';