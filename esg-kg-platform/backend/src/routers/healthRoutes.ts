import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { HealthService } from '../services/healthService';

/**
 * 健康检查路由
 */
export const createHealthRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const graphDBRepository = new GraphDBRepository();
  const healthService = new HealthService(graphDBRepository);
  const healthController = new HealthController(healthService);

  // 路由定义
  router.get('/health', healthController.checkHealth);
  router.get('/repositories', healthController.getRepositories);
  router.get('/system', healthController.getSystemInfo);

  return router;
};