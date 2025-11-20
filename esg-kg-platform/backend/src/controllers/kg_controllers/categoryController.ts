import { Request, Response } from 'express';
import { Controller, Route, Get, Post, Patch, Delete, Tags, Path, Query, Body, SuccessResponse, Response as TsoaResponse } from 'tsoa';
import { CategoryService } from '../../services/kg_services/categoryService';
import {
  GetCategoriesRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  AddMetricsToCategoryRequest,
  CategoriesResponse,
  CategoryDetailResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  CategoryMetricsResponse,
  AddMetricsToCategoryResponse,
  RemoveMetricFromCategoryResponse
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';

/**
 * Category Controller - 处理分类相关的 HTTP 请求
 */
@Route('api/kg/categories')
@Tags('Categories')
export class CategoryController extends Controller {
  private categoryService: CategoryService;

  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  /**
   * 获取分类列表（支持分页和搜索）
   * 
   * @param page 页码（从1开始，默认1）
   * @param size 每页数量（默认20，最大100）
   * @param search 搜索关键词（模糊匹配 label）
   * @param framework 按框架筛选（可选）
   * @param sort 排序字段（默认 label）
   * @param order 排序顺序（默认 asc）
   * @returns 分类列表及分页信息
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getCategoriesWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() framework?: string,
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<CategoriesResponse> {
    const params: GetCategoriesRequest = { page, size, search, framework, sort, order };
    return await this.categoryService.getCategories(params);
  }

  // Express 兼容方法
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const params: GetCategoriesRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      size: req.query.size ? parseInt(req.query.size as string) : undefined,
      search: req.query.search as string,
      framework: req.query.framework as string,
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.categoryService.getCategories(params);
    res.json(result);
  });

  /**
   * 获取分类详情
   * 
   * @param id 分类 ID（URI 格式）
   * @returns 分类详情（包含关联的指标和使用此分类的框架）
   */
  @Get('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Category not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getCategoryByIdWithTsoa(
    @Path() id: string
  ): Promise<CategoryDetailResponse> {
    return await this.categoryService.getCategoryById(id);
  }

  // Express 兼容方法
  getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    const result = await this.categoryService.getCategoryById(id);
    res.json(result);
  });

  /**
   * 创建新分类
   * 
   * @param requestBody 创建分类的请求数据
   * @returns 创建的分类信息
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @TsoaResponse<{ error: string }>('400', 'Validation Error - Invalid label or metrics')
  @TsoaResponse<{ error: string }>('409', 'Conflict - Category with same label already exists')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async createCategoryWithTsoa(
    @Body() data: CreateCategoryRequest
  ): Promise<CreateCategoryResponse> {
    return await this.categoryService.createCategory(data);
  }

  // Express 兼容方法
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.categoryService.createCategory(req.body);
    res.status(201).json(result);
  });

  /**
   * 更新分类信息
   * 
   * @param id 分类 ID（URI 格式）
   * @param requestBody 更新分类的请求数据（支持部分更新）
   * @returns 更新后的分类信息
   */
  @Patch('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error - Invalid parameters')
  @TsoaResponse<{ error: string }>('404', 'Category not found')
  @TsoaResponse<{ error: string }>('409', 'Conflict - Label already exists')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async updateCategoryWithTsoa(
    @Path() id: string,
    @Body() data: UpdateCategoryRequest
  ): Promise<UpdateCategoryResponse> {
    return await this.categoryService.updateCategory(id, data);
  }

  // Express 兼容方法
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    const result = await this.categoryService.updateCategory(id, req.body);
    res.json(result);
  });

  /**
   * 删除分类
   * 
   * @param id 分类 ID（URI 格式）
   * @param force 强制删除（即使被框架引用也删除，默认 false）
   * @returns 删除结果
   */
  @Delete('{id}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Category not found')
  @TsoaResponse<{ error: string }>('409', 'Conflict - Category is used by frameworks (use force=true to override)')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async deleteCategoryWithTsoa(
    @Path() id: string,
    @Query() force?: boolean
  ): Promise<DeleteCategoryResponse> {
    return await this.categoryService.deleteCategory(id, { force });
  }

  // Express 兼容方法
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    const force = req.query.force === 'true';
    const result = await this.categoryService.deleteCategory(id, { force });
    res.json(result);
  });

  /**
   * 获取分类的指标列表
   * 
   * @param id 分类 ID（URI 格式）
   * @returns 分类包含的所有指标
   */
  @Get('{id}/metrics')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Category not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getCategoryMetricsWithTsoa(
    @Path() id: string
  ): Promise<CategoryMetricsResponse> {
    return await this.categoryService.getCategoryMetrics(id);
  }

  // Express 兼容方法
  getCategoryMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    const result = await this.categoryService.getCategoryMetrics(id);
    res.json(result);
  });

  /**
   * 为分类添加指标
   * 
   * @param id 分类 ID（URI 格式）
   * @param requestBody 要添加的指标 URI 列表
   * @returns 添加后的指标列表
   */
  @Post('{id}/metrics')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error - Invalid metric URIs')
  @TsoaResponse<{ error: string }>('404', 'Category or Metric not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async addMetricsToCategoryWithTsoa(
    @Path() id: string,
    @Body() data: AddMetricsToCategoryRequest
  ): Promise<AddMetricsToCategoryResponse> {
    return await this.categoryService.addMetricsToCategory(id, data);
  }

  // Express 兼容方法
  addMetricsToCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    const result = await this.categoryService.addMetricsToCategory(id, req.body);
    res.json(result);
  });

  /**
   * 从分类中移除指标
   * 
   * @param id 分类 ID（URI 格式）
   * @param mid 指标 ID（URI 格式）
   * @returns 移除结果
   */
  @Delete('{id}/metrics/{mid}')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Invalid URI format')
  @TsoaResponse<{ error: string }>('404', 'Category or Metric not found')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async removeMetricFromCategoryWithTsoa(
    @Path() id: string,
    @Path() mid: string
  ): Promise<RemoveMetricFromCategoryResponse> {
    return await this.categoryService.removeMetricFromCategory(
      id,
      mid
    );
  }

  // Express 兼容方法
  removeMetricFromCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id, mid } = req.params;
    if (!id) {
      throw new Error('Category ID is required');
    }
    if (!mid) {
      throw new Error('Metric ID is required');
    }
    const result = await this.categoryService.removeMetricFromCategory(
      id,
      mid
    );
    res.json(result);
  });
}
