export interface SparqlQueryRequest {
  query: string;
  format?: 'json' | 'xml' | 'csv' | 'turtle';
  timeout?: number;
  reasoning?: boolean;
}

export interface SparqlQueryResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: Record<string, {
      type: 'uri' | 'literal' | 'bnode';
      value: string;
      datatype?: string;
      'xml:lang'?: string;
    }>[];
  };
  executionTime: number;
  resultCount: number;
}

export interface RdfUploadRequest {
  content: string;
  format: 'turtle' | 'rdf-xml' | 'n3' | 'json-ld';
  namedGraph?: string;
  replace?: boolean;
}

export interface RdfUploadResponse {
  success: boolean;
  triplesAdded: number;
  namedGraph: string;
  processedAt: string;
  validationResult?: {
    valid: boolean;
    violations: Array<{
      message: string;
      path: string;
      severity: string;
    }>;
  };
}

export interface GraphQueryParams {
  subject?: string;
  predicate?: string;
  object?: string;
  namedGraph?: string;
  limit?: number;
  offset?: number;
}

export interface TripleDto {
  subject: string;
  predicate: string;
  object: string;
  namedGraph?: string;
  datatype?: string;
  language?: string;
}

export interface GraphStatsResponse {
  totalTriples: number;
  namedGraphs: Array<{
    iri: string;
    tripleCount: number;
  }>;
  lastUpdated: string;
}

export interface ValidationRequest {
  content: string;
  format: 'turtle' | 'rdf-xml' | 'json-ld';
  shaclShapes?: string[];
}

export interface ValidationResponse {
  valid: boolean;
  violations: Array<{
    focusNode: string;
    resultPath: string;
    resultMessage: string;
    severity: 'violation' | 'warning' | 'info';
    sourceConstraintComponent: string;
  }>;
  validatedAt: string;
}
