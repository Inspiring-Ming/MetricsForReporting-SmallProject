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
 * Datasource Controller - Handles data source-related HTTP requests
 */
@Route('api/kg/datasources')
@Tags('Datasources')
export class DatasourceController {
  private service: DatasourceService;

  constructor(service?: DatasourceService) {
    this.service = service || new DatasourceService();
  }

  /**
   * Get data source list (supports pagination, search and sorting)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 20, max 100)
   * @param search Search keyword (fuzzy match on label or fileName)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Data source list and pagination information
   * 
   * Example request:
   * ```
   * GET /api/kg/datasources?page=1&size=20&search=carbon&sort=label&order=asc
   * ```
   * Example response:
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
   * Get data source details
   * 
   * @param id Data source ID (URI format or short ID)
   * @returns Data source details (including dataset variables using it)
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
   * Create a data source
   * 
   * @param data Data source information
   * @returns Created data source information
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
   *   "iri": "http://example.org/esg#New_Carbon_Dataset_1700000000000",
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
   * Update a data source (partial update)
   * 
   * @param id Data source ID (URI format or short ID)
   * @param data Fields to update
   * @returns Updated data source information
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
   *   "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
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
   * Delete a data source
   * 
   * @param id Data source ID (URI format or short ID)
   * @param force Whether to force delete (ignore dependency checks, default false)
   * @returns Delete result
   * @example request
   * ```
   * DELETE /api/kg/datasources/SemiconductorWRDSFinancialDataset
   * ```
   * @example response
   * ```json
   * {
   *   "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "deleted": true,
   *   "deleted_at": "2024-11-20T10:50:00.000Z"
   * }
   * ```
   * @example force true
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
   * Get all dataset variables using this data source
   * 
   * @param id Data source ID (short ID or full URI)
   * @returns List of variables
   * 
   * Example:
   * ```
   * GET /api/kg/datasources/SemiconductorsEurofidaiEnvironmentDataset/variables
   * ```
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
   * Get all metrics indirectly using this data source (through dataset variables)
   * 
   * @param id Data source ID (short ID or full URI)
   * @returns List of metrics
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
