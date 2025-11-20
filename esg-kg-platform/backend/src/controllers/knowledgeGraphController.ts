import { Request, Response } from 'express';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';
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
   * GET /api/kg/metrics?industry={industry}&category={category}&framework={framework}
   */
  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { industry, category, framework } = req.query as { 
      industry: string; 
      category: string; 
      framework: string 
    };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!category) {
      throw new ValidationError('Category query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    const result = await this.kgService.getMetricsByIndustryAndCategory(industry, category, framework);
    
    res.json(result);
  });

  /**
   * CQ4: 获取特定分类下的指标URIs（高性能版本）
   * GET /api/kg/metrics/uris?industry={industry}&category={category}&framework={framework}
   */
  getMetricUris = asyncHandler(async (req: Request, res: Response) => {
    const { industry, category, framework } = req.query as { 
      industry: string; 
      category: string; 
      framework: string 
    };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!category) {
      throw new ValidationError('Category query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    const result = await this.kgService.getMetricUrisByIndustryAndCategory(industry, category, framework);
    
    res.json(result);
  });

  /**
   * 获取特定分类下使用 model calculation 方法的指标
   * @deprecated Use GET /api/kg/metrics?calculationMethod=calculation_model instead. Will be removed in v2.0.0 (June 2026)
   * GET /api/kg/metrics/model-calculation?industry={industry}&category={category}&framework={framework}
   */
  getModelCalculationMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { industry, category, framework } = req.query as { 
      industry: string; 
      category: string; 
      framework: string 
    };
    
    if (!industry) {
      throw new ValidationError('Industry query parameter is required');
    }
    if (!category) {
      throw new ValidationError('Category query parameter is required');
    }
    if (!framework) {
      throw new ValidationError('Framework query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics?calculationMethod=calculation_model&industry=...&category=...&framework=... instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

    const result = await this.kgService.getModelCalculationMetrics(industry, category, framework);
    
    res.json(result);
  });

  /**
   * 获取指标属性
   * @deprecated Use GET /api/kg/metrics/:id instead. Will be removed in v2.0.0 (June 2026)
   * GET /api/kg/metrics/attributes?metric_label={metric_label}
   */
  getMetricAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric_label } = req.query as { metric_label: string };
    
    if (!metric_label) {
      throw new ValidationError('Metric_label query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

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
   * @deprecated This endpoint is deprecated and will be removed in v2.0.0 (June 2026)
   * @deprecationReason The concept of "DataPoint" is redundant with "Metric" in our knowledge graph.
   *                    DataPoints were originally intended to represent measurement instances,
   *                    but in practice they map 1:1 to Metrics. This caused API confusion and
   *                    duplicate code maintenance. Use GET /api/kg/metrics/:id instead.
   * GET /api/kg/datapoints/attributes?metric={metric}
   */
  getDataPointAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { metric } = req.query as { metric: string };
    
    if (!metric) {
      throw new ValidationError('Metric query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'DataPoint concept removed. Use GET /api/kg/metrics/:id instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');
    res.setHeader('X-Deprecation-Reason', 'The concept of DataPoint is redundant with Metric. This caused API confusion and duplicate code maintenance.');

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
   * @deprecated Use GET /api/kg/metrics/:id/best-datasource instead. Will be removed in v2.0.0 (June 2026)
   * GET /api/kg/metrics/best-datasource?metric_id={metric_id}
   */
  getBestDataSource = asyncHandler(async (req: Request, res: Response) => {
    const { metric_id } = req.query as { metric_id: string };
    
    if (!metric_id) {
      throw new ValidationError('Metric_id query parameter is required');
    }

    // 添加废弃警告头
    res.setHeader('X-Deprecated-Endpoint', 'true');
    res.setHeader('X-Deprecated-Message', 'Use GET /api/kg/metrics/:id/best-datasource instead');
    res.setHeader('X-Deprecation-Date', '2026-06-01');

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
   * @deprecated This method is deprecated. Use MetricController.getMetricById instead.
   * GET /api/metric/:id - This route is deprecated, use GET /api/kg/metrics/:id
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
   * @deprecated This method is deprecated. Use MetricController.getMetricDatasets instead.
   * GET /api/metric/:id/datasets - This route is deprecated, use GET /api/kg/metrics/:id/datasets
   */
  getMetricDatasets = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    
    if (!id) {
      throw new ValidationError('Metric ID parameter is required');
    }

    const result = await this.kgService.getMetricDatasets(id);
    
    res.json(result);
  });

  /**
   * 重置知识图谱到初始状态
   * POST /api/kg/reset
   */
  resetKnowledgeGraph = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.kgService.resetToInitialState();
    
    res.json(result);
  });

  /**
   * 创建新的 Implementation
   * POST /api/kg/implementations
   */
  createImplementation = asyncHandler(async (req: Request, res: Response) => {
    const { 
      name, 
      language, 
      file_path,
      function_name,
      description,
      input_parameters,
      return_type,
      validation
    } = req.body as { 
      name: string; 
      language: string; 
      file_path: string;
      function_name?: string;
      description?: string;
      input_parameters?: string;
      return_type?: string;
      validation?: string;
    };
    
    if (!name) {
      throw new ValidationError('name is required');
    }
    if (!language) {
      throw new ValidationError('language is required');
    }
    if (!file_path) {
      throw new ValidationError('file_path is required');
    }

    const result = await this.kgService.createImplementation(
      name, 
      language, 
      file_path,
      function_name,
      description,
      input_parameters,
      return_type,
      validation
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  });

  /**
   * 创建新的 Model
   * POST /api/kg/models
   */
  createModel = asyncHandler(async (req: Request, res: Response) => {
    const { 
      name, 
      calculation_type, 
      input_metrics, 
      implementation,
      description,
      formula,
      mathematical_expression
    } = req.body as {
      name: string;
      calculation_type: string;
      input_metrics: string[];
      implementation: string;
      description?: string;
      formula?: string;
      mathematical_expression?: string;
    };
    
    if (!name) {
      throw new ValidationError('name is required');
    }
    if (!calculation_type) {
      throw new ValidationError('calculation_type is required');
    }
    if (!input_metrics || !Array.isArray(input_metrics) || input_metrics.length === 0) {
      throw new ValidationError('input_metrics is required and must be a non-empty array');
    }
    if (!implementation) {
      throw new ValidationError('implementation is required');
    }

    const result = await this.kgService.createModel(
      name, 
      calculation_type, 
      input_metrics, 
      implementation,
      description,
      formula,
      mathematical_expression
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  });
}