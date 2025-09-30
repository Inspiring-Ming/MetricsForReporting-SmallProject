export interface HttpSparqlQueryRequest {
    query: string;
    format?: 'json' | 'turtle' | 'xml';
    timeout?: string;
}
export interface HttpEntitySearchRequest {
    term: string;
    limit?: string;
    offset?: string;
    entityType?: string;
}
export interface HttpSparqlQueryResponse {
    results: unknown;
    format: string;
    queryTime: number;
    resultCount: number;
}
export interface HttpGraphMetadata {
    totalTriples: number;
    totalEntities: number;
    frameworks: string[];
    industries: string[];
    lastUpdated: string;
}
export interface HttpEntitySearchResult {
    uri: string;
    label: string;
    type: string;
    description?: string;
}
export interface HttpEntitySearchResponse {
    entities: HttpEntitySearchResult[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    };
    searchTerm: string;
}
//# sourceMappingURL=http-knowledge-graph.dto.d.ts.map