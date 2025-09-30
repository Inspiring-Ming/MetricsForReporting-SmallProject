import { Router } from 'express';
import { knowledgeGraphValidation, asyncErrorHandler, createAuthMiddleware, generalRateLimit, heavyOperationRateLimit } from '../middleware';
export function createKnowledgeGraphRoutes(knowledgeGraphController) {
    const router = Router();
    router.use(generalRateLimit);
    router.post('/query', heavyOperationRateLimit, createAuthMiddleware(['query:knowledge-graph']), knowledgeGraphValidation.sparqlQuery, asyncErrorHandler(knowledgeGraphController.executeSparqlQuery.bind(knowledgeGraphController)));
    router.get('/entities/search', createAuthMiddleware(['read:knowledge-graph']), knowledgeGraphValidation.entitySearch, asyncErrorHandler(knowledgeGraphController.searchEntities.bind(knowledgeGraphController)));
    router.get('/metadata', createAuthMiddleware(['read:knowledge-graph']), asyncErrorHandler(knowledgeGraphController.getGraphMetadata.bind(knowledgeGraphController)));
    router.get('/entities/:uri', createAuthMiddleware(['read:knowledge-graph']), knowledgeGraphValidation.entityUri, asyncErrorHandler(knowledgeGraphController.getEntityByUri.bind(knowledgeGraphController)));
    return router;
}
//# sourceMappingURL=knowledge-graph.routes.js.map