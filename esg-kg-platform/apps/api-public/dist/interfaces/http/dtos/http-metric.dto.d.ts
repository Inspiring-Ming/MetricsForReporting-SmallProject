import { Framework } from '@esg-platform/dto';
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
export interface HttpMetricQueryParams {
    framework?: Framework;
    industry?: string;
    entityId?: string;
    code?: string;
    fromDate?: string;
    toDate?: string;
    page?: string;
    size?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
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
export interface HttpSuccessResponse<T = unknown> {
    data: T;
    timestamp: string;
    status: 'success';
}
//# sourceMappingURL=http-metric.dto.d.ts.map