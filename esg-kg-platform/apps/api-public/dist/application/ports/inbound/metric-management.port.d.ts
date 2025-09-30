import { MetricDto, CreateMetricRequest, MetricResponse, BatchMetricRequest, BatchMetricResponse, MetricQueryParams, PaginatedResponse, BaseResponse } from '@esg-platform/dto';
export interface MetricManagementPort {
    createMetric(request: CreateMetricRequest): Promise<BaseResponse<MetricResponse>>;
    createMetricsBatch(request: BatchMetricRequest): Promise<BaseResponse<BatchMetricResponse>>;
    queryMetrics(params: MetricQueryParams): Promise<PaginatedResponse<MetricResponse>>;
    getMetricById(id: string): Promise<BaseResponse<MetricResponse>>;
    updateMetric(id: string, request: Partial<MetricDto>): Promise<BaseResponse<MetricResponse>>;
    deleteMetric(id: string): Promise<BaseResponse<void>>;
    validateMetric(metric: MetricDto): Promise<BaseResponse<{
        valid: boolean;
        errors: string[];
    }>>;
}
//# sourceMappingURL=metric-management.port.d.ts.map