import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export class GraphDbConnectionError extends DomainError {
    code = 'GRAPHDB_CONNECTION_ERROR';
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
}
export class GraphDbQueryError extends DomainError {
    code = 'GRAPHDB_QUERY_ERROR';
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export class GraphDbClient {
    baseUrl;
    repository;
    timeout;
    maxRetries;
    constructor(config) {
        this.baseUrl = config.endpoint.replace(/\/$/, '');
        this.repository = config.repository;
        this.timeout = config.timeout || 30000;
        this.maxRetries = config.maxRetries || 3;
    }
    async query(sparql) {
        const url = `${this.baseUrl}/repositories/${this.repository}`;
        try {
            const result = await this.executeWithRetry(async () => {
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
                    throw new GraphDbQueryError(`SPARQL query failed: ${response.statusText}`, { status: response.status, sparql });
                }
                return await response.json();
            });
            return result;
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new GraphDbConnectionError(`Failed to execute SPARQL query: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async update(sparql) {
        const url = `${this.baseUrl}/repositories/${this.repository}/statements`;
        const startTime = Date.now();
        try {
            await this.executeWithRetry(async () => {
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
                    throw new GraphDbQueryError(`SPARQL update failed: ${response.statusText}`, { status: response.status, sparql });
                }
                return response;
            });
            return {
                success: true,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new GraphDbConnectionError(`Failed to execute SPARQL update: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async insertRdf(rdfData, graphUri, format = 'text/turtle') {
        const baseUrl = `${this.baseUrl}/repositories/${this.repository}/rdf-graphs/service`;
        const url = graphUri ? `${baseUrl}?graph=${encodeURIComponent(graphUri)}` : baseUrl;
        const startTime = Date.now();
        try {
            await this.executeWithRetry(async () => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': format
                    },
                    body: rdfData,
                    signal: AbortSignal.timeout(this.timeout)
                });
                if (!response.ok) {
                    throw new GraphDbQueryError(`RDF insert failed: ${response.statusText}`, { status: response.status, graphUri, format });
                }
                return response;
            });
            const tripleCount = this.estimateTripleCount(rdfData);
            return {
                success: true,
                triples: tripleCount,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new GraphDbConnectionError(`Failed to insert RDF data: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async ping() {
        try {
            const url = `${this.baseUrl}/rest/repositories`;
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async getRepositoryInfo() {
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
        }
        catch (error) {
            throw new GraphDbConnectionError(`Failed to get repository info: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt === this.maxRetries || error instanceof DomainError) {
                    break;
                }
                const delay = 100 * (2 ** attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    estimateTripleCount(rdfData) {
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
//# sourceMappingURL=graphdb.client.js.map