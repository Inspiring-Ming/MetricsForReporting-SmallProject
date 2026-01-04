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
 * Category Controller - Handles category-related HTTP requests
 */
@Route('api/kg/categories')
@Tags('Categories')
export class CategoryController extends Controller {
  private categoryService: CategoryService;

  constructor(categoryService?: CategoryService) {
    super();
    this.categoryService = categoryService || new CategoryService();
  }

  /**
   * Get category list (supports pagination and search)
   * 
   * @param page Page number (starting from 1, default 1)
   * @param size Items per page (default 20, max 100)
   * @param search Search keyword (fuzzy match on label)
   * @param industry Filter by industry (optional)
   * @param framework Filter by framework (optional)
   * @param sort Sort field (default label)
   * @param order Sort order (default asc)
   * @returns Category list and pagination information
   */
  @Get('/')
  @SuccessResponse('200', 'Success')
  @TsoaResponse<{ error: string }>('400', 'Validation Error')
  @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
  public async getCategoriesWithTsoa(
    @Query() page?: number,
    @Query() size?: number,
    @Query() search?: string,
    @Query() industry?: string,
    @Query() framework?: string,
    @Query() sort?: 'label' | 'createdAt',
    @Query() order?: 'asc' | 'desc'
  ): Promise<CategoriesResponse> {
    const params: GetCategoriesRequest = { page, size, search, industry, framework, sort, order };
    return await this.categoryService.getCategories(params);
  }

  // Express 兼容方法
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const params: GetCategoriesRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      size: req.query.size ? parseInt(req.query.size as string) : undefined,
      search: req.query.search as string,
      industry: req.query.industry as string,
      framework: req.query.framework as string,
      sort: req.query.sort as 'label' | 'createdAt',
      order: req.query.order as 'asc' | 'desc'
    };
    const result = await this.categoryService.getCategories(params);
    res.json(result);
  });

  /**
   * Get category details
   * 
   * @param id Category ID (URI format)
   * @returns Category details (including associated metrics and frameworks using this category)
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
   * Create a new category
   * 
   * @param requestBody Request data for creating a category
   * @returns Created category information
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
   * Update category information
   * 
   * @param id Category ID (URI format)
   * @param requestBody Request data for updating the category (supports partial update)
   * @returns Updated category information
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
   * Delete a category
   * 
   * @param id Category ID (URI format)
   * @param force Force delete (delete even if referenced by frameworks, default false)
   * @returns Delete result
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
   * Get metrics list for a category
   * 
   * @param id Category ID (URI format)
   * @returns All metrics contained in the category
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
   * Add metrics to a category
   * 
   * @param id Category ID (URI format)
   * @param requestBody List of metric URIs to add
   * @returns List of metrics after addition
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
   * Remove a metric from a category
   * 
   * @param id Category ID (URI format)
   * @param mid Metric ID (URI format)
   * @returns Remove result
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
