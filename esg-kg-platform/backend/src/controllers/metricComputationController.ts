import { Request, Response } from 'express';
import { Route, Get, Tags, Query, SuccessResponse, Deprecated } from 'tsoa';
import { MetricComputationService } from '../services/metricComputationService';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Metric Computation Information Controller (does not perform actual calculations, only provides calculation method information)
 * 
 * @deprecated This entire API group is deprecated and will be removed in v2.0.0 (June 2026).
 *             All endpoints have been migrated to /api/kg/metrics/:id/calculation-method.
 *             Please use the new Knowledge Graph API endpoints instead.
 */
@Route('api/computation')
@Tags('Computation (Deprecated)')
@Deprecated()
export class MetricComputationController {
  private computationService: MetricComputationService;

  constructor(computationService?: MetricComputationService) {
    this.computationService = computationService || new MetricComputationService();
  }

  /**
   * CQ5: Get metric calculation method information
   * GET /api/computation/method?metric_label={metric_label}
   * 
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026).
   *             Use GET /api/kg/metrics/:id/calculation-method instead.
   *             Migration: Replace ?metric_label=X with /:id in the URL path.
   * 
   * @param metric_label Metric label
   * @returns Metric calculation method information
   */
  @Get('method')
  @SuccessResponse('200', 'Success')
  @Deprecated()
  public async getComputationMethodWithTsoa(
    @Query() metric_label: string
  ): Promise<any> {
    return await this.computationService.getMetricComputationMethod(metric_label);
  }

  // Express 兼容方法（用于实际路由）
  getComputationMethod = asyncHandler(async (req: Request, res: Response) => {
    const { metric_label } = req.query as { metric_label: string };
    
    if (!metric_label) {
      throw new ValidationError('metric_label query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id/calculation-method instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    res.setHeader('X-Migration-Guide', 'Replace ?metric_label=X with /:id in the URL path');

    const result = await this.computationService.getMetricComputationMethod(metric_label);
    
    res.json(result);
  });

  /**
   * Get implementation file information
   * GET /api/computation/implementation?implementation_label={implementation_label}
   * 
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026).
   *             Implementation details are now available through GET /api/kg/metrics/:id/calculation-method.
   *             The new endpoint returns implementation info as part of the calculation method response.
   * 
   * @param implementation_label Implementation label
   * @returns Implementation file information
   */
  @Get('implementation')
  @SuccessResponse('200', 'Success')
  @Deprecated()
  public async getImplementationInfoWithTsoa(
    @Query() implementation_label: string
  ): Promise<any> {
    return await this.computationService.getImplementationInfo(implementation_label);
  }

  // Express 兼容方法（用于实际路由）
  getImplementationInfo = asyncHandler(async (req: Request, res: Response) => {
    const { implementation_label } = req.query as { implementation_label: string };
    
    if (!implementation_label) {
      throw new ValidationError('implementation_label query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id/calculation-method instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

    const result = await this.computationService.getImplementationInfo(implementation_label);
    
    res.json(result);
  });

  /**
   * Get all implementation information by calculation type
   * GET /api/computation/implementations?calculation_type={calculation_type}
   * 
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026).
   *             Use GET /api/kg/metrics with filtering to find metrics by calculation type,
   *             then use GET /api/kg/metrics/:id/calculation-method to get implementation details.
   * 
   * @param calculation_type Calculation type
   * @returns List of implementation information
   */
  @Get('implementations')
  @SuccessResponse('200', 'Success')
  @Deprecated()
  public async getImplementationsByTypeWithTsoa(
    @Query() calculation_type: string
  ): Promise<any> {
    const result = await this.computationService.getImplementationsByCalculationType(calculation_type);
    return { result };
  }

  // Express 兼容方法（用于实际路由）
  getImplementationsByType = asyncHandler(async (req: Request, res: Response) => {
    const { calculation_type } = req.query as { calculation_type: string };
    
    if (!calculation_type) {
      throw new ValidationError('calculation_type query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics with filtering instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

    const result = await this.computationService.getImplementationsByCalculationType(calculation_type);
    
    res.json({
      result: result
    });
  });

  /**
   * Get all supported calculation types
   * GET /api/computation/supported-types
   * 
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026).
   *             Calculation types are now part of the knowledge graph model structure.
   *             Query models directly through the KG API instead.
   * 
   * @returns List of supported calculation types
   */
  @Get('supported-types')
  @SuccessResponse('200', 'Success')
  @Deprecated()
  public async getSupportedCalculationTypesWithTsoa(): Promise<any> {
    const result = await this.computationService.getSupportedCalculationTypes();
    return { result };
  }

  // Express 兼容方法（用于实际路由）
  getSupportedCalculationTypes = asyncHandler(async (req: Request, res: Response) => {
    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Query models directly through the KG API instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

    const result = await this.computationService.getSupportedCalculationTypes();
    
    res.json({
      result: result
    });
  });

}