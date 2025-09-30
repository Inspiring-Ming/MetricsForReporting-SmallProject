/**
 * Metric Routes - RESTful API endpoints for metric operations
 */

import { Router } from 'express';
import { MetricController } from '../controllers/metric.controller';
import { 
  metricValidation, 
  asyncErrorHandler,
  validateRequest,
  validatePathParam,
  pathValidators
} from '../middleware';
import { createAuthMiddleware, generalRateLimit, writeOperationRateLimit } from '../middleware';

/**
 * Create metric routes with controller and middleware
 */
export function createMetricRoutes(metricController: MetricController): Router {
  const router = Router();

  // Apply general rate limiting to all metric routes
  router.use(generalRateLimit);

  /**
   * POST /metrics - Create single metric
   */
  router.post(
    '/',
    writeOperationRateLimit,
    createAuthMiddleware(['write:metrics']),
    metricValidation.create,
    validateRequest, // Unified validation middleware
    asyncErrorHandler(metricController.createMetric.bind(metricController))
  );

  /**
   * POST /metrics/batch - Create multiple metrics
   */
  router.post(
    '/batch',
    writeOperationRateLimit,
    createAuthMiddleware(['write:metrics']),
    metricValidation.batch,
    validateRequest,
    asyncErrorHandler(metricController.createMetricsBatch.bind(metricController))
  );

  /**
   * GET /metrics - Query metrics with filters and pagination
   */
  router.get(
    '/',
    createAuthMiddleware(['read:metrics']),
    metricValidation.query,
    validateRequest,
    asyncErrorHandler(metricController.queryMetrics.bind(metricController))
  );

  /**
   * GET /metrics/:id - Get specific metric by ID
   */
  router.get(
    '/:id',
    validatePathParam('id', pathValidators.nonEmptyString),
    createAuthMiddleware(['read:metrics']),
    metricValidation.id,
    validateRequest,
    asyncErrorHandler(metricController.getMetricById.bind(metricController))
  );

  /**
   * PUT /metrics/:id - Update existing metric
   */
  router.put(
    '/:id',
    validatePathParam('id', pathValidators.nonEmptyString),
    writeOperationRateLimit,
    createAuthMiddleware(['write:metrics']),
    metricValidation.id,
    metricValidation.update,
    validateRequest,
    asyncErrorHandler(metricController.updateMetric.bind(metricController))
  );

  /**
   * DELETE /metrics/:id - Delete metric by ID
   */
  router.delete(
    '/:id',
    validatePathParam('id', pathValidators.nonEmptyString),
    writeOperationRateLimit,
    createAuthMiddleware(['write:metrics']),
    metricValidation.id,
    validateRequest,
    asyncErrorHandler(metricController.deleteMetric.bind(metricController))
  );

  /**
   * POST /metrics/validate - Validate metric data without persisting
   */
  router.post(
    '/validate',
    createAuthMiddleware(['validate:metrics']),
    metricValidation.create,
    validateRequest,
    asyncErrorHandler(metricController.validateMetric.bind(metricController))
  );

  return router;
}