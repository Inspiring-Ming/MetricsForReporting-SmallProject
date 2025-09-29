export type Framework = 'SASB' | 'GRI' | 'TCFD' | 'EU_TAXONOMY' | 'CSRD';

export interface BaseResponse<T = unknown> {
  data: T;
  timestamp: string;
  status: 'success' | 'error';
}

export interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ValidationErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors: ErrorDetail[];
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number;
    size: number;
    total: number;
    hasNext: boolean;
  };
}

export interface IdempotencyKey {
  key: string;
  expiresAt: string;
}
