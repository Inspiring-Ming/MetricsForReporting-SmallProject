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
 * Industry Controller - 处理行业相关的 HTTP 请求
 */
@Route('api/kg/industries')
@Tags('Industries')
export class IndustryController {
  private industryService: IndustryService;

  constructor(industryService?: IndustryService) {
    this.industryService = industryService || new IndustryService();
  }

  /**
   * 获取行业列表（支持分页和搜索）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认10，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 行业列表及分页信息
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
   * 获取行业详情
   * 
   * @param id 行业 ID（可以是 URI、命名空间格式或简短 ID）
   * @returns 行业详情
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
   * 创建新行业
   * 
   * @param requestBody 创建行业的请求数据
   * @returns 创建的行业信息
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
   * 部分更新行业
   * 
   * @param id 行业 ID
   * @param requestBody 更新行业的请求数据
   * @returns 更新后的行业信息
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
   * 删除行业
   * 
   * @param id 行业 ID
   * @param force 是否强制删除（忽略 reportsUsing 关联检查）
   * @returns 删除结果
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
