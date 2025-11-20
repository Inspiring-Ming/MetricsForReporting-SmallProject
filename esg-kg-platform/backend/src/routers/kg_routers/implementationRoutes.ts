import { Router } from 'express';
import { ImplementationController } from '../../controllers/kg_controllers/implementationController';
import { ImplementationService } from '../../services/kg_services/implementationService';
import { ImplementationRepository } from '../../repositories/implementationRepository';

/**
 * Implementation 路由 - 实现管理 API
 */
export const createImplementationRoutes = (): Router => {
  const router = Router();

  // 依赖注入
  const implRepo = new ImplementationRepository();
  const implService = new ImplementationService(implRepo);
  const implController = new ImplementationController(implService);

  /**
   * GET /api/kg/implementations
   * 获取实现列表（支持分页和过滤）
   * 
   * 查询参数：
   * - page: 页码
   * - size: 每页数量
   * - search: 搜索关键词
   * - language: 编程语言筛选（Python, JavaScript, R 等）
   * - filePath: 文件路径筛选
   * - calculationType: 计算类型筛选（通过关联的模型）
   * - sort: 排序字段
   * - order: 排序顺序
   */
  router.get('/', implController.getImplementations);

  /**
   * POST /api/kg/implementations
   * 创建新实现
   */
  router.post('/', implController.createImplementation);

  /**
   * GET /api/kg/implementations/:id
   * 获取实现详情（包括关联的模型列表）
   */
  router.get('/:id', implController.getImplementationById);

  /**
   * PATCH /api/kg/implementations/:id
   * 部分更新实现
   */
  router.patch('/:id', implController.updateImplementation);

  /**
   * DELETE /api/kg/implementations/:id
   * 删除实现
   * 
   * 查询参数：
   * - force: 是否强制删除（忽略模型引用）
   */
  router.delete('/:id', implController.deleteImplementation);

  return router;
};
