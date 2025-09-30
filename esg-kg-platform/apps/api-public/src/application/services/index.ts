/**
 * Application Services
 * 
 * Concrete implementations of the application use cases (inbound ports).
 * These services orchestrate domain logic and coordinate with infrastructure.
 * 
 * Note: Service implementations will be created based on the port interfaces
 * and infrastructure components available.
 */

// Clean Architecture Compliant Service Implementations
// All services follow hexagonal architecture principles:
// ✅ Depend only on ports (abstractions), not infrastructure (concretions)
// ✅ Contain pure business logic and orchestration
// ✅ Use correct DTO structure from @esg-platform/dto
// ✅ Implement exact interface signatures from inbound ports

export { MetricManagementService } from './metric-management.service';
export { ComputationManagementService } from './computation-management.service';
export { KnowledgeGraphQueryService } from './knowledge-graph-query.service';
export { KnowledgeGraphNavigationService } from './knowledge-graph-navigation.service';
export { ServiceFactory, createServiceFactory } from './service.factory';

// Export service interface types
export type {
  MetricManagementPort,
  ComputationManagementPort,
  KnowledgeGraphQueryPort,
  KnowledgeGraphNavigationPort
} from '../ports/inbound';