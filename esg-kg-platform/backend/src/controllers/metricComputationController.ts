import { Request, Response } from 'express';
import { MetricComputationService } from '../services/metricComputationService';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * 指标计算信息控制器（不执行实际计算，只提供计算方法信息）
 */
export class MetricComputationController {
  private computationService: MetricComputationService;

  constructor(computationService: MetricComputationService) {
    this.computationService = computationService;
  }

  /**
   * CQ5: 获取指标计算方法信息
   * GET /api/computation/method?metric_label={metric_label}
   */
  getComputationMethod = asyncHandler(async (req: Request, res: Response) => {
    const { metric_label } = req.query as { metric_label: string };
    
    if (!metric_label) {
      throw new ValidationError('metric_label query parameter is required');
    }

    const result = await this.computationService.getMetricComputationMethod(metric_label);
    
    res.json(result);
  });

  /**
   * 获取实现文件信息
   * GET /api/computation/implementation?implementation_label={implementation_label}
   */
  getImplementationInfo = asyncHandler(async (req: Request, res: Response) => {
    const { implementation_label } = req.query as { implementation_label: string };
    
    if (!implementation_label) {
      throw new ValidationError('implementation_label query parameter is required');
    }

    const result = await this.computationService.getImplementationInfo(implementation_label);
    
    res.json(result);
  });

  /**
   * 按计算类型获取所有实现信息
   * GET /api/computation/implementations?calculation_type={calculation_type}
   */
  getImplementationsByType = asyncHandler(async (req: Request, res: Response) => {
    const { calculation_type } = req.query as { calculation_type: string };
    
    if (!calculation_type) {
      throw new ValidationError('calculation_type query parameter is required');
    }

    const result = await this.computationService.getImplementationsByCalculationType(calculation_type);
    
    res.json({
      result: result
    });
  });

  /**
   * 获取所有支持的计算类型
   * GET /api/computation/supported-types
   */
  getSupportedCalculationTypes = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.computationService.getSupportedCalculationTypes();
    
    res.json({
      result: result
    });
  });

}