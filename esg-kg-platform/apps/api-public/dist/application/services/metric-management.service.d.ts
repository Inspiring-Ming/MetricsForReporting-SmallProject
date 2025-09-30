import { MetricDto, CreateMetricRequest, MetricResponse, BatchMetricRequest, BatchMetricResponse, MetricQueryParams, PaginatedResponse, BaseResponse } from '@esg-platform/dto';
import { MetricManagementPort } from '../ports/inbound/metric-management.port';
import { MetricRepositoryPort } from '../ports/outbound/metric-repository.port';
import { CachePort } from '../ports/outbound/cache.port';
export declare class MetricManagementService implements MetricManagementPort {
    private readonly metricRepository;
    private readonly cache;
    constructor(metricRepository: MetricRepositoryPort, cache: CachePort);
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
    private validateCreateRequest;
    private validateUpdateRequest;
    private validateMetricData;
    private findDuplicateMetric;
    private invalidateRelatedCache;
    private buildCacheKey;
    private calculateHasNext;
    private generateIdFromDto;
}
//# sourceMappingURL=metric-management.service.d.ts.map