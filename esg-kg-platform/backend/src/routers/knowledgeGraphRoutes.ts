import { Router } from 'express';
import { KnowledgeGraphController } from '../controllers/knowledgeGraphController';
import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';

/**
 * Knowledge Graph 路由
 */
export const createKnowledgeGraphRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const kgRepository = new KnowledgeGraphRepository();
  const kgService = new KnowledgeGraphService(kgRepository);
  const kgController = new KnowledgeGraphController(kgService);

  // DEPRECATED: Use /api/kg/categories and /api/kg/frameworks with query params instead
  // These routes are now handled by CategoryController and FrameworkController
  // CQ3: 获取报告框架中包含的分类  
  // router.get('/categories', kgController.getCategories);

  // CQ4: 获取特定分类下的指标
  router.get('/metrics', kgController.getMetrics);

  // CQ4: 获取特定分类下的指标URIs（高性能版本）
  router.get('/metrics/uris', kgController.getMetricUris);

  // 获取特定分类下使用 model calculation 方法的指标
  router.get('/metrics/model-calculation', kgController.getModelCalculationMetrics);

  // 获取指标属性
  router.get('/metrics/attributes', kgController.getMetricAttributes);

  // CQ8: 获取数据点属性
  /**
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026)
   * @deprecationReason The concept of "DataPoint" is redundant with "Metric".
   *                    Use GET /api/kg/metrics/:id instead.
   */
  router.get('/datapoints/attributes', kgController.getDataPointAttributes);

  // 获取数据源信息
  router.get('/datasource', kgController.getDataSourceInfo);

  // 获取指标的最佳数据源
  router.get('/metrics/best-datasource', kgController.getBestDataSource);

  // CQ6: 获取执行特定模型的实现
  router.get('/models/implementation', kgController.getImplementationByModel);

  // 获取实现详情
  router.get('/implementations/details', kgController.getImplementationDetails);

  // 获取所有实现
  router.get('/implementations', kgController.getAllImplementations);

  // 按计算类型获取实现
  router.get('/implementations/by-calculation-type', kgController.getImplementationsByCalculationType);

  // 获取所有计算类型
  router.get('/calculation-types', kgController.getAllCalculationTypes);

  // 重置知识图谱到初始状态
  router.post('/reset', kgController.resetKnowledgeGraph);

  /**
   * @deprecated POST /api/kg/implementations is now handled by ImplementationController
   * This route is disabled to prevent conflicts. Use /api/kg/implementations from implementationRoutes instead.
   * Will be removed in v2.0.0 (June 2026)
   */
  // router.post('/implementations', kgController.createImplementation);

  /**
   * @deprecated POST /api/kg/models is now handled by ModelController
   * This route is disabled to prevent conflicts. Use /api/kg/models from modelRoutes instead.
   * Will be removed in v2.0.0 (June 2026)
   */
  // router.post('/models', kgController.createModel);

  return router;
};