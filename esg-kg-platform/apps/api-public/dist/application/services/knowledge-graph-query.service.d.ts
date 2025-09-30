import { Framework, BaseResponse, PaginatedResponse } from '@esg-platform/dto';
import { KnowledgeGraphQueryPort, KnowledgeGraphEntity, SparqlQueryResult } from '../ports/inbound/knowledge-graph-query.port';
import { KnowledgeGraphPort } from '../ports/outbound/knowledge-graph.port';
import { CachePort } from '../ports/outbound/cache.port';
export declare class KnowledgeGraphQueryService implements KnowledgeGraphQueryPort {
    private readonly knowledgeGraph;
    private readonly cache;
    constructor(knowledgeGraph: KnowledgeGraphPort, cache: CachePort);
    executeSparqlQuery(query: string, limit?: number, offset?: number): Promise<BaseResponse<SparqlQueryResult>>;
    getFrameworks(): Promise<BaseResponse<Framework[]>>;
    getIndustries(framework: Framework): Promise<BaseResponse<string[]>>;
    getMetricCodes(framework: Framework, industry: string): Promise<BaseResponse<string[]>>;
    getEntity(entityId: string): Promise<BaseResponse<KnowledgeGraphEntity>>;
    searchEntities(type?: string, properties?: Record<string, string>, limit?: number, offset?: number): Promise<PaginatedResponse<KnowledgeGraphEntity>>;
    getMetricDefinitions(framework: Framework, industry?: string): Promise<BaseResponse<Array<{
        code: string;
        name: string;
        description: string;
        unit: string;
    }>>>;
    private validateSparqlQuery;
    private applyPagination;
    private buildQueryCacheKey;
    private simpleHash;
    private isValidEntityId;
}
//# sourceMappingURL=knowledge-graph-query.service.d.ts.map