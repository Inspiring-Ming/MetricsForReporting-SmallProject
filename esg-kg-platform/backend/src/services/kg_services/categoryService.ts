import { CategoryRepository } from '../../repositories/categoryRepository';
import {
  GetCategoriesRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryRequest,
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
import { ValidationError, NotFoundError } from '../../types/errors';

export class CategoryService {
  private categoryRepo: CategoryRepository;

  constructor(categoryRepo?: CategoryRepository) {
    this.categoryRepo = categoryRepo || new CategoryRepository();
  }

  /**
   * 查询分类列表
   */
  async getCategories(params: GetCategoriesRequest): Promise<CategoriesResponse> {
    // 验证分页参数
    if (params.page !== undefined && params.page < 1) {
      throw new ValidationError('Page must be >= 1');
    }
    if (params.size !== undefined && (params.size < 1 || params.size > 100)) {
      throw new ValidationError('Size must be between 1 and 100');
    }

    const { categories, total } = await this.categoryRepo.getCategories(params);

    return {
      result: categories,
      page: params.page,
      size: params.size,
      total
    };
  }

  /**
   * 根据 URI 查询分类详情
   */
  async getCategoryById(id: string): Promise<CategoryDetailResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }

    // 检查 URI 是否包含 URL 编码字符（可能是双重编码）
    if (id.includes('%')) {
      throw new ValidationError('Invalid category URI format: URI appears to be URL-encoded');
    }

    const category = await this.categoryRepo.getCategoryById(id);
    if (!category) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    return { result: category };
  }

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryRequest): Promise<CreateCategoryResponse> {
    // 验证必填字段
    if (!data.label || data.label.trim().length === 0) {
      throw new ValidationError('Label is required');
    }

    // 验证字段长度
    if (data.label.length > 200) {
      throw new ValidationError('Label must not exceed 200 characters');
    }

    // 验证指标 URIs 格式
    if (data.metrics) {
      for (const uri of data.metrics) {
        if (!this.isValidUri(uri)) {
          throw new ValidationError(`Invalid metric URI format: ${uri}`);
        }
      }
    }

    const uri = await this.categoryRepo.createCategory(data);

    return {
      uri,
      label: data.label,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 更新分类
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }

    // 验证至少有一个字段需要更新
    const hasLabel = data.label !== undefined;
    const hasMetrics = data.metrics !== undefined;

    if (!hasLabel && !hasMetrics) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 验证字段长度
    if (data.label !== undefined) {
      if (data.label.trim().length === 0) {
        throw new ValidationError('Label cannot be empty');
      }
      if (data.label.length > 200) {
        throw new ValidationError('Label must not exceed 200 characters');
      }
    }

    // 验证指标 URIs 格式
    if (data.metrics) {
      for (const uri of data.metrics) {
        if (!this.isValidUri(uri)) {
          throw new ValidationError(`Invalid metric URI format: ${uri}`);
        }
      }
    }

    await this.categoryRepo.updateCategory(id, data);

    // 获取更新后的分类信息
    const updated = await this.categoryRepo.getCategoryById(id);
    if (!updated) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    return {
      uri: id,
      label: updated.label || data.label || '',
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string, params: DeleteCategoryRequest = {}): Promise<DeleteCategoryResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }

    await this.categoryRepo.deleteCategory(id, params.force || false);

    return {
      uri: id,
      deleted: true,
      deleted_at: new Date().toISOString()
    };
  }

  /**
   * 查询分类的指标列表
   */
  async getCategoryMetrics(id: string): Promise<CategoryMetricsResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }

    // 验证分类是否存在
    const exists = await this.categoryRepo.categoryExists(id);
    if (!exists) {
      throw new NotFoundError(`Category not found: ${id}`);
    }

    const metrics = await this.categoryRepo.getCategoryMetrics(id);

    return {
      result: metrics
    };
  }

  /**
   * 添加指标到分类
   */
  async addMetricsToCategory(id: string, data: AddMetricsToCategoryRequest): Promise<AddMetricsToCategoryResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }

    // 验证指标 URIs
    if (!data.metrics || data.metrics.length === 0) {
      throw new ValidationError('At least one metric URI is required');
    }

    for (const uri of data.metrics) {
      if (!this.isValidUri(uri)) {
        throw new ValidationError(`Invalid metric URI format: ${uri}`);
      }
    }

    const metrics = await this.categoryRepo.addMetricsToCategory(id, data.metrics);

    return {
      category_uri: id,
      added_metrics: metrics,
      added_at: new Date().toISOString()
    };
  }

  /**
   * 从分类移除指标
   */
  async removeMetricFromCategory(id: string, metricUri: string): Promise<RemoveMetricFromCategoryResponse> {
    // 验证 URI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid category URI format');
    }
    if (!this.isValidUri(metricUri)) {
      throw new ValidationError('Invalid metric URI format');
    }

    await this.categoryRepo.removeMetricFromCategory(id, metricUri);

    return {
      category_uri: id,
      removed_metric_uri: metricUri,
      removed_at: new Date().toISOString()
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证 URI 格式
   */
  private isValidUri(uri: string): boolean {
    if (!uri || uri.trim().length === 0) {
      return false;
    }
    // 简单验证：必须包含协议或是相对 URI
    return uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('urn:');
  }
}
