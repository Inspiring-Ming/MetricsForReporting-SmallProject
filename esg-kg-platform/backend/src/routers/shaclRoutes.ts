import { Router } from 'express';
import express from 'express';
import { ShaclController } from '../controllers/shaclController';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { ShaclService } from '../services/shaclService';

/**
 * SHACL 验证路由
 */
export const createShaclRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const graphDBRepository = new GraphDBRepository();
  const shaclService = new ShaclService(graphDBRepository);
  const shaclController = new ShaclController(shaclService);

  // 中间件：为验证仓库端点添加原始文本解析支持
  router.use('/validate-repo', express.text({ type: 'text/*', limit: '2mb' }));

  // 路由定义
  router.post('/validate-repo', shaclController.validateRepository);
  router.post('/validate-shapes', shaclController.validateShapes);
  router.post('/shapes-stats', shaclController.getShapesStats);

  return router;
};