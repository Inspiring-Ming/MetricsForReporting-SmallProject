import {
  Framework,
  BaseResponse,
  PaginatedResponse
} from '@esg-platform/dto';

/**
 * Knowledge graph entity for SPARQL query results
 */
export interface KnowledgeGraphEntity {
  iri: string;
  type: string;
  properties: Record<string, unknown>;
}

/**
 * SPARQL query result
 */
export interface SparqlQueryResult {
  bindings: Record<string, { type: string; value: string }>[];
  totalCount?: number;
}

/**
 * Inbound port for knowledge graph queries
 * Defines use cases for querying the ESG knowledge graph
 */
export interface KnowledgeGraphQueryPort {
  /**
   * Execute a SPARQL query against the knowledge graph
   */
  executeSparqlQuery(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<BaseResponse<SparqlQueryResult>>;

  /**
   * Get framework information
   */
  getFrameworks(): Promise<BaseResponse<Framework[]>>;

  /**
   * Get industries for a specific framework
   */
  getIndustries(framework: Framework): Promise<BaseResponse<string[]>>;

  /**
   * Get metric codes for a framework and industry
   */
  getMetricCodes(
    framework: Framework,
    industry: string
  ): Promise<BaseResponse<string[]>>;

  /**
   * Get entity information by ID
   */
  getEntity(entityId: string): Promise<BaseResponse<KnowledgeGraphEntity>>;

  /**
   * Search entities by type and properties
   */
  searchEntities(
    type?: string,
    properties?: Record<string, string>,
    limit?: number,
    offset?: number
  ): Promise<PaginatedResponse<KnowledgeGraphEntity>>;

  /**
   * Get metric definitions from the knowledge graph
   */
  getMetricDefinitions(
    framework: Framework,
    industry?: string
  ): Promise<BaseResponse<Array<{
    code: string;
    name: string;
    description: string;
    unit: string;
  }>>>;
}