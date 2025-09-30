import { MetricManagementPort, ComputationManagementPort, KnowledgeGraphQueryPort } from '../../../application/ports/inbound';
import { MetricController, ComputationController, KnowledgeGraphController } from '../controllers';
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
export declare class DIContainer {
    private serviceFactory?;
    private metricRepository?;
    private cache?;
    private knowledgeGraph?;
    private metricService?;
    private computationService?;
    private knowledgeGraphService?;
    private metricController?;
    private computationController?;
    private knowledgeGraphController?;
    constructor(config: ContainerConfig);
    private getMetricRepository;
    private getCache;
    private getKnowledgeGraph;
    private getServiceFactory;
    getMetricService(): MetricManagementPort;
    getComputationService(): ComputationManagementPort;
    getKnowledgeGraphService(): KnowledgeGraphQueryPort;
    getMetricController(): MetricController;
    getComputationController(): ComputationController;
    getKnowledgeGraphController(): KnowledgeGraphController;
    private createMockMetricRepository;
    private createMockCache;
    private createMockKnowledgeGraph;
    cleanup(): Promise<void>;
}
export declare function initializeContainer(config: ContainerConfig): DIContainer;
export declare function getContainer(): DIContainer;
export declare function cleanupContainer(): Promise<void>;
//# sourceMappingURL=di-container.d.ts.map