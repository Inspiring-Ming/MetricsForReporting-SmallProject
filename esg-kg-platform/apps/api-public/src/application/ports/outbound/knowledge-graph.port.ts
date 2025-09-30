import { ComputationMethod, Framework } from '@esg-platform/dto';

/**
 * Outbound port for knowledge graph operations
 * Defines the contract for interacting with the RDF knowledge graph
 */
export interface KnowledgeGraphPort {
  /**
   * Execute a SPARQL query
   */
  executeSparqlQuery(query: string): Promise<Record<string, unknown>[]>;

  /**
   * Get computation methods from the knowledge graph
   */
  getComputationMethods(framework: Framework, industry: string): Promise<ComputationMethod[]>;

  /**
   * Get a specific computation method
   */
  getComputationMethod(
    framework: Framework,
    industry: string,
    code: string
  ): Promise<ComputationMethod | null>;

  /**
   * Get available frameworks
   */
  getFrameworks(): Promise<Framework[]>;

  /**
   * Get industries for a framework
   */
  getIndustries(framework: Framework): Promise<string[]>;

  /**
   * Get metric codes for framework and industry
   */
  getMetricCodes(framework: Framework, industry: string): Promise<string[]>;

  /**
   * Get metric definitions from the knowledge graph
   */
  getMetricDefinitions(framework: Framework, industry?: string): Promise<Array<{
    code: string;
    name: string;
    description: string;
    unit: string;
  }>>;

  /**
   * Validate metric against SHACL constraints
   */
  validateMetricStructure(metric: unknown): Promise<{
    valid: boolean;
    violations: Array<{
      path: string;
      message: string;
    }>;
  }>;

  /**
   * Check if an entity exists in the knowledge graph
   */
  entityExists(entityId: string): Promise<boolean>;

  /**
   * Get entity information
   */
  getEntity(entityId: string): Promise<{
    iri: string;
    type: string;
    properties: Record<string, unknown>;
  } | null>;

  // Knowledge Graph Navigation Methods

  /**
   * Get reporting frameworks applicable to a specific industry
   */
  getReportingFrameworks(industry: string): Promise<Array<{
    code: Framework;
    name: string;
    description?: string | undefined;
  }>>;

  /**
   * Get categories for a specific industry and framework
   */
  getCategoriesByIndustryAndFramework(
    industry: string,
    framework: Framework
  ): Promise<Array<{
    code: string;
    name: string;
    description?: string | undefined;
  }>>;

  /**
   * Get metrics under a specific category
   */
  getMetricsByIndustryAndCategory(
    industry: string,
    framework: Framework,
    categoryLabel: string
  ): Promise<Array<{
    code: string;
    name: string;
    description?: string | undefined;
    unitIri?: string | undefined;
  }>>;
}