import { MetricManagementService } from './metric-management.service';
import { ComputationManagementService } from './computation-management.service';
import { KnowledgeGraphQueryService } from './knowledge-graph-query.service';
export class ServiceFactory {
    metricRepository;
    knowledgeGraph;
    cache;
    metricManagementService;
    computationManagementService;
    knowledgeGraphQueryService;
    constructor(metricRepository, knowledgeGraph, cache) {
        this.metricRepository = metricRepository;
        this.knowledgeGraph = knowledgeGraph;
        this.cache = cache;
    }
    getMetricManagementService() {
        if (!this.metricManagementService) {
            this.metricManagementService = new MetricManagementService(this.metricRepository, this.cache);
        }
        return this.metricManagementService;
    }
    getComputationManagementService() {
        if (!this.computationManagementService) {
            this.computationManagementService = new ComputationManagementService(this.knowledgeGraph, this.cache);
        }
        return this.computationManagementService;
    }
    getKnowledgeGraphQueryService() {
        if (!this.knowledgeGraphQueryService) {
            this.knowledgeGraphQueryService = new KnowledgeGraphQueryService(this.knowledgeGraph, this.cache);
        }
        return this.knowledgeGraphQueryService;
    }
    getAllServices() {
        return {
            metricManagement: this.getMetricManagementService(),
            computationManagement: this.getComputationManagementService(),
            knowledgeGraphQuery: this.getKnowledgeGraphQueryService()
        };
    }
}
export function createServiceFactory(metricRepository, knowledgeGraph, cache) {
    return new ServiceFactory(metricRepository, knowledgeGraph, cache);
}
//# sourceMappingURL=service.factory.js.map