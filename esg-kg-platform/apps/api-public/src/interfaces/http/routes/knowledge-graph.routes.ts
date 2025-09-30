/**
 * Knowledge Graph Routes - API endpoints for knowledge graph operations
 */

import { Router } from 'express';
import { KnowledgeGraphController } from '../controllers/knowledge-graph.controller';
import { 
  knowledgeGraphValidation, 
  asyncErrorHandler, 
  createAuthMiddleware, 
  generalRateLimit, 
  heavyOperationRateLimit 
} from '../middleware';

/**
 * Create knowledge graph routes with controller and middleware
 */
export function createKnowledgeGraphRoutes(knowledgeGraphController: KnowledgeGraphController): Router {
  const router = Router();

  // Apply general rate limiting to all knowledge graph routes
  router.use(generalRateLimit);

  /**
   * POST /knowledge-graph/query - Execute SPARQL query
   */
  router.post(
    '/query',
    heavyOperationRateLimit,
    createAuthMiddleware(['query:knowledge-graph']),
    knowledgeGraphValidation.sparqlQuery,
    asyncErrorHandler(knowledgeGraphController.executeSparqlQuery.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/entities/search - Search for entities
   */
  router.get(
    '/entities/search',
    createAuthMiddleware(['read:knowledge-graph']),
    knowledgeGraphValidation.entitySearch,
    asyncErrorHandler(knowledgeGraphController.searchEntities.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/metadata - Get graph statistics and metadata
   */
  router.get(
    '/metadata',
    createAuthMiddleware(['read:knowledge-graph']),
    asyncErrorHandler(knowledgeGraphController.getGraphMetadata.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/entities/:uri - Get specific entity by URI
   */
  router.get(
    '/entities/:uri',
    createAuthMiddleware(['read:knowledge-graph']),
    knowledgeGraphValidation.entityUri,
    asyncErrorHandler(knowledgeGraphController.getEntityByUri.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/frameworks - Get reporting frameworks for industry
   */
  router.get(
    '/frameworks',
    createAuthMiddleware(['read:knowledge-graph']),
    asyncErrorHandler(knowledgeGraphController.getFrameworksByIndustry.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/categories - Get categories for industry and framework
   */
  router.get(
    '/categories',
    createAuthMiddleware(['read:knowledge-graph']),
    asyncErrorHandler(knowledgeGraphController.getCategoriesByIndustryAndFramework.bind(knowledgeGraphController))
  );

  /**
   * GET /knowledge-graph/metrics - Get metrics by category
   */
  router.get(
    '/metrics',
    createAuthMiddleware(['read:knowledge-graph']),
    asyncErrorHandler(knowledgeGraphController.getMetricsByCategory.bind(knowledgeGraphController))
  );

  return router;
}