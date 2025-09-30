import { Framework, BaseResponse, PaginatedResponse } from '@esg-platform/dto';
export interface KnowledgeGraphEntity {
    iri: string;
    type: string;
    properties: Record<string, unknown>;
}
export interface SparqlQueryResult {
    bindings: Record<string, {
        type: string;
        value: string;
    }>[];
    totalCount?: number;
}
export interface KnowledgeGraphQueryPort {
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
}
//# sourceMappingURL=knowledge-graph-query.port.d.ts.map