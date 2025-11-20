import { Request, Response } from 'express';
import { Route, Get, Post, Patch, Delete, Tags, Query, Path, Body, SuccessResponse, Response as TsoaResponse } from 'tsoa';
import { DatasourceService } from '../../services/kg_services/datasourceService';
import {
  DatasourcesResponse,
  DatasourceDetailResponse,
  GetDatasourcesRequest,
  CreateDatasourceRequest,
  CreateDatasourceResponse,
  UpdateDatasourceRequest,
  UpdateDatasourceResponse,
  DeleteDatasourceResponse,
  DatasourceVariablesResponse,
  DatasourceMetricsResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError } from '../../types/errors';

/**
 * Datasource Controller - 处理数据源相关的 HTTP 请求
 */
@Route('api/kg/datasources')
@Tags('Datasources')
export class DatasourceController {
  private service: DatasourceService;

  constructor(service?: DatasourceService) {
    this.service = service || new DatasourceService();
  }

  /**
   * 获取数据源列表（支持分页、搜索和排序）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认20，最大100）
   * @param search 搜索关键词（模糊匹配 label 或 fileName）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 数据源列表及分页信息
   * @example request
   * ```
   * GET /api/kg/datasources?page=1&size=20&search=carbon&sort=label&order=asc
   * ```
   * @example response
   * ```json
   * {
   *   "result": [
   *     {
   *       "iri": "http://example.org/esg#datasource1",
   *       "label": "Carbon Emissions Dataset",
   *       "fileName": "carbon_data.csv",
   *       "description": "Historical carbon emissions data",
   *       "coverage": "Global",
   *       "recordCount": 1500
   *     }
   *   ],
   *   "page": 1,
   *   "size": 20,
   *   "total": 45,
   *   "totalPages": 3
   * }
   * ```
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasourcesWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() sort?: 'label' | 'fileName' | 'recordCount' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<DatasourcesResponse> {
    const params: GetDatasourcesRequest = {
      page,
      size,
      search,
      sort,
      order
    };
    return await this.service.getDatasources(params);
  }

  // Express 兼容方法（用于实际路由）
  getDatasources = asyncHandler(async (req: Request, res: Response) => {
    const params: GetDatasourcesRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      sort: req.query.sort as 'label' | 'fileName' | 'recordCount' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.service.getDatasources(params);
    res.json(result);
  });

  /**
   * 获取数据源详情
   * 
   * @param id 数据源 ID（URI 格式或简短 ID）
   * @returns 数据源详情（包含使用它的数据集变量）
   * @example request
   * ```
   * GET /api/kg/datasources/SemiconductorWRDSFinancialDataset
   * ```
   * @example response
   * ```json
   * {
   *   "result": {
   *     "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *     "label": "Semiconductor WRDS Financial Dataset",
   *     "fileName": "semiconductor_financial.csv",
   *     "description": "Financial data for semiconductor companies",
   *     "coverage": "2020-2024",
   *     "recordCount": 1500,
   *     "variables": [
   *       {
   *         "iri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *         "label": "POLICY_ACCOUNT_HOLDERS_AFFECTED"
   *       }
   *     ]
   *   }
   * }
   * ```
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Datasource not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasourceByIdWithTsoa(
    @Path() id: string
  ): Promise<DatasourceDetailResponse> {
    return await this.service.getDatasourceById(id);
  }

  // Express 兼容方法
  getDatasourceById = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const result = await this.service.getDatasourceById(id);
    res.json(result);
  });

  /**
   * 创建数据源
   * 
   * @param data 数据源信息
   * @returns 创建的数据源信息
   * @example request
   * ```json
   * {
   *   "label": "New Carbon Dataset",
   *   "fileName": "carbon_2024.csv",
   *   "description": "Carbon emissions data for 2024",
   *   "coverage": "Global",
   *   "recordCount": 2000
   * }
   * ```
   * @example response
   * ```json
   * {
   *   "uri": "http://example.org/esg#New_Carbon_Dataset_1700000000000",
   *   "label": "New Carbon Dataset",
   *   "created_at": "2024-11-20T10:30:00.000Z"
   * }
   * ```
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async createDatasourceWithTsoa(
    @Body() data: CreateDatasourceRequest
  ): Promise<CreateDatasourceResponse> {
    return await this.service.createDatasource(data);
  }

  // Express 兼容方法
  createDatasource = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateDatasourceRequest = req.body;
    const result = await this.service.createDatasource(data);
    res.status(201).json(result);
  });

  /**
   * 更新数据源（部分更新）
   * 
   * @param id 数据源 ID（URI 格式或简短 ID）
   * @param data 需要更新的字段
   * @returns 更新后的数据源信息
   * @example request
   * ```
   * PATCH /api/kg/datasources/SemiconductorWRDSFinancialDataset
   * Content-Type: application/json
   * 
   * {
   *   "description": "Updated description",
   *   "recordCount": 2000
   * }
   * ```
   * @example response
   * ```json
   * {
   *   "uri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "label": "Semiconductor WRDS Financial Dataset",
   *   "updated_at": "2024-11-20T10:45:00.000Z"
   * }
   * ```
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('404', 'Datasource not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async updateDatasourceWithTsoa(
    @Path() id: string,
    @Body() data: UpdateDatasourceRequest
  ): Promise<UpdateDatasourceResponse> {
    return await this.service.updateDatasource(id, data);
  }

  // Express 兼容方法
  updateDatasource = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const data: UpdateDatasourceRequest = req.body;
    const result = await this.service.updateDatasource(id, data);
    res.json(result);
  });

  /**
   * 删除数据源
   * 
   * @param id 数据源 ID（URI 格式或简短 ID）
   * @param force 是否强制删除（忽略依赖检查，默认 false）
   * @returns 删除结果
   * @example request
   * ```
   * DELETE /api/kg/datasources/SemiconductorWRDSFinancialDataset
   * ```
   * @example response
   * ```json
   * {
   *   "uri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "deleted": true,
   *   "deleted_at": "2024-11-20T10:50:00.000Z"
   * }
   * ```
   * @example force delete
   * ```
   * DELETE /api/kg/datasources/SemiconductorWRDSFinancialDataset?force=true
   * ```
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('404', 'Datasource not found')
  @TsoaResponse<{ error: string }>('409', 'Conflict - Datasource is in use')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async deleteDatasourceWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteDatasourceResponse> {
    return await this.service.deleteDatasource(id, force || false);
  }

  // Express 兼容方法
  deleteDatasource = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    // 解码 URI
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await this.service.deleteDatasource(id, force);
    res.json(result);
  });

  /**
   * 获取使用此数据源的所有数据集变量
   * 
   * @param id 数据源 ID（短 ID 或完整 URI）
   * @returns 变量列表
   * 
   * @example
   * GET /api/kg/datasources/SemiconductorsEurofidaiEnvironmentDataset/variables
   */
  @Get('{id}/variables')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('404', 'Datasource not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasourceVariablesWithTsoa(
    @Path() id: string
  ): Promise<DatasourceVariablesResponse> {
    return await this.service.getDatasourceVariables(id);
  }

  // Express 兼容方法
  getDatasourceVariables = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const result = await this.service.getDatasourceVariables(id);
    res.json(result);
  });

  /**
   * 获取间接使用此数据源的所有指标（通过数据集变量）
   * 
   * @param id 数据源 ID（短 ID 或完整 URI）
   * @returns 指标列表
   * 
   * @example
   * GET /api/kg/datasources/SemiconductorsEurofidaiEnvironmentDataset/metrics
   */
  @Get('{id}/metrics')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('404', 'Datasource not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getDatasourceMetricsWithTsoa(
    @Path() id: string
  ): Promise<DatasourceMetricsResponse> {
    return await this.service.getDatasourceMetrics(id);
  }

  // Express 兼容方法
  getDatasourceMetrics = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params;
    
    if (id) {
      id = decodeURIComponent(id);
    }
    
    if (!id || !id.trim()) {
      throw new ValidationError('Datasource ID is required');
    }
    
    const result = await this.service.getDatasourceMetrics(id);
    res.json(result);
  });
}
