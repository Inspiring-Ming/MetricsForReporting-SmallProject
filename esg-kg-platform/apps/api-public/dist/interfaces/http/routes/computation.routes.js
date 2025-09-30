import { Router } from 'express';
import { computationValidation, asyncErrorHandler, createAuthMiddleware, generalRateLimit, heavyOperationRateLimit } from '../middleware';
export function createComputationRoutes(computationController) {
    const router = Router();
    router.use(generalRateLimit);
    router.post('/execute', heavyOperationRateLimit, createAuthMiddleware(['compute:metrics']), computationValidation.execute, asyncErrorHandler(computationController.executeComputation.bind(computationController)));
    router.get('/methods', createAuthMiddleware(['read:methods']), computationValidation.methodsQuery, asyncErrorHandler(computationController.getComputationMethods.bind(computationController)));
    router.get('/methods/:code', createAuthMiddleware(['read:methods']), computationValidation.methodCode, computationValidation.methodsQuery, asyncErrorHandler(computationController.getComputationMethod.bind(computationController)));
    router.post('/validate', createAuthMiddleware(['validate:computations']), asyncErrorHandler(computationController.validateComputationInputs.bind(computationController)));
    router.post('/discover-methods', createAuthMiddleware(['read:methods']), computationValidation.discoverMethods, asyncErrorHandler(computationController.discoverMethods.bind(computationController)));
    return router;
}
//# sourceMappingURL=computation.routes.js.map