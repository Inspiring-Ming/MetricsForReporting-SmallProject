import { Router, Request, Response, NextFunction } from 'express';
import { MetricController } from '../controllers/kg_controllers/metricController';
import { MetricService } from '../services/kg_services/metricService';
import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';

/**
 * @deprecated Metric 专用路由 - 已废弃
 * 所有 /api/metric/* 路由已迁移到 /api/kg/metrics/*
 * 此路由组将在 v2.0.0 (June 2026) 中移除
 * 
 * 迁移指南：
 * - GET /api/metric/:id → GET /api/kg/metrics/:id
 * - GET /api/metric/:id/datasets → GET /api/kg/metrics/:id/datasets
 */
export const createMetricRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入新的controller
  const kgRepository = new KnowledgeGraphRepository();
  const metricService = new MetricService(kgRepository);
  const metricController = new MetricController(metricService);

  /**
   * @deprecated GET /api/metric/:id
   * Use GET /api/kg/metrics/:id instead
   * Will be removed in v2.0.0 (June 2026)
   */
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id instead');
    res.setHeader('X-Deprecated-Route-Group', '/api/metric/* is deprecated, use /api/kg/metrics/* instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    
    // 转发到新的controller
    metricController.getMetricById(req, res, next);
  });

  /**
   * @deprecated GET /api/metric/:id/datasets
   * Use GET /api/kg/metrics/:id/datasets instead
   * Will be removed in v2.0.0 (June 2026)
   */
  router.get('/:id/datasets', (req: Request, res: Response, next: NextFunction) => {
    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id/datasets instead');
    res.setHeader('X-Deprecated-Route-Group', '/api/metric/* is deprecated, use /api/kg/metrics/* instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    
    // 转发到新的controller
    metricController.getMetricDatasets(req, res, next);
  });

  return router;
};