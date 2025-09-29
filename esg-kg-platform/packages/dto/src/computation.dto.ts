import { Framework } from './common.dto';
import { MetricDto } from './metric.dto';

// Computation method definition from knowledge graph
export interface ComputationMethod {
  code: string;
  name: string;
  description: string;
  framework: Framework;
  industry: string;
  inputMetrics: InputMetricRequirement[];
  outputUnit: string;
  formula?: string;
  modelName?: string;
  implementedBy: 'platform' | 'external';
}

// Input metric requirement for computation models
export interface InputMetricRequirement {
  name: string;
  code?: string;
  dataType: 'number' | 'string' | 'boolean' | 'date';
  required: boolean;
  unit?: string;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: string[];
  };
}

// Request for computation execution
export interface ComputationRequest {
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  inputValues: Record<string, number>;
  asOf: string;
  source: string;
  idempotencyKey?: string;
}

// Computation execution result
export interface ComputationResult {
  computationId: string;
  value: number;
  unitIri: string;
  computedAt: string;
  method: {
    code: string;
    modelName: string;
    formula?: string;
    version?: string;
  };
  inputValues: Record<string, number>;
  generatedMetric?: MetricDto;
  duration: number;
}

export interface ComputationResponse extends ComputationResult {
  id: string;
  entityId: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

export interface ComputationJobRequest {
  computations: ComputationRequest[];
  batchId?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface ComputationJobResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total: number;
  completed: number;
  failed: number;
  results: ComputationResponse[];
  createdAt: string;
  completedAt?: string;
}

// HTTP response wrapper used by Public API /public/v1/compute
// Matches docs: { success: boolean, result: ComputationResult }
export interface PublicComputationHttpResponse {
  success: boolean;
  result: ComputationResult;
}

// HTTP response for Internal API list of computation methods
export interface ComputationMethodsListResponse {
  items: ComputationMethod[];
  total: number;
}

// Unit mappings between TTL text and QUDT IRIs
export const UNIT_MAPPINGS = {
  "Gigajoules (GJ)": "http://qudt.org/vocab/unit/GJ",
  "Metric tonnes (t) CO₂-e": "http://qudt.org/vocab/unit/TNE_CO2e",
  "Cubic meters (m³)": "http://qudt.org/vocab/unit/M3",
  "Metric tonnes (t)": "http://qudt.org/vocab/unit/TNE",
  "Percentage (%)": "http://qudt.org/vocab/unit/PERCENT",
  "tons CO2e per million USD": "http://qudt.org/vocab/unit/TNE_CO2e-PER-1E6_USD",
  "million USD": "http://qudt.org/vocab/unit/1E6_USD",
  "tons CO2e": "http://qudt.org/vocab/unit/TNE_CO2e",
  "Number": "http://qudt.org/vocab/unit/NUM",
  "n/a": "http://qudt.org/vocab/unit/UNITLESS",
} as const;

export type UnitText = keyof typeof UNIT_MAPPINGS;
export type UnitIRI = typeof UNIT_MAPPINGS[UnitText];
