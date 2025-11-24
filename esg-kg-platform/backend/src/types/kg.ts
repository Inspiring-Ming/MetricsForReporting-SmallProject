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
  totalPages?: number;
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

/** 模型详情DTO - 包含更多详细信息 */
export interface ModelDetailDTO extends ModelDTO {
  description?: string;
  inputMetrics?: Array<{
    iri: string;
    label: string;
  }>;
  implementation?: {
    iri: string;
    label: string;
    language?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

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
  category?: string;
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
  industry?: string;                    // 按行业筛选（可选）
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

/** 指标列表查询请求 */
export interface GetMetricsRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  industry?: string;                    // 按行业筛选（可选）
  category?: string;                    // 按分类筛选（可选）
  framework?: string;                   // 按报告框架筛选（可选）
  calculationMethod?: 'direct_measurement' | 'calculation_model';  // 按计算方法筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建指标请求 */
export interface CreateMetricRequest {
  label: string;                        // 指标名称（必填）
  code?: string;                        // 指标代码（可选，唯一标识）
  description?: string;                 // 指标描述（可选）
  unit?: string;                        // 单位（可选）
  dataType?: MetricType;                // 数据类型（可选）
  calculationMethod: CalculationMethod; // 计算方法（必填）
  hasType?: MetricRole;                 // 指标类型（可选）
  industry?: string;                    // 所属行业 URI（可选）
  category?: string;                    // 所属分类 URI（可选）
  framework?: string;                   // 所属框架 URI（可选）
  disclosureLevel?: number;             // 披露层次（可选，1-3）
  additionalProperties?: Record<string, any>; // 其他属性（可选）
}

/** 更新指标请求（完整更新） */
export interface UpdateMetricRequest {
  label: string;                        // 指标名称（必填）
  code?: string;                        // 指标代码（可选）
  description?: string;                 // 指标描述（可选）
  unit?: string;                        // 单位（可选）
  dataType?: MetricType;                // 数据类型（可选）
  calculationMethod: CalculationMethod; // 计算方法（必填）
  hasType?: MetricRole;                 // 指标类型（可选）
  industry?: string;                    // 所属行业 URI（可选）
  category?: string;                    // 所属分类 URI（可选）
  framework?: string;                   // 所属框架 URI（可选）
  disclosureLevel?: number;             // 披露层次（可选，1-3）
  additionalProperties?: Record<string, any>; // 其他属性（可选）
}

/** 部分更新指标请求 */
export interface PatchMetricRequest {
  label?: string;                       // 指标名称（可选）
  code?: string;                        // 指标代码（可选）
  description?: string;                 // 指标描述（可选）
  unit?: string;                        // 单位（可选）
  dataType?: MetricType;                // 数据类型（可选）
  calculationMethod?: CalculationMethod;// 计算方法（可选）
  hasType?: MetricRole;                 // 指标类型（可选）
  model?: string;                       // 关联的计算模型 URI 或 label（可选，仅用于 calculation_model 类型）
  industry?: string;                    // 所属行业 URI（可选）
  category?: string;                    // 所属分类 URI（可选）
  framework?: string;                   // 所属框架 URI（可选）
  disclosureLevel?: number;             // 披露层次（可选，1-3）
  additionalProperties?: Record<string, any>; // 其他属性（可选）
}

/** 删除指标请求 */
export interface DeleteMetricRequest {
  cascade?: boolean;                    // 是否级联删除相关数据（默认 false）
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
}

/** 添加数据源关联请求 */
export interface AddMetricDatasourceRequest {
  datasourceUri: string;                // 数据源 URI（必填）
  datasetVariableUri?: string;          // 数据集变量 URI（可选）
  disclosureLevel?: number;             // 披露层次（可选，1-3）
  priority?: number;                    // 优先级（可选）
}

/** 添加输入指标请求 */
export interface AddMetricInputRequest {
  inputMetricUri: string;               // 输入指标 URI（必填）
  order?: number;                       // 输入顺序（可选）
}

/** 批量创建指标请求 */
export interface BatchCreateMetricsRequest {
  metrics: CreateMetricRequest[];       // 指标数组
}

/** 批量删除指标请求 */
export interface BatchDeleteMetricsRequest {
  metricIds: string[];                  // 指标 ID 数组
  cascade?: boolean;                    // 是否级联删除（可选）
  force?: boolean;                      // 强制删除（可选）
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

/** 更新模型请求 */
export interface UpdateModelRequest {
  label?: string;                       // 模型名称（可选）
  calculation_type?: string;            // 计算类型（可选）
  input_metrics?: string[];             // 输入指标（可选）
  implementation?: string;              // 实现（可选）
  description?: string;                 // 描述（可选）
  formula?: string;                     // 公式（可选）
  mathematical_expression?: string;     // 数学表达式（可选）
}

/** 删除模型请求 */
export interface DeleteModelRequest {
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
}

/** 模型列表查询请求 */
export interface GetModelsRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  calculationType?: string;             // 按计算类型筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 更新模型请求 */
export interface UpdateModelRequest {
  label?: string;                       // 模型名称（可选）
  calculation_type?: string;            // 计算类型（可选）
  input_metrics?: string[];             // 输入指标（可选）
  implementation?: string;              // 实现（可选）
  description?: string;                 // 描述（可选）
  formula?: string;                     // 公式（可选）
  mathematical_expression?: string;     // 数学表达式（可选）
}

/** 删除模型请求 */
export interface DeleteModelRequest {
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
}

/** 模型列表查询请求 */
export interface GetModelsRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  calculationType?: string;             // 按计算类型筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 更新模型请求 */
export interface UpdateModelRequest {
  label?: string;                       // 模型名称（可选）
  calculation_type?: string;            // 计算类型（可选）
  input_metrics?: string[];             // 输入指标（可选）
  implementation?: string;              // 实现（可选）
  description?: string;                 // 描述（可选）
  formula?: string;                     // 公式（可选）
  mathematical_expression?: string;     // 数学表达式（可选）
}

/** 删除模型请求 */
export interface DeleteModelRequest {
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
}

/** 模型列表查询请求 */
export interface GetModelsRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  calculationType?: string;             // 按计算类型筛选（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}



/** 实现列表查询请求 */
export interface GetImplementationsRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  language?: string;                    // 按编程语言筛选（可选）
  filePath?: string;                    // 按文件路径筛选（可选）
  calculationType?: string;             // 按计算类型筛选（通过关联的模型）（可选）
  sort?: 'label' | 'createdAt';         // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 更新实现请求 */
export interface UpdateImplementationRequest {
  label?: string;                       // 实现名称（可选）
  language?: string;                    // 编程语言（可选）
  file_path?: string;                   // 文件路径（可选）
  function_name?: string;               // 函数名称（可选）
  description?: string;                 // 描述（可选）
  input_parameters?: string;            // 输入参数说明（可选）
  return_type?: string;                 // 返回类型（可选）
  validation?: string;                  // 验证规则（可选）
}

/** 删除实现请求 */
export interface DeleteImplementationRequest {
  force?: boolean;                      // 强制删除（包括有关联模型的实现）
}

/** 数据集变量列表查询请求 */
export interface GetDatasetVariablesRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label模糊匹配）
  datasource?: string;                  // 按数据源筛选（可选）
  metric?: string;                      // 按指标筛选（可选）
  minConfidenceScore?: number;          // 最小置信度分数筛选（可选，0-100）
  isUnitCompatible?: string;            // 按单位兼容性筛选（可选）
  sort?: 'label' | 'confidenceScore' | 'createdAt';  // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建数据集变量请求 */
export interface CreateDatasetVariableRequest {
  label: string;                        // 变量名称（必填）
  alignmentReason?: string;             // 对齐原因（可选）
  confidenceScore?: number;             // 置信度分数（可选，0-100）
  isUnitCompatible?: string;            // 单位兼容性（可选）
  sources?: string[];                   // 关联的数据源 URIs（可选）
}

/** 更新数据集变量请求（部分更新） */
export interface UpdateDatasetVariableRequest {
  label?: string;                       // 变量名称（可选）
  alignmentReason?: string;             // 对齐原因（可选）
  confidenceScore?: number;             // 置信度分数（可选，0-100）
  isUnitCompatible?: string;            // 单位兼容性（可选）
  sources?: string[];                   // 关联的数据源 URIs（可选，会替换现有的）
}

/** 删除数据集变量请求 */
export interface DeleteDatasetVariableRequest {
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
}

/** 添加数据源到数据集变量请求 */
export interface AddDatasourceToVariableRequest {
  datasourceUri: string;                // 数据源 URI（必填）
}

/** 数据源列表查询请求 */
export interface GetDatasourcesRequest {
  page?: number;                        // 页码（从1开始）
  size?: number;                        // 每页数量
  search?: string;                      // 搜索关键词（label或fileName模糊匹配）
  sort?: 'label' | 'fileName' | 'recordCount' | 'createdAt';  // 排序字段
  order?: 'asc' | 'desc';               // 排序顺序
}

/** 创建数据源请求 */
export interface CreateDatasourceRequest {
  label: string;                        // 数据源名称（必填）
  fileName?: string;                    // 文件名（可选）
  description?: string;                 // 描述（可选）
  coverage?: string;                    // 覆盖范围（可选）
  recordCount?: number;                 // 记录数量（可选）
  disclosureType?: string;              // 披露类型（可选）
}

/** 更新数据源请求（部分更新） */
export interface UpdateDatasourceRequest {
  label?: string;                       // 数据源名称（可选）
  fileName?: string;                    // 文件名（可选）
  description?: string;                 // 描述（可选）
  coverage?: string;                    // 覆盖范围（可选）
  recordCount?: number;                 // 记录数量（可选）
  disclosureType?: string;              // 披露类型（可选）
}

/** 删除数据源请求 */
export interface DeleteDatasourceRequest {
  force?: boolean;                      // 强制删除（忽略依赖检查，默认 false）
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
  iri: string;
  label: string;
  description?: string;
  created_at: string;
}

/** 更新行业响应 */
export interface UpdateIndustryResponse {
  iri: string;
  label: string;
  description?: string;
  updated_at: string;
}

/** 删除行业响应 */
export interface DeleteIndustryResponse {
  iri: string;
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
  iri: string;
  label: string;
  sourceDocument?: string;
  created_at: string;
}

/** 更新报告框架响应 */
export interface UpdateFrameworkResponse {
  iri: string;
  label: string;
  sourceDocument?: string;
  updated_at: string;
}

/** 删除报告框架响应 */
export interface DeleteFrameworkResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 框架分类列表响应 */
export interface FrameworkCategoriesResponse {
  result: CategoryDTO[];
}

/** 添加分类到框架响应 */
export interface AddCategoriesToFrameworkResponse {
  framework_iri: string;
  added_categories: CategoryDTO[];
  added_at: string;
}

/** 从框架删除分类响应 */
export interface RemoveCategoryFromFrameworkResponse {
  framework_iri: string;
  removed_category_iri: string;
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
  iri: string;
  label: string;
  created_at: string;
}

/** 更新分类响应 */
export interface UpdateCategoryResponse {
  iri: string;
  label: string;
  updated_at: string;
}

/** 删除分类响应 */
export interface DeleteCategoryResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 分类指标列表响应 */
export interface CategoryMetricsResponse {
  result: MetricDTO[];
}

/** 添加指标到分类响应 */
export interface AddMetricsToCategoryResponse {
  category_iri: string;
  added_metrics: MetricDTO[];
  added_at: string;
}

/** 从分类删除指标响应 */
export interface RemoveMetricFromCategoryResponse {
  category_iri: string;
  removed_metric_iri: string;
  removed_at: string;
}

/** 指标元数据响应 */
export interface MetricMetadataResponse {
  metric: MetricDTO;
  hierarchy?: HierarchyDTO;
  additionalAttributes?: Record<string, any>;
}

/** 指标详情响应（包含所有属性） */
export interface MetricDetailResponse {
  result: MetricDTO & {
    attributes?: Record<string, any>;
    hierarchy?: HierarchyDTO;
    createdAt?: string;
    updatedAt?: string;
  };
}

/** 指标列表响应 */
export interface MetricsResponse extends PaginationInfo {
  result: MetricDTO[];
}

/** 创建指标响应 */
export interface CreateMetricResponse {
  iri: string;
  label: string;
  code?: string;
  calculationMethod: CalculationMethod;
  created_at: string;
}

/** 更新指标响应 */
export interface UpdateMetricResponse {
  iri: string;
  label: string;
  calculationMethod: CalculationMethod;
  updated_at: string;
}

/** 更新指标模型关联响应（包含模型详情） */
export interface UpdateMetricModelResponse {
  metric_uri: string;
  metric_label: string;
  calculation_method: string;
  model?: {
    uri: string;
    label: string;
  } | null;
  updated_at: string;
}


/** 删除指标响应 */
export interface DeleteMetricResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 添加数据源关联响应 */
export interface AddMetricDatasourceResponse {
  metric_iri: string;
  datasource_iri: string;
  added_at: string;
}

/** 删除数据源关联响应 */
export interface RemoveMetricDatasourceResponse {
  metric_iri: string;
  datasource_iri: string;
  removed_at: string;
}

/** 添加输入指标响应 */
export interface AddMetricInputResponse {
  metric_iri: string;
  input_metric_iri: string;
  added_at: string;
}

/** 删除输入指标响应 */
export interface RemoveMetricInputResponse {
  metric_iri: string;
  input_metric_iri: string;
  removed_at: string;
}

/** 批量创建指标响应 */
export interface BatchCreateMetricsResponse {
  created: Array<{
    iri: string;
    label: string;
  }>;
  failed: Array<{
    label: string;
    error: string;
  }>;
  total_created: number;
  total_failed: number;
}

/** 批量删除指标响应 */
export interface BatchDeleteMetricsResponse {
  deleted: string[];                    // 成功删除的指标 URI 列表
  failed: Array<{
    iri: string;
    error: string;
  }>;
  total_deleted: number;
  total_failed: number;
}

/** 最佳数据源响应 */
export interface BestDataSourceResponse {
  metricId: string;
  dataSource: {
    dataSourceID: string;
    disclosureType: string;
    fileName?: string;
    description?: string;
  } | null;
}

/** 所有数据源列表响应 (GET /api/kg/metrics/:id/datasources) */
export interface MetricDataSourcesResponse {
  metricId: string;
  metricLabel: string;
  calculationMethod: 'direct_measurement' | 'calculation_model';
  dataSources: Array<{
    dataSourceID: string;
    label?: string;
    fileName?: string;
    disclosureType: string;
    recordCount?: number;
    description?: string;
    coverage?: string;
    // 关联的数据集变量信息
    variables?: Array<{
      iri: string;
      label?: string;
      alignmentReason?: string;
      confidenceScore?: number;
      isUnitCompatible?: string;
    }>;
  }>;
  total: number;
}

/** 使用该指标作为输入的模型列表响应 (GET /api/kg/metrics/:id/models) */
export interface MetricModelsResponse {
  metricId: string;
  metricLabel: string;
  models: Array<{
    iri: string;
    label?: string;
    calculationType?: string;
    formula?: string;
    mathematicalExpression?: string;
    // 该模型产出的指标
    outputMetric?: {
      iri: string;
      label?: string;
    };
    // 该模型的实现
    implementation?: {
      iri: string;
      label?: string;
      language?: string;
    };
  }>;
  total: number;
}

/** 指标的计算模型列表详情响应 (GET /api/kg/metrics/:id/models) */
export interface MetricModelsDetailResponse {
  metricId: string;
  metricLabel: string;
  calculationMethod: 'direct_measurement' | 'calculation_model';
  usage: 'output' | 'input';           // 查询用途：output=该指标由哪些模型计算，input=哪些模型依赖该指标作为输入
  models: Array<{
    iri: string;
    label: string;
    calculationType?: string;
    formula?: string;
    mathematicalExpression?: string;
    implementation?: {
      iri: string;
      label?: string;
      language?: string;
    };
    inputMetrics?: Array<{
      iri: string;
      label: string;
    }>;
    outputMetric?: {                   // 仅当 usage=input 时有值，表示该模型计算的指标
      iri: string;
      label?: string;
    };
  }>;
  total: number;
}

/** 指标输入列表响应 (GET /api/kg/metrics/:id/inputs) */
export interface MetricInputsResponse {
  metricId: string;
  metricLabel: string;
  calculationMethod: 'direct_measurement' | 'calculation_model';
  model?: {
    iri: string;
    label?: string;
    calculationType?: string;
  };
  inputs: Array<{
    iri: string;
    label?: string;
    hasCalculationMethod?: 'direct_measurement' | 'calculation_model';
    hasUnit?: string;
    hasMetricType?: string;
    hasType?: string;
    // 该输入指标是否还有输入（递归标识）
    hasInputs?: boolean;
  }>;
  total: number;
}

/** 直接测量数据血缘响应 */
export interface DirectMeasurementLineageResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'direct_measurement' };
  lineageType: 'direct_measurement';
  obtainedFrom: DatasetVariableDTO[];   // esg:obtainedFrom
}

/** 计算模型数据血缘响应 */
export interface CalculationModelLineageResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'calculation_model' };
  lineageType: 'calculation_model';
  model: ModelDTO | null;               // esg:isCalculatedBy
  inputs: DatasetVariableDTO[];         // 通过 model.requiresInputFrom 获取的输入数据
}

/** 指标数据血缘响应联合类型 (GET /api/kg/metrics/:id/lineage) */
export type MetricLineageResponse = DirectMeasurementLineageResponse | CalculationModelLineageResponse;

/** @deprecated Use DirectMeasurementLineageResponse instead. Will be removed in v2.0.0 */
export interface DirectMeasurementResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'direct_measurement' };
  obtainedFrom: DatasetVariableDTO[];   // esg:obtainedFrom
}

/** @deprecated Use CalculationModelLineageResponse instead. Will be removed in v2.0.0 */
export interface CalculationModelResponse extends PaginationInfo {
  metric: MetricDTO & { hasCalculationMethod: 'calculation_model' };
  model: ModelDTO | null;               // esg:isCalculatedBy
  inputs: DatasetVariableDTO[];         // 通过 model.requiresInputFrom 获取的输入数据
}

/** @deprecated Use MetricLineageResponse instead. Endpoint renamed from /datasets to /lineage. Will be removed in v2.0.0 */
export type MetricDatasetsResponse = DirectMeasurementResponse | CalculationModelResponse;

/** 创建实现响应 */
export interface CreateImplementationResponse {
  iri: string;
  label: string;
  language: string;
  file_path: string;
  created_at: string;
}

/** 创建模型响应 */
export interface CreateModelResponse {
  iri: string;
  label: string;
  calculation_type: string;
  input_metrics: Array<{
    iri: string;
    label: string;
  }>;
  implementation: {
    iri: string;
    label: string;
  };
  created_at: string;
}

/** 更新模型响应 */
export interface UpdateModelResponse {
  iri: string;
  label: string;
  inputMetrics?: Array<{
    iri: string;
    label: string;
  }>;
  updated_at: string;
}

/** 删除模型响应 */
export interface DeleteModelResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 模型列表响应 */
export interface ModelsResponse extends PaginationInfo {
  result: ModelDTO[];
}

/** 模型详情响应 */
export interface ModelDetailResponse {
  result: ModelDetailDTO;
}

/** 模型输入指标列表响应 (GET /api/kg/models/:id/metrics/inputs) */
export interface ModelMetricsInputsResponse {
  modelId: string;
  modelLabel: string;
  inputs: Array<{
    iri: string;
    label: string;
    hasCalculationMethod?: 'direct_measurement' | 'calculation_model';
    hasUnit?: string;
    hasMetricType?: string;
  }>;
  total: number;
}

/** 模型输出指标响应 (GET /api/kg/models/:id/metrics/output) */
export interface ModelMetricsOutputResponse {
  modelId: string;
  modelLabel: string;
  output: {
    iri: string;
    label: string;
    hasCalculationMethod: 'calculation_model';
    hasUnit?: string;
    hasMetricType?: string;
  } | null;
}

/** 更新模型输入指标请求 (PUT /api/kg/models/:id/metrics/inputs) */
export interface UpdateModelMetricsInputsRequest {
  inputs: string[];  // Array of metric URIs or labels
}

/** 添加单个输入指标到模型请求 (POST /api/kg/models/:id/metrics/inputs/:metricId) */
export interface AddModelInputMetricRequest {
  // No request body needed, metricId is in path
}

/** 删除模型的单个输入指标请求 (DELETE /api/kg/models/:id/metrics/inputs/:metricId) */
export interface RemoveModelInputMetricRequest {
  // No request body needed, metricId is in path
}

/** 更新模型输入指标响应 */
export interface UpdateModelMetricsInputsResponse {
  modelId: string;
  inputs: Array<{
    iri: string;
    label: string;
  }>;
  updated_at: string;
}

/** 添加输入指标响应 */
export interface AddModelInputMetricResponse {
  model_iri: string;
  metric_iri: string;
  added_at: string;
}

/** 删除输入指标响应 */
export interface RemoveModelInputMetricResponse {
  model_iri: string;
  metric_iri: string;
  removed_at: string;
}

/** 模型实现列表响应 (GET /api/kg/models/:id/implementations) */
export interface ModelImplementationsResponse {
  modelId: string;
  modelLabel: string;
  implementations: Array<{
    iri: string;
    label: string;
    language?: string;
    filePath?: string;
    functionName?: string;
  }>;
  total: number;
}

/** 添加实现到模型请求 (POST /api/kg/models/:id/implementations) */
export interface AddModelImplementationRequest {
  implementationId: string;  // Implementation URI or label
}

/** 添加实现到模型响应 */
export interface AddModelImplementationResponse {
  model_iri: string;
  implementation_iri: string;
  added_at: string;
}

/** 指标计算方法详情响应 (GET /api/kg/metrics/:id/calculation-method) */
export interface MetricCalculationMethodResponse {
  metric_label: string;
  metric_iri: string;
  calculation_method: 'direct_measurement' | 'calculation_model';
  attributes?: Record<string, any>;
  data_sources?: Array<{
    dataSourceID: string;
    disclosureType: string;
    fileName?: string;
    description?: string;
  }>;
  model?: {
    label: string;
    iri: string;
    calculationType?: string;
    formula?: string;
    mathematicalExpression?: string;
    description?: string;
  };
  implementation?: {
    label: string;
    iri: string;
    language?: string;
    filePath?: string;
    functionName?: string;
    description?: string;
  };
}

/** 实现列表响应 */
export interface ImplementationsResponse extends PaginationInfo {
  result: ImplementationDTO[];
}

/** 实现详情响应 */
export interface ImplementationDetailResponse {
  result: ImplementationDTO & {
    description?: string;
    inputParameters?: string;
    relatedModels?: Array<{
      iri: string;
      label: string;
      calculationType?: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
}

/** 更新实现响应 */
export interface UpdateImplementationResponse {
  iri: string;
  label: string;
  language?: string;
  file_path?: string;
  updated_at: string;
}

/** 删除实现响应 */
export interface DeleteImplementationResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 数据集变量列表响应 */
export interface DatasetVariablesResponse extends PaginationInfo {
  result: DatasetVariableDTO[];
}

/** 数据集变量详情响应 */
export interface DatasetVariableDetailResponse {
  result: DatasetVariableDTO & {
    metrics?: Array<Pick<Metric, 'iri' | 'label' | 'hasCalculationMethod'>>;  // 使用此变量的指标
    createdAt?: string;
    updatedAt?: string;
  };
}

/** 创建数据集变量响应 */
export interface CreateDatasetVariableResponse {
  iri: string;
  label: string;
  created_at: string;
}

/** 更新数据集变量响应 */
export interface UpdateDatasetVariableResponse {
  iri: string;
  label: string;
  updated_at: string;
}

/** 删除数据集变量响应 */
export interface DeleteDatasetVariableResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
}

/** 数据集变量数据源列表响应 */
export interface VariableDatasourcesResponse {
  variable_id: string;
  variable_label: string;
  datasources: DataSourceDTO[];
  total: number;
}

/** 添加数据源到数据集变量响应 */
export interface AddDatasourceToVariableResponse {
  variable_iri: string;
  datasource_iri: string;
  added_at: string;
}

/** 移除数据集变量数据源关联响应 */
export interface RemoveVariableDatasourceResponse {
  variable_iri: string;
  datasource_iri: string;
  removed_at: string;
}

/** 数据集变量质量信息响应 */
export interface DatasetVariableQualityResponse {
  variable_id: string;
  variable_label: string;
  confidenceScore?: number;
  isUnitCompatible?: string;
  alignmentReason?: string;
}

/** 数据集变量的指标列表响应 */
export interface VariableMetricsResponse {
  variable_id: string;
  variable_label: string;
  metrics: Array<{
    iri: string;
    label: string;
    hasCalculationMethod: 'direct_measurement' | 'calculation_model';
    hasUnit?: string;
    hasMetricType?: string;
  }>;
  total: number;
}

/** 数据源的变量列表响应 */
export interface DatasourceVariablesResponse {
  datasource_id: string;
  datasource_label: string;
  variables: Array<{
    iri: string;
    label: string;
    confidenceScore?: number;
    alignmentReason?: string;
  }>;
  total: number;
}

/** 数据源的指标列表响应（间接关联）*/
export interface DatasourceMetricsResponse {
  datasource_id: string;
  datasource_label: string;
  metrics: Array<{
    iri: string;
    label: string;
    hasCalculationMethod: 'direct_measurement' | 'calculation_model';
    hasUnit?: string;
    variable: {
      iri: string;
      label: string;
    };
  }>;
  total: number;
}

/** 数据源列表响应 */
export interface DatasourcesResponse extends PaginationInfo {
  result: DataSourceDTO[];
}

/** 数据源详情响应 */
export interface DatasourceDetailResponse {
  result: DataSourceDTO & {
    variables?: Array<Pick<DatasetVariable, 'iri' | 'label'>>;  // 使用此数据源的数据集变量
    createdAt?: string;
    updatedAt?: string;
  };
}

/** 创建数据源响应 */
export interface CreateDatasourceResponse {
  iri: string;
  label: string;
  created_at: string;
}

/** 更新数据源响应 */
export interface UpdateDatasourceResponse {
  iri: string;
  label: string;
  updated_at: string;
}

/** 删除数据源响应 */
export interface DeleteDatasourceResponse {
  iri: string;
  deleted: boolean;
  deleted_at: string;
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
}>> { }

/** @deprecated 使用 ListResponse 替代 */
export interface ImplementationsByCalculationType extends KGResponse<ImplementationByCalculationType[]> { }

/** @deprecated 使用 ListResponse 替代 */
export interface AllCalculationTypes extends KGResponse<CalculationType[]> { }