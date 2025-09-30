export class KnowledgeGraphQueryService {
    knowledgeGraph;
    cache;
    constructor(knowledgeGraph, cache) {
        this.knowledgeGraph = knowledgeGraph;
        this.cache = cache;
    }
    async executeSparqlQuery(query, limit, offset) {
        const timestamp = new Date().toISOString();
        try {
            const validationResult = this.validateSparqlQuery(query);
            if (!validationResult.valid) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const cacheKey = this.buildQueryCacheKey(query, limit, offset);
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const queryResults = await this.knowledgeGraph.executeSparqlQuery(query);
            const paginatedResults = this.applyPagination(queryResults, limit, offset);
            const result = {
                bindings: paginatedResults.map(row => {
                    const binding = {};
                    Object.entries(row).forEach(([key, value]) => {
                        if (typeof value === 'string') {
                            binding[key] = {
                                type: 'literal',
                                value: value
                            };
                        }
                        else if (typeof value === 'object' && value !== null) {
                            binding[key] = {
                                type: 'literal',
                                value: String(value)
                            };
                        }
                    });
                    return binding;
                }),
                totalCount: queryResults.length
            };
            await this.cache.set(cacheKey, result, 600);
            return {
                data: result,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to execute SPARQL query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getFrameworks() {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = 'frameworks:all';
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const frameworks = await this.knowledgeGraph.getFrameworks();
            await this.cache.set(cacheKey, frameworks, 86400);
            return {
                data: frameworks,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get frameworks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getIndustries(framework) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `industries:${framework}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const industries = await this.knowledgeGraph.getIndustries(framework);
            await this.cache.set(cacheKey, industries, 21600);
            return {
                data: industries,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get industries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getMetricCodes(framework, industry) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `metric-codes:${framework}:${industry}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const codes = await this.knowledgeGraph.getMetricCodes(framework, industry);
            await this.cache.set(cacheKey, codes, 10800);
            return {
                data: codes,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get metric codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getEntity(entityId) {
        const timestamp = new Date().toISOString();
        try {
            if (!this.isValidEntityId(entityId)) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const cacheKey = `entity:${entityId}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const entity = {
                iri: entityId,
                type: 'Entity',
                properties: {}
            };
            await this.cache.set(cacheKey, entity, 1800);
            return {
                data: entity,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async searchEntities(type, properties, limit, offset) {
        const timestamp = new Date().toISOString();
        try {
            if (type && type.trim() === '') {
                throw new Error('Type cannot be empty');
            }
            if (properties && Object.keys(properties).length === 0) {
                throw new Error('Properties cannot be empty object');
            }
            return {
                data: [],
                timestamp,
                status: 'success',
                pagination: {
                    page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
                    size: limit || 10,
                    total: 0,
                    hasNext: false
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to search entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getMetricDefinitions(framework, industry) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `metric-definitions:${framework}:${industry || 'all'}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const definitions = await this.knowledgeGraph.getMetricDefinitions(framework, industry);
            await this.cache.set(cacheKey, definitions, 7200);
            return {
                data: definitions,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get metric definitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateSparqlQuery(query) {
        const errors = [];
        if (!query || query.trim() === '') {
            errors.push('SPARQL query cannot be empty');
        }
        if (query.length > 10000) {
            errors.push('SPARQL query too long (max 10,000 characters)');
        }
        if (!query.toLowerCase().includes('select') && !query.toLowerCase().includes('construct') &&
            !query.toLowerCase().includes('ask') && !query.toLowerCase().includes('describe')) {
            errors.push('Invalid SPARQL query: must contain SELECT, CONSTRUCT, ASK, or DESCRIBE');
        }
        const dangerousPatterns = ['drop', 'delete', 'insert', 'create', 'load'];
        const lowerQuery = query.toLowerCase();
        for (const pattern of dangerousPatterns) {
            if (lowerQuery.includes(pattern)) {
                errors.push(`SPARQL query contains forbidden operation: ${pattern.toUpperCase()}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    applyPagination(results, limit, offset) {
        let paginatedResults = results;
        if (offset && offset > 0) {
            paginatedResults = paginatedResults.slice(offset);
        }
        if (limit && limit > 0) {
            paginatedResults = paginatedResults.slice(0, limit);
        }
        return paginatedResults;
    }
    buildQueryCacheKey(query, limit, offset) {
        const queryHash = this.simpleHash(query);
        const parts = ['sparql', queryHash];
        if (limit)
            parts.push(`limit:${limit}`);
        if (offset)
            parts.push(`offset:${offset}`);
        return parts.join(':');
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    isValidEntityId(entityId) {
        if (!entityId || entityId.trim() === '') {
            return false;
        }
        if (entityId.length > 500) {
            return false;
        }
        const iriPattern = /^https?:\/\//;
        const identifierPattern = /^[a-zA-Z0-9\-._:]+$/;
        return iriPattern.test(entityId) || identifierPattern.test(entityId);
    }
}
//# sourceMappingURL=knowledge-graph-query.service.js.map