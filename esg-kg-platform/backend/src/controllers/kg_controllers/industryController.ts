import { Request, Response } from 'express';
import { Route, Get, Post, Patch, Delete, Tags, Query, Path, Body, SuccessResponse } from 'tsoa';
import { IndustryService } from '../../services/kg_services/industryService';
import {
  GetIndustriesRequest,
  CreateIndustryRequest,
  UpdateIndustryRequest,
  IndustriesResponse,
  IndustryDetailResponse,
  CreateIndustryResponse,
  UpdateIndustryResponse,
  DeleteIndustryResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';

/**
 * Industry Controller - Handles industry-related HTTP requests
 */
@Route('api/kg/industries')
@Tags('Industries')
export class IndustryController {
  private industryService: IndustryService;

  constructor(industryService?: IndustryService) {
    this.industryService = industryService || new IndustryService();
  }

  /**
   * Get industry list (supports pagination and search)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 10, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Industry list and pagination information
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  public async getIndustriesWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<IndustriesResponse> {
    const params: GetIndustriesRequest = { page, size, search, sort, order };
    return await this.industryService.getIndustries(params);
  }

  // Express 兼容方法（用于实际路由）
  getIndustries = asyncHandler(async (req: Request, res: Response) => {
    const params: GetIndustriesRequest = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
      search: req.query.search as string,
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.industryService.getIndustries(params);
    res.json(result);
  });

  /**
   * Get industry details
   * 
   * @param id Industry ID (can be URI, namespace format or short ID)
   * @returns Industry details
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  public async getIndustryByIdWithTsoa(
    @Path() id: string
  ): Promise<IndustryDetailResponse> {
    return await this.industryService.getIndustryById(id);
  }

  // Express 兼容方法（用于实际路由）
  getIndustryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Industry ID is required');
    }
    const result = await this.industryService.getIndustryById(id);
    res.json(result);
  });

  /**
   * Create a new industry
   * 
   * @param requestBody Request data for creating an industry
   * @returns Created industry information
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  public async createIndustryWithTsoa(
    @Body() requestBody: CreateIndustryRequest
  ): Promise<CreateIndustryResponse> {
    return await this.industryService.createIndustry(requestBody);
  }

  // Express 兼容方法（用于实际路由）
  createIndustry = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateIndustryRequest = req.body;
    const result = await this.industryService.createIndustry(data);
    res.status(201).json(result);
  });

  /**
   * Partial update of industry
   * 
   * @param id Industry ID
   * @param requestBody Request data for updating the industry
   * @returns Updated industry information
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  public async updateIndustryWithTsoa(
    @Path() id: string,
    @Body() requestBody: UpdateIndustryRequest
  ): Promise<UpdateIndustryResponse> {
    return await this.industryService.updateIndustry(id, requestBody);
  }

  // Express 兼容方法（用于实际路由）
  updateIndustry = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Industry ID is required');
    }
    const data: UpdateIndustryRequest = req.body;
    const result = await this.industryService.updateIndustry(id, data);
    res.json(result);
  });

  /**
   * Delete an industry
   * 
   * @param id Industry ID
   * @param force Whether to force delete (ignore reportsUsing association checks)
   * @returns Delete result
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  public async deleteIndustryWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteIndustryResponse> {
    return await this.industryService.deleteIndustry(id, force || false);
  }

  // Express 兼容方法（用于实际路由）
  deleteIndustry = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Industry ID is required');
    }
    const force = req.query.force === 'true' || req.query.force === '1';
    const result = await this.industryService.deleteIndustry(id, force);
    res.json(result);
  });
}
