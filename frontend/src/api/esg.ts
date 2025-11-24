import { requestHelper } from "./callout";
import type { Result } from "./callout";

// ========================================================================= //
// ===================== BACKEND RESPONSE TYPES (Internal) ================ //
// ========================================================================= //

/** 分页信息 */
interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
}

/** 带有 label 的 DTO 对象 */
interface LabeledDTO {
  iri?: string;
  label: string;
}

/** Framework 后端响应（分页格式） */
interface FrameworkBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

/** Category 后端响应（分页格式） */
interface CategoryBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

/** Metric 后端响应（分页格式） */
interface MetricBackendRes extends PaginationInfo {
  result: LabeledDTO[];
}

// ========================================================================= //
// ==================== FRONTEND RESPONSE TYPES (Public) ================== //
// ========================================================================= //

// Response Type - 前端使用的简单格式
export type CompanyInfoRes = { industry: string, company_name: string };
export type FrameworkRes = { result: string[] };  // 简单字符串数组
export type CategoryRes = { result: string[] };  // 简单字符串数组
export type MetricRes = { result: string[] };    // 简单字符串数组

// ========================================================================= //
// ========================== UTILITY FUNCTIONS ============================ //
// ========================================================================= //

/**
 * 提取分页响应中的 label 数组
 * @param response 分页响应对象
 * @returns label 字符串数组
 */
function extractLabels<T extends { result: LabeledDTO[] }>(response: T): string[] {
  return response.result.map(item => item.label);
}

/**
 * 将后端分页响应转换为前端简单格式
 */
function toSimpleFormat<T extends { result: LabeledDTO[] }>(backendResponse: T): { result: string[] } {
  return { result: extractLabels(backendResponse) };
}

/**
 * 自动翻页获取所有数据
 * @param endpoint API 端点路径
 * @param params 查询参数
 * @param pageSize 每页大小，默认 100
 * @returns Result 类型，成功时包含所有数据的聚合结果
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

    // 如果请求失败
    if (!backendResult.ok) {
      // 如果是第一页就失败，直接返回错误
      if (page === 1) {
        return backendResult;
      }
      // 如果不是第一页，可能是已经获取完所有数据，跳出循环
      break;
    }

    const currentPageItems = backendResult.data.result || [];
    allItems.push(...currentPageItems);

    // 保存 total 信息（如果有的话）
    if (backendResult.data.total !== undefined) {
      total = backendResult.data.total;
    }

    // 判断是否已获取所有数据
    // 1. 当前页数据为空
    // 2. 当前页数据少于 pageSize（最后一页）
    // 3. 如果有 total 信息，检查是否已达到总数
    if (
      currentPageItems.length === 0 ||
      currentPageItems.length < pageSize ||
      (total > 0 && allItems.length >= total)
    ) {
      break;
    }

    page++;

    // 安全限制：最多翻 100 页，避免无限循环
    if (page > 100) {
      console.warn(`fetchAllPages: Reached maximum page limit (100) for ${endpoint}`);
      break;
    }
  }

  // 返回聚合后的结果
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
 * 指标计算方法响应（新版 KG API）
 * 来自 GET /api/kg/metrics/:id/calculation-method
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
 * @deprecated 旧版类型，保留用于向后兼容
 * 请使用 MetricCalculationMethod 代替
 */
export type DirectMeasure = {
  measureMethod: "direct_measurement";
  obtainedFrom: string;
  source?: string;
};

/** 
 * @deprecated 旧版类型，保留用于向后兼容
 * 请使用 MetricCalculationMethod 代替
 */
export type CalcModel = {
  measureMethod: "calculation_model";
  isCalculatedBy: string;
  hasCalculationType: string;
  hasFormula?: string;
  requiresInputFrom: string[];
};

/** 
 * @deprecated 旧版类型，保留用于向后兼容
 * 请使用 MetricCalculationMethod 代替
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
 * 将新的 MetricCalculationMethod 格式转换为旧的 MetricMethod 格式
 * 用于向后兼容
 */
export function convertToLegacyMetricMethod(
  newFormat: MetricCalculationMethod
): MetricMethod {
  if (newFormat.calculation_method === 'direct_measurement') {
    // 从 data_sources 中提取第一个数据源
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
      requiresInputFrom: [], // 新 API 不直接返回输入指标列表
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
 * 获取报告框架列表（兼容层）
 * 内部调用后端分页 API，自动翻页获取所有数据，并转换为简单字符串数组格式
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
 * 获取分类列表（兼容层）
 * 内部调用后端分页 API，自动翻页获取所有数据，并转换为简单字符串数组格式
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
 * 获取指标列表（兼容层）
 * 内部调用后端分页 API，自动翻页获取所有数据，并转换为简单字符串数组格式
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
 * 获取模型计算指标列表（兼容层）
 * 内部调用后端分页 API，自动翻页获取所有数据，并转换为简单字符串数组格式
 * 
 * 注意：使用统一的 /api/kg/metrics 端点 + calculationMethod 参数
 * 原端点 /api/kg/metrics/model-calculation 已废弃，将在 2026-06-01 移除
 */
export async function getModelCalMetricsReq(industry: string, category: string, framework: string): Promise<Result<MetricRes>> {
  const result = await fetchAllPages<MetricBackendRes>("/api/kg/metrics", {
    industry,
    category,
    framework,
    calculationMethod: "calculation_model"  // 只获取 calculation_model 类型的指标
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
  // 使用 PATCH /api/kg/metrics/:id 端点更新指标的模型关联

  return requestHelper(
    "PATCH",
    `/api/kg/metrics/${metric_label}`,
    { model }
  );
}

/**
 * 获取指标的计算方法信息
 * 使用新的 KG API: GET /api/kg/metrics/:id/calculation-method
 * 
 * @param metric_label 指标标识符（label 或 IRI）
 * @returns 指标计算方法详细信息
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
 * 向后兼容包装函数
 * 调用新 API 但返回旧格式，使现有代码无需修改
 */
export async function getMetricComputationMethodReqCompat(
  metric_label: string
): Promise<Result<MetricMethod>> {
  const result = await getMetricComputationMethodReq(metric_label);

  if (!result.ok) {
    return result;
  }

  // 转换为旧格式
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
