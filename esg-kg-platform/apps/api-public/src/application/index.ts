/**
 * Application Layer
 * 
 * This layer contains the application's use cases and orchestrates the flow
 * between the domain layer and infrastructure. It implements the business
 * logic that is specific to the application but not to the domain.
 * 
 * Following hexagonal architecture principles:
 * - Ports define interfaces (contracts)
 * - Services implement business logic
 * - Dependencies are injected through constructor
 */

// Export all ports (interfaces)
export * from './ports';

// Export all services (implementations)
export * from './services';

// Convenience re-exports for commonly used types
export type {
  // Inbound ports (what the application can do)
  MetricManagementPort,
  ComputationManagementPort,
  KnowledgeGraphQueryPort
} from './ports/inbound';

export type {
  // Outbound ports (what the application needs)
  MetricRepositoryPort,
  KnowledgeGraphPort,
  ComputationExecutorPort,
  CachePort,
  IdGeneratorPort
} from './ports/outbound';