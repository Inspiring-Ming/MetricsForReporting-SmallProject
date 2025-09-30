import { SparqlQueryRequest, SparqlQueryResponse, GraphStatsResponse, BaseResponse } from '@esg-platform/dto';
import { HttpSparqlQueryRequest, HttpSparqlQueryResponse, HttpEntitySearchRequest, HttpEntitySearchResponse, HttpGraphMetadata } from '../dtos/http-knowledge-graph.dto';
export declare class KnowledgeGraphDtoMapper {
    static toSparqlQueryRequest(httpRequest: HttpSparqlQueryRequest): SparqlQueryRequest;
    static toEntitySearchParams(httpRequest: HttpEntitySearchRequest): {
        term: string;
        limit: number;
        offset: number;
        entityType?: string;
    };
    static toHttpSparqlQueryResponse(appResponse: BaseResponse<SparqlQueryResponse>): HttpSparqlQueryResponse;
    static toHttpGraphMetadata(appResponse: BaseResponse<GraphStatsResponse>): HttpGraphMetadata;
    static createEntitySearchResponse(searchResults: any[], searchTerm: string, limit: number, offset: number, total: number): HttpEntitySearchResponse;
}
//# sourceMappingURL=knowledge-graph.mapper.d.ts.map