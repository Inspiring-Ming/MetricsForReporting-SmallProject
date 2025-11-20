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
 * Implementation Controller - 处理实现相关的 HTTP 请求
 */
@Route('api/kg/implementations')
@Tags('Implementations')
export class ImplementationController {
  private implementationService: ImplementationService;

  constructor(implementationService?: ImplementationService) {
    this.implementationService = implementationService || new ImplementationService();
  }

  /**
   * 获取实现列表（支持分页和搜索）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认10，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param language 按编程语言筛选（可选）
   * @param filePath 按文件路径筛选（可选）
   * @param calculationType 按计算类型筛选（通过关联的模型）（可选）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 实现列表及分页信息
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
   * 获取实现详情
   * 
   * @param id 实现 ID（可以是 URI、命名空间格式或简短 ID）
   * @returns 实现详情，包括关联的模型列表
   * @example id "Implementation_Python_PercentageRatio" or "esg:Implementation_Python_PercentageRatio"
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
   * 创建新实现
   * 
   * @param requestBody 创建实现的请求数据
   * @returns 创建的实现信息
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
   * 部分更新实现
   * 
   * @param id 实现 ID
   * @param requestBody 更新实现的请求数据
   * @returns 更新后的实现信息
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
   * 删除实现
   * 
   * @param id 实现 ID
   * @param force 是否强制删除（忽略模型引用关联检查）
   * @returns 删除结果
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
