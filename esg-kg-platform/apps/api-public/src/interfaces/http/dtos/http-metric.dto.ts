/**
 * HTTP-specific DTOs for Metric operations
 * These DTOs handle HTTP request/response serialization and basic validation
 */

import { Framework } from '@esg-platform/dto';

// HTTP Request DTOs - focused on serialization and basic validation
export interface HttpCreateMetricRequest {
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  value: number;
  unitIri: string;
  asOf: string;
  source: string;
  idempotencyKey?: string;
}

export interface HttpBatchMetricRequest {
  metrics: HttpCreateMetricRequest[];
  idempotencyKey?: string;
}

export interface HttpUpdateMetricRequest {
  framework?: Framework;
  industry?: string;
  code?: string;
  entityId?: string;
  value?: number;
  unitIri?: string;
  asOf?: string;
  source?: string;
}

// HTTP Query Parameters - URL/Query string specific
export interface HttpMetricQueryParams {
  framework?: Framework;
  industry?: string;
  entityId?: string;
  code?: string;
  fromDate?: string;
  toDate?: string;
  page?: string;  // String from query params, will be parsed
  size?: string;  // String from query params, will be parsed
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// HTTP Response DTOs - JSON serialization focused
export interface HttpMetricResponse {
  id: string;
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  value: number;
  unitIri: string;
  asOf: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface HttpBatchMetricResponse {
  success: HttpMetricResponse[];
  failed: Array<{
    index: number;
    errors: Array<{
      field: string;
      code: string;
      message: string;
    }>;
  }>;
}

export interface HttpPaginatedMetricResponse {
  data: HttpMetricResponse[];
  pagination: {
    page: number;
    size: number;
    total: number;
    hasNext: boolean;
  };
  timestamp: string;
  status: 'success' | 'error';
}

export interface HttpMetricValidationResponse {
  valid: boolean;
  errors: string[];
  timestamp: string;
  status: 'success' | 'error';
}

// HTTP Error responses
export interface HttpErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  timestamp: string;
}

// Standard HTTP response wrapper
export interface HttpSuccessResponse<T = unknown> {
  data: T;
  timestamp: string;
  status: 'success';
}