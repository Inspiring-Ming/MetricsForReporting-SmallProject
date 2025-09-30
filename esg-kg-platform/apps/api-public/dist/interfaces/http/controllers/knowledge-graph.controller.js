import { validationResult } from 'express-validator';
import { KnowledgeGraphDtoMapper } from '../mappers/knowledge-graph.mapper';
export class KnowledgeGraphController {
    knowledgeGraphService;
    constructor(knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }
    async executeSparqlQuery(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid SPARQL query request',
                    status: 400,
                    detail: 'The SPARQL query request contains invalid data.',
                    instance: req.path,
                    errors: errors.array().map(err => ({
                        field: 'path' in err ? err.path : 'unknown',
                        code: 'invalid_format',
                        message: err.msg
                    })),
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const httpRequest = req.body;
            const appRequest = KnowledgeGraphDtoMapper.toSparqlQueryRequest(httpRequest);
            const appResponse = await this.knowledgeGraphService.executeSparqlQuery(appRequest.query, appRequest.timeout);
            const httpResponse = {
                results: appResponse.data.bindings,
                format: 'json',
                queryTime: 0,
                resultCount: appResponse.data.bindings.length
            };
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async searchEntities(req, res, next) {
        try {
            const { term, limit, offset, entityType } = req.query;
            if (!term || typeof term !== 'string') {
                const errorResponse = {
                    type: 'missing_parameters',
                    title: 'Missing search term',
                    status: 400,
                    detail: 'Search term parameter is required.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const httpRequest = {
                term,
                limit: limit,
                offset: offset,
                entityType: entityType
            };
            const searchParams = KnowledgeGraphDtoMapper.toEntitySearchParams(httpRequest);
            const sparqlQuery = this.buildEntitySearchQuery(searchParams.term, searchParams.entityType, searchParams.limit, searchParams.offset);
            const appResponse = await this.knowledgeGraphService.executeSparqlQuery(sparqlQuery, searchParams.limit, searchParams.offset);
            const httpResponse = KnowledgeGraphDtoMapper.createEntitySearchResponse([], searchParams.term, searchParams.limit, searchParams.offset, appResponse.data ? 0 : 0);
            res.status(200).json({
                data: httpResponse,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getGraphMetadata(_req, res, next) {
        try {
            const mockMetadata = {
                totalTriples: 1000000,
                totalEntities: 50000,
                frameworks: ['SASB', 'GRI', 'TCFD'],
                industries: ['Banking', 'Technology', 'Energy'],
                lastUpdated: new Date().toISOString()
            };
            res.status(200).json({
                data: mockMetadata,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getEntityByUri(req, res, next) {
        try {
            const { uri } = req.params;
            if (!uri) {
                const errorResponse = {
                    type: 'missing_parameters',
                    title: 'Missing entity URI',
                    status: 400,
                    detail: 'Entity URI parameter is required.',
                    instance: req.path,
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
            const sparqlQuery = this.buildEntityDetailsQuery(decodeURIComponent(uri));
            const appResponse = await this.knowledgeGraphService.executeSparqlQuery(sparqlQuery);
            res.status(200).json({
                data: {
                    entity: appResponse.data,
                    uri: decodeURIComponent(uri)
                },
                timestamp: new Date().toISOString(),
                status: 'success'
            });
        }
        catch (error) {
            next(error);
        }
    }
    buildEntitySearchQuery(term, entityType, limit = 50, offset = 0) {
        const typeFilter = entityType
            ? `?entity a <${entityType}> .`
            : '?entity a ?type .';
        return `
      SELECT ?entity ?label ?type ?description
      WHERE {
        ${typeFilter}
        OPTIONAL { ?entity rdfs:label ?label . }
        OPTIONAL { ?entity rdfs:comment ?description . }
        FILTER(
          CONTAINS(LCASE(STR(?entity)), LCASE("${term}")) ||
          CONTAINS(LCASE(STR(?label)), LCASE("${term}"))
        )
      }
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    }
    buildEntityDetailsQuery(uri) {
        return `
      SELECT ?predicate ?object
      WHERE {
        <${uri}> ?predicate ?object .
      }
    `;
    }
}
//# sourceMappingURL=knowledge-graph.controller.js.map