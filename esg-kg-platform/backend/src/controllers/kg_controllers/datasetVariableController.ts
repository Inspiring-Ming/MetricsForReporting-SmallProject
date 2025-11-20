import { Request, Response } from 'express';
import { Route, Get, Post, Patch, Delete, Tags, Query, Path, Body, SuccessResponse, Response as TsoaResponse } from 'tsoa';
import { DatasetVariableService } from '../../services/kg_services/datasetVariableService';
import {
  DatasetVariablesResponse,
  DatasetVariableDetailResponse,
  GetDatasetVariablesRequest,
  CreateDatasetVariableRequest,
  CreateDatasetVariableResponse,
  UpdateDatasetVariableRequest,
  UpdateDatasetVariableResponse,
  DeleteDatasetVariableResponse,
  VariableDatasourcesResponse,
  AddDatasourceToVariableRequest,
  AddDatasourceToVariableResponse,
  RemoveVariableDatasourceResponse,
  DatasetVariableQualityResponse,
  VariableMetricsResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError } from '../../types/errors';

/**
 * DatasetVariable Controller - 处理数据集变量相关的 HTTP 请求
 */
@Route('api/kg/dataset-variables')
@Tags('Dataset Variables')
export class DatasetVariableController {
  private service: DatasetVariableService;

  constructor(service?: DatasetVariableService) {
    this.service = service || new DatasetVariableService();
  }

  /**
   * 获取数据集变量列表（支持分页、搜索和筛选）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认20，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param datasource 按数据源筛选（可选，URI或ID）
   * @param metric 按指标筛选（可选，URI或ID）
   * @param minConfidenceScore 最小置信度分数（可选，0-100）
   * @param isUnitCompatible 按单位兼容性筛选（可选）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 数据集变量列表及分页信息
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasetVariablesWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() datasource?: string,
    @Query() metric?: string,
    @Query() minConfidenceScore?: number,
    @Query() isUnitCompatible?: string,
    @Query() sort?: 'label' | 'confidenceScore' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<DatasetVariablesResponse> {
    const params: GetDatasetVariablesRequest = {
      page,
      size,
      search,
      datasource,
      metric,
      minConfidenceScore,
      isUnitCompatible,
      sort,
      order
    };
    return await this.service.getDatasetVariables(params);
  }

  // Express 兼容方法（用于实际路由）
  getDatasetVariables = asyncHandler(async (req: Request, res: Response) => {
    const params: GetDatasetVariablesRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      datasource: req.query.datasource as string,
      metric: req.query.metric as string,
      minConfidenceScore: req.query.minConfidenceScore 
        ? parseInt(req.query.minConfidenceScore as string, 10) 
        : undefined,
      isUnitCompatible: req.query.isUnitCompatible as string,
      sort: req.query.sort as 'label' | 'confidenceScore' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.service.getDatasetVariables(params);
    res.json(result);
  });

  /**
   * 获取数据集变量详情
   * 
   * @param id 数据集变量 ID（URI 格式或简短 ID）
   * @returns 数据集变量详情（包含关联的数据源和使用它的指标）
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasetVariableByIdWithTsoa(
    @Path() id: string
  ): Promise<DatasetVariableDetailResponse> {
    return await this.service.getDatasetVariableById(id);
  }

  // Express 兼容方法
  getDatasetVariableById = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const result = await this.service.getDatasetVariableById(id);
    res.json(result);
  });

  /**
   * 创建新的数据集变量
   * 
   * @param requestBody 创建数据集变量的请求数据
   * @returns 创建的数据集变量信息
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async createDatasetVariableWithTsoa(
    @Body() requestBody: CreateDatasetVariableRequest
  ): Promise<CreateDatasetVariableResponse> {
    return await this.service.createDatasetVariable(requestBody);
  }

  // Express 兼容方法
  createDatasetVariable = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateDatasetVariableRequest = req.body;
    
    const result = await this.service.createDatasetVariable(data);
    res.status(201).json(result);
  });

  /**
   * 更新数据集变量（部分更新）
   * 
   * @param id 数据集变量 ID（URI 格式或简短 ID）
   * @param requestBody 更新数据集变量的请求数据
   * @returns 更新的数据集变量信息
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async updateDatasetVariableWithTsoa(
    @Path() id: string,
    @Body() requestBody: UpdateDatasetVariableRequest
  ): Promise<UpdateDatasetVariableResponse> {
    return await this.service.updateDatasetVariable(id, requestBody);
  }

  // Express 兼容方法
  updateDatasetVariable = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const data: UpdateDatasetVariableRequest = req.body;
    const result = await this.service.updateDatasetVariable(id, data);
    res.json(result);
  });

  /**
   * 删除数据集变量
   * 
   * @param id 数据集变量 ID（URI 格式或简短 ID）
   * @param force 强制删除（忽略依赖检查，默认 false）
   * @returns 删除结果
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async deleteDatasetVariableWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteDatasetVariableResponse> {
    return await this.service.deleteDatasetVariable(id, { force });
  }

  // Express 兼容方法
  deleteDatasetVariable = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const force = req.query.force === 'true';
    const result = await this.service.deleteDatasetVariable(id, { force });
    res.json(result);
  });

  /**
   * 获取数据集变量的所有数据源
   * 
   * @param id 数据集变量 ID（URI 格式或简短 ID）
   * @returns 数据源列表
   * @example request
   * ```
   * GET /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   * ```
   * @example response
   * ```json
   * {
   *   "variable_id": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "variable_label": "POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasources": [
   *     {
   *       "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *       "label": "Semiconductor WRDS Financial Dataset",
   *       "fileName": "semiconductor_financial.csv",
   *       "description": "Financial data for semiconductor companies",
   *       "coverage": "2020-2024",
   *       "recordCount": 1500
   *     }
   *   ],
   *   "total": 1
   * }
   * ```
   */
  @Get('{id}/datasources')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid ID format')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getVariableDatasourcesWithTsoa(
    @Path() id: string
  ): Promise<VariableDatasourcesResponse> {
    return await this.service.getVariableDatasources(id);
  }

  // Express 兼容方法
  getVariableDatasources = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const result = await this.service.getVariableDatasources(id);
    res.json(result);
  });

  /**
   * 为数据集变量添加数据源关联
   * 
   * @param id 数据集变量 ID（URI 格式或简短 ID）
   * @param requestBody 添加数据源的请求数据
   * @returns 添加结果
   * @example request
   * ```
   * POST /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   * Content-Type: application/json
   * 
   * {
   *   "datasourceUri": "http://example.org/esg#NewDataSource"
   * }
   * ```
   * @example response
   * ```json
   * {
   *   "variable_uri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasource_uri": "http://example.org/esg#NewDataSource",
   *   "added_at": "2024-11-20T12:00:00.000Z"
   * }
   * ```
   */
  @Post('{id}/datasources')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable or datasource not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async addDatasourceToVariableWithTsoa(
    @Path() id: string,
    @Body() requestBody: AddDatasourceToVariableRequest
  ): Promise<AddDatasourceToVariableResponse> {
    return await this.service.addDatasourceToVariable(id, requestBody);
  }

  // Express 兼容方法
  addDatasourceToVariable = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const data: AddDatasourceToVariableRequest = req.body;
    const result = await this.service.addDatasourceToVariable(id, data);
    res.json(result);
  });

  /**
   * 移除数据集变量的数据源关联
   * 
   * @param id 数据集变量 ID（短 ID 或完整 URI）
   * @param dsId 数据源 ID（短 ID 或完整 URI）
   * @returns 移除操作的确认信息
   * 
   * @example
   * DELETE /api/kg/dataset-variables/SemiconductorRevenue/datasources/WRDSFinancialData
   * DELETE /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23SemiconductorRevenue/datasources/WRDSFinancialData
   */
  @Delete('{id}/datasources/{dsId}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async removeVariableDatasourceWithTsoa(
    @Path() id: string,
    @Path() dsId: string
  ): Promise<RemoveVariableDatasourceResponse> {
    return await this.service.removeVariableDatasource(id, dsId);
  }

  // Express 兼容方法
  removeVariableDatasource = asyncHandler(async (req: Request, res: Response) => {
    let { id, dsId } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    if (dsId) {
      dsId = decodeURIComponent(dsId);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    if (!dsId || !dsId.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const result = await this.service.removeVariableDatasource(id, dsId);
    res.json(result);
  });

  /**
   * 获取数据集变量的质量信息
   * 
   * @param id 数据集变量 ID（短 ID 或完整 URI）
   * @returns 质量信息（confidenceScore、isUnitCompatible、alignmentReason）
   * 
   * @example
   * GET /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/quality
   * GET /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23POLICY_ACCOUNT_HOLDERS_AFFECTED/quality
   */
  @Get('{id}/quality')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getVariableQualityWithTsoa(
    @Path() id: string
  ): Promise<DatasetVariableQualityResponse> {
    return await this.service.getVariableQuality(id);
  }

  // Express 兼容方法
  getVariableQuality = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const result = await this.service.getVariableQuality(id);
    res.json(result);
  });

  /**
   * 获取使用此数据集变量的所有指标
   * 
   * @param id 数据集变量 ID（短 ID 或完整 URI）
   * @returns 指标列表
   * 
   * @example
   * GET /api/kg/dataset-variables/CO2DIRECTSCOPE1/metrics
   * GET /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23CO2DIRECTSCOPE1/metrics
   */
  @Get('{id}/metrics')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('404', 'Dataset variable not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getVariableMetricsWithTsoa(
    @Path() id: string
  ): Promise<VariableMetricsResponse> {
    return await this.service.getVariableMetrics(id);
  }

  // Express 兼容方法
  getVariableMetrics = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI（如果是完整的 URI 格式）
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Dataset variable ID is required');
    }
    
    const result = await this.service.getVariableMetrics(id);
    res.json(result);
  });
}
