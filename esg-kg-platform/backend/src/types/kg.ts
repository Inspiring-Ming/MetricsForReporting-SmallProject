/**
 * Knowledge Graph 类型系统
 * 
 * 分层架构：
 * 1. 基础类型 (Basic Types) - 核心枚举和基础结构
 * 2. 实体类型 (Entity Types) - 对应RDF实体的类型定义  
 * 3. DTO类型 (DTO Types) - 数据传输对象
 * 4. 请求类型 (Request Types) - API请求参数
 * 5. 响应类型 (Response Types) - API响应结构
 */

// =====================================================
// 1. 基础类型 (Basic Types)
// =====================================================

/** 指标计算方法枚举 */
export type CalculationMethod = 'direct_measurement' | 'calculation_model';

/** 指标数据类型枚举 */
export type MetricType = 'Quantitative' | 'Discussion';

/** 指标角色类型枚举 */
export type MetricRole = 'SASBRequirement' | 'Input Metric' | 'Manual';

/** 分页信息 */
export interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
}

/** 通用失败响应结构 - 仅保留用于错误处理 */
export interface ErrorResponse {
  ok: false;
  error: string;
  code?: string;
}

// =====================================================
// 2. 实体类型 (Entity Types) - 对应RDF Schema
// =====================================================

/** 基础RDF实体 */
export interface RDFEntity {
  iri: string;
  label?: string;
}

/** 行业实体 */
export interface Industry extends RDFEntity {
  reportsUsing?: string[];              // esg:reportsUsing - 使用的报告框架
  description?: string;                 // 行业描述
  createdAt?: string;                   // 创建时间
  updatedAt?: string;                   // 更新时间
}

/** 报告框架实体 */
export interface ReportingFramework extends RDFEntity {
  // esg:ReportingFramework 相关属性可以在这里扩展
}

/** 分类实体 */
export interface Category extends RDFEntity {
  // esg:Category 相关属性可以在这里扩展
}

/** 指标实体 */
export interface Metric extends RDFEntity {
  hasType?: MetricRole;                 // esg:hasType
  hasMetricType?: MetricType;           // esg:hasMetricType
  hasUnit?: string;                     // esg:hasUnit
  hasCalculationMethod: CalculationMethod; // esg:hasCalculationMethod
}

/** 数据源实体 */
export interface DataSource extends RDFEntity {
  fileName?: string;
  description?: string;
  coverage?: string;
  recordCount?: number;                 // esg:hasRecordCount
  disclosureType?: string;
}

/** 数据集变量实体 */
export interface DatasetVariable extends RDFEntity {
  alignmentReason?: string;
  confidenceScore?: number;             // esg:hasConfidenceScore (0-100)
  isUnitCompatible?: string;
}

/** 模型实体 */
export interface Model extends RDFEntity {
  calculationType?: string;
  formula?: string;
  mathematicalExpression?: string;
}

/** 实现实体 */
export interface Implementation extends RDFEntity {
  language?: string;                    // esg:hasLanguage
  filePath?: string;                    // esg:hasFilePath
  functionName?: string;                // esg:hasFunction
  returnType?: string;                  // esg:hasReturnType
  validation?: string;
}

// =====================================================
// 3. DTO类型 (DTO Types) - 数据传输对象
// =====================================================

/** 数据源DTO - 轻量级传输格式 */
export type DataSourceDTO = Pick<DataSource, 'iri' | 'label' | 'fileName' | 'description' | 'coverage' | 'recordCount'>;

/** 数据集变量DTO - 包含关联的数据源 */
export type DatasetVariableDTO = Pick<DatasetVariable, 'iri' | 'label' | 'alignmentReason' | 'confidenceScore' | 'isUnitCompatible'> & {
  sources?: DataSourceDTO[];            // esg:sourceFrom
};

/** 实现DTO - 实现信息的传输格式 */
export type ImplementationDTO = Pick<Implementation, 'iri' | 'label' | 'language' | 'filePath' | 'functionName' | 'returnType' | 'validation'>;

/** 模型DTO - 包含实现信息 */
export type ModelDTO = Pick<Model, 'iri' | 'label' | 'calculationType' | 'formula' | 'mathematicalExpression'> & {
  implementation?: ImplementationDTO | null; // esg:executesWith
};

/** 指标DTO - 指标的传输格式 */
export type MetricDTO = Pick<Metric, 'iri' | 'label' | 'hasType' | 'hasMetricType' | 'hasUnit' | 'hasCalculationMethod'>;

/** 层次结构信息DTO */
export interface HierarchyDTO {
  category?: Pick<Category, 'iri' | 'label'>;
  framework?: Pick<ReportingFramework, 'iri' | 'label'>;
  industry?: Pick<Industry, 'iri' | 'label'>;
}

/** 行业DTO - 用于列表展示 */
export type IndustryDTO = Pick<Industry, 'iri' | 'label' | 'description'>;

/** 行业详情DTO - 包含关联的报告框架 */
export interface IndustryDetailDTO extends IndustryDTO {
  reportsUsing?: Array<Pick<ReportingFramework, 'iri' | 'label'>>;
  createdAt?: string;
  updatedAt?: string;
}

/** 报告框架DTO - 用于列表展示 */
export type FrameworkDTO = Pick<ReportingFramework, 'iri' | 'label'>;

/** 报告框架详情DTO - 包含关联的分类 */
export interface FrameworkDetailDTO extends FrameworkDTO {
  categories?: Array<Pick<Category, 'iri' | 'label'>>;
  sourceDocument?: string;              // esg:sourceDocument
  createdAt?: string;
  updatedAt?: string;
}

/** 分类DTO - 用于列表展示 */
export type CategoryDTO = Pick<Category, 'iri' | 'label'>;

/** 分类详情DTO - 包含关联的指标 */
export interface CategoryDetailDTO extends CategoryDTO {
  metrics?: Array<Pick<Metric, 'iri' | 'label'>>;
  frameworks?: Array<Pick<ReportingFramework, 'iri' | 'label'>>;
  createdAt?: string;
  updatedAt?: string;
}

// =====================================================
// 4. 请求类型 (Request Types)
// =====================================================

/** 通用KG查询请求参数 */
export interface KGQueryRequest {
  industry?: string;
  framework?: string;
  category_label?: string;
  metric_label?: string;
  model_label?: string;
  implementation_label?: string;
  calculation_type?: string;
  metric?: string;
  perm_id?: string;
  year?: string;
  metric_name?: string;
}

/** 行业列表查询请求 */
export interface GetIndustriesRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建行业请求 */
export interface CreateIndustryRequest {
  label: string;                        // 行业名称（必填）
  description?: string;                 // 行业描述（可选）
  reportsUsing?: string[];              // 使用的报告框架 URIs（可选）
}

/** 更新行业请求 */
export interface UpdateIndustryRequest {
  label?: string;                       // 行业名称（可选）
  description?: string;                 // 行业描述（可选）
  reportsUsing?: string[];              // 使用的报告框架 URIs（可选）
}

/** 删除行业请求 */
export interface DeleteIndustryRequest {
  force?: boolean;                      // 强制删除（包括有关联的行业）
}

/** 报告框架列表查询请求 */
export interface GetFrameworksRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  industry?: string;                    // 按行业筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建报告框架请求 */
export interface CreateFrameworkRequest {
  label: string;                        // 框架名称（必填）
  sourceDocument?: string;              // 来源文档（可选）
  categories?: string[];                // 包含的分类 URIs（可选）
}

/** 更新报告框架请求 */
export interface UpdateFrameworkRequest {
  label?: string;                       // 框架名称（可选）
  sourceDocument?: string;              // 来源文档（可选）
  categories?: string[];                // 包含的分类 URIs（可选）
}

/** 删除报告框架请求 */
export interface DeleteFrameworkRequest {
  force?: boolean;                      // 强制删除（包括有关联的框架）
}

/** 添加分类到框架请求 */
export interface AddCategoriesToFrameworkRequest {
  categories: string[];                 // 要添加的分类 URIs
}

/** 从框架删除分类请求 */
export interface RemoveCategoryFromFrameworkRequest {
  categoryId: string;                   // 要删除的分类 ID
}

/** 分类列表查询请求 */
export interface GetCategoriesRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  framework?: string;                   // 按框架筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建分类请求 */
export interface CreateCategoryRequest {
  label: string;                        // 分类名称（必填）
  metrics?: string[];                   // 包含的指标 URIs（可选）
}

/** 更新分类请求 */
export interface UpdateCategoryRequest {
  label?: string;                       // 分类名称（可选）
  metrics?: string[];                   // 包含的指标 URIs（可选）
}

/** 删除分类请求 */
export interface DeleteCategoryRequest {
  force?: boolean;                      // 强制删除（包括有关联的分类）
}

/** 添加指标到分类请求 */
export interface AddMetricsToCategoryRequest {
  metrics: string[];                    // 要添加的指标 URIs
}

/** 从分类删除指标请求 */
export interface RemoveMetricFromCategoryRequest {
  metricId: string;                     // 要删除的指标 ID
}

/** 模型执行请求 */
export interface ModelExecutionRequest {
  perm_id: string;
  calculation_type: string;
  year: string;
  metricArray: any[];
}

/** 创建实现请求 */
export interface CreateImplementationRequest {
  name: string;                         // 唯一标识符（必填）
  language: string;                     // 编程语言: Python, JavaScript, etc（必填）
  file_path: string;                    // 文件路径（必填）
  function_name?: string;               // 函数名称（可选）
  description?: string;                 // 描述（可选）
  input_parameters?: string;            // 输入参数说明（可选）
  return_type?: string;                 // 返回类型（可选）
  validation?: string;                  // 验证规则（可选）
}

/** 创建模型请求 */
export interface CreateModelRequest {
  name: string;                         // 唯一标识符（必填）
  calculation_type: string;             // 计算类型: percentage_ratio, intensity_ratio, etc（必填）
  input_metrics: string[];              // 输入指标的 label 或 URI（必填）
  implementation: string;               // 实现的 name 或 URI（必填）
  description?: string;                 // 模型描述（可选）
  formula?: string;                     // 公式（可选）
  mathematical_expression?: string;     // 数学表达式（可选）
}

/** 更新指标计算方法请求 */
export interface UpdateMetricCalculationMethodRequest {
  model: string;                        // 模型的 name 或 URI
}

// =====================================================
// 5. 响应类型 (Response Types)
// =====================================================

/** 通用列表响应格式 */
export interface ListResponse<T> {
  result: T[];
}

/** 框架查询响应 */
export type FrameworkResult = ListResponse<string>;

/** 分类查询响应 */
export type CategoryResult = ListResponse<string>;

/** 指标查询响应 */
export type MetricResult = ListResponse<string>;

/** 指标URI查询响应 */
export type MetricUriResult = ListResponse<string>;

/** 行业列表响应 */
export interface IndustriesResponse extends PaginationInfo {
  result: IndustryDTO[];
}

/** 行业详情响应 */
export interface IndustryDetailResponse {
  result: IndustryDetailDTO;
}

/** 创建行业响应 */
export interface CreateIndustryResponse {
  uri: string;
  label: string;
  description?: string;
  created_at: string;
}

/** 更新行业响应 */
export interface UpdateIndustryResponse {
  uri: string;
  label: string;
  description?: string;
  updated_at: string;
}

/** 删除行业响应 */
export interface DeleteIndustryResponse {
  uri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 报告框架列表响应 */
export interface FrameworksResponse extends PaginationInfo {
  result: FrameworkDTO[];
}

/** 报告框架详情响应 */
export interface FrameworkDetailResponse {
  result: FrameworkDetailDTO;
}

/** 创建报告框架响应 */
export interface CreateFrameworkResponse {
  uri: string;
  label: string;
  sourceDocument?: string;
  created_at: string;
}

/** 更新报告框架响应 */
export interface UpdateFrameworkResponse {
  uri: string;
  label: string;
  sourceDocument?: string;
  updated_at: string;
}

/** 删除报告框架响应 */
export interface DeleteFrameworkResponse {
  uri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 框架分类列表响应 */
export interface FrameworkCategoriesResponse {
  result: CategoryDTO[];
}

/** 添加分类到框架响应 */
export interface AddCategoriesToFrameworkResponse {
  framework_uri: string;
  added_categories: CategoryDTO[];
  added_at: string;
}

/** 从框架删除分类响应 */
export interface RemoveCategoryFromFrameworkResponse {
  framework_uri: string;
  removed_category_uri: string;
  removed_at: string;
}

/** 分类列表响应 */
export interface CategoriesResponse extends PaginationInfo {
  result: CategoryDTO[];
}

/** 分类详情响应 */
export interface CategoryDetailResponse {
  result: CategoryDetailDTO;
}

/** 创建分类响应 */
export interface CreateCategoryResponse {
  uri: string;
  label: string;
  created_at: string;
}

/** 更新分类响应 */
export interface UpdateCategoryResponse {
  uri: string;
  label: string;
  updated_at: string;
}

/** 删除分类响应 */
export interface DeleteCategoryResponse {
  uri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 分类指标列表响应 */
export interface CategoryMetricsResponse {
  result: MetricDTO[];
}

/** 添加指标到分类响应 */
export interface AddMetricsToCategoryResponse {
  category_uri: string;
  added_metrics: MetricDTO[];
  added_at: string;
}

/** 从分类删除指标响应 */
export interface RemoveMetricFromCategoryResponse {
  category_uri: string;
  removed_metric_uri: string;
  removed_at: string;
}

/** 指标元数据响应 */
export interface MetricMetadataResponse {
  metric: MetricDTO;
  hierarchy?: HierarchyDTO;
  additionalAttributes?: Record<string, any>;
}

/** 直接测量数据血缘响应 */
export interface DirectMeasurementResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'direct_measurement' };
  obtainedFrom: DatasetVariableDTO[];   // esg:obtainedFrom
}

/** 计算模型数据血缘响应 */
export interface CalculationModelResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'calculation_model' };
  model: ModelDTO | null;               // esg:isCalculatedBy
  inputs: DatasetVariableDTO[];         // 通过 model.requiresInputFrom 获取的输入数据
}

/** 指标数据血缘响应联合类型 */
export type MetricDatasetsResponse = DirectMeasurementResponse | CalculationModelResponse;

/** 创建实现响应 */
export interface CreateImplementationResponse {
  uri: string;
  label: string;
  language: string;
  file_path: string;
  created_at: string;
}

/** 创建模型响应 */
export interface CreateModelResponse {
  uri: string;
  label: string;
  calculation_type: string;
  input_metrics: Array<{
    uri: string;
    label: string;
  }>;
  implementation: {
    uri: string;
    label: string;
  };
  created_at: string;
}

/** 更新指标计算方法响应 */
export interface UpdateMetricCalculationMethodResponse {
  metric_uri: string;
  metric_label: string;
  calculation_method: string;
  model: {
    uri: string;
    label: string;
  };
  updated_at: string;
}

// =====================================================
// 6. 兼容性类型 (Legacy Types) - 向后兼容
// =====================================================

/** @deprecated 使用 Implementation 替代 */
export interface ImplementationDetails extends Implementation {
  inputParameters?: string;
}

/** @deprecated 使用 Implementation 替代 */
export interface ImplementationByCalculationType {
  implementationLabel: string;
  modelLabel: string;
  filePath: string;
  functionName: string;
  description: string;
}

/** @deprecated 使用新的响应类型替代 */
export interface CalculationType {
  calculationType: string;
  count: number;
  modelLabels: string[];
}

/** @deprecated 使用 DataSource 替代 */
export interface DataSourceInfo {
  dataSourceID: string;
  disclosureType: string;
}

/** @deprecated 使用 Map<string, string> 替代 */
export type MetricAttributesMap = Map<string, string>;

/** @deprecated 使用具体的响应类型替代 */
export interface MetricComputationMethod {
  [key: string]: any;
}

/** @deprecated 使用具体的响应类型替代 */
export interface MetricValue {
  [key: string]: any;
}

/** @deprecated 使用具体的响应类型替代 */
export interface ModelExecutionResult {
  [key: string]: any;
}

/** @deprecated 使用新的响应格式替代 */
export interface KGResponse<T = any> {
  result: T;
}

/** @deprecated 使用 ListResponse 替代 */
export interface AllImplementations extends KGResponse<Array<{
  label: string;
  language: string;
  description: string;
}>> {}

/** @deprecated 使用 ListResponse 替代 */
export interface ImplementationsByCalculationType extends KGResponse<ImplementationByCalculationType[]> {}

/** @deprecated 使用 ListResponse 替代 */
export interface AllCalculationTypes extends KGResponse<CalculationType[]> {}