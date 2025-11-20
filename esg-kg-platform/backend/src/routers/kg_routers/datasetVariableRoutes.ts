import { Router } from 'express';
import { DatasetVariableController } from '../../controllers/kg_controllers/datasetVariableController';

/**
 * DatasetVariable Routes - 数据集变量管理 API
 */
export const createDatasetVariableRoutes = (): Router => {
  const router = Router();
  const controller = new DatasetVariableController();

  /**
   * GET /api/kg/dataset-variables
   * 获取数据集变量列表
   * 
   * Query参数:
   * - page: 页码（默认1）
   * - size: 每页数量（默认20，最大100）
   * - search: 搜索关键词（模糊匹配label）
   * - datasource: 按数据源筛选（可选）
   * - metric: 按指标筛选（可选）
   * - minConfidenceScore: 最小置信度分数（0-100）
   * - isUnitCompatible: 按单位兼容性筛选（可选）
   * - sort: 排序字段（label, confidenceScore, createdAt，默认label）
   * - order: 排序顺序（asc, desc，默认asc）
   * 
   * 返回示例:
   * {
   *   "result": [
   *     {
   *       "iri": "http://example.org/esg#POLICYACCOUNTHOLDERSAFFECTED",
   *       "label": "POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *       "alignmentReason": "Direct mapping for account holders affected",
   *       "confidenceScore": 100,
   *       "isUnitCompatible": "Yes - both are numeric",
   *       "sources": [
   *         {
   *           "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *           "label": "Semiconductor WRDS Financial Dataset",
   *           "fileName": "semiconductor_financial.csv",
   *           "recordCount": 1500,
   *           "coverage": "2020-2024"
   *         }
   *       ]
   *     }
   *   ],
   *   "page": 1,
   *   "size": 20,
   *   "total": 45,
   *   "totalPages": 3
   * }
   */
  router.get('/', controller.getDatasetVariables);

  /**
   * GET /api/kg/dataset-variables/:id
   * 获取数据集变量详情
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * 返回示例:
   * {
   *   "result": {
   *     "iri": "http://example.org/esg#POLICYACCOUNTHOLDERSAFFECTED",
   *     "label": "POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *     "alignmentReason": "Direct mapping for account holders affected",
   *     "confidenceScore": 100,
   *     "isUnitCompatible": "Yes - both are numeric",
   *     "sources": [
   *       {
   *         "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *         "label": "Semiconductor WRDS Financial Dataset",
   *         "fileName": "semiconductor_financial.csv"
   *       }
   *     ],
   *     "metrics": [
   *       {
   *         "iri": "http://example.org/esg#FB-AC-000.A",
   *         "label": "Description of whistleblower policies",
   *         "hasCalculationMethod": "direct_measurement"
   *       }
   *     ]
   *   }
   * }
   */
  router.get('/:id', controller.getDatasetVariableById);

  /**
   * POST /api/kg/dataset-variables
   * 创建新的数据集变量
   * 
   * Request Body:
   * {
   *   "label": "NEW_VARIABLE_NAME",              // 必填
   *   "alignmentReason": "Reason for alignment", // 可选
   *   "confidenceScore": 95,                     // 可选，0-100
   *   "isUnitCompatible": "Yes - both numeric",  // 可选
   *   "sources": [                               // 可选，数据源URI数组
   *     "http://example.org/esg#DataSource1",
   *     "DataSource2"
   *   ]
   * }
   * 
   * 返回示例 (201 Created):
   * {
   *   "uri": "http://example.org/esg#NEW_VARIABLE_NAME_1634567890123",
   *   "label": "NEW_VARIABLE_NAME",
   *   "created_at": "2024-11-20T10:30:00.000Z"
   * }
   */
  router.post('/', controller.createDatasetVariable);

  /**
   * PATCH /api/kg/dataset-variables/:id
   * 更新数据集变量（部分更新）
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * Request Body (所有字段可选，至少提供一个):
   * {
   *   "label": "UPDATED_VARIABLE_NAME",          // 可选
   *   "alignmentReason": "Updated reason",       // 可选
   *   "confidenceScore": 85,                     // 可选，0-100
   *   "isUnitCompatible": "No - different units", // 可选
   *   "sources": [                               // 可选，会替换现有的所有数据源
   *     "http://example.org/esg#NewSource1"
   *   ]
   * }
   * 
   * 返回示例 (200 OK):
   * {
   *   "uri": "http://example.org/esg#VARIABLE_NAME",
   *   "label": "UPDATED_VARIABLE_NAME",
   *   "updated_at": "2024-11-20T11:00:00.000Z"
   * }
   */
  router.patch('/:id', controller.updateDatasetVariable);

  /**
   * DELETE /api/kg/dataset-variables/:id
   * 删除数据集变量
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * Query参数:
   * - force: 强制删除（忽略依赖检查，默认 false）
   * 
   * 返回示例 (200 OK):
   * {
   *   "uri": "http://example.org/esg#VARIABLE_NAME",
   *   "deleted": true,
   *   "deleted_at": "2024-11-20T11:30:00.000Z"
   * }
   * 
   * 错误示例 (400 Bad Request - 当有依赖且未使用force时):
   * {
   *   "error": "Cannot delete dataset variable: it is being used by one or more metrics. Use force=true to delete anyway."
   * }
   */
  router.delete('/:id', controller.deleteDatasetVariable);

  /**
   * GET /api/kg/dataset-variables/:id/datasources
   * 获取数据集变量的所有数据源
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * 返回示例 (200 OK):
   * {
   *   "variable_id": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "variable_label": "POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasources": [
   *     {
   *       "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *       "label": "Semiconductor WRDS Financial Dataset",
   *       "fileName": "semiconductor_financial.csv",
   *       "description": "Financial data for semiconductor companies",
   *       "coverage": "2020-2024",
   *       "recordCount": 1500
   *     },
   *     {
   *       "iri": "http://example.org/esg#AnotherDataSource",
   *       "label": "Another Data Source",
   *       "fileName": "data.csv",
   *       "recordCount": 500
   *     }
   *   ],
   *   "total": 2
   * }
   * 
   * 使用示例:
   * - GET /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   * - GET /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   * 
   * 错误示例 (404 Not Found):
   * {
   *   "error": "Dataset variable not found: NONEXISTENT_VARIABLE"
   * }
   */
  router.get('/:id/datasources', controller.getVariableDatasources);

  /**
   * POST /api/kg/dataset-variables/:id/datasources
   * 为数据集变量添加数据源关联
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * Request Body:
   * {
   *   "datasourceUri": "http://example.org/esg#NewDataSource"  // 必填，完整URI或短ID
   * }
   * 
   * 返回示例 (200 OK):
   * {
   *   "variable_uri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasource_uri": "http://example.org/esg#NewDataSource",
   *   "added_at": "2024-11-20T12:00:00.000Z"
   * }
   * 
   * 使用示例:
   * - POST /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   *   Body: { "datasourceUri": "NewDataSource" }
   * 
   * - POST /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources
   *   Body: { "datasourceUri": "http://example.org/esg#NewDataSource" }
   * 
   * 错误示例 (400 Bad Request - 重复关联):
   * {
   *   "error": "Datasource is already associated with this dataset variable"
   * }
   * 
   * 错误示例 (404 Not Found - 数据源不存在):
   * {
   *   "error": "Datasource not found: NonExistentDataSource"
   * }
   */
  router.post('/:id/datasources', controller.addDatasourceToVariable);

  /**
   * DELETE /api/kg/dataset-variables/:id/datasources/:dsId
   * 移除数据集变量与数据源的关联
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * - dsId: 数据源ID（可以是URI格式或简短ID）
   * 
   * 返回示例 (200 OK):
   * {
   *   "variable_uri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "datasource_uri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "removed_at": "2024-11-20T12:30:00.000Z"
   * }
   * 
   * 使用示例:
   * - DELETE /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources/SemiconductorWRDSFinancialDataset
   * - DELETE /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources/http%3A%2F%2Fexample.org%2Fesg%23SemiconductorWRDSFinancialDataset
   * - DELETE /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23POLICY_ACCOUNT_HOLDERS_AFFECTED/datasources/SemiconductorWRDSFinancialDataset
   * 
   * 特性:
   * - 幂等操作：重复删除返回200成功
   * - 不存在的关联也返回200（不报错）
   * - 只删除关联，不删除数据源或变量本身
   * 
   * 错误示例 (400 Bad Request - URI格式错误):
   * {
   *   "error": "Invalid datasource URI format"
   * }
   */
  router.delete('/:id/datasources/:dsId', controller.removeVariableDatasource);

  /**
   * GET /api/kg/dataset-variables/:id/quality
   * 获取数据集变量的质量信息
   * 
   * Path参数:
   * - id: 数据集变量ID（可以是URI格式或简短ID）
   * 
   * 返回示例 (200 OK):
   * {
   *   "variable_id": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "variable_label": "POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *   "confidenceScore": 95,
   *   "isUnitCompatible": "Yes - both are numeric",
   *   "alignmentReason": "Direct mapping for account holders affected"
   * }
   * 
   * 返回示例 (质量信息不完整):
   * {
   *   "variable_id": "http://example.org/esg#SOME_VARIABLE",
   *   "variable_label": "SOME_VARIABLE",
   *   "confidenceScore": 80
   * }
   * 
   * 说明:
   * - confidenceScore: 置信度分数（0-100），可选
   * - isUnitCompatible: 单位兼容性说明，可选
   * - alignmentReason: 对齐原因说明，可选
   * - 所有质量字段都是可选的，未设置时不返回
   * 
   * 使用示例:
   * - GET /api/kg/dataset-variables/POLICY_ACCOUNT_HOLDERS_AFFECTED/quality
   * - GET /api/kg/dataset-variables/http%3A%2F%2Fexample.org%2Fesg%23POLICY_ACCOUNT_HOLDERS_AFFECTED/quality
   * 
   * 错误示例 (404 Not Found):
   * {
   *   "error": "Dataset variable not found: NONEXISTENT_VARIABLE"
   * }
   */
  router.get('/:id/quality', controller.getVariableQuality);

  /**
   * GET /api/kg/dataset-variables/:id/metrics
   * 获取使用此数据集变量的所有指标
   * 通过 esg:obtainedFrom 关系查询
   */
  router.get('/:id/metrics', controller.getVariableMetrics);

  return router;
};
