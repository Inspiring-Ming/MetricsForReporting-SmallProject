import { KnowledgeGraphRepository } from '../../repositories/knowledgeGraphRepository';
import { MetricRepository } from '../../repositories/metricRepository';
import {
  MetricDetailResponse,
  MetricDatasetsResponse,
  MetricLineageResponse,
  MetricsResponse,
  GetMetricsRequest,
  BestDataSourceResponse,
  MetricDataSourcesResponse,
  MetricModelsResponse,
  MetricModelsDetailResponse,
  MetricInputsResponse,

  MetricCalculationMethodResponse,
  MetricDTO,
  CreateMetricRequest,
  CreateMetricResponse,
  UpdateMetricRequest,
  UpdateMetricResponse,
  PatchMetricRequest,
  DeleteMetricRequest,
  DeleteMetricResponse,
  AddMetricDatasourceRequest,
  AddMetricDatasourceResponse,
  RemoveMetricDatasourceResponse,
  AddMetricInputRequest,
  AddMetricInputResponse,
  RemoveMetricInputResponse,
  BatchCreateMetricsRequest,
  BatchCreateMetricsResponse,
  BatchDeleteMetricsRequest,
  BatchDeleteMetricsResponse
} from '../../types/kg';
import { ValidationError, NotFoundError } from '../../types/errors';

/**
 * Metric Service - 处理指标相关的业务逻辑
 */
export class MetricService {
  private kgRepo: KnowledgeGraphRepository;
  private metricRepo: MetricRepository;

  constructor(kgRepo?: KnowledgeGraphRepository, metricRepo?: MetricRepository) {
    this.kgRepo = kgRepo || new KnowledgeGraphRepository();
    this.metricRepo = metricRepo || new MetricRepository();
  }

  /**
   * 获取指标列表（支持多种过滤条件）
   * 
   * @param params 查询参数
   * @returns 指标列表及分页信息
   */
  async getMetrics(params: GetMetricsRequest): Promise<MetricsResponse> {
    // 参数验证
    if (params.page !== undefined && params.page < 1) {
      throw new ValidationError('Page number must be greater than 0');
    }

    if (params.size !== undefined && params.size < 1) {
      throw new ValidationError('Page size must be greater than 0');
    }

    // 验证 calculationMethod 参数
    if (params.calculationMethod !== undefined &&
      params.calculationMethod !== 'direct_measurement' &&
      params.calculationMethod !== 'calculation_model') {
      throw new ValidationError('Invalid calculationMethod. Must be either "direct_measurement" or "calculation_model"');
    }

    const page = params.page || 1;
    const requestedSize = params.size || 10;
    const size = Math.min(requestedSize, 100);

    try {
      // 使用统一的 listMetrics 方法处理所有情况
      const { metrics, total } = await this.metricRepo.listMetrics({ ...params, page, size });
      const totalPages = Math.ceil(total / size);

      return {
        result: metrics,
        page,
        size,
        total,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get metrics list. ${error}`);
    }
  }

  /**
   * 根据 ID 获取指标详情（包含所有属性）
   * 
   * @param id 指标标识符（可以是 IRI、命名空间格式、label 或简短 ID）
   * @returns 指标详情及其所有属性
   */
  async getMetricById(id: string): Promise<MetricDetailResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Metric ID is required');
    }

    try {
      // 获取指标元数据
      const metadata = await this.kgRepo.getMetricMetadata(id);

      // 获取指标所有属性
      const attributesMap = await this.kgRepo.getMetricAttributes(id);
      const attributes = Object.fromEntries(attributesMap);

      return {
        result: {
          iri: metadata.metric.iri,
          label: metadata.metric.label,
          hasType: metadata.metric.hasType,
          hasMetricType: metadata.metric.hasMetricType,
          hasUnit: metadata.metric.hasUnit,
          hasCalculationMethod: metadata.metric.hasCalculationMethod,
          attributes,
          hierarchy: metadata.hierarchy
        }
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get metric details for: ${id}. ${error}`);
    }
  }

  /**
   * 获取指标的数据血缘关系
   * GET /api/kg/metrics/:id/lineage
   * 
   * 根据指标的计算方法，返回相应的数据来源：
   * - 直接测量：返回数据集变量和数据源
   * - 计算模型：返回模型、输入指标和实现信息
   * 
   * @param id 指标标识符
   * @returns 指标的数据血缘信息
   */
  async getMetricLineage(id: string): Promise<MetricLineageResponse> {
    this.validateMetricId(id);

    try {
      // 转换为 IRI 格式
      const metricIri = this.normalizeMetricId(id);

      // 首先获取metric的基本信息以确定计算方法
      const metadata = await this.kgRepo.getMetricMetadata(metricIri);
      const calculationMethod = metadata.metric.hasCalculationMethod;

      if (calculationMethod === 'direct_measurement') {
        // 直接测量路径
        const obtainedFrom = await this.kgRepo.getMetricDirectMeasurementLineage(metricIri);

        return {
          metric: {
            iri: metadata.metric.iri,
            label: metadata.metric.label,
            hasType: metadata.metric.hasType,
            hasMetricType: metadata.metric.hasMetricType,
            hasUnit: metadata.metric.hasUnit,
            hasCalculationMethod: 'direct_measurement'
          },
          lineageType: 'direct_measurement',
          obtainedFrom
        };
      } else if (calculationMethod === 'calculation_model') {
        // 计算模型路径
        const modelLineage = await this.kgRepo.getMetricCalculationModelLineage(metricIri);

        return {
          metric: {
            iri: metadata.metric.iri,
            label: metadata.metric.label,
            hasType: metadata.metric.hasType,
            hasMetricType: metadata.metric.hasMetricType,
            hasUnit: metadata.metric.hasUnit,
            hasCalculationMethod: 'calculation_model'
          },
          lineageType: 'calculation_model',
          model: modelLineage.model,
          inputs: modelLineage.inputs
        };
      } else {
        throw new ValidationError(`Unknown calculation method: ${calculationMethod}`);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get metric lineage for: ${id}. ${error}`);
    }
  }

  /**
   * @deprecated This method is deprecated. Use getMetricLineage() instead.
   *             The endpoint has been renamed from /datasets to /lineage.
   *             Will be removed in v2.0.0 (June 2026).
   * 
   * 获取指标的数据血缘关系
   * 
   * 根据指标的计算方法，返回相应的数据来源：
   * - 直接测量：返回数据集变量和数据源
   * - 计算模型：返回模型、输入指标和实现信息
   * 
   * @param id 指标标识符
   * @returns 指标的数据血缘信息
   */
  async getMetricDatasets(id: string): Promise<MetricDatasetsResponse> {
    // Redirect to new method
    const result = await this.getMetricLineage(id);

    // Remove lineageType field for backward compatibility
    const { lineageType, ...rest } = result as any;
    return rest as MetricDatasetsResponse;
  }

  /**
   * 获取指标的最佳数据源（遵循 IFRS 披露层次）
   * 
   * @param id 指标标识符
   * @returns 最佳数据源信息
   */
  async getBestDataSource(id: string): Promise<BestDataSourceResponse> {
    this.validateMetricId(id);

    try {
      const dataSource = await this.kgRepo.getBestDataSourceForMetric(id);

      return {
        metricId: id,
        dataSource: dataSource ? {
          dataSourceID: dataSource.dataSourceID,
          disclosureType: dataSource.disclosureType,
          fileName: undefined,
          description: undefined
        } : null
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get best data source for metric: ${id}. ${error}`);
    }
  }

  /**
   * 获取指标的所有数据源（非仅最佳数据源）
   * GET /api/kg/metrics/:id/datasources
   * 
   * 返回与指标关联的所有数据源，包括通过数据集变量的关联信息。
   * 仅适用于直接测量（direct_measurement）的指标。
   * 
   * @param id 指标标识符
   * @param includeVariables 是否包含数据集变量的详细信息
   * @returns 所有数据源列表
   */
  async getMetricDataSources(id: string, includeVariables: boolean = false): Promise<MetricDataSourcesResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Metric ID is required');
    }

    // Validate IRI format
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric ID format');
    }

    try {
      // 获取指标详情以确认计算方法
      const metricDetail = await this.getMetricById(id);
      const metric = metricDetail.result;

      // 检查是否为直接测量指标
      if (metric.hasCalculationMethod !== 'direct_measurement') {
        return {
          metricId: id,
          metricLabel: metric.label || id,
          calculationMethod: metric.hasCalculationMethod || 'calculation_model',
          dataSources: [],
          total: 0
        };
      }

      // 获取数据集信息（包含数据源）
      const lineage = await this.getMetricLineage(id);

      if (!('obtainedFrom' in lineage)) {
        return {
          metricId: id,
          metricLabel: metric.label || id,
          calculationMethod: 'direct_measurement',
          dataSources: [],
          total: 0
        };
      }

      // 提取所有数据源，使用 Map 去重
      const dataSourceMap = new Map<string, any>();

      for (const variable of lineage.obtainedFrom) {
        if (variable.sources && variable.sources.length > 0) {
          for (const source of variable.sources) {
            const sourceId = source.iri || source.label || '';

            if (!dataSourceMap.has(sourceId)) {
              dataSourceMap.set(sourceId, {
                dataSourceID: sourceId,
                label: source.label,
                fileName: source.fileName,
                disclosureType: '', // 需要从 repository 获取
                recordCount: source.recordCount,
                description: source.description,
                coverage: source.coverage,
                variables: includeVariables ? [] : undefined
              });
            }

            // 如果需要包含变量信息
            if (includeVariables) {
              const dsEntry = dataSourceMap.get(sourceId);
              if (dsEntry.variables) {
                dsEntry.variables.push({
                  iri: variable.iri || '',
                  label: variable.label,
                  alignmentReason: variable.alignmentReason,
                  confidenceScore: variable.confidenceScore,
                  isUnitCompatible: variable.isUnitCompatible
                });
              }
            }
          }
        }
      }

      const dataSources = Array.from(dataSourceMap.values());

      // 按披露类型排序（如果有的话）
      // 这里可以添加排序逻辑

      return {
        metricId: id,
        metricLabel: metric.label || id,
        calculationMethod: 'direct_measurement',
        dataSources,
        total: dataSources.length
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get data sources for metric: ${id}. ${error}`);
    }
  }

  /**
   * 获取使用该指标作为输入的所有模型（反向依赖查询）
   * GET /api/kg/metrics/:id/models
   * 
   * 返回所有将该指标作为输入（requiresInputFrom）的模型。
   * 这是一个反向依赖查询，用于了解该指标在哪些计算模型中被使用。
   * 
   * @param id 指标标识符
   * @returns 使用该指标的模型列表
   */
  async getMetricModels(id: string): Promise<MetricModelsResponse> {
    this.validateMetricId(id);

    try {
      // 解析指标 IRI
      const metricIri = this.normalizeMetricId(id);

      // 获取指标元数据以获取 label
      const metadata = await this.kgRepo.getMetricMetadata(metricIri);

      // 查询使用该指标的模型
      const models = await this.kgRepo.getModelsByMetric(metricIri);

      return {
        metricId: id,
        metricLabel: metadata.metric.label || id,
        models: models,
        total: models.length
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get models for metric: ${id}. ${error}`);
    }
  }

  /**
   * 获取指标计算所需的输入指标列表
   * GET /api/kg/metrics/:id/inputs
   * 
   * 返回该指标计算所需的所有输入指标。
   * 仅适用于 calculation_model 类型的指标。
   * 对于 direct_measurement 类型的指标，返回空输入列表。
   * 
   * @param id 指标标识符
   * @returns 输入指标列表
   */
  async getMetricInputs(id: string): Promise<MetricInputsResponse> {
    this.validateMetricId(id);

    try {
      // 解析指标 IRI
      const metricIri = this.normalizeMetricId(id);

      // 获取指标元数据
      const metadata = await this.kgRepo.getMetricMetadata(metricIri);
      const calculationMethod = metadata.metric.hasCalculationMethod;

      // 如果是直接测量，返回空输入列表
      if (calculationMethod === 'direct_measurement') {
        return {
          metricId: id,
          metricLabel: metadata.metric.label || id,
          calculationMethod: 'direct_measurement',
          inputs: [],
          total: 0
        };
      }

      // 如果是计算模型，查询输入指标
      const inputData = await this.kgRepo.getInputMetricsByMetric(metricIri);

      return {
        metricId: id,
        metricLabel: metadata.metric.label || id,
        calculationMethod: 'calculation_model',
        model: inputData.model,
        inputs: inputData.inputs,
        total: inputData.inputs.length
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get input metrics for metric: ${id}. ${error}`);
    }
  }

  /**
   * 获取指标的计算方法详情（CQ5）
   * GET /api/kg/metrics/:id/calculation-method
   * 
   * 返回指标的计算或直接测量方法信息：
   * - 直接测量：返回数据源信息
   * - 计算模型：返回模型和实现信息
   * 
   * @param id 指标标识符
   * @returns 计算方法详细信息
   */
  async getMetricCalculationMethod(id: string): Promise<MetricCalculationMethodResponse> {
    this.validateMetricId(id);

    try {
      // 获取指标详情
      const metricDetail = await this.getMetricById(id);
      const metric = metricDetail.result;

      const response: MetricCalculationMethodResponse = {
        metric_label: metric.label || id,
        metric_iri: metric.iri || '',
        calculation_method: metric.hasCalculationMethod || 'direct_measurement',
        attributes: metric.attributes
      };

      // 如果是直接测量，获取数据源信息
      if (response.calculation_method === 'direct_measurement') {
        try {
          const bestDataSource = await this.getBestDataSource(id);
          if (bestDataSource.dataSource) {
            response.data_sources = [bestDataSource.dataSource];
          }
        } catch (error) {
          console.warn(`Failed to get data source for metric ${id}:`, error);
        }
      }

      // 如果是计算模型，获取模型和实现信息
      if (response.calculation_method === 'calculation_model') {
        try {
          const datasets = await this.getMetricDatasets(id);

          if ('model' in datasets && datasets.model) {
            response.model = {
              label: datasets.model.label || '',
              iri: datasets.model.iri || '',
              calculationType: datasets.model.calculationType,
              formula: datasets.model.formula,
              mathematicalExpression: datasets.model.mathematicalExpression,
              description: `Calculation model for ${metric.label}`
            };

            // 获取实现信息
            if (datasets.model.implementation) {
              const impl = datasets.model.implementation;
              response.implementation = {
                label: impl.label || '',
                iri: impl.iri || '',
                language: impl.language,
                filePath: impl.filePath,
                functionName: impl.functionName,
                description: `Implementation for ${metric.label}`
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to get model info for metric ${id}:`, error);
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get calculation method for metric: ${id}. ${error}`);
    }
  }

  /**
   * 标准化指标 ID 为 IRI 格式
   */
  private normalizeMetricId(id: string): string {
    // 如果已经是完整 IRI
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }

    // 如果是命名空间格式 (esg:MetricName)
    if (id.includes(':')) {
      return id;
    }

    // 否则假设是简短ID或label，直接返回
    return id;
  }

  /**
   * 验证 IRI/ID 格式
   * 支持: 完整URL, 命名空间格式(prefix:name), 简单标识符
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
   * 验证并标准化 metric ID
   * @throws ValidationError 如果 ID 格式无效
   */
  private validateMetricId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Metric ID is required');
    }

    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric ID format');
    }
  }

  // =====================================================
  // CRUD Operations
  // =====================================================

  /**
   * 创建新指标
   */
  async createMetric(data: CreateMetricRequest): Promise<CreateMetricResponse> {
    // 验证必填字段
    if (!data.label || data.label.trim().length === 0) {
      throw new ValidationError('Label is required');
    }

    if (!data.calculationMethod) {
      throw new ValidationError('Calculation method is required');
    }

    // 验证 calculationMethod 的有效值
    if (data.calculationMethod !== 'direct_measurement' && data.calculationMethod !== 'calculation_model') {
      throw new ValidationError('Calculation method must be either "direct_measurement" or "calculation_model"');
    }

    // 验证字段长度
    if (data.label.length > 200) {
      throw new ValidationError('Label must not exceed 200 characters');
    }

    // 验证关联 IRIs 格式
    if (data.industry && !this.isValidUri(data.industry)) {
      throw new ValidationError(`Invalid industry IRI format: ${data.industry}`);
    }

    if (data.category && !this.isValidUri(data.category)) {
      throw new ValidationError(`Invalid category IRI format: ${data.category}`);
    }

    if (data.framework && !this.isValidUri(data.framework)) {
      throw new ValidationError(`Invalid framework IRI format: ${data.framework}`);
    }

    const result = await this.metricRepo.createMetric(data);

    return {
      iri: result.iri,
      label: result.label,
      code: data.code,
      calculationMethod: data.calculationMethod,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 完整更新指标
   */
  async updateMetric(id: string, data: UpdateMetricRequest): Promise<UpdateMetricResponse> {
    // 验证必填字段
    if (!data.label || data.label.trim().length === 0) {
      throw new ValidationError('Label is required');
    }

    if (!data.calculationMethod) {
      throw new ValidationError('Calculation method is required');
    }

    // 验证 calculationMethod 的有效值
    if (data.calculationMethod !== 'direct_measurement' && data.calculationMethod !== 'calculation_model') {
      throw new ValidationError('Calculation method must be either "direct_measurement" or "calculation_model"');
    }

    // 验证字段长度
    if (data.label.length > 200) {
      throw new ValidationError('Label must not exceed 200 characters');
    }

    // 验证 IRI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    await this.metricRepo.updateMetric(id, data);

    return {
      iri: id,
      label: data.label,
      calculationMethod: data.calculationMethod,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 部分更新指标
   */
  async patchMetric(id: string, data: PatchMetricRequest): Promise<UpdateMetricResponse> {
    // 验证 IRI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    // 至少需要一个字段
    if (Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // 验证 label 字段
    if (data.label !== undefined) {
      if (typeof data.label !== 'string' || data.label.trim().length === 0) {
        throw new ValidationError('Label cannot be empty or whitespace');
      }
      if (data.label.length > 200) {
        throw new ValidationError('Label must not exceed 200 characters');
      }
    }

    // 验证 calculationMethod 的有效值
    if (data.calculationMethod &&
      data.calculationMethod !== 'direct_measurement' &&
      data.calculationMethod !== 'calculation_model') {
      throw new ValidationError('Calculation method must be either "direct_measurement" or "calculation_model"');
    }

    await this.metricRepo.patchMetric(id, data);

    // 获取更新后的指标信息
    const updated = await this.metricRepo.getMetricById(id);
    if (!updated) {
      throw new NotFoundError(`Metric not found: ${id}`);
    }

    return {
      iri: id,
      label: updated.label!,
      calculationMethod: updated.hasCalculationMethod,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 删除指标
   */
  async deleteMetric(id: string, options: DeleteMetricRequest): Promise<DeleteMetricResponse> {
    // 验证 IRI 格式
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    const cascade = options.cascade || false;
    const force = options.force || false;

    await this.metricRepo.deleteMetric(id, cascade, force);

    return {
      iri: id,
      deleted: true,
      deleted_at: new Date().toISOString()
    };
  }

  /**
   * 添加数据源关联
   */
  async addMetricDatasource(id: string, data: AddMetricDatasourceRequest): Promise<AddMetricDatasourceResponse> {
    // 验证必填字段
    if (!data.datasourceUri) {
      throw new ValidationError('Datasource IRI is required');
    }

    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    if (!this.isValidUri(data.datasourceUri)) {
      throw new ValidationError('Invalid datasource IRI format');
    }

    await this.metricRepo.addMetricDatasource(id, data);

    return {
      metric_iri: id,
      datasource_iri: data.datasourceUri,
      added_at: new Date().toISOString()
    };
  }

  /**
   * 删除数据源关联
   */
  async removeMetricDatasource(id: string, datasourceId: string): Promise<RemoveMetricDatasourceResponse> {
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    if (!this.isValidUri(datasourceId)) {
      throw new ValidationError('Invalid datasource IRI format');
    }

    await this.metricRepo.removeMetricDatasource(id, datasourceId);

    return {
      metric_iri: id,
      datasource_iri: datasourceId,
      removed_at: new Date().toISOString()
    };
  }

  /**
   * 添加输入指标
   */
  async addMetricInput(id: string, data: AddMetricInputRequest): Promise<AddMetricInputResponse> {
    // 验证必填字段
    if (!data.inputMetricUri) {
      throw new ValidationError('Input metric IRI is required');
    }

    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    if (!this.isValidUri(data.inputMetricUri)) {
      throw new ValidationError('Invalid input metric IRI format');
    }

    await this.metricRepo.addMetricInput(id, data);

    return {
      metric_iri: id,
      input_metric_iri: data.inputMetricUri,
      added_at: new Date().toISOString()
    };
  }

  /**
   * 删除输入指标
   */
  async removeMetricInput(id: string, inputMetricId: string): Promise<RemoveMetricInputResponse> {
    if (!this.isValidUri(id)) {
      throw new ValidationError('Invalid metric IRI format');
    }

    if (!this.isValidUri(inputMetricId)) {
      throw new ValidationError('Invalid input metric IRI format');
    }

    await this.metricRepo.removeMetricInput(id, inputMetricId);

    return {
      metric_iri: id,
      input_metric_iri: inputMetricId,
      removed_at: new Date().toISOString()
    };
  }

  /**
   * 批量创建指标
   */
  async batchCreateMetrics(data: BatchCreateMetricsRequest): Promise<BatchCreateMetricsResponse> {
    if (!data.metrics || data.metrics.length === 0) {
      throw new ValidationError('At least one metric is required');
    }

    const created: Array<{ iri: string; label: string }> = [];
    const failed: Array<{ label: string; error: string }> = [];

    for (const metricData of data.metrics) {
      try {
        const result = await this.metricRepo.createMetric(metricData);
        created.push({ iri: result.iri, label: result.label });
      } catch (error) {
        failed.push({
          label: metricData.label,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      created,
      failed,
      total_created: created.length,
      total_failed: failed.length
    };
  }

  /**
   * 批量删除指标
   */
  async batchDeleteMetrics(data: BatchDeleteMetricsRequest): Promise<BatchDeleteMetricsResponse> {
    if (!data.metricIds || data.metricIds.length === 0) {
      throw new ValidationError('At least one metric ID is required');
    }

    const deleted: string[] = [];
    const failed: Array<{ iri: string; error: string }> = [];
    const cascade = data.cascade || false;
    const force = data.force || false;

    for (const metricId of data.metricIds) {
      try {
        await this.metricRepo.deleteMetric(metricId, cascade, force);
        deleted.push(metricId);
      } catch (error) {
        failed.push({
          iri: metricId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      deleted,
      failed,
      total_deleted: deleted.length,
      total_failed: failed.length
    };
  }

  /**
   * 获取指标的计算模型列表
   * GET /api/kg/metrics/:id/models
   * 
   * @param id 指标标识符
   * @param usage 查询用途：'output'=查询计算该指标的模型（默认），'input'=查询依赖该指标作为输入的模型
   * @returns 计算模型列表
   */
  async getMetricModelsDetail(id: string, usage: 'output' | 'input' = 'output'): Promise<MetricModelsDetailResponse> {
    this.validateMetricId(id);

    try {
      // 解析指标 IRI
      const metricIri = this.normalizeMetricId(id);

      // 获取指标元数据
      const metadata = await this.kgRepo.getMetricMetadata(metricIri);
      const calculationMethod = metadata.metric.hasCalculationMethod;

      let models: any[];
      
      if (usage === 'input') {
        // 查询依赖该指标作为输入的模型（任何指标都可以作为输入）
        models = await this.metricRepo.getModelsUsingMetricAsInput(metricIri);
      } else {
        // 查询计算该指标的模型（仅 calculation_model 类型的指标有）
        if (calculationMethod === 'direct_measurement') {
          return {
            metricId: id,
            metricLabel: metadata.metric.label || id,
            calculationMethod: 'direct_measurement',
            usage: 'output',
            models: [],
            total: 0
          };
        }
        models = await this.metricRepo.getModelsByMetricId(metricIri);
      }

      return {
        metricId: id,
        metricLabel: metadata.metric.label || id,
        calculationMethod,
        usage,
        models: models.map((m: any) => ({
          iri: m.iri,
          label: m.label,
          calculationType: m.calculationType,
          formula: m.formula,
          mathematicalExpression: m.mathematicalExpression,
          implementation: m.implementation,
          inputMetrics: m.inputMetrics,
          ...(usage === 'input' && m.outputMetric ? { outputMetric: m.outputMetric } : {})
        })),
        total: models.length
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get models for metric: ${id}. ${error}`);
    }
  }
}
