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
  MetricModelsDetailResponse,
  MetricInputsResponse,

  MetricCalculationMethodResponse,
  CreateMetricRequest,
  CreateMetricResponse,
  UpdateMetricRequest,
  UpdateMetricResponse,
  UpdateMetricModelResponse,
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
 * Metric Controller - Handles metric-related HTTP requests
 */
@Route('api/kg/metrics')
@Tags('Metrics')
export class MetricController {
  private metricService: MetricService;

  constructor(metricService?: MetricService) {
    this.metricService = metricService || new MetricService();
  }

  /**
   * Get metric list (supports multiple filter conditions)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 10, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param industry Filter by industry (optional)
   * @param category Filter by category (optional)
   * @param framework Filter by reporting framework (optional)
   * @param calculationMethod Filter by calculation method: direct_measurement or calculation_model (optional)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Metric list and pagination information
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
   * Create a new metric
   * 
   * @param requestBody Request data for creating a metric
   * @returns Created metric information
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
   * Get metric details (including all attributes)
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns Metric details and all its attributes
   * @example id "GHG_Emissions_Scope1"
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
   * Full update of metric (replace all attributes)
   * 
   * @param id Metric ID
   * @param requestBody Request data for updating the metric (all fields must be provided)
   * @returns Updated metric information
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
   * Partial update of metric (only update provided fields)
   * 
   * @param id Metric ID
   * @param requestBody Request data for updating the metric (all fields are optional)
   * @returns Updated metric information
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  public async patchMetricWithTsoa(
    @Path() id: string,
    @Body() data: PatchMetricRequest
  ): Promise<UpdateMetricResponse | UpdateMetricModelResponse> {
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
   * Delete a metric
   * 
   * @param id Metric ID
   * @param cascade Whether to cascade delete related data (default false)
   * @param force Force delete (ignore dependency checks, default false)
   * @returns Delete result
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
   * Get metric data lineage
   * 
   * Based on the metric's calculation method (direct measurement or calculation model), returns corresponding data sources:
   * - Direct measurement: returns dataset variables and data sources
   * - Calculation model: returns model, input metrics and implementation information
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns Metric data lineage information
   * @example id "GHG_Emissions_Scope1"
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
   * Get metric data lineage
   * 
   * Based on the metric's calculation method (direct measurement or calculation model), returns corresponding data sources:
   * - Direct measurement: returns dataset variables and data sources
   * - Calculation model: returns model, input metrics and implementation information
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns Metric data lineage information
   * @example id "GHG_Emissions_Scope1"
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
   * Get the best data source for a metric
   * 
   * Selects the best data source based on IFRS disclosure hierarchy:
   * 1. Corporate Disclosure (highest priority)
   * 2. Sustainability Reports
   * 3. Other sources
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns Best data source information for the metric
   * @example id "GHG_Emissions_Scope1"
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
   * Get all data sources for a metric (not just the best one)
   * 
   * Returns a list of all data sources associated with the metric.
   * Only applicable to direct measurement metrics.
   * For calculation model metrics, returns an empty list.
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @param includeVariables Whether to include associated dataset variable information (default false)
   * @returns List of all data sources for the metric
   * @example id "GHG_Emissions_Scope1"
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
   * Get all models that use this metric as input (reverse dependency query)
   * 
   * Returns all models that use this metric as input (requiresInputFrom).
   * This is a reverse dependency query to understand which calculation models use this metric.
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns List of models using this metric
   * @example id "GHG_Emissions_Scope1"
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
   * Get the list of input metrics required for metric calculation
   * 
   * Returns all input metrics required for calculating this metric.
   * Only applicable to calculation_model type metrics.
   * For direct_measurement type metrics, returns an empty input list.
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns List of input metrics
   * @example id "GHG_Emissions_Total"
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
   * Add data source association to metric
   * 
   * @param id Metric ID
   * @param requestBody Request data for adding data source
   * @returns Add result
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
   * Remove data source association from metric
   * 
   * @param id Metric ID
   * @param datasourceId Data source ID
   * @returns Delete result
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
   * Add input metric to calculation model metric
   * 
   * @param id Metric ID
   * @param requestBody Request data for adding input metric
   * @returns Add result
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
   * Remove input metric association from calculation model metric
   * 
   * @param id Metric ID
   * @param inputMetricId Input metric ID
   * @returns Delete result
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
   * Batch create metrics
   * 
   * @param requestBody Batch creation request data
   * @returns Creation result (including success and failure lists)
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
   * Batch delete metrics
   * 
   * @param requestBody Batch deletion request data
   * @returns Deletion result (including success and failure lists)
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
   * Get metric calculation method details (CQ5)
   * 
   * Based on the metric's calculation method (direct measurement or calculation model), returns corresponding information:
   * - Direct measurement: returns data source information
   * - Calculation model: returns model, formula and implementation information
   * 
   * @param id Metric ID (can be URI, namespace format, label or short ID)
   * @returns Detailed calculation method information for the metric
   * @example id "GHG_Emissions_Scope1"
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
   * Get metric attributes
   * 
   * @param metric_label Metric label
   * @returns All attributes of the metric
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
   * Get data point attributes (data points are metrics)
   * 
   * @param metric Metric ID
   * @returns All attributes of the metric
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

  /**
   * Get models related to a metric
   * 
   * This endpoint supports two query modes via the `usage` parameter:
   * - usage=output (default): Returns models that CALCULATE this metric (via esg:isCalculatedBy)
   * - usage=input: Returns models that USE this metric as input (via esg:requiresInputFrom)
   * 
   * For direct_measurement metrics with usage=output, returns an empty list.
   * 
   * @param id Metric identifier (IRI, label, or short ID)
   * @param usage Query mode: 'output' (default) or 'input'
   * @returns List of models with their details
   * @example GET /api/kg/metrics/Revenue/models - Returns models that calculate Revenue
   * @example GET /api/kg/metrics/Revenue/models?usage=input - Returns models that use Revenue as input
   */
  @Get('/:id/models')
  @SuccessResponse('200', 'Success')
  public async getMetricModelsDetailWithTsoa(
    @Path() id: string,
    @Query() usage?: 'output' | 'input'
  ): Promise<MetricModelsDetailResponse> {
    return await this.metricService.getMetricModelsDetail(id, usage || 'output');
  }

  // Express compatible method
  getMetricModelsDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Metric ID is required');
    }
    const usage = (req.query.usage as 'output' | 'input') || 'output';
    const result = await this.metricService.getMetricModelsDetail(id, usage);
    res.json(result);
  });
}
