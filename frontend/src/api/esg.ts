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

// export type MetricMethod = {
//   metric_label: string;
//   computation_method: DirectMeasure | CalcModel;
//   attributes: object;
// }

export type ReportGenRes = {
  rpId: string,
  fileName: string,
  fileURL: string,
};

type UploadSuccess = {
  success: true,
  data: {
    uri?: string,
    label: string,
    language?: string,
    file_path?: string,
    created_at?: string,
  };
};

type UpdateMetricCalMethodSuccess = {
  success: true,
  data: {
    metric_uri: string,
    metric_label: string,
    calculation_method: string,
    model: {
      uri: string,
      label: string,
    },
    updated_at: string,
  };
};

// --- Upload info to embed into report ---
export type UploadItem = {
  category: string;
  metric: string;
  modelName: string;
  implementationName: string;          // e.g. "percentage_ratio.py"
  implementationFilePath?: string;     // e.g. "models/user_scripts/percentage_ratio.py"
  implementationUri?: string;          // KG IRI returned when implementation is created
  modelUri?: string;                   // KG IRI returned when model is created
  inputMetrics: string[];              // user's chosen input metrics
  calculationType?: string;            // e.g. "user_scripts/percentage_ratio"
  link?: {
    metric_label: string;
    model_label: string;
    updated_at?: string;
  };
  notes?: string;                      // reminders, e.g., mock/random values note
  created_at: string;                  // ISO timestamp
};

// --- Types you can export from ./api/esg (or keep local) --------------------
export type ReportItem = {
  category: string;
  metric: string;
  modelDisplay: string;                     // e.g. "direct_measurement" or calculation type
  value: number | string;                   // computed result
  method: "direct_measurement" | "calculation_model";
  methodDetails: {
    direct?: {
      obtainedFrom?: string | null;
      source?: string | null;
      reported_date?: string | null;
      pillar?: string | null;
    };
    calc?: {
      calculationType?: string | null;     // method.hasCalculationType
      modelExecution?: string | null;      // implementation filename if any
      formula?: string | undefined;        // method.hasFormula
      inputs?: string[];                   // method.requiresInputFrom
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
  uploadItem?: UploadItem; // include upload information for report rendering
};

// ========================================================================= //
// ======================== COMPUTATION MICROSERVICE ======================= //
// ========================================================================= //
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

export function submitCodeReq(language: "python", code: string, name?: string): Promise<Result<SaveUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/submit", { language, code, name });
}

export type ExecuteUserScriptRes = {
  ok: boolean;
  result?: unknown;
  logs?: string[];
  error?: CodeValidationError;
};

export function executeCodeReq(
  id: string | undefined,
  inputs: unknown,
  script_name?: string
): Promise<Result<ExecuteUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/execute", { id, script_name, inputs });
}

export function executeTempCodeReq(language: "python", code: string, inputs: unknown): Promise<Result<ExecuteUserScriptRes>> {
  return requestHelper("POST", "/SAGE/code/execute-temp", { language, code, inputs });
}

export function getCompanyInfoReq(perm_id: string): Promise<Result<CompanyInfoRes>> {
  // DynamoDB API - goes to root backend (port 3001)
  return requestHelper("GET", "/SAGE/dynamoDB/company/info", { perm_id });
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

// ========================================================================= //
// ============================ KG MICROSERVICE ============================ //
// ========================================================================= //
export function getReportFrameworkReq(industry: string): Promise<Result<FrameworkRes>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper("GET", "/api/kg/frameworks", { industry });
}

export function getCategoriesReq(industry: string, framework: string): Promise<Result<CategoryRes>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper("GET", "/api/kg/categories", { industry, framework });
}

export function getMetricsReq(industry: string, category_label:string, framework: string): Promise<Result<MetricRes>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper("GET", "/api/kg/metrics", { industry, category_label, framework });
}

export function getModelCalMetricsReq(industry: string, category_label:string, framework: string): Promise<Result<MetricRes>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper("GET", "/api/kg/metrics/model-calculation", { industry, category_label, framework });
}

export function uploadModelReq(
  name: string,
  calculation_type: string,
  input_metrics: string[],
  implementation: string,
  description?: string,
  formula?: string,
  mathematical_expression?: string,
): Promise<Result<UploadSuccess>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper(
    "POST",
    "/api/kg/models",
    {
      name,
      calculation_type,
      input_metrics,
      implementation,
      description,
      formula,
      mathematical_expression,
    }
  )
}

export function uploadImplementationReq(
  name: string,
  language: string,
  file_path: string,
  description?: string,
): Promise<Result<UploadSuccess>> {
  // KG API - goes to docker backend (port 3000)

  return requestHelper(
    "POST",
    "/api/kg/implementations",
    { name, language, file_path, description }
  );
}

export function resetKGReq() {
  // KG API - goes to docker backend (port 3000)

  return requestHelper(
    "POST",
    "/api/kg/reset",
  );
}

export function updateMetricCalMethodReq(
  metric_label: string,
  model: string,
): Promise<Result<UpdateMetricCalMethodSuccess>> {
  // KG API - goes to docker backend (port 3000)

  return requestHelper(
    "PATCH",
    `/api/kg/metrics/${metric_label}/calculation-method`,
    { model }
  );
}

// Wrong output type -- NEEDS FIXING
// export function getMetricComputationMethodReq(metric_label: string): Promise<Result<MetricMethod>> {
//   // KG Computation API - goes to docker backend (port 3000)
//   return requestHelper("GET", "/api/computation/method", { metric_label });
// }

// Using old endpoint for now
export function getMetricComputationMethodReq(metric_label: string): Promise<Result<MetricMethod>> {
  // KG Computation API - goes to docker backend (port 3000)
  return requestHelper("GET", "/SAGE/KG/metric/computation/method", { metric_label });
}

// ========================================================================= //
// ===================== REPORT GENERATION MICROSERVICE ==================== //
// ========================================================================= //
export function generateReportReq(fileType: string, data: ReportData) {
  return requestHelper<ReportGenRes>("POST", "/SAGE/report/generate", { fileType, data });
}
