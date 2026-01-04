import { FrameworkRepository } from '../../repositories/frameworkRepository';
import {
  GetFrameworksRequest,
  CreateFrameworkRequest,
  UpdateFrameworkRequest,
  FrameworksResponse,
  FrameworkDetailResponse,
  CreateFrameworkResponse,
  UpdateFrameworkResponse,
  DeleteFrameworkResponse,
  FrameworkCategoriesResponse,
  AddCategoriesToFrameworkRequest,
  AddCategoriesToFrameworkResponse,
  RemoveCategoryFromFrameworkResponse
} from '../../types/kg';
import { ValidationError, NotFoundError } from '../../types/errors';

/**
 * Framework Service - 处理报告框架相关的业务逻辑
 */
export class FrameworkService {
  private frameworkRepo: FrameworkRepository;

  constructor(frameworkRepo?: FrameworkRepository) {
    this.frameworkRepo = frameworkRepo || new FrameworkRepository();
  }

  /**
   * 获取报告框架列表（支持分页和搜索）
   */
  async getFrameworks(params: GetFrameworksRequest): Promise<FrameworksResponse> {
    // 参数验证
    if (params.page !== undefined && params.page < 1) {
      throw new ValidationError('Page number must be greater than 0');
    }

    if (params.size !== undefined && (params.size < 1 || params.size > 100)) {
      throw new ValidationError('Page size must be between 1 and 100');
    }

    const { frameworks, total } = await this.frameworkRepo.getFrameworks(params);

    return {
      result: frameworks,
      page: params.page || 1,
      size: params.size || 10,
      total
    };
  }

  /**
   * 根据 ID 获取报告框架详情
   */
  async getFrameworkById(id: string): Promise<FrameworkDetailResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    const framework = await this.frameworkRepo.getFrameworkById(id);

    return {
      result: framework
    };
  }

  /**
   * 创建新报告框架
   */
  async createFramework(data: CreateFrameworkRequest): Promise<CreateFrameworkResponse> {
    // 参数验证
    if (!data.label || data.label.trim().length === 0) {
      throw new ValidationError('Framework label is required');
    }

    if (data.label.length > 200) {
      throw new ValidationError('Framework label must not exceed 200 characters');
    }

    if (data.sourceDocument && data.sourceDocument.length > 500) {
      throw new ValidationError('Source document must not exceed 500 characters');
    }

    // 验证分类 URIs 格式
    if (data.categories) {
      for (const iri of data.categories) {
        if (!this.isValidUri(iri)) {
          throw new ValidationError(`Invalid category URI: ${iri}`);
        }
      }
    }

    const { iri, label } = await this.frameworkRepo.createFramework(data);

    return {
      iri,
      label,
      sourceDocument: data.sourceDocument,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 部分更新报告框架
   */
  async updateFramework(id: string, data: UpdateFrameworkRequest): Promise<UpdateFrameworkResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    // 验证至少有一个字段需要更新
    const hasLabel = data.label !== undefined;
    const hasSourceDocument = data.sourceDocument !== undefined;
    const hasCategories = data.categories !== undefined;

    if (!hasLabel && !hasSourceDocument && !hasCategories) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 参数验证
    if (hasLabel && data.label!.trim().length === 0) {
      throw new ValidationError('Framework label cannot be empty');
    }

    if (hasLabel && data.label!.length > 200) {
      throw new ValidationError('Framework label must not exceed 200 characters');
    }

    if (hasSourceDocument && data.sourceDocument!.length > 0 && data.sourceDocument!.length > 500) {
      throw new ValidationError('Source document must not exceed 500 characters');
    }

    // 验证分类 URIs 格式
    if (data.categories) {
      for (const iri of data.categories) {
        if (!this.isValidUri(iri)) {
          throw new ValidationError(`Invalid category URI: ${iri}`);
        }
      }
    }

    const { iri, label } = await this.frameworkRepo.updateFramework(id, data);

    return {
      iri,
      label,
      sourceDocument: data.sourceDocument,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 删除报告框架
   * @param id - 框架标识符
   * @param force - 是否强制删除（即使有引用）
   */
  async deleteFramework(id: string, force: boolean = false): Promise<DeleteFrameworkResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    const { iri, deleted } = await this.frameworkRepo.deleteFramework(id, force);

    return {
      iri,
      deleted,
      deleted_at: new Date().toISOString()
    };
  }

  /**
   * 获取框架的分类列表
   */
  async getFrameworkCategories(id: string): Promise<FrameworkCategoriesResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    const categories = await this.frameworkRepo.getFrameworkCategories(id);

    return {
      result: categories
    };
  }

  /**
   * 添加分类到框架
   */
  async addCategoriesToFramework(id: string, data: AddCategoriesToFrameworkRequest): Promise<AddCategoriesToFrameworkResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    if (!data.categories || data.categories.length === 0) {
      throw new ValidationError('At least one category URI is required');
    }

    // 验证分类 URIs 格式
    for (const iri of data.categories) {
      if (!this.isValidUri(iri)) {
        throw new ValidationError(`Invalid category URI: ${iri}`);
      }
    }

    const addedCategories = await this.frameworkRepo.addCategoriesToFramework(id, data.categories);

    // 解析框架 URI
    const frameworkUri = this.resolveFrameworkUri(id);

    return {
      framework_iri: frameworkUri,
      added_categories: addedCategories,
      added_at: new Date().toISOString()
    };
  }

  /**
   * 从框架删除分类
   */
  async removeCategoryFromFramework(id: string, categoryId: string): Promise<RemoveCategoryFromFrameworkResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Framework ID is required');
    }

    if (!categoryId || categoryId.trim().length === 0) {
      throw new ValidationError('Category ID is required');
    }

    const { iri } = await this.frameworkRepo.removeCategoryFromFramework(id, categoryId);

    // 解析框架 URI
    const frameworkUri = this.resolveFrameworkUri(id);

    return {
      framework_iri: frameworkUri,
      removed_category_iri: iri,
      removed_at: new Date().toISOString()
    };
  }

  // ============== 辅助方法 ==============

  /**
   * 验证 URI 格式
   */
  private isValidUri(iri: string): boolean {
    try {
      // 检查是否为完整 URI
      if (iri.startsWith('http://') || iri.startsWith('https://')) {
        new URL(iri);
        return true;
      }

      // 检查是否为命名空间格式（例如 esg:Something）
      if (/^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9_-]+$/.test(iri)) {
        return true;
      }

      // 检查是否为简短 ID 格式
      if (/^[a-zA-Z0-9_-]+$/.test(iri)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 解析框架 URI
   */
  private resolveFrameworkUri(id: string): string {
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }
    if (id.startsWith('esg:')) {
      return `http://example.org/esg#${id.substring(4)}`;
    }
    return `http://example.org/esg#${id}`;
  }
}
