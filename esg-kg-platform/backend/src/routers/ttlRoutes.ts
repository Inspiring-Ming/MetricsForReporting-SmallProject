import { Router } from 'express';
import { TTLController } from '../controllers/ttlController';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { TTLService } from '../services/ttlService';

/**
 * TTL 文件路由
 */
export const createTTLRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const graphDBRepository = new GraphDBRepository();
  const ttlService = new TTLService(graphDBRepository);
  const ttlController = new TTLController(ttlService);

  // 路由定义
  router.post('/upload', ttlController.uploadTTL);
  router.post('/validate', ttlController.validateTTL);
  router.post('/stats', ttlController.getTTLStats);

  return router;
};