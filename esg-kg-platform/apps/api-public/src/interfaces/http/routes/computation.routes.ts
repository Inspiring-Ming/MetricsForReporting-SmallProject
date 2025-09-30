/**
 * Computation Routes - API endpoints for computation operations
 */

import { Router } from 'express';
import { ComputationController } from '../controllers/computation.controller';
import { 
  computationValidation, 
  asyncErrorHandler, 
  createAuthMiddleware, 
  generalRateLimit, 
  heavyOperationRateLimit 
} from '../middleware';

/**
 * Create computation routes with controller and middleware
 */
export function createComputationRoutes(computationController: ComputationController): Router {
  const router = Router();

  // Apply general rate limiting to all computation routes
  router.use(generalRateLimit);

  /**
   * POST /computations/execute - Execute a computation
   */
  router.post(
    '/execute',
    heavyOperationRateLimit,
    createAuthMiddleware(['compute:metrics']),
    computationValidation.execute,
    asyncErrorHandler(computationController.executeComputation.bind(computationController))
  );

  /**
   * GET /computations/methods - Get available computation methods
   */
  router.get(
    '/methods',
    createAuthMiddleware(['read:methods']),
    computationValidation.methodsQuery,
    asyncErrorHandler(computationController.getComputationMethods.bind(computationController))
  );

  /**
   * GET /computations/methods/:code - Get specific computation method
   */
  router.get(
    '/methods/:code',
    createAuthMiddleware(['read:methods']),
    computationValidation.methodCode,
    computationValidation.methodsQuery,
    asyncErrorHandler(computationController.getComputationMethod.bind(computationController))
  );

  /**
   * POST /computations/validate - Validate computation inputs
   */
  router.post(
    '/validate',
    createAuthMiddleware(['validate:computations']),
    asyncErrorHandler(computationController.validateComputationInputs.bind(computationController))
  );

  /**
   * POST /computations/discover-methods - Discover available methods for metric
   */
  router.post(
    '/discover-methods',
    createAuthMiddleware(['read:methods']),
    computationValidation.discoverMethods,
    asyncErrorHandler(computationController.discoverMethods.bind(computationController))
  );

  return router;
}