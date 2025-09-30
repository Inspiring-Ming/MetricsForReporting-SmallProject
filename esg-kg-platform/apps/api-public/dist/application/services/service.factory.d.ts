import { MetricRepositoryPort } from '../ports/outbound/metric-repository.port';
import { KnowledgeGraphPort } from '../ports/outbound/knowledge-graph.port';
import { CachePort } from '../ports/outbound/cache.port';
import type { MetricManagementPort, ComputationManagementPort, KnowledgeGraphQueryPort } from '../ports/inbound';
export declare class ServiceFactory {
    private readonly metricRepository;
    private readonly knowledgeGraph;
    private readonly cache;
    private metricManagementService?;
    private computationManagementService?;
    private knowledgeGraphQueryService?;
    constructor(metricRepository: MetricRepositoryPort, knowledgeGraph: KnowledgeGraphPort, cache: CachePort);
    getMetricManagementService(): MetricManagementPort;
    getComputationManagementService(): ComputationManagementPort;
    getKnowledgeGraphQueryService(): KnowledgeGraphQueryPort;
    getAllServices(): {
        metricManagement: MetricManagementPort;
        computationManagement: ComputationManagementPort;
        knowledgeGraphQuery: KnowledgeGraphQueryPort;
    };
}
export declare function createServiceFactory(metricRepository: MetricRepositoryPort, knowledgeGraph: KnowledgeGraphPort, cache: CachePort): ServiceFactory;
//# sourceMappingURL=service.factory.d.ts.map