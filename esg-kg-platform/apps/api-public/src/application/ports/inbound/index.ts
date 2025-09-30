/**
 * Inbound Ports - Application Use Cases
 * 
 * These interfaces define the business operations that can be performed
 * by the application layer. They represent the "driving" side of the
 * hexagonal architecture - what the application can do.
 */

export * from './metric-management.port';
export * from './computation-management.port';
export * from './knowledge-graph-query.port';
export * from './knowledge-graph-navigation.port';