import { requestHelper } from "./callout";
import type { Result } from "./callout";

// ========================================================================= //
// ===================== BACKEND RESPONSE TYPES (Internal) ================ //
// ========================================================================= //

/** Pagination info */
interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
}

/** DTO object with label */
interface LabeledDTO {
  iri?: string;
  label: string;
}

/** Framework backend response (pagination format) */
interface FrameworkBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

/** Category backend response (pagination format) */
interface CategoryBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

/** Metric backend response (pagination format) */
interface MetricBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

// ========================================================================= //
// ==================== FRONTEND RESPONSE TYPES (Public) ================== //
// ========================================================================= //

// Response Type - Simple format used by frontend
export type CompanyInfoRes = { industry: string, company_name: string };
export type FrameworkRes = { result: string[] };  // Simple string array
export type CategoryRes = { result: string[] };  // Simple string array
export type MetricRes = { result: string[] };    // Simple string array

// ========================================================================= //
// ========================== UTILITY FUNCTIONS ============================ //
// ========================================================================= //

/**
 * Extract label array from pagination response
 * @param response Pagination response object
 * @returns label string array
 */
function extractLabels<T extends { result: LabeledDTO[] }>(response: T): string[] {
  return response.result.map(item => item.label);
}

/**
 * Convert backend pagination response to frontend simple format
 */
function toSimpleFormat<T extends { result: LabeledDTO[] }>(backendResponse: T): { result: string[] } {
  return { result: extractLabels(backendResponse) };
}

/**
 * Automatically fetch all pages of data
 * @param endpoint API endpoint path
 * @param params Query parameters
 * @param pageSize Page size, default 100
 * @returns Result type, containing aggregated result of all data on success
 */
async function fetchAllPages<T extends PaginationInfo & { result: LabeledDTO[] }>(
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
      // If it's the first page and failed, return error directly
      if (page === 1) {
        return backendResult;
      }
      // If not the first page, assume all data fetched, break loop
      break;
    }

    const currentPageItems = backendResult.data.result || [];
    allItems.push(...currentPageItems);

    // Save total info (if available)
    if (backendResult.data.total !== undefined) {
      total = backendResult.data.total;
    }

    // Check if all data fetched
    // 1. Current page data is empty
    // 2. Current page data less than pageSize (last page)
    // 3. If total info exists, check if total reached
    if (
      currentPageItems.length === 0 ||
      currentPageItems.length < pageSize ||
      (total > 0 && allItems.length >= total)
    ) {
      break;
    }

    page++;

    // Safety limit: max 100 pages to avoid infinite loop
    if (page > 100) {
      console.warn(`fetchAllPages: Reached maximum page limit (100) for ${endpoint}`);
      break;
    }
  }

  // Return aggregated result
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
 * Metric calculation method response (New KG API)
 * From GET /api/kg/metrics/:id/calculation-method
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
 * @deprecated Legacy type, kept for backward compatibility
 * Please use MetricCalculationMethod instead
 */
export type DirectMeasure = {
  measureMethod: "direct_measurement";
  obtainedFrom: string;
  source?: string;
};

/** 
 * @deprecated Legacy type, kept for backward compatibility
 * Please use MetricCalculationMethod instead
 */
export type CalcModel = {
  measureMethod: "calculation_model";
  isCalculatedBy: string;
  hasCalculationType: string;
  hasFormula?: string;
  requiresInputFrom: string[];
};

/** 
 * @deprecated Legacy type, kept for backward compatibility
 * Please use MetricCalculationMethod instead
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
 * For backward compatibility
 */
export function convertToLegacyMetricMethod(
  newFormat: MetricCalculationMethod
): MetricMethod {
  if (newFormat.calculation_method === 'direct_measurement') {
    // Extract first data source from data_sources
    const firstDataSource = newFormat.data_sources?.[0];
    
    // Use obtainedFrom from attributes (DatasetVariable label) for DynamoDB queries
    // This is the correct metric_name to use when querying DynamoDB
    const obtainedFrom = newFormat.attributes?.obtainedFrom 
      || firstDataSource?.dataSourceID 
      || newFormat.metric_label;
    
    // Try to get source information from multiple places:
    // 1. First check data_sources array (preferred)
    // 2. Fall back to description if fileName unavailable
    // 3. If neither exists, source will be undefined and we'll need to fetch it dynamically
    const source = firstDataSource?.fileName 
      || firstDataSource?.description 
      || undefined;
    
    return {
      measureMethod: 'direct_measurement',
      obtainedFrom: obtainedFrom,
      source: source,
    };
  } else {
    // calculation_model
    // TEMPORARY FIX: hardcoded path for testing
    // should be: newFormat.implementation?.filePath
    const calculationType = "models/percentage_ratio.py";
    
    return {
      measureMethod: 'calculation_model',
      isCalculatedBy: newFormat.model?.label || newFormat.model?.iri || '',
      hasCalculationType: calculationType,
      hasFormula: newFormat.model?.formula,
      requiresInputFrom: [], // Will be populated by getMetricComputationMethodReqCompat from /inputs endpoint
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

/**
 * Get report framework list (Compatibility layer)
 * Internally calls backend pagination API, automatically fetches all pages, and converts to simple string array format
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
 * Get category list (Compatibility layer)
 * Internally calls backend pagination API, automatically fetches all pages, and converts to simple string array format
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
 * Get metric list (Compatibility layer)
 * Internally calls backend pagination API, automatically fetches all pages, and converts to simple string array format
 */
export async function getMetricsReq(industry: string, category: string, framework: string): Promise<Result<MetricRes>> {
  const result = await fetchAllPages<MetricBackendRes>("/api/kg/metrics", { industry, category, framework });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toSimpleFormat(result.data)
  };
}

/**
 * Get model calculation metric list (Compatibility layer)
 * Internally calls backend pagination API, automatically fetches all pages, and converts to simple string array format
 * 
 * Note: Uses unified /api/kg/metrics endpoint + calculationMethod parameter
 * Original endpoint /api/kg/metrics/model-calculation is deprecated, will be removed on 2026-06-01
 */
export async function getModelCalMetricsReq(industry: string, category: string, framework: string): Promise<Result<MetricRes>> {
  const result = await fetchAllPages<MetricBackendRes>("/api/kg/metrics", {
    industry,
    category,
    framework,
    calculationMethod: "calculation_model"  // Only fetch metrics of type calculation_model
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
  // Use PATCH /api/kg/metrics/:id endpoint to update metric model association

  return requestHelper(
    "PATCH",
    `/api/kg/metrics/${metric_label}`,
    { model }
  );
}

/**
 * Get metric calculation method information
 * Use new KG API: GET /api/kg/metrics/:id/calculation-method
 * 
 * @param metric_label Metric identifier (label or IRI)
 * @returns Metric calculation method details
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
 * Response type for GET /api/kg/metrics/:id/inputs
 */
interface MetricInputsResponse {
  metricId: string;
  metricLabel: string;
  calculationMethod: 'direct_measurement' | 'calculation_model';
  inputs: Array<{
    iri: string;
    label?: string;
    hasCalculationMethod?: 'direct_measurement' | 'calculation_model';
    hasUnit?: string;
  }>;
  total: number;
}

/**
 * Fetch input metrics for a calculation model metric
 * @param metric_label Metric identifier
 * @returns Array of input metric labels, empty array on failure
 */
async function fetchInputMetrics(metric_label: string): Promise<string[]> {
  try {
    const result = await requestHelper<MetricInputsResponse>(
      "GET",
      `/api/kg/metrics/${metric_label}/inputs`
    );

    if (!result.ok || !result.data.inputs) {
      return [];
    }

    // Extract labels from inputs, fallback to IRI if label missing
    return result.data.inputs.map(input => input.label || input.iri);
  } catch (error) {
    console.warn(`Failed to fetch input metrics for "${metric_label}":`, error);
    return [];
  }
}

/**
 * Backward compatibility wrapper function
 * Converts new KG API response to legacy format for existing code
 * 
 * For calculation_model metrics, automatically fetches input metrics from /inputs endpoint
 * 
 * @param metric_label Metric identifier (label or IRI)
 * @returns Legacy format MetricMethod with populated requiresInputFrom for calculation models
 */
export async function getMetricComputationMethodReqCompat(
  metric_label: string
): Promise<Result<MetricMethod>> {
  // Fetch calculation method details
  const result = await getMetricComputationMethodReq(metric_label);

  if (!result.ok) {
    return result;
  }

  // Convert to legacy format
  const legacyFormat = convertToLegacyMetricMethod(result.data);

  // Enhance calculation model with input metrics
  if (legacyFormat.measureMethod === 'calculation_model') {
    legacyFormat.requiresInputFrom = await fetchInputMetrics(metric_label);
  }

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
