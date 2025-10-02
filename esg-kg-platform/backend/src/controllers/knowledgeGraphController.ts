import { Request, Response } from 'express';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';
import { KGQueryRequest } from '../types/kg';
import { ValidationError } from '../types/errors';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Knowledge Graph 控制器
 */
export class KnowledgeGraphController {
  private kgService: KnowledgeGraphService;

  constructor(kgService: KnowledgeGraphService) {
    this.kgService = kgService;
  }

  /**
   * CQ2: 获取特定行业适用的报告框架
   * GET /api/kg/frameworks?industry={industry}
   */
  getReportFrameworks = asyncHandler(async (req: Request, res: Response) => {
    const { industry } = req.query as { industry: string };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }

    const result = await this.kgService.getReportFrameworks(industry);
    
    res.json(result);
  });

  /**
   * CQ3: 获取报告框架中包含的分类
   * GET /api/kg/categories?industry={industry}&framework={framework}
   */
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const { industry, framework } = req.query as { industry: string; framework: string };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    const result = await this.kgService.getCategoriesByIndustryAndFramework(industry, framework);
    
    res.json(result);
  });

  /**
   * CQ4: 获取特定分类下的指标
   * GET /api/kg/metrics?industry={industry}&category_label={category_label}&framework={framework}
   */
  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { industry, category_label, framework } = req.query as { 
      industry: string; 
      category_label: string; 
      framework: string 
    };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!category_label) {
      throw new ValidationError('Category_label query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    const result = await this.kgService.getMetricsByIndustryAndCategory(industry, category_label, framework);
    
    res.json(result);
  });

  /**
   * CQ4: 获取特定分类下的指标URIs（高性能版本）
   * GET /api/kg/metrics/uris?industry={industry}&category_label={category_label}&framework={framework}
   */
  getMetricUris = asyncHandler(async (req: Request, res: Response) => {
    const { industry, category_label, framework } = req.query as { 
      industry: string; 
      category_label: string; 
      framework: string 
    };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!category_label) {
      throw new ValidationError('Category_label query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    const result = await this.kgService.getMetricUrisByIndustryAndCategory(industry, category_label, framework);
    
    res.json(result);
  });

  /**
   * 获取指标属性
   * GET /api/kg/metrics/attributes?metric_label={metric_label}
   */
  getMetricAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric_label } = req.query as { metric_label: string };
    
    if (!metric_label) {
      throw new ValidationError('Metric_label query parameter is required');
    }

    const attributes = await this.kgService.getMetricAttributes(metric_label);
    
    // 将 Map 转换为对象以便 JSON 序列化
    const attributesObject = Object.fromEntries(attributes);
    
    res.json({
      metricLabel: metric_label,
      attributes: attributesObject
    });
  });

  /**
   * CQ8: 获取数据点属性
   * GET /api/kg/datapoints/attributes?metric={metric}
   */
  getDataPointAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric } = req.query as { metric: string };
    
    if (!metric) {
      throw new ValidationError('Metric query parameter is required');
    }

    const attributes = await this.kgService.getDataPointAttributes(metric);
    
    // 将 Map 转换为对象以便 JSON 序列化
    const attributesObject = Object.fromEntries(attributes);
    
    res.json({
      metric,
      attributes: attributesObject
    });
  });

  /**
   * 获取数据源信息
   * GET /api/kg/datasource?source={source}
   */
  getDataSourceInfo = asyncHandler(async (req: Request, res: Response) => {
    const { source } = req.query as { source: string };
    
    if (!source) {
      throw new ValidationError('Source query parameter is required');
    }

    const info = await this.kgService.getDataSourceInfo(source);
    
    res.json({
      source,
      info: info || null
    });
  });

  /**
   * 获取指标的最佳数据源
   * GET /api/kg/metrics/best-datasource?metric_id={metric_id}
   */
  getBestDataSource = asyncHandler(async (req: Request, res: Response) => {
    const { metric_id } = req.query as { metric_id: string };
    
    if (!metric_id) {
      throw new ValidationError('Metric_id query parameter is required');
    }

    const dataSource = await this.kgService.getBestDataSourceForMetric(metric_id);
    
    res.json({
      metricId: metric_id,
      dataSource: dataSource || null
    });
  });

  /**
   * CQ6: 获取执行特定模型的实现
   * GET /api/kg/models/implementation?model_label={model_label}
   */
  getImplementationByModel = asyncHandler(async (req: Request, res: Response) => {
    const { model_label } = req.query as { model_label: string };
    
    if (!model_label) {
      throw new ValidationError('Model_label query parameter is required');
    }

    const implementation = await this.kgService.getImplementationByModel(model_label);
    
    res.json({
      modelLabel: model_label,
      implementation
    });
  });

  /**
   * 获取实现详情
   * GET /api/kg/implementations/details?implementation_label={implementation_label}
   */
  getImplementationDetails = asyncHandler(async (req: Request, res: Response) => {
    const { implementation_label } = req.query as { implementation_label: string };
    
    if (!implementation_label) {
      throw new ValidationError('Implementation_label query parameter is required');
    }

    const details = await this.kgService.getImplementationDetails(implementation_label);
    
    res.json(details);
  });

  /**
   * 获取所有实现
   * GET /api/kg/implementations
   */
  getAllImplementations = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.kgService.getAllImplementations();
    
    res.json(result);
  });

  /**
   * 按计算类型获取实现
   * GET /api/kg/implementations/by-calculation-type?calculation_type={calculation_type}
   */
  getImplementationsByCalculationType = asyncHandler(async (req: Request, res: Response) => {
    const { calculation_type } = req.query as { calculation_type: string };
    
    if (!calculation_type) {
      throw new ValidationError('Calculation_type query parameter is required');
    }

    const result = await this.kgService.getImplementationsByCalculationType(calculation_type);
    
    res.json(result);
  });

  /**
   * 获取所有计算类型
   * GET /api/kg/calculation-types
   */
  getAllCalculationTypes = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.kgService.getAllCalculationTypes();
    
    res.json(result);
  });

  /**
   * 获取Metric元数据
   * GET /api/metric/:id
   */
  getMetricMetadata = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    
    if (!id) {
      throw new ValidationError('Metric ID parameter is required');
    }

    const result = await this.kgService.getMetricMetadata(id);
    
    res.json(result);
  });

  /**
   * 获取Metric数据血缘
   * GET /api/metric/:id/datasets
   */
  getMetricDatasets = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    
    if (!id) {
      throw new ValidationError('Metric ID parameter is required');
    }

    const result = await this.kgService.getMetricDatasets(id);
    
    res.json(result);
  });
}