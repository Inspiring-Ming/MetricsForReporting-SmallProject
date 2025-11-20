import { IndustryRepository } from '../../repositories/industryRepository';
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
import { ValidationError, NotFoundError } from '../../types/errors';

/**
 * Industry Service - 处理行业相关的业务逻辑
 */
export class IndustryService {
  private industryRepo: IndustryRepository;

  constructor(industryRepo?: IndustryRepository) {
    this.industryRepo = industryRepo || new IndustryRepository();
  }

  /**
   * 获取行业列表（支持分页和搜索）
   */
  async getIndustries(params: GetIndustriesRequest): Promise<IndustriesResponse> {
    // 参数验证
    if (params.page !== undefined && params.page < 1) {
      throw new ValidationError('Page number must be greater than 0');
    }

    if (params.size !== undefined && (params.size < 1 || params.size > 100)) {
      throw new ValidationError('Page size must be between 1 and 100');
    }

    const { industries, total } = await this.industryRepo.getIndustries(params);

    return {
      result: industries,
      page: params.page || 1,
      size: params.size || 10,
      total
    };
  }

  /**
   * 根据 ID 获取行业详情
   */
  async getIndustryById(id: string): Promise<IndustryDetailResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Industry ID is required');
    }

    const industry = await this.industryRepo.getIndustryById(id);

    return {
      result: industry
    };
  }

  /**
   * 创建新行业
   */
  async createIndustry(data: CreateIndustryRequest): Promise<CreateIndustryResponse> {
    // 参数验证
    if (!data.label || data.label.trim().length === 0) {
      throw new ValidationError('Industry label is required');
    }

    if (data.label.length > 200) {
      throw new ValidationError('Industry label must not exceed 200 characters');
    }

    if (data.description && data.description.length > 1000) {
      throw new ValidationError('Industry description must not exceed 1000 characters');
    }

    // 验证报告框架 URIs 格式
    if (data.reportsUsing) {
      for (const uri of data.reportsUsing) {
        if (!this.isValidUri(uri)) {
          throw new ValidationError(`Invalid framework URI: ${uri}`);
        }
      }
    }

    const { uri, label } = await this.industryRepo.createIndustry(data);

    return {
      uri,
      label,
      description: data.description,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 部分更新行业
   */
  async updateIndustry(id: string, data: UpdateIndustryRequest): Promise<UpdateIndustryResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Industry ID is required');
    }

    // 验证至少有一个字段需要更新
    const hasLabel = data.label !== undefined;
    const hasDescription = data.description !== undefined;
    const hasReportsUsing = data.reportsUsing !== undefined;
    
    if (!hasLabel && !hasDescription && !hasReportsUsing) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 参数验证
    if (hasLabel && data.label!.trim().length === 0) {
      throw new ValidationError('Industry label cannot be empty');
    }

    if (hasLabel && data.label!.length > 200) {
      throw new ValidationError('Industry label must not exceed 200 characters');
    }

    // Description can be empty string (to delete), but check max length if not empty
    if (hasDescription && data.description!.length > 0 && data.description!.length > 1000) {
      throw new ValidationError('Industry description must not exceed 1000 characters');
    }

    // 验证报告框架 URIs 格式
    if (data.reportsUsing) {
      for (const uri of data.reportsUsing) {
        if (!this.isValidUri(uri)) {
          throw new ValidationError(`Invalid framework URI: ${uri}`);
        }
      }
    }

    const { uri, label } = await this.industryRepo.updateIndustry(id, data);

    return {
      uri,
      label,
      description: data.description,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 删除行业
   * @param id - 行业标识符
   * @param force - 是否强制删除（忽略关联检查）
   */
  async deleteIndustry(id: string, force: boolean = false): Promise<DeleteIndustryResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Industry ID is required');
    }

    const { uri, deleted } = await this.industryRepo.deleteIndustry(id, force);

    return {
      uri,
      deleted,
      deleted_at: new Date().toISOString()
    };
  }

  /**
   * 辅助方法：验证 URI 格式
   */
  private isValidUri(uri: string): boolean {
    try {
      // 检查是否是有效的 URL 或命名空间格式
      return uri.startsWith('http://') || 
             uri.startsWith('https://') || 
             /^[a-zA-Z0-9]+:[a-zA-Z0-9]+$/.test(uri);
    } catch {
      return false;
    }
  }
}
