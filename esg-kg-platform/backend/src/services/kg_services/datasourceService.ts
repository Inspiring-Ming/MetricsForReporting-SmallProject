import { DatasourceRepository } from '../../repositories/datasourceRepository';
import {
  DatasourcesResponse,
  DatasourceDetailResponse,
  GetDatasourcesRequest,
  CreateDatasourceRequest,
  CreateDatasourceResponse,
  UpdateDatasourceRequest,
  UpdateDatasourceResponse,
  DeleteDatasourceResponse,
  DatasourceVariablesResponse,
  DatasourceMetricsResponse
} from '../../types/kg';
import { ValidationError } from '../../types/errors';

/**
 * Datasource Service - 处理数据源相关的业务逻辑
 */
export class DatasourceService {
  private repository: DatasourceRepository;

  constructor(repository?: DatasourceRepository) {
    this.repository = repository || new DatasourceRepository();
  }

  /**
   * 获取数据源列表
   */
  async getDatasources(params: GetDatasourcesRequest): Promise<DatasourcesResponse> {
    // 参数验证
    this.validatePaginationParams(params);

    const { datasources, total } = await this.repository.getDatasources(params);

    const page = params.page || 1;
    const size = params.size || 20;
    const totalPages = Math.ceil(total / size);

    return {
      result: datasources,
      page,
      size,
      total,
      totalPages
    };
  }

  /**
   * 获取数据源详情
   */
  async getDatasourceById(id: string): Promise<DatasourceDetailResponse> {
    this.validateId(id);

    const datasource = await this.repository.getDatasourceById(id);

    return {
      result: datasource
    };
  }

  /**
   * 创建数据源
   */
  async createDatasource(data: CreateDatasourceRequest): Promise<CreateDatasourceResponse> {
    // 验证必填字段
    if (data.label === undefined || data.label === null) {
      throw new ValidationError('Label is required and must be a string');
    }

    if (typeof data.label !== 'string') {
      throw new ValidationError('Label is required and must be a string');
    }

    if (data.label.trim().length === 0) {
      throw new ValidationError('Label cannot be empty or whitespace');
    }

    // 验证 recordCount
    if (data.recordCount !== undefined) {
      if (typeof data.recordCount !== 'number' || data.recordCount < 0) {
        throw new ValidationError('Record count must be a non-negative number');
      }
    }

    // 验证可选字符串字段
    if (data.fileName !== undefined && typeof data.fileName !== 'string') {
      throw new ValidationError('File name must be a string');
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (data.coverage !== undefined && typeof data.coverage !== 'string') {
      throw new ValidationError('Coverage must be a string');
    }

    if (data.disclosureType !== undefined && typeof data.disclosureType !== 'string') {
      throw new ValidationError('Disclosure type must be a string');
    }

    const result = await this.repository.createDatasource(data);

    return result;
  }

  /**
   * 更新数据源
   */
  async updateDatasource(id: string, data: UpdateDatasourceRequest): Promise<UpdateDatasourceResponse> {
    // 验证 ID
    this.validateId(id);

    // 验证至少有一个字段需要更新
    const hasUpdateFields = Object.keys(data).length > 0;
    if (!hasUpdateFields) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 验证 recordCount
    if (data.recordCount !== undefined) {
      if (typeof data.recordCount !== 'number' || data.recordCount < 0) {
        throw new ValidationError('Record count must be a non-negative number');
      }
    }

    // 验证字符串字段
    if (data.label !== undefined && typeof data.label !== 'string') {
      throw new ValidationError('Label must be a string');
    }

    if (data.fileName !== undefined && typeof data.fileName !== 'string') {
      throw new ValidationError('File name must be a string');
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (data.coverage !== undefined && typeof data.coverage !== 'string') {
      throw new ValidationError('Coverage must be a string');
    }

    if (data.disclosureType !== undefined && typeof data.disclosureType !== 'string') {
      throw new ValidationError('Disclosure type must be a string');
    }

    const result = await this.repository.updateDatasource(id, data);

    return result;
  }

  /**
   * 删除数据源
   */
  async deleteDatasource(id: string, force: boolean = false): Promise<DeleteDatasourceResponse> {
    // 验证 ID
    this.validateId(id);

    // 验证 force 参数
    if (typeof force !== 'boolean') {
      throw new ValidationError('Force parameter must be a boolean');
    }

    const result = await this.repository.deleteDatasource(id, force);

    return result;
  }

  /**
   * 验证 ID
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError('Datasource ID is required and must be a non-empty string');
    }
  }

  /**
   * 验证分页参数
   */
  private validatePaginationParams(params: GetDatasourcesRequest): void {
    if (params.page !== undefined) {
      if (!Number.isInteger(params.page) || params.page < 1) {
        throw new ValidationError('Page must be a positive integer');
      }
    }

    if (params.size !== undefined) {
      if (!Number.isInteger(params.size) || params.size < 1 || params.size > 100) {
        throw new ValidationError('Size must be between 1 and 100');
      }
    }

    if (params.sort !== undefined) {
      const validSorts = ['label', 'fileName', 'recordCount', 'createdAt'];
      if (!validSorts.includes(params.sort)) {
        throw new ValidationError(`Sort must be one of: ${validSorts.join(', ')}`);
      }
    }

    if (params.order !== undefined) {
      if (params.order !== 'asc' && params.order !== 'desc') {
        throw new ValidationError('Order must be either "asc" or "desc"');
      }
    }
  }

  /**
   * 获取使用此数据源的所有数据集变量
   */
  async getDatasourceVariables(id: string): Promise<DatasourceVariablesResponse> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError('Datasource ID is required');
    }

    const result = await this.repository.getDatasourceVariables(id);

    return {
      datasource_id: result.datasourceUri,
      datasource_label: result.datasourceLabel,
      variables: result.variables,
      total: result.variables.length
    };
  }

  /**
   * 获取间接使用此数据源的所有指标
   */
  async getDatasourceMetrics(id: string): Promise<DatasourceMetricsResponse> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError('Datasource ID is required');
    }

    const result = await this.repository.getDatasourceMetrics(id);

    return {
      datasource_id: result.datasourceUri,
      datasource_label: result.datasourceLabel,
      metrics: result.metrics,
      total: result.metrics.length
    };
  }
}
