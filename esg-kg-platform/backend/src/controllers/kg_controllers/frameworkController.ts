import { Request, Response } from 'express';
import { Route, Get, Post, Patch, Delete, Tags, Query, Path, Body, SuccessResponse } from 'tsoa';
import { FrameworkService } from '../../services/kg_services/frameworkService';
import {
  GetFrameworksRequest,
  CreateFrameworkRequest,
  UpdateFrameworkRequest,
  AddCategoriesToFrameworkRequest,
  FrameworksResponse,
  FrameworkDetailResponse,
  CreateFrameworkResponse,
  UpdateFrameworkResponse,
  DeleteFrameworkResponse,
  FrameworkCategoriesResponse,
  AddCategoriesToFrameworkResponse,
  RemoveCategoryFromFrameworkResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';

/**
 * Framework Controller - Handles reporting framework-related HTTP requests
 */
@Route('api/kg/frameworks')
@Tags('Frameworks')
export class FrameworkController {
  private frameworkService: FrameworkService;

  constructor(frameworkService?: FrameworkService) {
    this.frameworkService = frameworkService || new FrameworkService();
  }

  /**
   * Get reporting framework list (supports pagination and search)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 10, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param industry Filter by industry (optional)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Reporting framework list and pagination information
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  public async getFrameworksWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() industry?: string,
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<FrameworksResponse> {
    const params: GetFrameworksRequest = { page, size, search, industry, sort, order };
    return await this.frameworkService.getFrameworks(params);
  }

  // Express 兼容方法（用于实际路由）
  getFrameworks = asyncHandler(async (req: Request, res: Response) => {
    const params: GetFrameworksRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      industry: req.query.industry as string,
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.frameworkService.getFrameworks(params);
    res.json(result);
  });

  /**
   * Get reporting framework details
   * 
   * @param id Framework ID (can be URI, namespace format or short ID)
   * @returns Framework details
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  public async getFrameworkByIdWithTsoa(
    @Path() id: string
  ): Promise<FrameworkDetailResponse> {
    return await this.frameworkService.getFrameworkById(id);
  }

  // Express 兼容方法（用于实际路由）
  getFrameworkById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    const result = await this.frameworkService.getFrameworkById(id);
    res.json(result);
  });

  /**
   * Create a new reporting framework
   * 
   * @param requestBody Request data for creating a framework
   * @returns Created framework information
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  public async createFrameworkWithTsoa(
    @Body() requestBody: CreateFrameworkRequest
  ): Promise<CreateFrameworkResponse> {
    return await this.frameworkService.createFramework(requestBody);
  }

  // Express 兼容方法（用于实际路由）
  createFramework = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateFrameworkRequest = req.body;
    const result = await this.frameworkService.createFramework(data);
    res.status(201).json(result);
  });

  /**
   * Partial update of reporting framework
   * 
   * @param id Framework ID
   * @param requestBody Request data for updating the framework
   * @returns Updated framework information
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  public async updateFrameworkWithTsoa(
    @Path() id: string,
    @Body() requestBody: UpdateFrameworkRequest
  ): Promise<UpdateFrameworkResponse> {
    return await this.frameworkService.updateFramework(id, requestBody);
  }

  // Express 兼容方法（用于实际路由）
  updateFramework = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    const data: UpdateFrameworkRequest = req.body;
    const result = await this.frameworkService.updateFramework(id, data);
    res.json(result);
  });

  /**
   * Delete a reporting framework
   * 
   * @param id Framework ID
   * @param force Whether to force delete (ignore industry reference association checks)
   * @returns Delete result
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  public async deleteFrameworkWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteFrameworkResponse> {
    return await this.frameworkService.deleteFramework(id, force || false);
  }

  // Express 兼容方法（用于实际路由）
  deleteFramework = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await this.frameworkService.deleteFramework(id, force);
    res.json(result);
  });

  /**
   * Get categories list for a framework
   * 
   * @param id Framework ID
   * @returns List of categories contained in the framework
   */
  @Get('{id}/categories')
  @SuccessResponse('200', 'Success')
  public async getFrameworkCategoriesWithTsoa(
    @Path() id: string
  ): Promise<FrameworkCategoriesResponse> {
    return await this.frameworkService.getFrameworkCategories(id);
  }

  // Express 兼容方法（用于实际路由）
  getFrameworkCategories = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    const result = await this.frameworkService.getFrameworkCategories(id);
    res.json(result);
  });

  /**
   * Add categories to a framework
   * 
   * @param id Framework ID
   * @param requestBody Category URIs to add
   * @returns Added categories information
   */
  @Post('{id}/categories')
  @SuccessResponse('201', 'Created')
  public async addCategoriesToFrameworkWithTsoa(
    @Path() id: string,
    @Body() requestBody: AddCategoriesToFrameworkRequest
  ): Promise<AddCategoriesToFrameworkResponse> {
    return await this.frameworkService.addCategoriesToFramework(id, requestBody);
  }

  // Express 兼容方法（用于实际路由）
  addCategoriesToFramework = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    const data: AddCategoriesToFrameworkRequest = req.body;
    const result = await this.frameworkService.addCategoriesToFramework(id, data);
    res.status(201).json(result);
  });

  /**
   * Remove a category from a framework
   * 
   * @param id Framework ID
   * @param cid Category ID
   * @returns Delete result
   */
  @Delete('{id}/categories/{cid}')
  @SuccessResponse('200', 'Success')
  public async removeCategoryFromFrameworkWithTsoa(
    @Path() id: string,
    @Path() cid: string
  ): Promise<RemoveCategoryFromFrameworkResponse> {
    return await this.frameworkService.removeCategoryFromFramework(id, cid);
  }

  // Express 兼容方法（用于实际路由）
  removeCategoryFromFramework = asyncHandler(async (req: Request, res: Response) => {
    const { id, cid } = req.params;
    if (!id) {
      throw new Error('Framework ID is required');
    }
    if (!cid) {
      throw new Error('Category ID is required');
    }
    const result = await this.frameworkService.removeCategoryFromFramework(id, cid);
    res.json(result);
  });
}
