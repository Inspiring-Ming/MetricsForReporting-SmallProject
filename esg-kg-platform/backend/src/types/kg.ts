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
  // esg:Industry 相关属性可以在这里扩展
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