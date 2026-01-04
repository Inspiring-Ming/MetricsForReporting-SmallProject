import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * 健康检查控制器
 */
export class HealthController {
  private healthService: HealthService;

  constructor(healthService: HealthService) {
    this.healthService = healthService;
  }

  /**
   * 系统健康检查
   */
  checkHealth = asyncHandler(async (req: Request, res: Response) => {
    const healthStatus = await this.healthService.checkHealth();
    
    // 根据健康状态设置 HTTP 状态码
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus
    });
  });

  /**
   * 获取仓库列表
   */
  getRepositories = asyncHandler(async (req: Request, res: Response) => {
    const repositories = await this.healthService.getRepositories();
    
    res.json({
      success: true,
      data: repositories,
      total: repositories.length
    });
  });

  /**
   * 获取系统信息
   */
  getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
    const systemInfo = this.healthService.getSystemInfo();
    
    res.json({
      success: true,
      data: systemInfo
    });
  });
}