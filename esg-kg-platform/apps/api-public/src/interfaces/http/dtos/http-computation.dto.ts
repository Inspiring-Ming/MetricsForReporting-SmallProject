/**
 * HTTP-specific DTOs for Computation operations
 */

import { Framework } from '@esg-platform/dto';

// HTTP Request DTOs for computation operations
export interface HttpComputationRequest {
  formula: string;
  inputs: Record<string, number>;
  framework: Framework;
  industry: string;
  entityId: string;
  asOf: string;
}

export interface HttpDiscoverMethodsRequest {
  metricCode: string;
  framework: Framework;
  industry: string;
  availableInputs?: string[];
}

// HTTP Response DTOs
export interface HttpComputationResponse {
  result: number;
  formula: string;
  inputs: Record<string, number>;
  metadata: {
    framework: Framework;
    industry: string;
    entityId: string;
    asOf: string;
    computedAt: string;
  };
}

export interface HttpComputationMethod {
  methodId: string;
  formula: string;
  requiredInputs: string[];
  description?: string;
  priority: number;
}

export interface HttpDiscoverMethodsResponse {
  methods: HttpComputationMethod[];
  metricCode: string;
  framework: Framework;
  industry: string;
}