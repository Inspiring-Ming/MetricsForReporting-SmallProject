import { KnowledgeGraphRepository } from '../repositories/knowledgeGraphRepository';
import { 
  MetricComputationMethodResponse, 
  ComputationInfoRequest,
  DataSourceReference,
  ModelReference,
  ImplementationReference
} from '../types/computation';
import { ValidationError, GraphDBQueryError } from '../types/errors';

/**
 * 指标计算信息服务类 - 提供指标计算方法信息查询（不执行实际计算）
 */
export class MetricComputationService {
  private kgRepository: KnowledgeGraphRepository;

  constructor(kgRepository: KnowledgeGraphRepository) {
    this.kgRepository = kgRepository;
  }

  /**
   * CQ5: 获取特定指标的计算或直接测量方法信息
   */
  async getMetricComputationMethod(metricLabel: string): Promise<MetricComputationMethodResponse> {
    this.validateMetricLabel(metricLabel);
    
    try {
      // 获取指标属性
      const attributes = await this.kgRepository.getMetricAttributes(metricLabel);
      const attributesObject = Object.fromEntries(attributes);
      
      // 判断计算方法
      const calculationMethod = attributesObject['hasCalculationMethod'] || 'unknown';
      
      const response: MetricComputationMethodResponse = {
        metric_label: metricLabel,
        computation_method: calculationMethod === 'direct_measurement' ? 'direct_measurement' : 
                          calculationMethod === 'calculation_model' ? 'calculation_model' : 
                          'direct_measurement',
        attributes: attributesObject
      };

      // 如果是直接测量，获取数据源信息
      if (calculationMethod === 'direct_measurement') {
        const dataSource = await this.kgRepository.getBestDataSourceForMetric(metricLabel);
        if (dataSource) {
          const dataSourceRef: DataSourceReference = {
            dataSourceID: dataSource.dataSourceID,
            disclosureType: dataSource.disclosureType,
            description: `Data source for ${metricLabel} with disclosure type ${dataSource.disclosureType}`
          };
          response.data_sources = [dataSourceRef];
        }
      }

      // 如果是计算模型，获取模型和实现信息
      if (calculationMethod === 'calculation_model') {
        try {
          // 根据指标属性查找相关的模型
          const modelLabel = attributesObject['isCalculatedBy'];
          if (modelLabel) {
            // 获取实现信息
            const implementation = await this.kgRepository.getImplementationByModel(modelLabel);
            
            const modelRef: ModelReference = {
              modelLabel: modelLabel,
              calculationType: attributesObject['hasCalculationType'] || 'unknown',
              formula: attributesObject['hasFormula'],
              mathematicalExpression: attributesObject['hasMathematicalExpression'],
              description: `Calculation model for ${metricLabel}`
            };

            const implementationRef: ImplementationReference = {
              implementationLabel: implementation.label || implementation.iri || '',
              language: implementation.language || '',
              filePath: implementation.filePath || '',
              functionName: implementation.functionName || '',
              description: `Implementation for ${metricLabel}`
            };

            response.model = modelRef;
            response.implementation = implementationRef;
          }
        } catch (error) {
          // 模型信息获取失败，但不影响主要响应
          console.warn(`Failed to get model info for metric ${metricLabel}:`, error);
          response.model = {
            modelLabel: 'Unknown',
            calculationType: 'unknown',
            description: 'Model information not available'
          };
        }
      }

      return response;
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get computation method for metric: ${metricLabel}`,
        { metricLabel, originalError: error }
      );
    }
  }

  /**
   * 获取指标计算所需的实现文件信息
   */
  async getImplementationInfo(implementationLabel: string): Promise<ImplementationReference> {
    this.validateImplementationLabel(implementationLabel);
    
    try {
      const details = await this.kgRepository.getImplementationDetails(implementationLabel);
      
      return {
        implementationLabel: details.label || details.iri || '',
        language: details.language || '',
        filePath: details.filePath || '',
        functionName: details.functionName || '',
        description: `Implementation details for ${implementationLabel}`,
        returnType: details.returnType || '',
        validation: details.validation || ''
      };
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementation info for: ${implementationLabel}`,
        { implementationLabel, originalError: error }
      );
    }
  }

  /**
   * 获取计算类型对应的所有实现文件信息
   */
  async getImplementationsByCalculationType(calculationType: string): Promise<ImplementationReference[]> {
    this.validateCalculationType(calculationType);
    
    try {
      const implementations = await this.kgRepository.getImplementationsByCalculationType(calculationType);
      
      return implementations.map(impl => ({
        implementationLabel: impl.implementationLabel,
        language: 'Unknown', // 需要额外查询
        filePath: impl.filePath,
        functionName: impl.functionName,
        description: impl.description
      }));
    } catch (error) {
      throw new GraphDBQueryError(
        `Failed to get implementations for calculation type: ${calculationType}`,
        { calculationType, originalError: error }
      );
    }
  }

  /**
   * 获取所有支持的计算类型和对应的实现
   */
  async getSupportedCalculationTypes(): Promise<Array<{
    calculationType: string;
    implementationCount: number;
    availableImplementations: string[];
    description: string;
  }>> {
    try {
      const calculationTypes = await this.kgRepository.getAllCalculationTypes();
      
      return calculationTypes.map(ct => ({
        calculationType: ct.calculationType,
        implementationCount: ct.count,
        availableImplementations: ct.modelLabels,
        description: `Calculation type with ${ct.count} available implementations`
      }));
    } catch (error) {
      throw new GraphDBQueryError(
        'Failed to get supported calculation types',
        { originalError: error }
      );
    }
  }

  // 验证方法
  private validateMetricLabel(metricLabel: string): void {
    if (!metricLabel || typeof metricLabel !== 'string' || metricLabel.trim().length === 0) {
      throw new ValidationError('Metric label is required and must be a non-empty string');
    }
  }

  private validateImplementationLabel(implementationLabel: string): void {
    if (!implementationLabel || typeof implementationLabel !== 'string' || implementationLabel.trim().length === 0) {
      throw new ValidationError('Implementation label is required and must be a non-empty string');
    }
  }

  private validateCalculationType(calculationType: string): void {
    if (!calculationType || typeof calculationType !== 'string' || calculationType.trim().length === 0) {
      throw new ValidationError('Calculation type is required and must be a non-empty string');
    }
  }


}