import { Request, Response } from 'express';
import { Route, Get, Post, Put, Patch, Delete, Tags, Query, Path, Body, SuccessResponse, Deprecated } from 'tsoa';
import { MetricService } from "../../services/kg_services/metricService"
import { 
  MetricDetailResponse,
  MetricDatasetsResponse,
  MetricLineageResponse,
  MetricsResponse,
  GetMetricsRequest,
  BestDataSourceResponse,
  MetricDataSourcesResponse,
  MetricModelsResponse,
  MetricInputsResponse,

  MetricCalculationMethodResponse,
  CreateMetricRequest,
  CreateMetricResponse,
  UpdateMetricRequest,
  UpdateMetricResponse,
  PatchMetricRequest,
  DeleteMetricResponse,
  AddMetricDatasourceRequest,
  AddMetricDatasourceResponse,
  RemoveMetricDatasourceResponse,
  AddMetricInputRequest,
  AddMetricInputResponse,
  RemoveMetricInputResponse,
  BatchCreateMetricsRequest,
  BatchCreateMetricsResponse,
  BatchDeleteMetricsRequest,
  BatchDeleteMetricsResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';

/**
 * Metric Controller - 处理指标相关的 HTTP 请求
 */
@Route('api/kg/metrics')
@Tags('Metrics')
export class MetricController {
  private metricService: MetricService;

  constructor(metricService?: MetricService) {
    this.metricService = metricService || new MetricService();
  }

  /**
   * 获取指标列表（支持多种过滤条件）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认10，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param industry 按行业筛选（可选）
   * @param category 按分类筛选（可选）
   * @param framework 按报告框架筛选（可选）
   * @param calculationMethod 按计算方法筛选：direct_measurement 或 calculation_model（可选）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 指标列表及分页信息
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  public async getMetricsWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() industry?: string,
    @Query() category?: string,
    @Query() framework?: string,
    @Query() calculationMethod?: 'direct_measurement' | 'calculation_model',
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<MetricsResponse> {
    const params: GetMetricsRequest = { 
      page, size, search, industry, category, framework, calculationMethod, sort, order 
    };
    return await this.metricService.getMetrics(params);
  }

  // Express 兼容方法（用于实际路由）
  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const params: GetMetricsRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      industry: req.query.industry as string,
      category: req.query.category as string,
      framework: req.query.framework as string,
      calculationMethod: req.query.calculationMethod as 'direct_measurement' | 'calculation_model',
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.metricService.getMetrics(params);
    res.json(result);
  });

  /**
   * 创建新指标
   * 
   * @param requestBody 创建指标的请求数据
   * @returns 创建的指标信息
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  public async createMetricWithTsoa(
    @Body() data: CreateMetricRequest
  ): Promise<CreateMetricResponse> {
    return await this.metricService.createMetric(data);
  }

  // Express 兼容方法
  createMetric = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.metricService.createMetric(req.body);
    res.status(201).json(result);
  });

  /**
   * 获取指标详情（包含所有属性）
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 指标详情及其所有属性
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  public async getMetricByIdWithTsoa(
    @Path() id: string
  ): Promise<MetricDetailResponse> {
    return await this.metricService.getMetricById(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getMetricById(id);
    res.json(result);
  });

  /**
   * 完整更新指标（替换所有属性）
   * 
   * @param id 指标 ID
   * @param requestBody 更新指标的请求数据（所有字段都需要提供）
   * @returns 更新后的指标信息
   */
  @Put('{id}')
  @SuccessResponse('200', 'Success')
  public async updateMetricWithTsoa(
    @Path() id: string,
    @Body() data: UpdateMetricRequest
  ): Promise<UpdateMetricResponse> {
    return await this.metricService.updateMetric(id, data);
  }

  // Express 兼容方法
  updateMetric = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.updateMetric(id, req.body);
    res.json(result);
  });

  /**
   * 部分更新指标（仅更新提供的字段）
   * 
   * @param id 指标 ID
   * @param requestBody 更新指标的请求数据（所有字段都是可选的）
   * @returns 更新后的指标信息
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  public async patchMetricWithTsoa(
    @Path() id: string,
    @Body() data: PatchMetricRequest
  ): Promise<UpdateMetricResponse> {
    return await this.metricService.patchMetric(id, data);
  }

  // Express 兼容方法
  patchMetric = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.patchMetric(id, req.body);
    res.json(result);
  });

  /**
   * 删除指标
   * 
   * @param id 指标 ID
   * @param cascade 是否级联删除相关数据（默认 false）
   * @param force 强制删除（忽略依赖检查，默认 false）
   * @returns 删除结果
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  public async deleteMetricWithTsoa(
    @Path() id: string,
    @Query() cascade?: boolean,
    @Query() force?: boolean
  ): Promise<DeleteMetricResponse> {
    return await this.metricService.deleteMetric(id, { cascade, force });
  }

  // Express 兼容方法
  deleteMetric = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const cascade = req.query.cascade === 'true';
    const force = req.query.force === 'true';
    const result = await this.metricService.deleteMetric(id, { cascade, force });
    res.json(result);
  });

  /**
   * 获取指标的数据血缘关系
   * 
   * 根据指标的计算方法（直接测量或计算模型），返回相应的数据来源：
   * - 直接测量：返回数据集变量和数据源
   * - 计算模型：返回模型、输入指标和实现信息
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 指标的数据血缘信息
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/lineage')
  @SuccessResponse('200', 'Success')
  public async getMetricLineageWithTsoa(
    @Path() id: string
  ): Promise<MetricLineageResponse> {
    return await this.metricService.getMetricLineage(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricLineage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getMetricLineage(id);
    res.json(result);
  });

  /**
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026).
   *             Use GET /api/kg/metrics/:id/lineage instead.
   *             Renamed from /datasets to /lineage for better semantic clarity.
   * 
   * 获取指标的数据血缘关系
   * 
   * 根据指标的计算方法（直接测量或计算模型），返回相应的数据来源：
   * - 直接测量：返回数据集变量和数据源
   * - 计算模型：返回模型、输入指标和实现信息
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 指标的数据血缘信息
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/datasets')
  @SuccessResponse('200', 'Success')
  @Deprecated()
  public async getMetricDatasetsWithTsoa(
    @Path() id: string
  ): Promise<MetricDatasetsResponse> {
    return await this.metricService.getMetricDatasets(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricDatasets = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id/lineage instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    res.setHeader('X-Migration-Guide', 'Endpoint renamed from /datasets to /lineage for better clarity');

    const result = await this.metricService.getMetricDatasets(id);
    res.json(result);
  });

  /**
   * 获取指标的最佳数据源
   * 
   * 根据 IFRS 披露层次选择最佳数据源：
   * 1. Corporate Disclosure (最高优先级)
   * 2. Sustainability Reports
   * 3. Other sources
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 指标的最佳数据源信息
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/best-datasource')
  @SuccessResponse('200', 'Success')
  public async getBestDataSourceWithTsoa(
    @Path() id: string
  ): Promise<BestDataSourceResponse> {
    return await this.metricService.getBestDataSource(id);
  }

  // Express 兼容方法（用于实际路由）
  getBestDataSource = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getBestDataSource(id);
    res.json(result);
  });

  /**
   * 获取指标的所有数据源（非仅最佳数据源）
   * 
   * 返回与指标关联的所有数据源列表。
   * 仅适用于直接测量（direct_measurement）的指标。
   * 对于计算模型指标，返回空列表。
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @param includeVariables 是否包含关联的数据集变量信息（默认 false）
   * @returns 指标的所有数据源列表
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/datasources')
  @SuccessResponse('200', 'Success')
  public async getMetricDataSourcesWithTsoa(
    @Path() id: string,
    @Query() includeVariables?: boolean
  ): Promise<MetricDataSourcesResponse> {
    return await this.metricService.getMetricDataSources(id, includeVariables || false);
  }

  // Express 兼容方法（用于实际路由）
  getMetricDataSources = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const includeVariables = req.query.includeVariables === 'true';
    const result = await this.metricService.getMetricDataSources(id, includeVariables);
    res.json(result);
  });

  /**
   * 获取使用该指标作为输入的所有模型（反向依赖查询）
   * 
   * 返回所有将该指标作为输入（requiresInputFrom）的模型。
   * 这是一个反向依赖查询，用于了解该指标在哪些计算模型中被使用。
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 使用该指标的模型列表
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/models')
  @SuccessResponse('200', 'Success')
  public async getMetricModelsWithTsoa(
    @Path() id: string
  ): Promise<MetricModelsResponse> {
    return await this.metricService.getMetricModels(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricModels = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getMetricModels(id);
    res.json(result);
  });

  /**
   * 获取指标计算所需的输入指标列表
   * 
   * 返回该指标计算所需的所有输入指标。
   * 仅适用于 calculation_model 类型的指标。
   * 对于 direct_measurement 类型的指标，返回空输入列表。
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 输入指标列表
   * @example id "GHG_Emissions_Total" or "esg:GHG_Emissions_Total"
   */
  @Get('{id}/inputs')
  @SuccessResponse('200', 'Success')
  public async getMetricInputsWithTsoa(
    @Path() id: string
  ): Promise<MetricInputsResponse> {
    return await this.metricService.getMetricInputs(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricInputs = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getMetricInputs(id);
    res.json(result);
  });

  /**
   * 为指标添加数据源关联
   * 
   * @param id 指标 ID
   * @param requestBody 添加数据源的请求数据
   * @returns 添加结果
   */
  @Post('{id}/datasources')
  @SuccessResponse('200', 'Success')
  public async addMetricDatasourceWithTsoa(
    @Path() id: string,
    @Body() data: AddMetricDatasourceRequest
  ): Promise<AddMetricDatasourceResponse> {
    return await this.metricService.addMetricDatasource(id, data);
  }

  // Express 兼容方法
  addMetricDatasource = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.addMetricDatasource(id, req.body);
    res.json(result);
  });

  /**
   * 删除指标的数据源关联
   * 
   * @param id 指标 ID
   * @param datasourceId 数据源 ID
   * @returns 删除结果
   */
  @Delete('{id}/datasources/{datasourceId}')
  @SuccessResponse('200', 'Success')
  public async removeMetricDatasourceWithTsoa(
    @Path() id: string,
    @Path() datasourceId: string
  ): Promise<RemoveMetricDatasourceResponse> {
    return await this.metricService.removeMetricDatasource(id, datasourceId);
  }

  // Express 兼容方法
  removeMetricDatasource = asyncHandler(async (req: Request, res: Response) => {
    const { id, datasourceId } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    if (!datasourceId) {
      throw new Error('Datasource ID is required');
    }
    const result = await this.metricService.removeMetricDatasource(id, datasourceId);
    res.json(result);
  });

  /**
   * 为计算模型指标添加输入指标
   * 
   * @param id 指标 ID
   * @param requestBody 添加输入指标的请求数据
   * @returns 添加结果
   */
  @Post('{id}/inputs')
  @SuccessResponse('200', 'Success')
  public async addMetricInputWithTsoa(
    @Path() id: string,
    @Body() data: AddMetricInputRequest
  ): Promise<AddMetricInputResponse> {
    return await this.metricService.addMetricInput(id, data);
  }

  // Express 兼容方法
  addMetricInput = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.addMetricInput(id, req.body);
    res.json(result);
  });

  /**
   * 删除计算模型指标的输入指标关联
   * 
   * @param id 指标 ID
   * @param inputMetricId 输入指标 ID
   * @returns 删除结果
   */
  @Delete('{id}/inputs/{inputMetricId}')
  @SuccessResponse('200', 'Success')
  public async removeMetricInputWithTsoa(
    @Path() id: string,
    @Path() inputMetricId: string
  ): Promise<RemoveMetricInputResponse> {
    return await this.metricService.removeMetricInput(id, inputMetricId);
  }

  // Express 兼容方法
  removeMetricInput = asyncHandler(async (req: Request, res: Response) => {
    const { id, inputMetricId } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    if (!inputMetricId) {
      throw new Error('Input Metric ID is required');
    }
    const result = await this.metricService.removeMetricInput(id, inputMetricId);
    res.json(result);
  });

  /**
   * 批量创建指标
   * 
   * @param requestBody 批量创建请求数据
   * @returns 创建结果（包含成功和失败列表）
   */
  @Post('batch')
  @SuccessResponse('200', 'Success')
  public async batchCreateMetricsWithTsoa(
    @Body() data: BatchCreateMetricsRequest
  ): Promise<BatchCreateMetricsResponse> {
    return await this.metricService.batchCreateMetrics(data);
  }

  // Express 兼容方法
  batchCreateMetrics = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.metricService.batchCreateMetrics(req.body);
    res.json(result);
  });

  /**
   * 批量删除指标
   * 
   * @param requestBody 批量删除请求数据
   * @returns 删除结果（包含成功和失败列表）
   */
  @Delete('batch')
  @SuccessResponse('200', 'Success')
  public async batchDeleteMetricsWithTsoa(
    @Body() data: BatchDeleteMetricsRequest
  ): Promise<BatchDeleteMetricsResponse> {
    return await this.metricService.batchDeleteMetrics(data);
  }

  // Express 兼容方法
  batchDeleteMetrics = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.metricService.batchDeleteMetrics(req.body);
    res.json(result);
  });

  /**
   * 获取指标的计算方法详情（CQ5）
   * 
   * 根据指标的计算方法（直接测量或计算模型），返回相应的信息：
   * - 直接测量：返回数据源信息
   * - 计算模型：返回模型、公式和实现信息
   * 
   * @param id 指标 ID（可以是 URI、命名空间格式、label 或简短 ID）
   * @returns 指标的计算方法详细信息
   * @example id "GHG_Emissions_Scope1" or "esg:GHG_Emissions_Scope1"
   */
  @Get('{id}/calculation-method')
  @SuccessResponse('200', 'Success')
  public async getMetricCalculationMethodWithTsoa(
    @Path() id: string
  ): Promise<MetricCalculationMethodResponse> {
    return await this.metricService.getMetricCalculationMethod(id);
  }

  // Express 兼容方法（用于实际路由）
  getMetricCalculationMethod = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const result = await this.metricService.getMetricCalculationMethod(id);
    res.json(result);
  });

  /**
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026)
   * @deprecationReason Use GET /api/kg/metrics/:id instead. This endpoint returns the same data.
   * 
   * 获取指标属性
   * 
   * @param metric_label 指标 label
   * @returns 指标的所有属性
   */
  @Get('attributes')
  @SuccessResponse('200', 'Success')
  public async getMetricAttributesWithTsoa(
    @Query() metric_label: string
  ): Promise<MetricDetailResponse> {
    return await this.metricService.getMetricById(metric_label);
  }

  // Express 兼容方法（用于实际路由）
  getMetricAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric_label } = req.query as { metric_label: string };
    
    if (!metric_label) {
      throw new Error('Metric_label query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

    // 内部转发到新方法
    req.params.id = metric_label;
    const result = await this.metricService.getMetricById(metric_label);
    
    // 保持旧格式兼容性
    res.json({
      metricLabel: metric_label,
      attributes: result.result.attributes || {}
    });
  });

  /**
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026)
   * @deprecationReason The concept of "DataPoint" is redundant with "Metric" in our knowledge graph.
   *                    DataPoints were originally intended to represent measurement instances,
   *                    but in practice they map 1:1 to Metrics. This caused API confusion and
   *                    duplicate code maintenance. Use GET /api/kg/metrics/:id instead.
   * 
   * 获取数据点属性（数据点即指标）
   * 
   * @param metric 指标 ID
   * @returns 指标的所有属性
   */
  @Get('datapoints/attributes')
  @SuccessResponse('200', 'Success')
  public async getDataPointAttributesWithTsoa(
    @Query() metric: string
  ): Promise<MetricDetailResponse> {
    return await this.metricService.getMetricById(metric);
  }

  // Express 兼容方法（用于实际路由）
  getDataPointAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric } = req.query as { metric: string };
    
    if (!metric) {
      throw new Error('Metric query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'DataPoint concept removed. Use GET /api/kg/metrics/:id instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    res.setHeader('X-Deprecation-Reason', 'The concept of DataPoint is redundant with Metric. This caused API confusion and duplicate code maintenance.');

    // 内部转发到新方法
    req.params.id = metric;
    const result = await this.metricService.getMetricById(metric);
    
    // 保持旧格式兼容性
    res.json({
      metric,
      attributes: result.result.attributes || {}
    });
  });
}
