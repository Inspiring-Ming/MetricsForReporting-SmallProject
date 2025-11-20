import { Router } from 'express';
import { MetricController } from '../../controllers/kg_controllers/metricController';
import { MetricService } from '../../services/kg_services/metricService';
import { KnowledgeGraphRepository } from '../../repositories/knowledgeGraphRepository';

/**
 * Metric 路由 - 指标管理 API
 */
export const createMetricRoutes = (): Router => {
  const router = Router();

  // 依赖注入
  const kgRepo = new KnowledgeGraphRepository();
  const metricService = new MetricService(kgRepo);
  const metricController = new MetricController(metricService);

  /**
   * GET /api/kg/metrics
   * 获取指标列表（支持多种过滤条件，包括 calculationMethod）
   * 
   * 查询参数：
   * - page: 页码
   * - size: 每页数量
   * - search: 搜索关键词
   * - industry: 行业筛选
   * - category: 分类筛选
   * - framework: 框架筛选
   * - calculationMethod: 计算方法筛选（direct_measurement 或 calculation_model）
   */
  router.get('/', metricController.getMetrics);

  /**
   * POST /api/kg/metrics
   * 创建新指标
   * 
   * 请求体：
   * - name: 指标名称（必填）
   * - code: 指标代码（必填，唯一标识）
   * - description: 指标描述（可选）
   * - unit: 单位（可选）
   * - dataType: 数据类型（可选，如 numeric, string, boolean）
   * - calculationMethod: 计算方法（必填，direct_measurement 或 calculation_model）
   * - industry: 所属行业 URI（可选）
   * - category: 所属分类 URI（可选）
   * - framework: 所属框架 URI（可选）
   * - disclosureLevel: 披露层次（可选，1-3）
   * - additionalProperties: 其他属性（可选）
   */
  router.post('/', metricController.createMetric);

  /**
   * GET /api/kg/metrics/:id
   * 获取指标详情（包含所有属性）
   */
  router.get('/:id', metricController.getMetricById);

  /**
   * PUT /api/kg/metrics/:id
   * 完整更新指标（替换所有属性）
   * 
   * 请求体：与 POST 相同，所有字段都需要提供
   */
  router.put('/:id', metricController.updateMetric);

  /**
   * PATCH /api/kg/metrics/:id
   * 部分更新指标（仅更新提供的字段）
   * 
   * 请求体：与 POST 相同，但所有字段都是可选的
   * 只更新请求体中提供的字段，其他字段保持不变
   */
  router.patch('/:id', metricController.patchMetric);

  /**
   * DELETE /api/kg/metrics/:id
   * 删除指标
   * 
   * 查询参数：
   * - cascade: 是否级联删除相关数据（可选，默认 false）
   * - force: 强制删除（忽略依赖检查，可选，默认 false）
   * 
   * 注意：
   * - 如果指标被其他模型依赖，需要 force=true 才能删除
   * - 如果 cascade=true，会同时删除相关的数据集变量关联、数据源关联等
   */
  router.delete('/:id', metricController.deleteMetric);

  /**
   * GET /api/kg/metrics/:id/lineage
   * 获取指标的数据血缘关系
   * 
   * 根据计算方法返回不同的血缘信息：
   * - 直接测量：返回数据集变量和数据源
   * - 计算模型：返回模型、输入指标和实现信息
   */
  router.get('/:id/lineage', metricController.getMetricLineage);

  /**
   * @deprecated GET /api/kg/metrics/:id/datasets
   * 已废弃，使用 GET /api/kg/metrics/:id/lineage 代替
   * 将在 v2.0.0 (2026年6月) 移除
   */
  router.get('/:id/datasets', metricController.getMetricDatasets);

  /**
   * GET /api/kg/metrics/:id/best-datasource
   * 获取指标的最佳数据源（遵循 IFRS 披露层次）
   */
  router.get('/:id/best-datasource', metricController.getBestDataSource);

  /**
   * GET /api/kg/metrics/:id/datasources
   * 获取指标的所有数据源（非仅最佳数据源）
   * 
   * 查询参数：
   * - includeVariables: 是否包含数据集变量的详细信息
   * 
   * 仅适用于直接测量（direct_measurement）的指标。
   */
  router.get('/:id/datasources', metricController.getMetricDataSources);

  /**
   * GET /api/kg/metrics/:id/models
   * 获取使用该指标作为输入的所有模型（反向依赖查询）
   * 
   * 返回所有将该指标作为输入（requiresInputFrom）的模型。
   * 这是一个反向依赖查询，用于了解该指标在哪些计算模型中被使用。
   */
  router.get('/:id/models', metricController.getMetricModels);

  /**
   * GET /api/kg/metrics/:id/inputs
   * 获取指标计算所需的输入指标列表
   * 
   * 返回该指标计算所需的所有输入指标。
   * 仅适用于 calculation_model 类型的指标。
   * 对于 direct_measurement 类型的指标，返回空输入列表。
   */
  router.get('/:id/inputs', metricController.getMetricInputs);



  /**
   * POST /api/kg/metrics/:id/datasources
   * 为指标添加数据源关联
   * 
   * 请求体：
   * - datasourceUri: 数据源 URI（必填）
   * - datasetVariableUri: 数据集变量 URI（可选）
   * - disclosureLevel: 披露层次（可选，1-3）
   * - priority: 优先级（可选，用于确定最佳数据源）
   */
  router.post('/:id/datasources', metricController.addMetricDatasource);

  /**
   * DELETE /api/kg/metrics/:id/datasources/:datasourceId
   * 删除指标的数据源关联
   */
  router.delete('/:id/datasources/:datasourceId', metricController.removeMetricDatasource);

  /**
   * POST /api/kg/metrics/:id/inputs
   * 为计算模型指标添加输入指标
   * 
   * 请求体：
   * - inputMetricUri: 输入指标 URI（必填）
   * - order: 输入顺序（可选，用于确定计算顺序）
   * 
   * 注意：仅适用于 calculation_model 类型的指标
   */
  router.post('/:id/inputs', metricController.addMetricInput);

  /**
   * DELETE /api/kg/metrics/:id/inputs/:inputMetricId
   * 删除计算模型指标的输入指标关联
   */
  router.delete('/:id/inputs/:inputMetricId', metricController.removeMetricInput);

  /**
   * POST /api/kg/metrics/batch
   * 批量创建指标
   * 
   * 请求体：
   * - metrics: 指标数组，每个元素格式与 POST /api/kg/metrics 相同
   * 
   * 返回：
   * - created: 成功创建的指标列表
   * - failed: 创建失败的指标列表（包含错误信息）
   */
  router.post('/batch', metricController.batchCreateMetrics);

  /**
   * DELETE /api/kg/metrics/batch
   * 批量删除指标
   * 
   * 请求体：
   * - metricIds: 指标 ID 数组（必填）
   * - cascade: 是否级联删除（可选，默认 false）
   * - force: 强制删除（可选，默认 false）
   * 
   * 返回：
   * - deleted: 成功删除的指标 ID 列表
   * - failed: 删除失败的指标 ID 列表（包含错误信息）
   */
  router.delete('/batch', metricController.batchDeleteMetrics);

  /**
   * GET /api/kg/metrics/:id/calculation-method
   * 获取指标的计算方法详情（CQ5）
   * 
   * 返回指标的计算或直接测量方法信息：
   * - 直接测量：返回数据源信息
   * - 计算模型：返回模型、公式和实现信息
   */
  router.get('/:id/calculation-method', metricController.getMetricCalculationMethod);

  /**
   * @deprecated GET /api/kg/metrics/attributes
   * 获取指标属性（废弃，使用 GET /api/kg/metrics/:id 代替）
   */
  router.get('/attributes', metricController.getMetricAttributes);

  /**
   * @deprecated GET /api/kg/datapoints/attributes  
   * 获取数据点属性（废弃，使用 GET /api/kg/metrics/:id 代替）
   */
  router.get('/datapoints/attributes', metricController.getDataPointAttributes);

  return router;
};
