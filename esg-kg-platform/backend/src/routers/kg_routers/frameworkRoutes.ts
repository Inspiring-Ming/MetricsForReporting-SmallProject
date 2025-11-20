import { Router } from 'express';
import { FrameworkController } from '../../controllers/kg_controllers/frameworkController';
import { FrameworkService } from '../../services/kg_services/frameworkService';
import { FrameworkRepository } from '../../repositories/frameworkRepository';

/**
 * Framework 路由 - 报告框架管理 API
 */
export const createFrameworkRoutes = (): Router => {
  const router = Router();

  // 依赖注入
  const frameworkRepo = new FrameworkRepository();
  const frameworkService = new FrameworkService(frameworkRepo);
  const frameworkController = new FrameworkController(frameworkService);

  /**
   * GET /api/kg/frameworks
   * 获取报告框架列表（支持分页和搜索）
   */
  router.get('/', frameworkController.getFrameworks);

  /**
   * POST /api/kg/frameworks
   * 创建新报告框架
   */
  router.post('/', frameworkController.createFramework);

  /**
   * GET /api/kg/frameworks/:id
   * 获取报告框架详情
   */
  router.get('/:id', frameworkController.getFrameworkById);

  /**
   * PATCH /api/kg/frameworks/:id
   * 部分更新报告框架
   */
  router.patch('/:id', frameworkController.updateFramework);

  /**
   * DELETE /api/kg/frameworks/:id
   * 删除报告框架
   */
  router.delete('/:id', frameworkController.deleteFramework);

  /**
   * GET /api/kg/frameworks/:id/categories
   * 获取框架的分类列表
   */
  router.get('/:id/categories', frameworkController.getFrameworkCategories);

  /**
   * POST /api/kg/frameworks/:id/categories
   * 添加分类到框架
   */
  router.post('/:id/categories', frameworkController.addCategoriesToFramework);

  /**
   * DELETE /api/kg/frameworks/:id/categories/:cid
   * 从框架删除分类
   */
  router.delete('/:id/categories/:cid', frameworkController.removeCategoryFromFramework);

  return router;
};
