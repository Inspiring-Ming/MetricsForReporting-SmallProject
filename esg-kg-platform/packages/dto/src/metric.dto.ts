import { Framework } from './common.dto';

// Core metric DTO - Direct measurement only (aligns with SHACL constraints)
export interface MetricDto {
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  value: number;
  unitIri: string;
  asOf: string;
  source: string;
}

// Request DTO for direct measurement ingestion
export interface CreateMetricRequest extends MetricDto {
  idempotencyKey?: string;
}

export interface MetricResponse extends MetricDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchMetricRequest {
  metrics: CreateMetricRequest[];
  idempotencyKey?: string;
}

export interface BatchMetricResponse {
  success: MetricResponse[];
  failed: Array<{
    index: number;
    errors: Array<{
      field: string;
      code: string;
      message: string;
    }>;
  }>;
}

export interface MetricQueryParams {
  framework?: Framework;
  industry?: string;
  entityId?: string;
  code?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

// Validation result for metric data
export interface MetricValidationResult {
  valid: boolean;
  errors: Array<{
    field: keyof MetricDto;
    code: string;
    message: string;
  }>;
}

// Validation patterns matching SHACL constraints
export const VALIDATION_PATTERNS = {
  INDUSTRY: /^[A-Za-z0-9\s\-_]+$/,
  CODE: /^[A-Za-z0-9\-._]+$/,
  ENTITY_ID: /^[A-Za-z0-9\-._]+$/,
  UNIT_IRI: /^https?:\/\//,
} as const;

// Framework-specific code patterns
export const FRAMEWORK_CODE_PATTERNS = {
  SASB: /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\.[0-9]+$/,
  GRI: /^[0-9]{3}-[0-9]+$/,
} as const;
