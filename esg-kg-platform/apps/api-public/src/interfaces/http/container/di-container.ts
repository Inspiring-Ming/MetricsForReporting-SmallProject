/**
 * Dependency Injection Container - Composition Root
 * 
 * This is where all dependencies are wired together following the
 * Dependency Inversion Principle. Infrastructure adapters are
 * injected into Application ports.
 */

import { ServiceFactory } from '../../../application/services/service.factory';

// Import Outbound Port interfaces (abstractions)
import {
  MetricRepositoryPort,
  CachePort,
  KnowledgeGraphPort
} from '../../../application/ports/outbound';

// Import Inbound Port interfaces (use cases)
import {
  MetricManagementPort,
  ComputationManagementPort,
  KnowledgeGraphQueryPort,
  KnowledgeGraphNavigationPort
} from '../../../application/ports/inbound';

// Import Controllers
import {
  MetricController,
  ComputationController,
  KnowledgeGraphController
} from '../controllers';

/**
 * Configuration interface for the container
 */
export interface ContainerConfig {
  database: {
    url: string;
    options?: Record<string, unknown>;
  };
  cache: {
    url?: string;
    ttl?: number;
  };
  knowledgeGraph: {
    endpoint: string;
    credentials?: {
      username: string;
      password: string;
    };
  };
}

/**
 * Dependency Injection Container
 * 
 * Manages the lifecycle and wiring of all application dependencies.
 * Follows the composition root pattern where all object graphs
 * are constructed in one place.
 */
export class DIContainer {
  private serviceFactory?: ServiceFactory;

  // Infrastructure adapters (will be created on-demand)
  private metricRepository?: MetricRepositoryPort;
  private cache?: CachePort;
  private knowledgeGraph?: KnowledgeGraphPort;

  // Application services (will be created on-demand)
  private metricService?: MetricManagementPort;
  private computationService?: ComputationManagementPort;
  private knowledgeGraphService?: KnowledgeGraphQueryPort;
  private knowledgeGraphNavigationService?: KnowledgeGraphNavigationPort;

  // HTTP Controllers (will be created on-demand)
  private metricController?: MetricController;
  private computationController?: ComputationController;
  private knowledgeGraphController?: KnowledgeGraphController;

  constructor(config: ContainerConfig) {
    // Config stored for future use when implementing real adapters
    console.log('DI Container initialized with config:', {
      database: config.database.url,
      cache: config.cache.url,
      knowledgeGraph: config.knowledgeGraph.endpoint
    });
  }

  /**
   * Get or create MetricRepositoryPort implementation
   */
  private getMetricRepository(): MetricRepositoryPort {
    if (!this.metricRepository) {
      // Mock implementation - would instantiate real database adapter
      this.metricRepository = this.createMockMetricRepository();
    }
    return this.metricRepository;
  }

  /**
   * Get or create CachePort implementation
   */
  private getCache(): CachePort {
    if (!this.cache) {
      // Mock implementation - would instantiate Redis or in-memory cache
      this.cache = this.createMockCache();
    }
    return this.cache;
  }

  /**
   * Get or create KnowledgeGraphPort implementation
   */
  private getKnowledgeGraph(): KnowledgeGraphPort {
    if (!this.knowledgeGraph) {
      // Mock implementation - would instantiate GraphDB/Jena adapter
      this.knowledgeGraph = this.createMockKnowledgeGraph();
    }
    return this.knowledgeGraph;
  }

  /**
   * Get or create ServiceFactory
   */
  private getServiceFactory(): ServiceFactory {
    if (!this.serviceFactory) {
      this.serviceFactory = new ServiceFactory(
        this.getMetricRepository(),
        this.getKnowledgeGraph(),
        this.getCache()
      );
    }
    return this.serviceFactory;
  }

  /**
   * Get MetricManagementPort service
   */
  getMetricService(): MetricManagementPort {
    if (!this.metricService) {
      this.metricService = this.getServiceFactory().getMetricManagementService();
    }
    return this.metricService;
  }

  /**
   * Get ComputationManagementPort service
   */
  getComputationService(): ComputationManagementPort {
    if (!this.computationService) {
      this.computationService = this.getServiceFactory().getComputationManagementService();
    }
    return this.computationService;
  }

  /**
   * Get KnowledgeGraphQueryPort service
   */
  getKnowledgeGraphService(): KnowledgeGraphQueryPort {
    if (!this.knowledgeGraphService) {
      this.knowledgeGraphService = this.getServiceFactory().getKnowledgeGraphQueryService();
    }
    return this.knowledgeGraphService;
  }

  /**
   * Get KnowledgeGraphNavigationPort service
   */
  getKnowledgeGraphNavigationService(): KnowledgeGraphNavigationPort {
    if (!this.knowledgeGraphNavigationService) {
      this.knowledgeGraphNavigationService = this.getServiceFactory().getKnowledgeGraphNavigationService();
    }
    return this.knowledgeGraphNavigationService;
  }

  /**
   * Get MetricController
   */
  getMetricController(): MetricController {
    if (!this.metricController) {
      this.metricController = new MetricController(this.getMetricService());
    }
    return this.metricController;
  }

  /**
   * Get ComputationController
   */
  getComputationController(): ComputationController {
    if (!this.computationController) {
      this.computationController = new ComputationController(this.getComputationService());
    }
    return this.computationController;
  }

  /**
   * Get KnowledgeGraphController
   */
  getKnowledgeGraphController(): KnowledgeGraphController {
    if (!this.knowledgeGraphController) {
      this.knowledgeGraphController = new KnowledgeGraphController(
        this.getKnowledgeGraphService(),
        this.getKnowledgeGraphNavigationService()
      );
    }
    return this.knowledgeGraphController;
  }

  /**
   * Mock MetricRepositoryPort implementation
   * In production, this would be replaced with actual database adapter
   */
  private createMockMetricRepository(): MetricRepositoryPort {
    return {
      save: async (metric) => {
        console.log('Mock: Saving metric to database', metric);
        return `metric-${Date.now()}`;
      },

      saveBatch: async (metrics) => {
        console.log('Mock: Saving batch metrics to database', metrics.length);
        return metrics.map((_, index) => `metric-${Date.now()}-${index}`);
      },

      findById: async (id) => {
        console.log('Mock: Finding metric by ID', id);
        return {
          id,
          framework: 'SASB',
          industry: 'Banking',
          code: 'MOCK_METRIC',
          entityId: 'entity-123',
          value: 42.0,
          unitIri: 'http://qudt.org/vocab/unit/NUM',
          asOf: new Date().toISOString(),
          source: 'mock-source',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      },

      findMany: async (params: any) => {
        console.log('Mock: Finding metrics by filters', params);
        return {
          metrics: [{
            framework: 'SASB',
            industry: 'Banking',
            code: 'MOCK_METRIC',
            entityId: 'entity-123',
            value: 42.0,
            unitIri: 'http://qudt.org/vocab/unit/NUM',
            asOf: new Date().toISOString(),
            source: 'mock-source'
          }],
          totalCount: 1
        };
      },

      update: async (id, updates) => {
        console.log('Mock: Updating metric', id, updates);
        return true;
      },

      delete: async (id) => {
        console.log('Mock: Deleting metric', id);
        return true;
      },

      exists: async (id) => {
        console.log('Mock: Checking if metric exists', id);
        return true;
      },

      findByEntityAndFramework: async (entityId, framework, fromDate, toDate) => {
        console.log('Mock: Finding metrics by entity and framework', entityId, framework, fromDate, toDate);
        return [{
          framework: framework as any,
          industry: 'Banking',
          code: 'MOCK_METRIC',
          entityId,
          value: 42.0,
          unitIri: 'http://qudt.org/vocab/unit/NUM',
          asOf: new Date().toISOString(),
          source: 'mock-source'
        }];
      }
    };
  }

  /**
   * Mock CachePort implementation
   * In production, this would be replaced with Redis or other cache
   */
  private createMockCache(): CachePort {
    const mockCache = new Map<string, { value: unknown; expiresAt: number }>();

    return {
      set: async (key, value, ttlSeconds) => {
        console.log('Mock: Setting cache', key);
        mockCache.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000
        });
        return true;
      },

      get: async <T>(key: string): Promise<T | null> => {
        console.log('Mock: Getting from cache', key);
        const cached = mockCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value as T;
        }
        mockCache.delete(key); // Cleanup expired
        return null;
      },

      delete: async (key) => {
        console.log('Mock: Deleting from cache', key);
        return mockCache.delete(key);
      },

      exists: async (key) => {
        console.log('Mock: Checking cache existence', key);
        const cached = mockCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return true;
        }
        if (cached) {
          mockCache.delete(key); // Cleanup expired
        }
        return false;
      },

      mset: async (entries) => {
        console.log('Mock: Setting multiple cache entries', entries.length);
        for (const entry of entries) {
          mockCache.set(entry.key, {
            value: entry.value,
            expiresAt: Date.now() + entry.ttl * 1000
          });
        }
        return true;
      },

      mget: async <T>(keys: string[]): Promise<Array<T | null>> => {
        console.log('Mock: Getting multiple cache entries', keys.length);
        return keys.map(key => {
          const cached = mockCache.get(key);
          if (cached && cached.expiresAt > Date.now()) {
            return cached.value as T;
          }
          return null;
        });
      },

      clearByPattern: async (pattern) => {
        console.log('Mock: Clearing cache by pattern', pattern);
        let count = 0;
        for (const key of mockCache.keys()) {
          if (key.includes(pattern)) { // Simple pattern matching
            mockCache.delete(key);
            count++;
          }
        }
        return count;
      },

      getStats: async () => {
        console.log('Mock: Getting cache stats');
        return {
          hitRate: 0.85,
          missRate: 0.15,
          keyCount: mockCache.size
        };
      }
    };
  }

  /**
   * Mock KnowledgeGraphPort implementation
   * In production, this would be replaced with GraphDB adapter
   */
  private createMockKnowledgeGraph(): KnowledgeGraphPort {
    return {
      executeSparqlQuery: async (query) => {
        console.log('Mock: Executing SPARQL query', query.substring(0, 100) + '...');
        return [
          {
            subject: 'http://example.org/metric1',
            predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
            object: 'http://example.org/Metric'
          }
        ];
      },

      getComputationMethods: async (framework, industry) => {
        console.log('Mock: Getting computation methods', framework, industry);
        return [{
          code: 'MOCK_METHOD',
          name: 'Mock Computation Method',
          description: 'A mock computation method for testing',
          framework,
          industry,
          inputMetrics: [
            {
              name: 'input1',
              code: 'INPUT1',
              dataType: 'number' as const,
              required: true,
              unit: 'units'
            }
          ],
          outputUnit: 'result_units',
          formula: 'input1 * 2',
          implementedBy: 'platform' as const
        }];
      },

      getComputationMethod: async (framework, industry, code) => {
        console.log('Mock: Getting computation method', framework, industry, code);
        return {
          code,
          name: 'Mock Computation Method',
          description: 'A mock computation method for testing',
          framework,
          industry,
          inputMetrics: [
            {
              name: 'input1',
              code: 'INPUT1',
              dataType: 'number' as const,
              required: true,
              unit: 'units'
            }
          ],
          outputUnit: 'result_units',
          formula: 'input1 * 2',
          implementedBy: 'platform' as const
        };
      },

      getFrameworks: async () => {
        console.log('Mock: Getting frameworks');
        return ['SASB', 'GRI', 'TCFD'];
      },

      getIndustries: async (framework) => {
        console.log('Mock: Getting industries for framework', framework);
        return ['Banking', 'Technology', 'Energy'];
      },

      getMetricCodes: async (framework, industry) => {
        console.log('Mock: Getting metric codes', framework, industry);
        return ['METRIC_1', 'METRIC_2', 'METRIC_3'];
      },

      getMetricDefinitions: async (framework, industry) => {
        console.log('Mock: Getting metric definitions', framework, industry);
        return [
          {
            code: 'METRIC_1',
            name: 'Mock Metric 1',
            description: 'A mock metric for testing',
            unit: 'units'
          }
        ];
      },

      validateMetricStructure: async (metric) => {
        console.log('Mock: Validating metric structure', metric);
        return { valid: true, violations: [] };
      },

      entityExists: async (entityId) => {
        console.log('Mock: Checking if entity exists', entityId);
        return true;
      },

      getEntity: async (entityId) => {
        console.log('Mock: Getting entity', entityId);
        return {
          iri: `http://example.org/entity/${entityId}`,
          type: 'Organization',
          properties: {
            name: 'Mock Entity',
            industry: 'Banking'
          }
        };
      },

      // Navigation methods for knowledge graph
      getReportingFrameworks: async (industry) => {
        console.log('Mock: Getting reporting frameworks for industry', industry);
        return [
          { code: 'SASB' as any, name: 'SASB', description: 'Sustainability Accounting Standards Board' },
          { code: 'GRI' as any, name: 'GRI', description: 'Global Reporting Initiative' }
        ];
      },

      getCategoriesByIndustryAndFramework: async (industry, framework) => {
        console.log('Mock: Getting categories for industry and framework', industry, framework);
        return [
          { 
            code: 'environmental',
            name: 'Environmental',
            description: 'Environmental impact metrics'
          },
          { 
            code: 'social',
            name: 'Social',
            description: 'Social responsibility metrics'
          }
        ];
      },

      getMetricsByIndustryAndCategory: async (industry, framework, categoryLabel) => {
        console.log('Mock: Getting metrics by category', industry, framework, categoryLabel);
        return [
          {
            code: 'ENV001',
            name: 'Carbon Emissions',
            description: 'Total carbon dioxide equivalent emissions',
            unitIri: 'http://example.org/units/tCO2e'
          },
          {
            code: 'ENV002',
            name: 'Energy Consumption',
            description: 'Total energy consumed from all sources',
            unitIri: 'http://example.org/units/MWh'
          }
        ];
      }
    };
  }

  /**
   * Cleanup resources when shutting down
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up DI Container resources...');
    
    // Clear cache if available
    if (this.cache) {
      await this.cache.clearByPattern('*'); // Clear all cache entries
    }

    // Reset all instances
    this.serviceFactory = undefined as any;
    this.metricRepository = undefined as any;
    this.cache = undefined as any;
    this.knowledgeGraph = undefined as any;
    this.metricService = undefined as any;
    this.computationService = undefined as any;
    this.knowledgeGraphService = undefined as any;
    this.metricController = undefined as any;
    this.computationController = undefined as any;
    this.knowledgeGraphController = undefined as any;

    console.log('DI Container cleanup completed');
  }
}

/**
 * Global container instance (singleton pattern)
 */
let containerInstance: DIContainer | undefined;

/**
 * Initialize the global DI container
 */
export function initializeContainer(config: ContainerConfig): DIContainer {
  if (containerInstance) {
    throw new Error('DI Container already initialized');
  }
  
  containerInstance = new DIContainer(config);
  console.log('DI Container initialized');
  return containerInstance;
}

/**
 * Get the global DI container instance
 */
export function getContainer(): DIContainer {
  if (!containerInstance) {
    throw new Error('DI Container not initialized. Call initializeContainer() first.');
  }
  return containerInstance;
}

/**
 * Cleanup and reset the global container
 */
export async function cleanupContainer(): Promise<void> {
  if (containerInstance) {
    await containerInstance.cleanup();
    containerInstance = undefined;
  }
}