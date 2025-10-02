import { Router } from 'express';
import { SparqlController } from '../controllers/sparqlController';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { SparqlService } from '../services/sparqlService';

/**
 * SPARQL 查询路由
 */
export const createSparqlRoutes = (): Router => {
  const router = Router();
  
  // 依赖注入
  const graphDBRepository = new GraphDBRepository();
  const sparqlService = new SparqlService(graphDBRepository);
  const sparqlController = new SparqlController(sparqlService);

  // 中间件：记录查询开始时间
  router.use((req, res, next) => {
    (req as any).startTime = Date.now();
    next();
  });

  // 路由定义
  router.post('/', sparqlController.executeQuery);
  router.post('/validate', sparqlController.validateQuery);
  router.get('/history', sparqlController.getQueryHistory);

  return router;
};