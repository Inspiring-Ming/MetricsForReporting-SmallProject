/**
 * DTO Mappers for Knowledge Graph operations
 */

import {
  SparqlQueryRequest,
  SparqlQueryResponse,
  GraphStatsResponse,
  BaseResponse
} from '@esg-platform/dto';

import {
  HttpSparqlQueryRequest,
  HttpSparqlQueryResponse,
  HttpEntitySearchRequest,
  HttpEntitySearchResponse,
  HttpGraphMetadata
} from '../dtos/http-knowledge-graph.dto';

export class KnowledgeGraphDtoMapper {
  /**
   * Map HTTP SPARQL query request to Application request
   */
  static toSparqlQueryRequest(httpRequest: HttpSparqlQueryRequest): SparqlQueryRequest {
    const result: SparqlQueryRequest = {
      query: httpRequest.query
    };
    
    if (httpRequest.format && ['json', 'xml', 'csv', 'turtle'].includes(httpRequest.format)) {
      result.format = httpRequest.format as 'json' | 'xml' | 'csv' | 'turtle';
    }
    if (httpRequest.timeout) result.timeout = parseInt(httpRequest.timeout, 10);
    
    return result;
  }

  /**
   * Map HTTP entity search request to SPARQL query parameters
   */
  static toEntitySearchParams(httpRequest: HttpEntitySearchRequest): {
    term: string;
    limit: number;
    offset: number;
    entityType?: string;
  } {
    const result = {
      term: httpRequest.term,
      limit: httpRequest.limit ? parseInt(httpRequest.limit, 10) : 50,
      offset: httpRequest.offset ? parseInt(httpRequest.offset, 10) : 0
    } as {
      term: string;
      limit: number;
      offset: number;
      entityType?: string;
    };
    
    if (httpRequest.entityType) {
      result.entityType = httpRequest.entityType;
    }
    
    return result;
  }

  /**
   * Map Application SPARQL response to HTTP response
   */
  static toHttpSparqlQueryResponse(
    appResponse: BaseResponse<SparqlQueryResponse>
  ): HttpSparqlQueryResponse {
    const data = appResponse.data;
    return {
      results: data.results.bindings,
      format: 'json',
      queryTime: data.executionTime,
      resultCount: data.resultCount
    };
  }

  /**
   * Map Application graph stats to HTTP metadata response
   */
  static toHttpGraphMetadata(
    appResponse: BaseResponse<GraphStatsResponse>
  ): HttpGraphMetadata {
    const data = appResponse.data;
    return {
      totalTriples: data.totalTriples,
      totalEntities: data.namedGraphs.length,
      frameworks: [], // Would need to be queried from the graph
      industries: [], // Would need to be queried from the graph
      lastUpdated: data.lastUpdated
    };
  }

  /**
   * Create mock entity search response (would implement real search via SPARQL)
   */
  static createEntitySearchResponse(
    searchResults: any[],
    searchTerm: string,
    limit: number,
    offset: number,
    total: number
  ): HttpEntitySearchResponse {
    return {
      entities: searchResults.map((result: any) => ({
        uri: result.uri || result.subject,
        label: result.label || result.name || 'Unknown',
        type: result.type || 'Entity',
        description: result.description
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      },
      searchTerm
    };
  }
}