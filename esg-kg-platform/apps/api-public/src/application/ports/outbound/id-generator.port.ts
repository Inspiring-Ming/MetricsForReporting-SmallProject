/**
 * ID generation strategies
 */
export type IdGenerationStrategy = 'uuid' | 'iri' | 'sequential';

/**
 * Outbound port for ID generation
 * Defines the contract for generating unique identifiers
 */
export interface IdGeneratorPort {
  /**
   * Generate a unique ID using the specified strategy
   */
  generate(strategy?: IdGenerationStrategy): Promise<string>;

  /**
   * Generate an IRI for ESG entities
   */
  generateIri(type: string, identifier: string): Promise<string>;

  /**
   * Generate batch of IDs
   */
  generateBatch(count: number, strategy?: IdGenerationStrategy): Promise<string[]>;

  /**
   * Validate ID format
   */
  validateId(id: string, strategy: IdGenerationStrategy): boolean;
}