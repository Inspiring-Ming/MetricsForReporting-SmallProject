import { DatasetVariableRepository } from '../../repositories/datasetVariableRepository';
import {
  DatasetVariablesResponse,
  DatasetVariableDetailResponse,
  GetDatasetVariablesRequest,
  CreateDatasetVariableRequest,
  CreateDatasetVariableResponse,
  UpdateDatasetVariableRequest,
  UpdateDatasetVariableResponse,
  DeleteDatasetVariableRequest,
  DeleteDatasetVariableResponse,
  VariableDatasourcesResponse,
  AddDatasourceToVariableRequest,
  AddDatasourceToVariableResponse,
  RemoveVariableDatasourceResponse,
  DatasetVariableQualityResponse,
  VariableMetricsResponse
} from '../../types/kg';
import { ValidationError } from '../../types/errors';

/**
 * DatasetVariable Service - 处理数据集变量相关的业务逻辑
 */
export class DatasetVariableService {
  private repository: DatasetVariableRepository;

  constructor(repository?: DatasetVariableRepository) {
    this.repository = repository || new DatasetVariableRepository();
  }

  /**
   * 获取数据集变量列表
   */
  async getDatasetVariables(params: GetDatasetVariablesRequest): Promise<DatasetVariablesResponse> {
    // 参数验证
    this.validatePaginationParams(params);

    if (params.minConfidenceScore !== undefined) {
      if (params.minConfidenceScore < 0 || params.minConfidenceScore > 100) {
        throw new ValidationError('minConfidenceScore must be between 0 and 100');
      }
    }

    const { variables, total } = await this.repository.getDatasetVariables(params);

    const page = params.page || 1;
    const size = params.size || 20;
    const totalPages = Math.ceil(total / size);

    return {
      result: variables,
      page,
      size,
      total,
      totalPages
    };
  }

  /**
   * 获取数据集变量详情
   */
  async getDatasetVariableById(id: string): Promise<DatasetVariableDetailResponse> {
    this.validateId(id);

    const variable = await this.repository.getDatasetVariableById(id);

    return {
      result: variable
    };
  }

  /**
   * 创建数据集变量
   */
  async createDatasetVariable(data: CreateDatasetVariableRequest): Promise<CreateDatasetVariableResponse> {
    // 验证必填字段
    if (!data.label || typeof data.label !== 'string') {
      throw new ValidationError('Label is required and must be a string');
    }

    if (data.label.trim().length === 0) {
      throw new ValidationError('Label cannot be empty or whitespace');
    }

    // 验证 confidenceScore 范围
    if (data.confidenceScore !== undefined) {
      if (typeof data.confidenceScore !== 'number' || data.confidenceScore < 0 || data.confidenceScore > 100) {
        throw new ValidationError('Confidence score must be a number between 0 and 100');
      }
    }

    // 验证 sources 数组
    if (data.sources !== undefined) {
      if (!Array.isArray(data.sources)) {
        throw new ValidationError('Sources must be an array');
      }

      if (data.sources.length === 0) {
        throw new ValidationError('Sources array cannot be empty');
      }

      for (const source of data.sources) {
        if (!source || typeof source !== 'string' || source.trim().length === 0) {
          throw new ValidationError('Each source must be a non-empty string');
        }
      }
    }

    const result = await this.repository.createDatasetVariable(data);

    return result;
  }

  /**
   * 更新数据集变量
   */
  async updateDatasetVariable(id: string, data: UpdateDatasetVariableRequest): Promise<UpdateDatasetVariableResponse> {
    // 验证 ID
    this.validateId(id);

    // 验证至少有一个字段需要更新
    if (data.label === undefined && data.alignmentReason === undefined && data.confidenceScore === undefined &&
      data.isUnitCompatible === undefined && data.sources === undefined) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 验证 label（如果提供）
    if (data.label !== undefined) {
      if (typeof data.label !== 'string' || data.label.trim().length === 0) {
        throw new ValidationError('Label must be a non-empty string');
      }
    }

    // 验证 confidenceScore 范围
    if (data.confidenceScore !== undefined) {
      if (typeof data.confidenceScore !== 'number' || data.confidenceScore < 0 || data.confidenceScore > 100) {
        throw new ValidationError('Confidence score must be a number between 0 and 100');
      }
    }

    // 验证 sources 数组
    if (data.sources !== undefined) {
      if (!Array.isArray(data.sources)) {
        throw new ValidationError('Sources must be an array');
      }

      // 允许空数组（用于移除所有数据源）
      for (const source of data.sources) {
        if (!source || typeof source !== 'string' || source.trim().length === 0) {
          throw new ValidationError('Each source must be a non-empty string');
        }
      }
    }

    const result = await this.repository.updateDatasetVariable(id, data);

    return result;
  }

  /**
   * 删除数据集变量
   */
  async deleteDatasetVariable(id: string, params?: DeleteDatasetVariableRequest): Promise<DeleteDatasetVariableResponse> {
    // 验证 ID
    this.validateId(id);

    const force = params?.force || false;

    const result = await this.repository.deleteDatasetVariable(id, force);

    return result;
  }

  /**
   * 获取数据集变量的所有数据源
   */
  async getVariableDatasources(id: string): Promise<VariableDatasourcesResponse> {
    // 验证 ID
    this.validateId(id);

    const { variableUri, variableLabel, datasources } = await this.repository.getVariableDatasources(id);

    return {
      variable_id: variableUri,
      variable_label: variableLabel,
      datasources,
      total: datasources.length
    };
  }

  /**
   * 为数据集变量添加数据源关联
   */
  async addDatasourceToVariable(id: string, data: AddDatasourceToVariableRequest): Promise<AddDatasourceToVariableResponse> {
    // 验证 ID
    this.validateId(id);

    // 验证 datasourceUri
    if (!data.datasourceUri || typeof data.datasourceUri !== 'string') {
      throw new ValidationError('Datasource URI is required and must be a string');
    }

    if (data.datasourceUri.trim().length === 0) {
      throw new ValidationError('Datasource URI cannot be empty or whitespace');
    }

    const result = await this.repository.addDatasourceToVariable(id, data.datasourceUri);

    return {
      variable_iri: result.variableUri,
      datasource_iri: result.datasourceUri,
      added_at: new Date().toISOString()
    };
  }

  /**
   * 验证分页参数
   */
  private validatePaginationParams(params: GetDatasetVariablesRequest): void {
    const { page, size } = params;

    if (page !== undefined) {
      if (!Number.isInteger(page) || page < 1) {
        throw new ValidationError('Page must be a positive integer');
      }
    }

    if (size !== undefined) {
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        throw new ValidationError('Size must be between 1 and 100');
      }
    }
  }

  /**
   * 移除数据集变量的数据源关联
   */
  async removeVariableDatasource(id: string, datasourceId: string): Promise<RemoveVariableDatasourceResponse> {
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid variable IRI format');
    }

    if (!this.isValidUri(datasourceId)) {
      throw new ValidationError('Invalid datasource IRI format');
    }

    await this.repository.removeVariableDatasource(id, datasourceId);

    return {
      variable_iri: id,
      datasource_iri: datasourceId,
      removed_at: new Date().toISOString()
    };
  }

  /**
   * 获取数据集变量的质量信息
   */
  async getVariableQuality(id: string): Promise<DatasetVariableQualityResponse> {
    this.validateId(id);

    const quality = await this.repository.getVariableQuality(id);

    return {
      variable_id: quality.variableUri,
      variable_label: quality.variableLabel,
      confidenceScore: quality.confidenceScore,
      isUnitCompatible: quality.isUnitCompatible,
      alignmentReason: quality.alignmentReason
    };
  }

  /**
   * 验证 ID
   */
  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Dataset variable ID is required');
    }

    // 检查是否全是空格或为空
    if (id.trim().length === 0) {
      throw new ValidationError('Dataset variable ID cannot be empty or whitespace');
    }
  }

  /**
   * 验证 URI 格式是否有效
   */
  private isValidUri(iri: string): boolean {
    if (!iri || iri.trim().length === 0) {
      return false;
    }

    // 完整 URL 格式
    if (iri.startsWith('http://') || iri.startsWith('https://')) {
      try {
        new URL(iri);
        return true;
      } catch {
        return false;
      }
    }

    // 命名空间格式 (prefix:localName)
    if (/^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z_][a-zA-Z0-9_-]*$/.test(iri)) {
      return true;
    }

    // 简单标识符 (字母开头，可包含字母数字下划线连字符)
    if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(iri)) {
      return true;
    }

    return false;
  }

  /**
   * 获取使用此数据集变量的所有指标
   */
  async getVariableMetrics(id: string): Promise<VariableMetricsResponse> {
    this.validateId(id);

    const result = await this.repository.getVariableMetrics(id);

    return {
      variable_id: result.variableUri,
      variable_label: result.variableLabel,
      metrics: result.metrics,
      total: result.metrics.length
    };
  }
}
