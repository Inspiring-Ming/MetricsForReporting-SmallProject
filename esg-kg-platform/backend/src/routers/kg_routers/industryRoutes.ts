import { Router } from 'express';
import { IndustryController } from '../../controllers/kg_controllers/industryController';
import { IndustryService } from '../../services/kg_services/industryService';
import { IndustryRepository } from '../../repositories/industryRepository';

/**
 * Industry 路由 - 行业管理 API
 */
export const createIndustryRoutes = (): Router => {
  const router = Router();

  // 依赖注入
  const industryRepo = new IndustryRepository();
  const industryService = new IndustryService(industryRepo);
  const industryController = new IndustryController(industryService);

  /**
   * GET /api/kg/industries
   * 获取行业列表（支持分页和搜索）
   */
  router.get('/', industryController.getIndustries);

  /**
   * POST /api/kg/industries
   * 创建新行业
   */
  router.post('/', industryController.createIndustry);

  /**
   * GET /api/kg/industries/:id
   * 获取行业详情
   */
  router.get('/:id', industryController.getIndustryById);

  /**
   * PATCH /api/kg/industries/:id
   * 部分更新行业
   */
  router.patch('/:id', industryController.updateIndustry);

  /**
   * DELETE /api/kg/industries/:id
   * 删除行业
   */
  router.delete('/:id', industryController.deleteIndustry);

  return router;
};
