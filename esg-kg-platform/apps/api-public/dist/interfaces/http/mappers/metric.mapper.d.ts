import { MetricDto, CreateMetricRequest, MetricResponse, BatchMetricRequest, BatchMetricResponse, MetricQueryParams, PaginatedResponse, BaseResponse } from '@esg-platform/dto';
import { HttpCreateMetricRequest, HttpBatchMetricRequest, HttpUpdateMetricRequest, HttpMetricQueryParams, HttpMetricResponse, HttpBatchMetricResponse, HttpPaginatedMetricResponse, HttpMetricValidationResponse, HttpSuccessResponse } from '../dtos/http-metric.dto';
export declare class MetricDtoMapper {
    static toCreateMetricRequest(httpRequest: HttpCreateMetricRequest): CreateMetricRequest;
    static toBatchMetricRequest(httpRequest: HttpBatchMetricRequest): BatchMetricRequest;
    static toUpdateMetricRequest(httpRequest: HttpUpdateMetricRequest): Partial<MetricDto>;
    static toMetricQueryParams(httpParams: HttpMetricQueryParams): MetricQueryParams;
    static toHttpMetricResponse(appResponse: MetricResponse): HttpMetricResponse;
    static toHttpBatchMetricResponse(appResponse: BatchMetricResponse): HttpBatchMetricResponse;
    static toHttpPaginatedResponse(appResponse: PaginatedResponse<MetricResponse>): HttpPaginatedMetricResponse;
    static toHttpSuccessResponse<T>(appResponse: BaseResponse<T>, transformer?: (data: T) => any): HttpSuccessResponse<any>;
    static toHttpValidationResponse(appResponse: BaseResponse<{
        valid: boolean;
        errors: string[];
    }>): HttpMetricValidationResponse;
}
//# sourceMappingURL=metric.mapper.d.ts.map