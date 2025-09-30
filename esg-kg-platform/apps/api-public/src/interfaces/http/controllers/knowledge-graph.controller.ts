/**
 * Knowledge Graph Controller - Thin HTTP interface layer
 * 
 * Handles knowledge graph operations:
 * - SPARQL queries
 * - Entity search
 * - Graph metadata
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { KnowledgeGraphQueryPort, KnowledgeGraphNavigationPort } from '../../../application/ports/inbound';
import { KnowledgeGraphDtoMapper } from '../mappers/knowledge-graph.mapper';
import {
  HttpSparqlQueryRequest,
  HttpEntitySearchRequest,
  HttpErrorResponse
} from '../dtos';

export class KnowledgeGraphController {
  constructor(
    private readonly knowledgeGraphService: KnowledgeGraphQueryPort,
    private readonly knowledgeGraphNavigationService: KnowledgeGraphNavigationPort
  ) {}

  /**
   * POST /knowledge-graph/query - Execute SPARQL query
   */
  async executeSparqlQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorResponse: HttpErrorResponse = {
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

      const httpRequest = req.body as HttpSparqlQueryRequest;
      const appRequest = KnowledgeGraphDtoMapper.toSparqlQueryRequest(httpRequest);

      const appResponse = await this.knowledgeGraphService.executeSparqlQuery(
        appRequest.query,
        appRequest.timeout
      );

      const httpResponse = {
        results: appResponse.data.bindings,
        format: 'json',
        queryTime: 0, // Would be provided by the service
        resultCount: appResponse.data.bindings.length
      };

      res.status(200).json({
        data: httpResponse,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /knowledge-graph/entities/search - Search for entities
   */
  async searchEntities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { term, limit, offset, entityType } = req.query;

      if (!term || typeof term !== 'string') {
        const errorResponse: HttpErrorResponse = {
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

      const httpRequest: HttpEntitySearchRequest = {
        term,
        limit: limit as string,
        offset: offset as string,
        entityType: entityType as string
      };

      const searchParams = KnowledgeGraphDtoMapper.toEntitySearchParams(httpRequest);

      // Build SPARQL query for entity search
      const sparqlQuery = this.buildEntitySearchQuery(
        searchParams.term,
        searchParams.entityType,
        searchParams.limit,
        searchParams.offset
      );

      const appResponse = await this.knowledgeGraphService.executeSparqlQuery(
        sparqlQuery,
        searchParams.limit,
        searchParams.offset
      );

      // Map application response to HTTP response through mapper
      // Note: In a real implementation, mapper would extract entities from SPARQL results
      const httpResponse = KnowledgeGraphDtoMapper.createEntitySearchResponse(
        [], // TODO: Mapper should transform appResponse.data to entities array
        searchParams.term,
        searchParams.limit,
        searchParams.offset,
        appResponse.data ? 0 : 0 // TODO: Extract actual count from appResponse.data
      );

      res.status(200).json({
        data: httpResponse,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /knowledge-graph/metadata - Get graph statistics and metadata
   */
  async getGraphMetadata(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Mock implementation - would use a metadata query
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /knowledge-graph/entities/:uri - Get specific entity by URI
   */
  async getEntityByUri(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uri } = req.params;

      if (!uri) {
        const errorResponse: HttpErrorResponse = {
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

      // Build SPARQL query to get entity details
      const sparqlQuery = this.buildEntityDetailsQuery(decodeURIComponent(uri));

      const appResponse = await this.knowledgeGraphService.executeSparqlQuery(sparqlQuery);

      res.status(200).json({
        data: {
          entity: appResponse.data, // Mapper should handle the transformation
          uri: decodeURIComponent(uri)
        },
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build SPARQL query for entity search
   */
  private buildEntitySearchQuery(
    term: string,
    entityType?: string,
    limit: number = 50,
    offset: number = 0
  ): string {
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

  /**
   * Build SPARQL query for entity details
   */
  private buildEntityDetailsQuery(uri: string): string {
    return `
      SELECT ?predicate ?object
      WHERE {
        <${uri}> ?predicate ?object .
      }
    `;
  }

  // Knowledge Graph Navigation Methods

  /**
   * GET /knowledge-graph/frameworks - Get reporting frameworks for industry
   */
  async getFrameworksByIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { industry } = req.query;

      if (!industry || typeof industry !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing industry parameter',
          status: 400,
          detail: 'Industry parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.knowledgeGraphNavigationService.getFrameworksByIndustry(industry);

      res.status(200).json({
        data: result.data,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /knowledge-graph/categories - Get categories for industry and framework
   */
  async getCategoriesByIndustryAndFramework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { industry, framework } = req.query;

      if (!industry || typeof industry !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing industry parameter',
          status: 400,
          detail: 'Industry parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!framework || typeof framework !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing framework parameter',
          status: 400,
          detail: 'Framework parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.knowledgeGraphNavigationService.getCategoriesByIndustryAndFramework(
        industry, 
        framework as any // TypeScript will validate this at runtime through service layer
      );

      res.status(200).json({
        data: result.data,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /knowledge-graph/metrics - Get metrics by category
   */
  async getMetricsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { industry, framework, categoryLabel } = req.query;

      if (!industry || typeof industry !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing industry parameter',
          status: 400,
          detail: 'Industry parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!framework || typeof framework !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing framework parameter',
          status: 400,
          detail: 'Framework parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!categoryLabel || typeof categoryLabel !== 'string') {
        const errorResponse: HttpErrorResponse = {
          type: 'missing_parameters',
          title: 'Missing categoryLabel parameter',
          status: 400,
          detail: 'CategoryLabel parameter is required.',
          instance: req.path,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.knowledgeGraphNavigationService.getMetricsByCategory(
        industry,
        framework as any, // TypeScript will validate this at runtime through service layer
        categoryLabel
      );

      res.status(200).json({
        data: result.data,
        timestamp: result.timestamp,
        status: result.status
      });
    } catch (error) {
      next(error);
    }
  }

}