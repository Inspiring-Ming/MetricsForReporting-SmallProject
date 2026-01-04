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
 * DatasetVariable Controller - Handles dataset variable-related HTTP requests
 */
@Route('api/kg/dataset-variables')
@Tags('Dataset Variables')
export class DatasetVariableController {
  private service: DatasetVariableService;

  constructor(service?: DatasetVariableService) {
    this.service = service || new DatasetVariableService();
  }

  /**
   * Get dataset variable list (supports pagination, search and filtering)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 20, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param datasource Filter by data source (optional, URI or ID)
   * @param metric Filter by metric (optional, URI or ID)
   * @param minConfidenceScore Minimum confidence score (optional, 0-100)
   * @param isUnitCompatible Filter by unit compatibility (optional)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Dataset variable list and pagination information
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
   * Get dataset variable details
   * 
   * @param id Dataset variable ID (URI format or short ID)
   * @returns Dataset variable details (including associated data sources and metrics using it)
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
   * Create a new dataset variable
   * 
   * @param requestBody Request data for creating a dataset variable
   * @returns Created dataset variable information
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
   * Update dataset variable (partial update)
   * 
   * @param id Dataset variable ID (URI format or short ID)
   * @param requestBody Request data for updating the dataset variable
   * @returns Updated dataset variable information
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
   * Delete a dataset variable
   * 
   * @param id Dataset variable ID (URI format or short ID)
   * @param force Force delete (ignore dependency checks, default false)
   * @returns Delete result
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
   * Get all data sources for a dataset variable
   * 
   * @param id Dataset variable ID (URI format or short ID)
   * @returns List of data sources
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
   * Add data source association to dataset variable
   * 
   * @param id Dataset variable ID (URI format or short ID)
   * @param requestBody Request data for adding data source
   * @returns Add result
   * 
   * Example request:
   * ```
   * POST /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   * Content-Type: application/json
   * 
   * {
   *   "datasourceUri": "http://example.org/esg#NewDataSource"
   * }
   * ```
   * Example response:
   * ```json
   * {
   *   "variable_iri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasource_iri": "http://example.org/esg#NewDataSource",
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
   * Remove data source association from dataset variable
   * 
   * @param id Dataset variable ID (short ID or full URI)
   * @param dsId Data source ID (short ID or full URI)
   * @returns Confirmation of removal operation
   * 
   * Example:
   * ```
   * DELETE /api/kg/dataset-variables/SemiconductorRevenue/datasources/WRDSFinancialData
   * DELETE /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23SemiconductorRevenue/datasources/WRDSFinancialData
   * ```
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
   * Get quality information for a dataset variable
   * 
   * @param id Dataset variable ID (short ID or full URI)
   * @returns Quality information (confidenceScore, isUnitCompatible, alignmentReason)
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
   * Get all metrics using this dataset variable
   * 
   * @param id Dataset variable ID (short ID or full URI)
   * @returns List of metrics
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
