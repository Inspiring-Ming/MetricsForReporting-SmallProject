import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export interface GraphDbConfig {
    endpoint: string;
    repository: string;
    timeout?: number;
    maxRetries?: number;
}
export interface SparqlResult {
    head: {
        vars: string[];
    };
    results: {
        bindings: Array<Record<string, {
            type: string;
            value: string;
            datatype?: string;
        }>>;
    };
}
export interface UpdateResult {
    success: boolean;
    triples?: number;
    duration?: number;
}
export declare class GraphDbConnectionError extends DomainError {
    readonly code = "GRAPHDB_CONNECTION_ERROR";
    readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;
}
export declare class GraphDbQueryError extends DomainError {
    readonly code = "GRAPHDB_QUERY_ERROR";
    readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export declare class GraphDbClient {
    private readonly baseUrl;
    private readonly repository;
    private readonly timeout;
    private readonly maxRetries;
    constructor(config: GraphDbConfig);
    query(sparql: string): Promise<SparqlResult>;
    update(sparql: string): Promise<UpdateResult>;
    insertRdf(rdfData: string, graphUri?: string, format?: string): Promise<UpdateResult>;
    ping(): Promise<boolean>;
    getRepositoryInfo(): Promise<any>;
    private executeWithRetry;
    private estimateTripleCount;
}
//# sourceMappingURL=graphdb.client.d.ts.map