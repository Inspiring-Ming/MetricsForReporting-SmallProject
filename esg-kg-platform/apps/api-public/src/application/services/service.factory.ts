import { MetricManagementService } from './metric-management.service';
import { ComputationManagementService } from './computation-management.service';
import { KnowledgeGraphQueryService } from './knowledge-graph-query.service';
import { KnowledgeGraphNavigationService } from './knowledge-graph-navigation.service';

// Import outbound ports (dependencies that services need)
import { MetricRepositoryPort } from '../ports/outbound/metric-repository.port';
import { KnowledgeGraphPort } from '../ports/outbound/knowledge-graph.port';
import { CachePort } from '../ports/outbound/cache.port';

// Import inbound ports (interfaces that services implement)
import type { 
  MetricManagementPort,
  ComputationManagementPort,
  KnowledgeGraphQueryPort,
  KnowledgeGraphNavigationPort 
} from '../ports/inbound';

/**
 * Service Factory for Application Layer
 * 
 * Clean Architecture Compliance:
 * ✅ Depends only on ports (abstractions), not infrastructure (concretions)
 * ✅ Proper dependency injection through constructor parameters
 * ✅ Services are created with their required port dependencies
 * 
 * This factory is responsible for creating and wiring up services with their port dependencies.
 * It follows the dependency injection pattern and ensures proper hexagonal architecture.
 */
export class ServiceFactory {
  private metricManagementService?: MetricManagementService;
  private computationManagementService?: ComputationManagementService;
  private knowledgeGraphQueryService?: KnowledgeGraphQueryService;
  private knowledgeGraphNavigationService?: KnowledgeGraphNavigationService;

  constructor(
    // All infrastructure adapters are injected as ports (abstractions)
    private readonly metricRepository: MetricRepositoryPort,
    private readonly knowledgeGraph: KnowledgeGraphPort,
    private readonly cache: CachePort
  ) {}

  /**
   * Get or create MetricManagementService instance
   */
  getMetricManagementService(): MetricManagementPort {
    if (!this.metricManagementService) {
      this.metricManagementService = new MetricManagementService(
        this.metricRepository,
        this.cache
      );
    }
    return this.metricManagementService;
  }

  /**
   * Get or create ComputationManagementService instance
   */
  getComputationManagementService(): ComputationManagementPort {
    if (!this.computationManagementService) {
      this.computationManagementService = new ComputationManagementService(
        this.knowledgeGraph,
        this.cache
      );
    }
    return this.computationManagementService;
  }

  /**
   * Get or create KnowledgeGraphQueryService instance
   */
  getKnowledgeGraphQueryService(): KnowledgeGraphQueryPort {
    if (!this.knowledgeGraphQueryService) {
      this.knowledgeGraphQueryService = new KnowledgeGraphQueryService(
        this.knowledgeGraph,
        this.cache
      );
    }
    return this.knowledgeGraphQueryService;
  }

  /**
   * Get or create KnowledgeGraphNavigationService instance
   */
  getKnowledgeGraphNavigationService(): KnowledgeGraphNavigationPort {
    if (!this.knowledgeGraphNavigationService) {
      this.knowledgeGraphNavigationService = new KnowledgeGraphNavigationService(
        this.knowledgeGraph,
        this.cache
      );
    }
    return this.knowledgeGraphNavigationService;
  }

  /**
   * Get all services as a single object
   */
  getAllServices(): {
    metricManagement: MetricManagementPort;
    computationManagement: ComputationManagementPort;
    knowledgeGraphQuery: KnowledgeGraphQueryPort;
  } {
    return {
      metricManagement: this.getMetricManagementService(),
      computationManagement: this.getComputationManagementService(),
      knowledgeGraphQuery: this.getKnowledgeGraphQueryService()
    };
  }
}

/**
 * Create a service factory with port dependencies
 * This is typically called from the main application bootstrap where
 * infrastructure adapters are created and injected as port implementations
 * 
 * Example usage:
 * ```
 * const factory = createServiceFactory(
 *   new GraphDbMetricRepository(graphDbClient),     // implements MetricRepositoryPort
 *   new GraphDbKnowledgeGraph(graphDbClient),       // implements KnowledgeGraphPort  
 *   new RedisCache(redisClient)                     // implements CachePort
 * );
 * ```
 */
export function createServiceFactory(
  metricRepository: MetricRepositoryPort,
  knowledgeGraph: KnowledgeGraphPort,
  cache: CachePort
): ServiceFactory {
  return new ServiceFactory(
    metricRepository,
    knowledgeGraph,
    cache
  );
}