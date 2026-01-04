import { Router } from 'express';
import { DatasourceController } from '../../controllers/kg_controllers/datasourceController';

/**
 * Datasource Routes - 数据源管理 API
 */
export const createDatasourceRoutes = (): Router => {
  const router = Router();
  const controller = new DatasourceController();

  /**
   * GET /api/kg/datasources
   * 获取数据源列表
   * 
   * Query参数:
   * - page: 页码（默认1）
   * - size: 每页数量（默认20，最大100）
   * - search: 搜索关键词（模糊匹配label或fileName）
   * - sort: 排序字段（label, fileName, recordCount, createdAt，默认label）
   * - order: 排序顺序（asc, desc，默认asc）
   * 
   * 返回示例:
   * {
   *   "result": [
   *     {
   *       "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *       "label": "Semiconductor WRDS Financial Dataset",
   *       "fileName": "semiconductor_financial.csv",
   *       "description": "Financial data for semiconductor companies",
   *       "coverage": "2020-2024",
   *       "recordCount": 1500
   *     }
   *   ],
   *   "page": 1,
   *   "size": 20,
   *   "total": 45,
   *   "totalPages": 3
   * }
   * 
   * 使用示例:
   * - GET /api/kg/datasources - 获取第一页（20条）
   * - GET /api/kg/datasources?page=2&size=50 - 获取第二页（50条）
   * - GET /api/kg/datasources?search=carbon - 搜索包含"carbon"的数据源
   * - GET /api/kg/datasources?sort=recordCount&order=desc - 按记录数降序排序
   */
  router.get('/', controller.getDatasources);

  /**
   * GET /api/kg/datasources/:id
   * 获取数据源详情
   * 
   * Path参数:
   * - id: 数据源ID（可以是URI格式或简短ID）
   * 
   * 返回示例:
   * {
   *   "result": {
   *     "iri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *     "label": "Semiconductor WRDS Financial Dataset",
   *     "fileName": "semiconductor_financial.csv",
   *     "description": "Financial data for semiconductor companies",
   *     "coverage": "2020-2024",
   *     "recordCount": 1500,
   *     "variables": [
   *       {
   *         "iri": "http://example.org/esg#POLICY_ACCOUNT_HOLDERS_AFFECTED",
   *         "label": "POLICY_ACCOUNT_HOLDERS_AFFECTED"
   *       }
   *     ]
   *   }
   * }
   * 
   * 使用示例:
   * - GET /api/kg/datasources/SemiconductorWRDSFinancialDataset - 通过简短ID获取
   * - GET /api/kg/datasources/http%3A%2F%2Fexample.org%2Fesg%23SemiconductorWRDSFinancialDataset - 通过完整URI获取
   */
  router.get('/:id', controller.getDatasourceById);

  /**
   * POST /api/kg/datasources
   * 创建新数据源
   * 
   * Request Body:
   * {
   *   "label": "New Carbon Dataset",           // 必填
   *   "fileName": "carbon_2024.csv",           // 可选
   *   "description": "Carbon emissions data",  // 可选
   *   "coverage": "Global",                    // 可选
   *   "recordCount": 2000,                     // 可选
   *   "disclosureType": "Public"               // 可选
   * }
   * 
   * 返回示例:
   * {
   *   "uri": "http://example.org/esg#New_Carbon_Dataset_1700000000000",
   *   "label": "New Carbon Dataset",
   *   "created_at": "2024-11-20T10:30:00.000Z"
   * }
   * 
   * 错误响应:
   * - 400: 验证错误（如缺少label、recordCount为负数等）
   * - 500: 服务器内部错误
   */
  router.post('/', controller.createDatasource);

  /**
   * PATCH /api/kg/datasources/:id
   * 更新数据源（部分更新）
   * 
   * Path参数:
   * - id: 数据源ID（可以是URI格式或简短ID）
   * 
   * Request Body（所有字段都是可选的，只更新提供的字段）:
   * {
   *   "label": "Updated Dataset Name",         // 可选
   *   "fileName": "updated_file.csv",          // 可选
   *   "description": "Updated description",    // 可选
   *   "coverage": "Global 2024",               // 可选
   *   "recordCount": 3000,                     // 可选
   *   "disclosureType": "Private"              // 可选
   * }
   * 
   * 返回示例:
   * {
   *   "uri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "label": "Updated Dataset Name",
   *   "updated_at": "2024-11-20T10:45:00.000Z"
   * }
   * 
   * 使用示例:
   * - PATCH /api/kg/datasources/SemiconductorWRDSFinancialDataset
   * - PATCH /api/kg/datasources/http%3A%2F%2Fexample.org%2Fesg%23SemiconductorWRDSFinancialDataset
   * 
   * 错误响应:
   * - 400: 验证错误（如recordCount为负数、请求体为空等）
   * - 404: 数据源不存在
   * - 500: 服务器内部错误
   */
  router.patch('/:id', controller.updateDatasource);

  /**
   * DELETE /api/kg/datasources/:id
   * 删除数据源
   * 
   * Path参数:
   * - id: 数据源ID（可以是URI格式或简短ID）
   * 
   * Query参数:
   * - force: 是否强制删除（忽略依赖检查，默认false）
   * 
   * 返回示例:
   * {
   *   "uri": "http://example.org/esg#SemiconductorWRDSFinancialDataset",
   *   "deleted": true,
   *   "deleted_at": "2024-11-20T10:50:00.000Z"
   * }
   * 
   * 使用示例:
   * - DELETE /api/kg/datasources/SemiconductorWRDSFinancialDataset - 正常删除
   * - DELETE /api/kg/datasources/SemiconductorWRDSFinancialDataset?force=true - 强制删除
   * 
   * 错误响应:
   * - 400: 验证错误
   * - 404: 数据源不存在
   * - 409: 数据源正在被使用且未设置force=true
   * - 500: 服务器内部错误
   * 
   * 注意:
   * - 如果数据源被数据集变量使用，且force=false，则会返回409错误
   * - 设置force=true可以强制删除，同时会删除所有相关的三元组
   */
  router.delete('/:id', controller.deleteDatasource);

  /**
   * GET /api/kg/datasources/:id/variables
   * 获取使用此数据源的所有数据集变量
   * 通过 esg:sourceFrom 关系查询
   */
  router.get('/:id/variables', controller.getDatasourceVariables);

  /**
   * GET /api/kg/datasources/:id/metrics
   * 获取间接使用此数据源的所有指标（通过数据集变量）
   * 查询路径: metric -> variable -> datasource
   */
  router.get('/:id/metrics', controller.getDatasourceMetrics);

  return router;
};
