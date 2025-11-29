import { Router } from 'express';
import { ModelController } from '../../controllers/kg_controllers/modelController';

/**
 * Model Routes
 */
export const createModelRoutes = (): Router => {
  const router = Router();
  const modelController = new ModelController();

  /**
   * GET /api/kg/models
   * Get list of models with pagination and filtering
   */
  router.get('/', modelController.getModels);

  /**
   * POST /api/kg/models
   * Create a new model
   */
  router.post('/', modelController.createModel);

  /**
   * GET /api/kg/models/:id/metrics/inputs
   * Get input metrics for a model
   * 
   * Returns all metrics that are used as inputs for this model (via esg:requiresInputFrom).
   */
  router.get('/:id/metrics/inputs', modelController.getModelInputMetrics);

  /**
   * GET /api/kg/models/:id/metrics/output
   * Get output metric for a model
   * 
   * Returns the metric that is calculated by this model (via esg:isCalculatedBy).
   */
  router.get('/:id/metrics/output', modelController.getModelOutputMetric);

  /**
   * PUT /api/kg/models/:id/metrics/inputs
   * Update input metrics for a model
   * 
   * Replaces all existing input metrics with the provided list.
   */
  router.put('/:id/metrics/inputs', modelController.updateModelInputMetrics);

  /**
   * POST /api/kg/models/:id/metrics/inputs/:metricId
   * Add a single input metric to a model
   * 
   * Adds one metric to the model's input metrics without affecting other inputs.
   */
  router.post('/:id/metrics/inputs/:metricId', modelController.addModelInputMetric);

  /**
   * DELETE /api/kg/models/:id/metrics/inputs/:metricId
   * Remove a single input metric from a model
   * 
   * Removes one metric from the model's input metrics without affecting other inputs.
   */
  router.delete('/:id/metrics/inputs/:metricId', modelController.removeModelInputMetric);

  /**
   * GET /api/kg/models/:id/implementations
   * Get implementations for a model
   * 
   * Returns all implementations associated with this model (via esg:executesWith).
   */
  router.get('/:id/implementations', modelController.getModelImplementations);

  /**
   * POST /api/kg/models/:id/implementations
   * Add implementation to a model
   * 
   * Associates an implementation with the model via esg:executesWith relationship.
   */
  router.post('/:id/implementations', modelController.addModelImplementation);

  /**
   * GET /api/kg/models/:id
   * Get model details by ID
   */
  router.get('/:id', modelController.getModelById);

  /**
   * PUT /api/kg/models/:id
   * Update a model
   */
  router.put('/:id', modelController.updateModel);

  /**
   * DELETE /api/kg/models/:id
   * Delete a model
   */
  router.delete('/:id', modelController.deleteModel);

  return router;
};

export default createModelRoutes;
