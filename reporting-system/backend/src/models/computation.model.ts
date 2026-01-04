/**
 * Computation Model Types
 * Types for metric computation and model execution
 */

export interface MetricInfo {
  metric_name: string;
  value: string | number;
  metric_type: string;
  unit: string;
  description: string;
  provider: string;
  source: string;
}

export interface ModelExecutionResult {
  value: number;
  implementation: string;
  pillar: string;
  metricInfo: MetricInfo[];
}

export interface MetricCalculationMethod {
  metric_label: string;
  calculation_method: string;
  data_sources?: Array<{
    dataSourceID?: string;
    fileName?: string;
    description?: string;
  }>;
  attributes?: {
    obtainedFrom?: string;
  };
}
