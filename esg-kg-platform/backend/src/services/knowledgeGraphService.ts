import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';
import { GraphDBRepository } from '../repositories/graphDBRepository';
import { 
  FrameworkResult, 
  CategoryResult, 
  MetricResult, 
  MetricUriResult,
  Implementation,
  ImplementationDetails,
  AllImplementations,
  ImplementationsByCalculationType,
  AllCalculationTypes,
  DataSourceInfo,
  MetricAttributesMap,
  MetricMetadataResponse,
  MetricDatasetsResponse
} from '../types/kg';
import { ValidationError, GraphDBQueryError } from '../types/errors';
import { config } from '../config';
import { promises as fs } from 'fs';

/**
 * Knowledge Graph 服务类 - 处理 KG 相关业务逻辑
 */
export class KnowledgeGraphService {
  private kgRepository: KnowledgeGraphRepository;
  private graphDBRepository: GraphDBRepository;

  constructor(kgRepository: KnowledgeGraphRepository, graphDBRepository?: GraphDBRepository) {
    this.kgRepository = kgRepository;
    this.graphDBRepository = graphDBRepository || new GraphDBRepository();
  }

  /**
   * CQ2: 获取特定行业适用的报告框架
   */
  async getReportFrameworks(industry: string): Promise<FrameworkResult> {
    this.validateIndustry(industry);
    
    try {
      const frameworks = await this.kgRepository.getReportFrameworks(industry);
      return { result: frameworks };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get report frameworks for industry: ${industry}`,
        { industry, originalError: error }
      );
    }
  }

  /**
   * CQ3: 获取报告框架中包含的分类
   */
  async getCategoriesByIndustryAndFramework(industry: string, framework: string): Promise<CategoryResult> {
    this.validateIndustry(industry);
    this.validateFramework(framework);
    
    try {
      const categories = await this.kgRepository.getCategoriesByIndustryAndFramework(industry, framework);
      return { result: categories };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get categories for industry: ${industry} and framework: ${framework}`,
        { industry, framework, originalError: error }
      );
    }
  }

  /**
   * CQ4: 获取特定分类下的指标
   */
  async getMetricsByIndustryAndCategory(industry: string, category: string, framework: string): Promise<MetricResult> {
    this.validateIndustry(industry);
    this.validateFramework(framework);
    this.validateCategoryLabel(category);
    
    try {
      const metrics = await this.kgRepository.getMetricsByIndustryAndCategory(industry, category, framework);
      return { result: metrics };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get metrics for industry: ${industry}, category: ${category}, framework: ${framework}`,
        { industry, category, framework, originalError: error }
      );
    }
  }

  /**
   * CQ4: 获取特定分类下的指标URIs（高性能版本）
   */
  async getMetricUrisByIndustryAndCategory(industry: string, category: string, framework: string): Promise<MetricUriResult> {
    this.validateIndustry(industry);
    this.validateFramework(framework);
    this.validateCategoryLabel(category);
    
    try {
      const metricUris = await this.kgRepository.getMetricUrisByIndustryAndCategory(industry, category, framework);
      return { result: metricUris };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get metric URIs for industry: ${industry}, category: ${category}, framework: ${framework}`,
        { industry, category, framework, originalError: error }
      );
    }
  }

  /**
   * 获取特定分类下使用 model calculation 方法的指标
   */
  async getModelCalculationMetrics(industry: string, category: string, framework: string): Promise<MetricResult> {
    this.validateIndustry(industry);
    this.validateFramework(framework);
    this.validateCategoryLabel(category);
    
    try {
      const metrics = await this.kgRepository.getModelCalculationMetricsByCategory(industry, category, framework);
      return { result: metrics };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get model calculation metrics for industry: ${industry}, category: ${category}, framework: ${framework}`,
        { industry, category, framework, originalError: error }
      );
    }
  }

  /**
   * 获取指标属性
   */
  async getMetricAttributes(metricLabel: string): Promise<MetricAttributesMap> {
    this.validateMetricLabel(metricLabel);
    
    try {
      return await this.kgRepository.getMetricAttributes(metricLabel);
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get attributes for metric: ${metricLabel}`,
        { metricLabel, originalError: error }
      );
    }
  }

  /**
   * CQ8: 获取数据点属性
   */
  async getDataPointAttributes(metric: string): Promise<MetricAttributesMap> {
    this.validateMetric(metric);
    
    try {
      return await this.kgRepository.getDataPointAttributes(metric);
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get data point attributes for: ${metric}`,
        { metric, originalError: error }
      );
    }
  }

  /**
   * 获取数据源信息
   */
  async getDataSourceInfo(source: string): Promise<string | undefined> {
    this.validateSource(source);
    
    try {
      return await this.kgRepository.getDataSourceInfo(source);
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get data source info for: ${source}`,
        { source, originalError: error }
      );
    }
  }

  /**
   * 获取指标的最佳数据源（遵循 IFRS 披露层次）
   */
  async getBestDataSourceForMetric(metricID: string): Promise<DataSourceInfo | null> {
    this.validateMetricID(metricID);
    
    try {
      const result = await this.kgRepository.getBestDataSourceForMetric(metricID);
      
      if (result) {
        console.log(`Selected data source for metric ${metricID}: ${result.dataSourceID} (disclosure type: ${result.disclosureType})`);
      } else {
        console.log(`No data source found for metric ${metricID}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error querying best data source:', error);
      throw new GraphDBQueryError(
        `Failed to get best data source for metric: ${metricID}`,
        { metricID, originalError: error }
      );
    }
  }

  /**
   * CQ6: 获取执行特定模型的实现
   */
  async getImplementationByModel(modelLabel: string): Promise<Implementation> {
    this.validateModelLabel(modelLabel);
    
    try {
      return await this.kgRepository.getImplementationByModel(modelLabel);
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementation for model: ${modelLabel}`,
        { modelLabel, originalError: error }
      );
    }
  }

  /**
   * 获取实现的详细信息
   */
  async getImplementationDetails(implementationLabel: string): Promise<ImplementationDetails> {
    this.validateImplementationLabel(implementationLabel);
    
    try {
      return await this.kgRepository.getImplementationDetails(implementationLabel);
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementation details for: ${implementationLabel}`,
        { implementationLabel, originalError: error }
      );
    }
  }

  /**
   * 获取所有可用的实现
   */
  async getAllImplementations(): Promise<AllImplementations> {
    try {
      const implementations = await this.kgRepository.getAllImplementations();
      return { result: implementations };
    } catch (error) {
      throw new GraphDBQueryError(
        'Failed to get all implementations',
        { originalError: error }
      );
    }
  }

  /**
   * 按计算类型获取实现
   */
  async getImplementationsByCalculationType(calculationType: string): Promise<ImplementationsByCalculationType> {
    this.validateCalculationType(calculationType);
    
    try {
      const implementations = await this.kgRepository.getImplementationsByCalculationType(calculationType);
      return { result: implementations };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementations for calculation type: ${calculationType}`,
        { calculationType, originalError: error }
      );
    }
  }

  /**
   * 获取所有可用的计算类型
   */
  async getAllCalculationTypes(): Promise<AllCalculationTypes> {
    try {
      const calculationTypes = await this.kgRepository.getAllCalculationTypes();
      return { result: calculationTypes };
    } catch (error) {
      throw new GraphDBQueryError(
        'Failed to get all calculation types',
        { originalError: error }
      );
    }
  }

  // 验证方法
  private validateIndustry(industry: string): void {
    if (!industry || typeof industry !== 'string' || industry.trim().length === 0) {
      throw new ValidationError('Industry parameter is required and must be a non-empty string');
    }
  }

  private validateFramework(framework: string): void {
    if (!framework || typeof framework !== 'string' || framework.trim().length === 0) {
      throw new ValidationError('Framework parameter is required and must be a non-empty string');
    }
  }

  private validateCategoryLabel(categoryLabel: string): void {
    if (!categoryLabel || typeof categoryLabel !== 'string' || categoryLabel.trim().length === 0) {
      throw new ValidationError('Category label parameter is required and must be a non-empty string');
    }
  }

  private validateMetricLabel(metricLabel: string): void {
    if (!metricLabel || typeof metricLabel !== 'string' || metricLabel.trim().length === 0) {
      throw new ValidationError('Metric label parameter is required and must be a non-empty string');
    }
  }

  private validateMetric(metric: string): void {
    if (!metric || typeof metric !== 'string' || metric.trim().length === 0) {
      throw new ValidationError('Metric parameter is required and must be a non-empty string');
    }
  }

  private validateSource(source: string): void {
    if (!source || typeof source !== 'string' || source.trim().length === 0) {
      throw new ValidationError('Source parameter is required and must be a non-empty string');
    }
  }

  private validateMetricID(metricID: string): void {
    if (!metricID || typeof metricID !== 'string' || metricID.trim().length === 0) {
      throw new ValidationError('Metric ID parameter is required and must be a non-empty string');
    }
  }

  private validateModelLabel(modelLabel: string): void {
    if (!modelLabel || typeof modelLabel !== 'string' || modelLabel.trim().length === 0) {
      throw new ValidationError('Model label parameter is required and must be a non-empty string');
    }
  }

  private validateImplementationLabel(implementationLabel: string): void {
    if (!implementationLabel || typeof implementationLabel !== 'string' || implementationLabel.trim().length === 0) {
      throw new ValidationError('Implementation label parameter is required and must be a non-empty string');
    }
  }

  private validateCalculationType(calculationType: string): void {
    if (!calculationType || typeof calculationType !== 'string' || calculationType.trim().length === 0) {
      throw new ValidationError('Calculation type parameter is required and must be a non-empty string');
    }
  }

  /**
   * 获取Metric元数据
   */
  async getMetricMetadata(metricId: string): Promise<MetricMetadataResponse> {
    this.validateMetricId(metricId);
    
    try {
      // 确保metricId是完整的IRI格式
      const metricIri = metricId.startsWith('http') ? metricId : `http://example.org/esg#${metricId}`;
      
      const metadata = await this.kgRepository.getMetricMetadata(metricIri);
      
      return {
        metric: {
          iri: metadata.metric.iri,
          label: metadata.metric.label,
          hasType: metadata.metric.hasType,
          hasMetricType: metadata.metric.hasMetricType,
          hasUnit: metadata.metric.hasUnit,
          hasCalculationMethod: metadata.metric.hasCalculationMethod
        },
        hierarchy: metadata.hierarchy
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get metric metadata for: ${metricId}`,
        { metricId, originalError: error }
      );
    }
  }

  /**
   * 获取Metric数据血缘
   */
  async getMetricDatasets(metricId: string): Promise<MetricDatasetsResponse> {
    this.validateMetricId(metricId);
    
    try {
      // 确保metricId是完整的IRI格式
      const metricIri = metricId.startsWith('http') ? metricId : `http://example.org/esg#${metricId}`;
      
      // 首先获取metric的基本信息以确定计算方法
      const metadata = await this.kgRepository.getMetricMetadata(metricIri);
      const calculationMethod = metadata.metric.hasCalculationMethod;

      if (calculationMethod === 'direct_measurement') {
        // 直接测量路径
        const obtainedFrom = await this.kgRepository.getMetricDirectMeasurementLineage(metricIri);
        
        return {
          metric: {
            iri: metadata.metric.iri,
            label: metadata.metric.label,
            hasType: metadata.metric.hasType,
            hasMetricType: metadata.metric.hasMetricType,
            hasUnit: metadata.metric.hasUnit,
            hasCalculationMethod: 'direct_measurement'
          },
          obtainedFrom
        };
      } else if (calculationMethod === 'calculation_model') {
        // 计算模型路径
        const modelLineage = await this.kgRepository.getMetricCalculationModelLineage(metricIri);
        
        return {
          metric: {
            iri: metadata.metric.iri,
            label: metadata.metric.label,
            hasType: metadata.metric.hasType,
            hasMetricType: metadata.metric.hasMetricType,
            hasUnit: metadata.metric.hasUnit,
            hasCalculationMethod: 'calculation_model'
          },
          model: modelLineage.model,
          inputs: modelLineage.inputs
        };
      } else {
        throw new ValidationError(`Unknown calculation method: ${calculationMethod}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError(
        `Failed to get metric datasets for: ${metricId}`,
        { metricId, originalError: error }
      );
    }
  }

  /**
   * 重置知识图谱到初始状态
   */
  async resetToInitialState(): Promise<{
    ok: boolean;
    message: string;
    stats: {
      triplesCleared: number;
      triplesImported: number;
      resetAt: string;
    };
  }> {
    try {
      // 1. 获取清空前的三元组数量
      const triplesBefore = await this.graphDBRepository.countTriples();
      console.log(`[KG Reset] Current triples count: ${triplesBefore}`);

      // 2. 清空所有数据
      console.log('[KG Reset] Clearing all data...');
      await this.graphDBRepository.clearAllData();
      
      // 验证清空成功
      const triplesAfterClear = await this.graphDBRepository.countTriples();
      if (triplesAfterClear !== 0) {
        throw new GraphDBQueryError(
          `Failed to clear all data: ${triplesAfterClear} triples remaining`,
          { triplesAfterClear }
        );
      }
      console.log('[KG Reset] All data cleared successfully');

      // 3. 读取初始 TTL 文件
      console.log(`[KG Reset] Reading initial TTL file from: ${config.INITIAL_TTL_PATH}`);
      const initialTTL = await fs.readFile(config.INITIAL_TTL_PATH, 'utf-8');
      
      if (!initialTTL || initialTTL.trim().length === 0) {
        throw new ValidationError('Initial TTL file is empty');
      }

      // 4. 重新导入初始数据
      console.log('[KG Reset] Importing initial data...');
      await this.graphDBRepository.uploadTTLFile(initialTTL);

      // 5. 验证导入成功
      const triplesAfterImport = await this.graphDBRepository.countTriples();
      if (triplesAfterImport === 0) {
        throw new GraphDBQueryError(
          'Failed to import initial data: no triples found after import',
          { triplesAfterImport }
        );
      }
      console.log(`[KG Reset] Import successful: ${triplesAfterImport} triples imported`);

      return {
        ok: true,
        message: 'Knowledge graph reset to initial state successfully',
        stats: {
          triplesCleared: triplesBefore,
          triplesImported: triplesAfterImport,
          resetAt: new Date().toISOString()
        }
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof GraphDBQueryError) {
        throw error;
      }
      
      // 检查文件不存在错误
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new ValidationError(
          `Initial TTL file not found at: ${config.INITIAL_TTL_PATH}`,
          { path: config.INITIAL_TTL_PATH }
        );
      }

      throw new GraphDBQueryError(
        `Failed to reset knowledge graph: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  private validateMetricId(metricId: string): void {
    if (!metricId || typeof metricId !== 'string' || metricId.trim().length === 0) {
      throw new ValidationError('Metric ID parameter is required and must be a non-empty string');
    }
  }

  /**
   * 创建新的 Implementation
   */
  async createImplementation(
    name: string, 
    language: string, 
    filePath: string,
    functionName?: string,
    description?: string,
    inputParameters?: string,
    returnType?: string,
    validation?: string
  ): Promise<{ uri: string; label: string; language: string; file_path: string; created_at: string }> {
    // 验证输入
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Implementation name is required');
    }
    if (!language || typeof language !== 'string' || language.trim().length === 0) {
      throw new ValidationError('Language is required');
    }
    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      throw new ValidationError('File path is required');
    }

    // 验证语言类型
    const supportedLanguages = ['Python', 'JavaScript', 'R', 'SQL'];
    if (!supportedLanguages.includes(language)) {
      throw new ValidationError(
        `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`
      );
    }

    try {
      const result = await this.kgRepository.createImplementation(
        name, 
        language, 
        filePath,
        functionName,
        description,
        inputParameters,
        returnType,
        validation
      );
      return {
        uri: result.uri,
        label: result.label,
        language,
        file_path: filePath,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof GraphDBQueryError && (error as any).code === 'IMPLEMENTATION_EXISTS') {
        throw new ValidationError(`Implementation already exists: ${name}`);
      }
      throw new GraphDBQueryError(
        `Failed to create implementation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name, language, filePath, originalError: error }
      );
    }
  }

  /**
   * 创建新的 Model
   */
  async createModel(
    name: string,
    calculationType: string,
    inputMetrics: string[],
    implementationName: string,
    description?: string,
    formula?: string,
    mathematicalExpression?: string
  ): Promise<{
    uri: string;
    label: string;
    calculation_type: string;
    input_metrics: Array<{ uri: string; label: string }>;
    implementation: { uri: string; label: string };
    created_at: string;
  }> {
    // 验证输入
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Model name is required');
    }
    if (!calculationType || typeof calculationType !== 'string' || calculationType.trim().length === 0) {
      throw new ValidationError('Calculation type is required');
    }
    if (!Array.isArray(inputMetrics) || inputMetrics.length === 0) {
      throw new ValidationError('Input metrics are required and must be a non-empty array');
    }
    if (!implementationName || typeof implementationName !== 'string' || implementationName.trim().length === 0) {
      throw new ValidationError('Implementation name is required');
    }

    // 验证所有输入指标不为空
    for (const metric of inputMetrics) {
      if (!metric || typeof metric !== 'string' || metric.trim().length === 0) {
        throw new ValidationError('All input metric names must be non-empty strings');
      }
    }

    try {
      const result = await this.kgRepository.createModel(
        name,
        calculationType,
        inputMetrics,
        implementationName,
        description,
        formula,
        mathematicalExpression
      );

      return {
        uri: result.uri,
        label: result.label,
        calculation_type: calculationType,
        input_metrics: result.inputMetrics,
        implementation: result.implementation,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        const err = error as any;
        if (err.code === 'MODEL_EXISTS') {
          throw new ValidationError(`Model already exists: ${name}`);
        }
        if (err.code === 'IMPLEMENTATION_NOT_FOUND') {
          throw new ValidationError(`Implementation not found: ${implementationName}`);
        }
        if (err.code === 'METRIC_NOT_FOUND') {
          throw new ValidationError(`One or more input metrics not found`);
        }
      }
      throw new GraphDBQueryError(
        `Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name, calculationType, inputMetrics, implementationName, originalError: error }
      );
    }
  }
}