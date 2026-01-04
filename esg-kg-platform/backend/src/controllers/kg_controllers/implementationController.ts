import { Request, Response } from 'express';
import { Route, Get, Post, Patch, Delete, Tags, Query, Path, Body, SuccessResponse } from 'tsoa';
import { ImplementationService } from '../../services/kg_services/implementationService';
import {
  GetImplementationsRequest,
  CreateImplementationRequest,
  UpdateImplementationRequest,
  ImplementationsResponse,
  ImplementationDetailResponse,
  CreateImplementationResponse,
  UpdateImplementationResponse,
  DeleteImplementationResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';

/**
 * Implementation Controller - Handles implementation-related HTTP requests
 */
@Route('api/kg/implementations')
@Tags('Implementations')
export class ImplementationController {
  private implementationService: ImplementationService;

  constructor(implementationService?: ImplementationService) {
    this.implementationService = implementationService || new ImplementationService();
  }

  /**
   * Get implementation list (supports pagination and search)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 10, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param language Filter by programming language (optional)
   * @param filePath Filter by file path (optional)
   * @param calculationType Filter by calculation type (via associated models) (optional)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Implementation list and pagination information
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  public async getImplementationsWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() language?: string,
    @Query() filePath?: string,
    @Query() calculationType?: string,
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<ImplementationsResponse> {
    const params: GetImplementationsRequest = { 
      page, size, search, language, filePath, calculationType, sort, order 
    };
    return await this.implementationService.getImplementations(params);
  }

  // Express 兼容方法（用于实际路由）
  getImplementations = asyncHandler(async (req: Request, res: Response) => {
    const params: GetImplementationsRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      language: req.query.language as string,
      filePath: req.query.filePath as string,
      calculationType: req.query.calculationType as string,
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.implementationService.getImplementations(params);
    res.json(result);
  });

  /**
   * Get implementation details
   * 
   * @param id Implementation ID (can be URI, namespace format or short ID)
   * @returns Implementation details, including list of associated models
   * @example id "Implementation_Python_PercentageRatio"
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  public async getImplementationByIdWithTsoa(
    @Path() id: string
  ): Promise<ImplementationDetailResponse> {
    return await this.implementationService.getImplementationById(id);
  }

  // Express 兼容方法（用于实际路由）
  getImplementationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Implementation ID is required');
    }
    const result = await this.implementationService.getImplementationById(id);
    res.json(result);
  });

  /**
   * Create a new implementation
   * 
   * @param requestBody Request data for creating an implementation
   * @returns Created implementation information
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  public async createImplementationWithTsoa(
    @Body() requestBody: CreateImplementationRequest
  ): Promise<CreateImplementationResponse> {
    return await this.implementationService.createImplementation(requestBody);
  }

  // Express 兼容方法（用于实际路由）
  createImplementation = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateImplementationRequest = req.body;
    const result = await this.implementationService.createImplementation(data);
    res.status(201).json(result);
  });

  /**
   * Partial update of implementation
   * 
   * @param id Implementation ID
   * @param requestBody Request data for updating the implementation
   * @returns Updated implementation information
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  public async updateImplementationWithTsoa(
    @Path() id: string,
    @Body() requestBody: UpdateImplementationRequest
  ): Promise<UpdateImplementationResponse> {
    return await this.implementationService.updateImplementation(id, requestBody);
  }

  // Express 兼容方法（用于实际路由）
  updateImplementation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Implementation ID is required');
    }
    const data: UpdateImplementationRequest = req.body;
    const result = await this.implementationService.updateImplementation(id, data);
    res.json(result);
  });

  /**
   * Delete an implementation
   * 
   * @param id Implementation ID
   * @param force Whether to force delete (ignore model reference association checks)
   * @returns Delete result
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  public async deleteImplementationWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteImplementationResponse> {
    return await this.implementationService.deleteImplementation(id, force || false);
  }

  // Express 兼容方法（用于实际路由）
  deleteImplementation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Implementation ID is required');
    }
    const force = req.query.force === 'true';
    const result = await this.implementationService.deleteImplementation(id, force);
    res.json(result);
  });
}
