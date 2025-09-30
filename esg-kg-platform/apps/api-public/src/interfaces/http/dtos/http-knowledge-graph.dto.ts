/**
 * HTTP-specific DTOs for Knowledge Graph operations
 */

// HTTP Request DTOs
export interface HttpSparqlQueryRequest {
  query: string;
  format?: 'json' | 'turtle' | 'xml';
  timeout?: string; // String from query param, will be parsed to number
}

export interface HttpEntitySearchRequest {
  term: string;
  limit?: string; // String from query param
  offset?: string; // String from query param
  entityType?: string;
}

// HTTP Response DTOs
export interface HttpSparqlQueryResponse {
  results: unknown; // SPARQL results can have varying structures
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