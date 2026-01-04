import { ImplementationRepository } from '../../repositories/implementationRepository';
import {
  ImplementationsResponse,
  ImplementationDetailResponse,
  GetImplementationsRequest,
  CreateImplementationRequest,
  UpdateImplementationRequest,
  CreateImplementationResponse,
  UpdateImplementationResponse,
  DeleteImplementationResponse,
  ImplementationDTO
} from '../../types/kg';
import { ValidationError, NotFoundError, DeleteConflictError } from '../../types/errors';

/**
 * Implementation Service - 处理实现相关的业务逻辑
 */
export class ImplementationService {
  private implRepo: ImplementationRepository;

  constructor(implRepo?: ImplementationRepository) {
    this.implRepo = implRepo || new ImplementationRepository();
  }

  /**
   * 获取实现列表（支持多种过滤条件）
   * 
   * @param params 查询参数
   * @returns 实现列表及分页信息
   */
  async getImplementations(params: GetImplementationsRequest): Promise<ImplementationsResponse> {
    // 参数验证
    if (params.page !== undefined && params.page < 1) {
      throw new ValidationError('Page number must be greater than 0');
    }

    if (params.size !== undefined && (params.size < 1 || params.size > 100)) {
      throw new ValidationError('Page size must be between 1 and 100');
    }

    try {
      const { implementations, total } = await this.implRepo.getImplementations(params);

      return {
        result: implementations,
        page: params.page || 1,
        size: params.size || 10,
        total
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to get implementations. ${error}`);
    }
  }

  /**
   * 获取实现详情
   * 
   * @param id 实现标识符
   * @returns 实现详细信息
   */
  async getImplementationById(id: string): Promise<ImplementationDetailResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Implementation ID is required');
    }

    try {
      const implementation = await this.implRepo.getImplementationById(id);

      return {
        result: implementation
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get implementation: ${id}. ${error}`);
    }
  }

  /**
   * 创建新实现
   * 
   * @param data 创建请求数据
   * @returns 创建的实现信息
   */
  async createImplementation(data: CreateImplementationRequest): Promise<CreateImplementationResponse> {
    try {
      const iri = await this.implRepo.createImplementation(data);

      return {
        iri,
        label: data.name,
        language: data.language,
        file_path: data.file_path,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create implementation. ${error}`);
    }
  }

  /**
   * 更新实现
   * 
   * @param id 实现标识符
   * @param data 更新请求数据
   * @returns 更新后的实现信息
   */
  async updateImplementation(id: string, data: UpdateImplementationRequest): Promise<UpdateImplementationResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Implementation ID is required');
    }

    // 验证至少有一个字段需要更新
    const hasUpdates = Object.keys(data).length > 0;
    if (!hasUpdates) {
      throw new ValidationError('At least one field must be provided for update');
    }

    try {
      await this.implRepo.updateImplementation(id, data);

      // 获取更新后的数据
      const updated = await this.implRepo.getImplementationById(id);

      return {
        iri: updated.iri || '',
        label: updated.label || '',
        language: updated.language,
        file_path: updated.filePath,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update implementation: ${id}. ${error}`);
    }
  }

  /**
   * 删除实现
   * 
   * @param id 实现标识符
   * @param force 是否强制删除（忽略模型引用）
   * @returns 删除结果
   */
  async deleteImplementation(id: string, force: boolean = false): Promise<DeleteImplementationResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Implementation ID is required');
    }

    try {
      // 获取实现信息（用于返回）
      const implementation = await this.implRepo.getImplementationById(id);

      // 执行删除
      await this.implRepo.deleteImplementation(id, force);

      return {
        iri: implementation.iri || '',
        deleted: true,
        deleted_at: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DeleteConflictError) {
        throw error;
      }
      throw new Error(`Failed to delete implementation: ${id}. ${error}`);
    }
  }
}
