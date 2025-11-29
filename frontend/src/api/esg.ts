import { requestHelper } from "./callout";
import type { Result } from "./callout";

// ========================================================================= //
// ===================== BACKEND RESPONSE TYPES (Internal) ================ //
// ========================================================================= //

// Pagination info
interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
}

// DTO with label
interface LabeledDTO {
  iri?: string;
  label: string;
}

// Framework backend response (paginated)
interface FrameworkBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

// Category backend response (paginated)
interface CategoryBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

// Metric backend response (paginated)
interface MetricBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

// ========================================================================= //
// ==================== FRONTEND RESPONSE TYPES (Public) ================== //
// ========================================================================= //

// Response Type - simplified format used by the frontend
export type CompanyInfoRes = { industry: string, company_name: string };
export type FrameworkRes = { result: string[] };  // simple string array
export type CategoryRes = { result: string[] };   // simple string array
export type MetricRes = { result: string[] };     // simple string array

// ========================================================================= //
// ========================== UTILITY FUNCTIONS ============================ //
// ========================================================================= //

/**
 * Extract label array from a paginated response (supports string[] or object array)
 * @param response paginated response object
 * @returns label strings
 */
function extractLabels<T extends { result: Array<LabeledDTO | string> }>(response: T): string[] {
  const arr = response.result ?? [];
  return arr
    .map((item) => (typeof item === "string" ? item : item.label))
    .filter((s) => typeof s === "string" && s.trim().length > 0);
}

/**
 * Convert backend paginated response to simplified frontend format
 */
function toSimpleFormat<T extends { result: Array<LabeledDTO | string> }>(backendResponse: T): { result: string[] } {
  return { result: extractLabels(backendResponse) };
}

/**
 * Fetch all pages automatically
 * @param endpoint API endpoint path
 * @param params query parameters
 * @param pageSize page size, default 100
 * @returns Result type with aggregated data when successful
 */
async function fetchAllPages<T extends PaginationInfo & { result: Array<LabeledDTO | string> }>(
  endpoint: string,
  params: Record<string, unknown>,
  pageSize: number = 100
): Promise<Result<T>> {
  let page = 1;
  const allItems: LabeledDTO[] = [];
  let total = 0;

  while (true) {
    const backendResult = await requestHelper<T>(
      "GET",
      endpoint,
      { ...params, page, size: pageSize }
    );

    // If request failed
    if (!backendResult.ok) {
      // If the first page fails, return error immediately
      if (page === 1) {
        return backendResult;
      }
      // If not the first page, we likely reached the end; stop looping
      break;
    }

    const currentPageItems = backendResult.data.result || [];
    allItems.push(...currentPageItems);

    // Save total info if provided
    if (backendResult.data.total !== undefined) {
      total = backendResult.data.total;
    }

    // Determine if all data has been fetched:
    // 1) current page is empty
    // 2) fewer items than pageSize (last page)
    // 3) reached total if provided
    if (
      currentPageItems.length === 0 ||
      currentPageItems.length < pageSize ||
      (total > 0 && allItems.length >= total)
    ) {
      break;
    }

    page++;

    // Safety cap: max 100 pages to avoid infinite loops
    if (page > 100) {
      console.warn(`fetchAllPages: Reached maximum page limit (100) for ${endpoint}`);
      break;
    }
  }

  // Return aggregated data
  return {
    ok: true,
    data: {
      result: allItems,
      total: total || allItems.length,
      page: 1,
      size: allItems.length
    } as unknown as T
  };
}

// ========================================================================= //
// ============================ OTHER TYPES ================================ //
// ========================================================================= //

// ========================================================================= //
// ===================== METRIC CALCULATION METHOD TYPES =================== //
// ========================================================================= //

/**
 * Metric calculation method response (new KG API)
 * from GET /api/kg/metrics/:id/calculation-method
 */
export type MetricCalculationMethod = {
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
};

/**
 * @deprecated Legacy type retained for backward compatibility
 * Use MetricCalculationMethod instead
 */
export type DirectMeasure = {
  measureMethod: "direct_measurement";
  obtainedFrom: string;
  source?: string;
};

/**
 * @deprecated Legacy type retained for backward compatibility
 * Use MetricCalculationMethod instead
 */
export type CalcModel = {
  measureMethod: "calculation_model";
  isCalculatedBy: string;
  hasCalculationType: string;
  hasFormula?: string;
  requiresInputFrom: string[];
};

/**
 * @deprecated Legacy union retained for backward compatibility
 * Use MetricCalculationMethod instead
 */
export type MetricMethod = DirectMeasure | CalcModel;

export type MetricValRes = {
  value: number;
  pillar: string;
  reported_date: string;
};

export type ModelExecutaionRes = {
  value: number;
  pillar: string;
};

// ========================================================================= //
// ===================== CONVERSION HELPERS ================================ //
// ========================================================================= //

/**
 * Convert new MetricCalculationMethod format to legacy MetricMethod format
 * for backward compatibility
 */
export function convertToLegacyMetricMethod(
  newFormat: MetricCalculationMethod
): MetricMethod {
  if (newFormat.calculation_method === 'direct_measurement') {
    // Take the first data source from data_sources
    const firstDataSource = newFormat.data_sources?.[0];
    return {
      measureMethod: 'direct_measurement',
      obtainedFrom: firstDataSource?.dataSourceID || newFormat.metric_label,
      source: firstDataSource?.fileName,
    };
  } else {
    // calculation_model
    return {
      measureMethod: 'calculation_model',
      isCalculatedBy: newFormat.model?.label || newFormat.model?.iri || '',
      hasCalculationType: newFormat.model?.calculationType || 'calculation_model',
      hasFormula: newFormat.model?.formula,
      requiresInputFrom: [], // New API does not directly return input metrics list
    };
  }
}


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
  metric_uri: string,
  metric_label: string,
  calculation_method: string,
  model: {
    uri: string,
    label: string,
  } | null,
  updated_at: string,
};

// --- Upload info to embed into report ---
export type UploadItem = {
  category: string;
  metric: string;
  modelName: string;
  implementationName: string;          // e.g., "percentage_ratio.py"
  implementationFilePath?: string;     // e.g., "models/user_scripts/percentage_ratio.py"
  implementationUri?: string;          // KG IRI returned when implementation is created
  modelUri?: string;                   // KG IRI returned when model is created
  inputMetrics: string[];              // user's chosen input metrics
  calculationType?: string;            // e.g., "user_scripts/percentage_ratio"
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
  modelDisplay: string;                     // e.g., "direct_measurement" or calculation type
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

/**
 * Get list of reporting frameworks (compat layer)
 * Internally calls backend paginated API, auto-fetches all pages,
 * and converts to simple string array format
 */
export async function getReportFrameworkReq(industry: string): Promise<Result<FrameworkRes>> {
  const result = await fetchAllPages<FrameworkBackendRes>("/api/kg/frameworks", { industry });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toSimpleFormat(result.data)
  };
}

/**
 * Get category list (compat layer)
 * Internally calls backend paginated API, auto-fetches all pages,
 * and converts to simple string array format
 */
export async function getCategoriesReq(industry: string, framework: string): Promise<Result<CategoryRes>> {
  const result = await fetchAllPages<CategoryBackendRes>("/api/kg/categories", { industry, framework });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toSimpleFormat(result.data)
  };
}

/**
 * Get metric list (compat layer)
 * Internally calls backend paginated API, auto-fetches all pages,
 * and converts to simple string array format
 */
export async function getMetricsReq(industry: string, category_label: string, framework: string): Promise<Result<MetricRes>> {
  const result = await fetchAllPages<MetricBackendRes>("/api/kg/metrics", { industry, category_label, framework });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toSimpleFormat(result.data)
  };
}

/**
 * Get metrics that use calculation models (compat layer)
 * Internally calls backend paginated API, auto-fetches all pages,
 * and converts to simple string array format
 *
 * Note: use unified /api/kg/metrics endpoint + calculationMethod parameter.
 * Legacy endpoint /api/kg/metrics/model-calculation is deprecated and will be removed on 2026-06-01.
 */
export async function getModelCalMetricsReq(industry: string, category: string, framework: string): Promise<Result<MetricRes>> {
  const result = await fetchAllPages<MetricBackendRes>("/api/kg/metrics", {
    industry,
    category,
    framework,
    calculationMethod: "calculation_model"  // only fetch metrics with calculation_model
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toSimpleFormat(result.data)
  };
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
  // Use PATCH /api/kg/metrics/:id to update the metric's model association

  return requestHelper(
    "PATCH",
    `/api/kg/metrics/${metric_label}`,
    { model }
  );
}

/**
 * Get metric calculation method information
 * Uses new KG API: GET /api/kg/metrics/:id/calculation-method
 *
 * @param metric_label metric identifier (label or IRI)
 * @returns detailed calculation method information
 */
export function getMetricComputationMethodReq(
  metric_label: string
): Promise<Result<MetricCalculationMethod>> {
  // KG API - goes to docker backend (port 3000)
  return requestHelper(
    "GET",
    `/api/kg/metrics/${metric_label}/calculation-method`
  );
}

/**
 * Backward-compat wrapper
 * Calls new API but returns legacy format so existing code can remain unchanged
 */
export async function getMetricComputationMethodReqCompat(
  metric_label: string
): Promise<Result<MetricMethod>> {
  const result = await getMetricComputationMethodReq(metric_label);

  if (!result.ok) {
    return result;
  }

  // Convert to legacy format
  const legacyFormat = convertToLegacyMetricMethod(result.data);

  return {
    ok: true,
    data: legacyFormat
  };
}


// ========================================================================= //
// ===================== REPORT GENERATION MICROSERVICE ==================== //
// ========================================================================= //
export function generateReportReq(fileType: string, data: ReportData) {
  return requestHelper<ReportGenRes>("POST", "/SAGE/report/generate", { fileType, data });
}
