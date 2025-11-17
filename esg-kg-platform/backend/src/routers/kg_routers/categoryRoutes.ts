import { Router } from 'express';
import { CategoryController } from '../../controllers/kg_controllers/categoryController';

/**
 * Category 路由配置
 */
export const createCategoryRoutes = (): Router => {
  const router = Router();
  const categoryController = new CategoryController();

  // 分类 CRUD
  router.get('/', categoryController.getCategories);
  router.post('/', categoryController.createCategory);
  router.get('/:id', categoryController.getCategoryById);
  router.patch('/:id', categoryController.updateCategory);
  router.delete('/:id', categoryController.deleteCategory);

  // 分类-指标关联管理
  router.get('/:id/metrics', categoryController.getCategoryMetrics);
  router.post('/:id/metrics', categoryController.addMetricsToCategory);
  router.delete('/:id/metrics/:mid', categoryController.removeMetricFromCategory);

  return router;
};
