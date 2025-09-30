import { ServiceFactory } from '../../../application/services/service.factory';
import { MetricController, ComputationController, KnowledgeGraphController } from '../controllers';
export class DIContainer {
    serviceFactory;
    metricRepository;
    cache;
    knowledgeGraph;
    metricService;
    computationService;
    knowledgeGraphService;
    metricController;
    computationController;
    knowledgeGraphController;
    constructor(config) {
        console.log('DI Container initialized with config:', {
            database: config.database.url,
            cache: config.cache.url,
            knowledgeGraph: config.knowledgeGraph.endpoint
        });
    }
    getMetricRepository() {
        if (!this.metricRepository) {
            this.metricRepository = this.createMockMetricRepository();
        }
        return this.metricRepository;
    }
    getCache() {
        if (!this.cache) {
            this.cache = this.createMockCache();
        }
        return this.cache;
    }
    getKnowledgeGraph() {
        if (!this.knowledgeGraph) {
            this.knowledgeGraph = this.createMockKnowledgeGraph();
        }
        return this.knowledgeGraph;
    }
    getServiceFactory() {
        if (!this.serviceFactory) {
            this.serviceFactory = new ServiceFactory(this.getMetricRepository(), this.getKnowledgeGraph(), this.getCache());
        }
        return this.serviceFactory;
    }
    getMetricService() {
        if (!this.metricService) {
            this.metricService = this.getServiceFactory().getMetricManagementService();
        }
        return this.metricService;
    }
    getComputationService() {
        if (!this.computationService) {
            this.computationService = this.getServiceFactory().getComputationManagementService();
        }
        return this.computationService;
    }
    getKnowledgeGraphService() {
        if (!this.knowledgeGraphService) {
            this.knowledgeGraphService = this.getServiceFactory().getKnowledgeGraphQueryService();
        }
        return this.knowledgeGraphService;
    }
    getMetricController() {
        if (!this.metricController) {
            this.metricController = new MetricController(this.getMetricService());
        }
        return this.metricController;
    }
    getComputationController() {
        if (!this.computationController) {
            this.computationController = new ComputationController(this.getComputationService());
        }
        return this.computationController;
    }
    getKnowledgeGraphController() {
        if (!this.knowledgeGraphController) {
            this.knowledgeGraphController = new KnowledgeGraphController(this.getKnowledgeGraphService());
        }
        return this.knowledgeGraphController;
    }
    createMockMetricRepository() {
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
            findMany: async (params) => {
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
                        framework: framework,
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
    createMockCache() {
        const mockCache = new Map();
        return {
            set: async (key, value, ttlSeconds) => {
                console.log('Mock: Setting cache', key);
                mockCache.set(key, {
                    value,
                    expiresAt: Date.now() + ttlSeconds * 1000
                });
                return true;
            },
            get: async (key) => {
                console.log('Mock: Getting from cache', key);
                const cached = mockCache.get(key);
                if (cached && cached.expiresAt > Date.now()) {
                    return cached.value;
                }
                mockCache.delete(key);
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
                    mockCache.delete(key);
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
            mget: async (keys) => {
                console.log('Mock: Getting multiple cache entries', keys.length);
                return keys.map(key => {
                    const cached = mockCache.get(key);
                    if (cached && cached.expiresAt > Date.now()) {
                        return cached.value;
                    }
                    return null;
                });
            },
            clearByPattern: async (pattern) => {
                console.log('Mock: Clearing cache by pattern', pattern);
                let count = 0;
                for (const key of mockCache.keys()) {
                    if (key.includes(pattern)) {
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
    createMockKnowledgeGraph() {
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
                                dataType: 'number',
                                required: true,
                                unit: 'units'
                            }
                        ],
                        outputUnit: 'result_units',
                        formula: 'input1 * 2',
                        implementedBy: 'platform'
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
                            dataType: 'number',
                            required: true,
                            unit: 'units'
                        }
                    ],
                    outputUnit: 'result_units',
                    formula: 'input1 * 2',
                    implementedBy: 'platform'
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
            }
        };
    }
    async cleanup() {
        console.log('Cleaning up DI Container resources...');
        if (this.cache) {
            await this.cache.clearByPattern('*');
        }
        this.serviceFactory = undefined;
        this.metricRepository = undefined;
        this.cache = undefined;
        this.knowledgeGraph = undefined;
        this.metricService = undefined;
        this.computationService = undefined;
        this.knowledgeGraphService = undefined;
        this.metricController = undefined;
        this.computationController = undefined;
        this.knowledgeGraphController = undefined;
        console.log('DI Container cleanup completed');
    }
}
let containerInstance;
export function initializeContainer(config) {
    if (containerInstance) {
        throw new Error('DI Container already initialized');
    }
    containerInstance = new DIContainer(config);
    console.log('DI Container initialized');
    return containerInstance;
}
export function getContainer() {
    if (!containerInstance) {
        throw new Error('DI Container not initialized. Call initializeContainer() first.');
    }
    return containerInstance;
}
export async function cleanupContainer() {
    if (containerInstance) {
        await containerInstance.cleanup();
        containerInstance = undefined;
    }
}
//# sourceMappingURL=di-container.js.map