import { Router } from 'express';
import { MetricComputationController } from '../controllers/metricComputationController';
import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';
import { MetricComputationService } from '../services/metricComputationService';

/**
 * 指标计算路由
 */
export const createMetricComputationRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const kgRepository = new KnowledgeGraphRepository();
  const computationService = new MetricComputationService(kgRepository);
  const computationController = new MetricComputationController(computationService);

  // CQ5: 获取指标计算方法信息
  router.get('/method', computationController.getComputationMethod);

  // 获取实现文件信息
  router.get('/implementation', computationController.getImplementationInfo);

  // 按计算类型获取所有实现信息
  router.get('/implementations', computationController.getImplementationsByType);

  // 获取所有支持的计算类型
  router.get('/supported-types', computationController.getSupportedCalculationTypes);

  return router;
};