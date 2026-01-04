/**
 * Report Model Types
 * Types for ESG report generation
 */

export interface ReportMetric {
  model: string;
  description: string;
  dataPoint: object;
  dataSource: string;
  computationMethod: string;
}

export interface ReportCategory {
  range: string;
  preresented_Value: string;
  metrics: ReportMetric[];
}

export interface ReportData {
  company_Name: string;
  generatedDate: string | null;
  company_Perm_ID: string;
  Industry: string;
  Reporting_framework: string;
  Categories: ReportCategory[];
}

export interface ReportGenerationResponse {
  rpId: string;
  fileName: string;
  fileURL: string;
}
