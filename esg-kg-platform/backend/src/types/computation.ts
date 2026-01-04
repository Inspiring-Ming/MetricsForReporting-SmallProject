/**
 * 指标计算信息查询相关类型定义（不执行实际计算）
 */

// 指标计算方法响应
export interface MetricComputationMethodResponse {
  metric_label: string;
  computation_method: 'direct_measurement' | 'calculation_model';
  attributes: Record<string, any>;
  data_sources?: DataSourceReference[];
  model?: ModelReference;
  implementation?: ImplementationReference;
}

// 数据源引用信息
export interface DataSourceReference {
  dataSourceID: string;
  disclosureType: string;
  sourceLabel?: string;
  description?: string;
}

// 模型引用信息
export interface ModelReference {
  modelLabel: string;
  calculationType: string;
  formula?: string;
  mathematicalExpression?: string;
  requiredInputs?: string[];
  description?: string;
}

// 实现引用信息
export interface ImplementationReference {
  implementationLabel: string;
  language: string;
  filePath: string;
  functionName: string;
  description: string;
  inputParameters?: string;
  returnType?: string;
  validation?: string;
}

// 计算信息查询请求
export interface ComputationInfoRequest {
  metric_label: string;
  include_data_sources?: boolean;
  include_implementation?: boolean;
}