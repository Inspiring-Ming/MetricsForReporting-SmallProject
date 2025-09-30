export class KnowledgeGraphDtoMapper {
    static toSparqlQueryRequest(httpRequest) {
        const result = {
            query: httpRequest.query
        };
        if (httpRequest.format && ['json', 'xml', 'csv', 'turtle'].includes(httpRequest.format)) {
            result.format = httpRequest.format;
        }
        if (httpRequest.timeout)
            result.timeout = parseInt(httpRequest.timeout, 10);
        return result;
    }
    static toEntitySearchParams(httpRequest) {
        const result = {
            term: httpRequest.term,
            limit: httpRequest.limit ? parseInt(httpRequest.limit, 10) : 50,
            offset: httpRequest.offset ? parseInt(httpRequest.offset, 10) : 0
        };
        if (httpRequest.entityType) {
            result.entityType = httpRequest.entityType;
        }
        return result;
    }
    static toHttpSparqlQueryResponse(appResponse) {
        const data = appResponse.data;
        return {
            results: data.results.bindings,
            format: 'json',
            queryTime: data.executionTime,
            resultCount: data.resultCount
        };
    }
    static toHttpGraphMetadata(appResponse) {
        const data = appResponse.data;
        return {
            totalTriples: data.totalTriples,
            totalEntities: data.namedGraphs.length,
            frameworks: [],
            industries: [],
            lastUpdated: data.lastUpdated
        };
    }
    static createEntitySearchResponse(searchResults, searchTerm, limit, offset, total) {
        return {
            entities: searchResults.map((result) => ({
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
//# sourceMappingURL=knowledge-graph.mapper.js.map