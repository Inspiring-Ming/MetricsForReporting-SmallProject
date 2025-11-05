import { requestHelper } from "./callout";
import type { Result } from "./callout";

// Response Type
export type CompanyInfoRes = { industry: string, company_name: string };
export type FrameworkRes = { result: string[] };
export type CategoryRes  = { result: string[] };
export type MetricRes  = { result: string[] };

export type DirectMeasure = {
  measureMethod: "direct_measurement";
  obtainedFrom: string;      // required: you need this for metric_name
  source?: string;
};

export type CalcModel = {
  measureMethod: "calculation_model";
  isCalculatedBy: string;
  hasCalculationType: string;     // required, any string
  hasFormula?: string;
  requiresInputFrom: string[];    // keep required if API always sends it
};

export type MetricValRes = {
    value: number;
    pillar: string;
    reported_date: string;
};

export type ModelExecutaionRes = {
  value: number;
  pillar: string;
};

export type MetricMethod = DirectMeasure | CalcModel;

export type ReportGenRes = {
  rpId: string,
  fileName: string,
  fileURL: string,
};

// --- Types you can export from ./api/esg (or keep local) --------------------
export type ReportItem = {
  category: string;
  metric: string;
  modelDisplay: string;             // what we show in the UI (“direct_measurement” or model name)
  value: number | string;           // computed result shown in table
  method: "direct_measurement" | "calculation_model";
  methodDetails: {
    direct?: {
      obtainedFrom?: string | null;
      source?: string | null;
      reported_date?: string | null;
      pillar?: string | null;
    };
    calc?: {
      calculationType?: string | null;    // method.hasCalculationType
      modelExecution?: string | null;     // e.g. "percentage_ratio.py"
      formula?: string | undefined;       // method.hasFormula
      inputs?: string[];                  // method.requiresInputFrom
      metricInfo?: Array<{
        metric_name: string;
        value: number;
        metric_type?: string;
        unit?: string;
        description?: string;
        provider?: string;
        source?: string;
      }>;
      pillar?: string | null;
    };
  };
};

export type ReportData = {
  perm_id: string;
  industry: string;
  framework?: string;
  year: string;
  items: ReportItem[];
};

// --- Code validation/submit/execute (IDE) ----------------------------------
export type CodeValidationError = { message: string; line?: number; column?: number; text?: string };
export type CodeValidationRes = { ok: boolean; error?: CodeValidationError; errors?: CodeValidationError[] };

export function validateCodeReq(language: "python", code: string): Promise<Result<CodeValidationRes>> {
  return requestHelper("POST", "/SAGE/code/validate", { language, code });
}

export type SaveUserScriptRes = {
  ok: boolean;
  id?: string;
  file?: { path: string; bytes: number };
  bytecode?: { path: string; bytes: number };
  error?: CodeValidationError;
  errors?: CodeValidationError[];
};

export function submitCodeReq(language: "python", code: string): Promise<Result<SaveUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/submit", { language, code });
}

export type ExecuteUserScriptRes = {
  ok: boolean;
  result?: unknown;
  logs?: string[];
  error?: CodeValidationError;
};

export function executeCodeReq(id: string, inputs: unknown): Promise<Result<ExecuteUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/execute", { id, inputs });
}

export function executeTempCodeReq(language: "python", code: string, inputs: unknown): Promise<Result<ExecuteUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/execute-temp", { language, code, inputs });
}

export function getCompanyInfoReq(perm_id: string): Promise<Result<CompanyInfoRes>> {
  // If using proxy: url starts with /SAGE...
  return requestHelper("GET", "/SAGE/dynamoDB/company/info", { perm_id });
}

export function getReportFrameworkReq(industry: string): Promise<Result<FrameworkRes>> {
  return requestHelper("GET", "/SAGE/KG/retrieve/framework", { industry });
}

export function getCategoriesReq(industry: string, framework: string): Promise<Result<CategoryRes>> {
  return requestHelper("GET", "/SAGE/KG/retrieve/categories", { industry, framework });
}

export function getMetricsReq(industry: string, category_label:string, framework: string): Promise<Result<MetricRes>> {
  return requestHelper("GET", "/SAGE/KG/retrieve/category/metrics", { industry, category_label, framework });
}

export function getMetricComputationMethodReq(metric_label: string): Promise<Result<MetricMethod>> {
  return requestHelper("GET", "/SAGE/KG/metric/computation/method", { metric_label });
}

export function getMetricValueReq(
  perm_id: string,
  metric_name: string,
  year: string
): Promise<Result<MetricValRes>> {
  return requestHelper("GET", "/SAGE/dynamoDB/metric/value", { perm_id, metric_name, year });
}

export function modelExecutionReq(
  perm_id: string,
  calculation_type: string,
  year: string,
  metricArray: string[]
): Promise<Result<ModelExecutaionRes>> {
  return requestHelper("POST", "/SAGE/model/computation", { perm_id, calculation_type, year, metricArray });
}

export function generateReportReq(fileType: string, data: ReportData) {
  return requestHelper<ReportGenRes>("POST", "/SAGE/report/generate", { fileType, data });
}
