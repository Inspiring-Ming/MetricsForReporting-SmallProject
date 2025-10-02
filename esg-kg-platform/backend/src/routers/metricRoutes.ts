import { Router } from 'express';
import { KnowledgeGraphController } from '../controllers/knowledgeGraphController';
import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';

/**
 * Metric 专用路由
 */
export const createMetricRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const kgRepository = new KnowledgeGraphRepository();
  const kgService = new KnowledgeGraphService(kgRepository);
  const kgController = new KnowledgeGraphController(kgService);

  // GET /api/metric/:id - 获取Metric元数据
  router.get('/:id', kgController.getMetricMetadata);

  // GET /api/metric/:id/datasets - 获取Metric数据血缘
  router.get('/:id/datasets', kgController.getMetricDatasets);

  return router;
};