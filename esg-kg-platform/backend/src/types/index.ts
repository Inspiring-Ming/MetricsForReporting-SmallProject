/**
 * Wizard 相关类型定义
 */

export interface Industry {
  iri?: string;
  label?: string;
  code?: string;
}

export interface Framework {
  iri?: string;
  label?: string;
  sourceDocument?: string;
  code?: string;
}

export interface Category {
  iri?: string;
  label?: string;
  code?: string;
}

export interface Metric {
  iri?: string;
  code: string;
  label: string;
  hasType: string;
  hasCalculationMethod: 'direct_measurement' | 'calculation_model';
  hasMetricType: string;
  hasUnit: string;
  hasDescription?: string;
}

export interface DataSource {
  iri?: string;
  label: string;
  fileName?: string;
  description?: string;
  coverage?: string;
  recordCount?: number;
}

export interface DatasetVariable {
  iri?: string;
  label: string;
  alignmentReason?: string;
  confidenceScore?: number;
  isUnitCompatible?: string;
  sources: DataSource[];
}

export interface Model {
  iri?: string;
  label: string;
  calculationType?: string;
  formula?: string;
  mathematicalExpression?: string;
  requiresInputFrom?: string[];
}

export interface Implementation {
  iri?: string;
  label?: string;
  language?: string;
  filePath?: string;
  func?: string;
  returnType?: string;
  validation?: string;
}

export interface WizardPayload {
  industry?: Industry;
  framework?: Framework;
  category?: Category;
  metric: Metric;
  datasetVariables?: DatasetVariable[];
  model?: Model;
  implementation?: Implementation;
  graph?: string;
}

/**
 * Triple 相关类型定义
 */
export interface Triple {
  s: string;
  p: string;
  o: string;
  oType?: 'iri' | 'literal';
}

export interface TripleResult {
  triples: Triple[];
  ttl: string;
}

/**
 * SPARQL 相关类型定义
 */
export interface SparqlQueryRequest {
  query: string;
  infer?: boolean;
  sameAs?: boolean;
}

/**
 * TTL 上传相关类型定义
 */
export interface TTLUploadRequest {
  ttl: string;
  graph?: string;
  baseUri?: string;
}

/**
 * SHACL 验证相关类型定义
 */
export interface ShaclValidationRequest {
  ttl: string;
  graph?: string;
}

export interface ShaclValidationResult {
  ok: boolean;
  graph?: string;
  report?: string;
  message?: string;
  raw?: string;
}

/**
 * GraphDB 仓库信息
 */
export interface Repository {
  id: string;
  title: string;
  uri: string;
  type: string;
  sesameType: string;
  location: string;
  readable: boolean;
  writable: boolean;
}