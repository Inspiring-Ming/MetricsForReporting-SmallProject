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
 * Framework Controller - 处理报告框架相关的 HTTP 请求
 */
@Route('api/kg/frameworks')
@Tags('Frameworks')
export class FrameworkController {
  private frameworkService: FrameworkService;

  constructor(frameworkService?: FrameworkService) {
    this.frameworkService = frameworkService || new FrameworkService();
  }

  /**
   * 获取报告框架列表（支持分页和搜索）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认10，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param industry 按行业筛选（可选）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 报告框架列表及分页信息
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
   * 获取报告框架详情
   * 
   * @param id 框架 ID（可以是 URI、命名空间格式或简短 ID）
   * @returns 框架详情
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
   * 创建新报告框架
   * 
   * @param requestBody 创建框架的请求数据
   * @returns 创建的框架信息
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
   * 部分更新报告框架
   * 
   * @param id 框架 ID
   * @param requestBody 更新框架的请求数据
   * @returns 更新后的框架信息
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
   * 删除报告框架
   * 
   * @param id 框架 ID
   * @param force 是否强制删除（忽略行业引用关联检查）
   * @returns 删除结果
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
   * 获取框架的分类列表
   * 
   * @param id 框架 ID
   * @returns 框架包含的分类列表
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
   * 添加分类到框架
   * 
   * @param id 框架 ID
   * @param requestBody 要添加的分类 URIs
   * @returns 添加的分类信息
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
   * 从框架删除分类
   * 
   * @param id 框架 ID
   * @param cid 分类 ID
   * @returns 删除结果
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
