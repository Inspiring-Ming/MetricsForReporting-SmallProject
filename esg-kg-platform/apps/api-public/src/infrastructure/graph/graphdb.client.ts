/**
 * GraphDB Client - HTTP client for GraphDB SPARQL endpoint
 * 
 * Responsibilities:
 * - Execute SPARQL queries and updates
 * - Handle HTTP connections to GraphDB
 * - Provide typed responses for SPARQL operations
 * - Connection pooling and error handling
 */

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

export class GraphDbConnectionError extends DomainError {
  readonly code = 'GRAPHDB_CONNECTION_ERROR';
  readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;
}

export class GraphDbQueryError extends DomainError {
  readonly code = 'GRAPHDB_QUERY_ERROR';
  readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}

export class GraphDbClient {
  private readonly baseUrl: string;
  private readonly repository: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: GraphDbConfig) {
    this.baseUrl = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.repository = config.repository;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Execute SPARQL SELECT query
   */
  async query(sparql: string): Promise<SparqlResult> {
    const url = `${this.baseUrl}/repositories/${this.repository}`;
    
    try {
      const result: SparqlResult = await this.executeWithRetry(async (): Promise<SparqlResult> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
          },
          body: `query=${encodeURIComponent(sparql)}`,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new GraphDbQueryError(
            `SPARQL query failed: ${response.statusText}`,
            { status: response.status, sparql }
          );
        }

        return await response.json() as SparqlResult;
      });

      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new GraphDbConnectionError(
        `Failed to execute SPARQL query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute SPARQL UPDATE (INSERT, DELETE)
   */
  async update(sparql: string): Promise<UpdateResult> {
    const url = `${this.baseUrl}/repositories/${this.repository}/statements`;
    const startTime = Date.now();
    
    try {
      await this.executeWithRetry(async (): Promise<Response> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: `update=${encodeURIComponent(sparql)}`,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new GraphDbQueryError(
            `SPARQL update failed: ${response.statusText}`,
            { status: response.status, sparql }
          );
        }

        return response;
      });

      return {
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new GraphDbConnectionError(
        `Failed to execute SPARQL update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Insert RDF data directly
   */
  async insertRdf(rdfData: string, graphUri?: string, format: string = 'text/turtle'): Promise<UpdateResult> {
    const baseUrl = `${this.baseUrl}/repositories/${this.repository}/rdf-graphs/service`;
    const url = graphUri ? `${baseUrl}?graph=${encodeURIComponent(graphUri)}` : baseUrl;
    const startTime = Date.now();
    
    try {
      await this.executeWithRetry(async (): Promise<Response> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': format
          },
          body: rdfData,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new GraphDbQueryError(
            `RDF insert failed: ${response.statusText}`,
            { status: response.status, graphUri, format }
          );
        }

        return response;
      });

      // Count triples by parsing RDF data (simple heuristic)
      const tripleCount = this.estimateTripleCount(rdfData);

      return {
        success: true,
        triples: tripleCount,
        duration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new GraphDbConnectionError(
        `Failed to insert RDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Test connection to GraphDB
   */
  async ping(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/rest/repositories`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for ping
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/rest/repositories/${this.repository}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new GraphDbConnectionError(`Repository info failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new GraphDbConnectionError(
        `Failed to get repository info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.maxRetries || error instanceof DomainError) {
          break;
        }

        // Exponential backoff: 100ms, 300ms, 700ms
        const delay = 100 * (2 ** attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Estimate triple count from RDF data (simple heuristic)
   */
  private estimateTripleCount(rdfData: string): number {
    // Simple heuristic: count lines that look like triples (contain " . " or end with " .")
    const lines = rdfData.split('\n');
    let count = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('@') && !trimmed.startsWith('#')) {
        if (trimmed.includes(' . ') || trimmed.endsWith(' .')) {
          count++;
        }
      }
    }
    
    return count;
  }
}
