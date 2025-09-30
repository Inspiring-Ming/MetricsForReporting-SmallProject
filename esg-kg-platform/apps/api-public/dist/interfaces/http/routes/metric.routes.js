import { Router } from 'express';
import { metricValidation, asyncErrorHandler, validateRequest, validatePathParam, pathValidators } from '../middleware';
import { createAuthMiddleware, generalRateLimit, writeOperationRateLimit } from '../middleware';
export function createMetricRoutes(metricController) {
    const router = Router();
    router.use(generalRateLimit);
    router.post('/', writeOperationRateLimit, createAuthMiddleware(['write:metrics']), metricValidation.create, validateRequest, asyncErrorHandler(metricController.createMetric.bind(metricController)));
    router.post('/batch', writeOperationRateLimit, createAuthMiddleware(['write:metrics']), metricValidation.batch, validateRequest, asyncErrorHandler(metricController.createMetricsBatch.bind(metricController)));
    router.get('/', createAuthMiddleware(['read:metrics']), metricValidation.query, validateRequest, asyncErrorHandler(metricController.queryMetrics.bind(metricController)));
    router.get('/:id', validatePathParam('id', pathValidators.nonEmptyString), createAuthMiddleware(['read:metrics']), metricValidation.id, validateRequest, asyncErrorHandler(metricController.getMetricById.bind(metricController)));
    router.put('/:id', validatePathParam('id', pathValidators.nonEmptyString), writeOperationRateLimit, createAuthMiddleware(['write:metrics']), metricValidation.id, metricValidation.update, validateRequest, asyncErrorHandler(metricController.updateMetric.bind(metricController)));
    router.delete('/:id', validatePathParam('id', pathValidators.nonEmptyString), writeOperationRateLimit, createAuthMiddleware(['write:metrics']), metricValidation.id, validateRequest, asyncErrorHandler(metricController.deleteMetric.bind(metricController)));
    router.post('/validate', createAuthMiddleware(['validate:metrics']), metricValidation.create, validateRequest, asyncErrorHandler(metricController.validateMetric.bind(metricController)));
    return router;
}
//# sourceMappingURL=metric.routes.js.map