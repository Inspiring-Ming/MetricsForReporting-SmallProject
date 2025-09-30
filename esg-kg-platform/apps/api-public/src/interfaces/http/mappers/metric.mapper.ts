/**
 * DTO Mappers for Metric operations
 * Maps between HTTP DTOs and Application DTOs
 */

import {
  MetricDto,
  CreateMetricRequest,
  MetricResponse,
  BatchMetricRequest,
  BatchMetricResponse,
  MetricQueryParams,
  PaginatedResponse,
  BaseResponse
} from '@esg-platform/dto';

import {
  HttpCreateMetricRequest,
  HttpBatchMetricRequest,
  HttpUpdateMetricRequest,
  HttpMetricQueryParams,
  HttpMetricResponse,
  HttpBatchMetricResponse,
  HttpPaginatedMetricResponse,
  HttpMetricValidationResponse,
  HttpSuccessResponse
} from '../dtos/http-metric.dto';

export class MetricDtoMapper {
  /**
   * Map HTTP create request to Application create request
   */
  static toCreateMetricRequest(httpRequest: HttpCreateMetricRequest): CreateMetricRequest {
    const result: CreateMetricRequest = {
      framework: httpRequest.framework,
      industry: httpRequest.industry,
      code: httpRequest.code,
      entityId: httpRequest.entityId,
      value: httpRequest.value,
      unitIri: httpRequest.unitIri,
      asOf: httpRequest.asOf,
      source: httpRequest.source
    };
    
    if (httpRequest.idempotencyKey) {
      result.idempotencyKey = httpRequest.idempotencyKey;
    }
    
    return result;
  }

  /**
   * Map HTTP batch request to Application batch request
   */
  static toBatchMetricRequest(httpRequest: HttpBatchMetricRequest): BatchMetricRequest {
    const result: BatchMetricRequest = {
      metrics: httpRequest.metrics.map(metric => this.toCreateMetricRequest(metric))
    };
    
    if (httpRequest.idempotencyKey) {
      result.idempotencyKey = httpRequest.idempotencyKey;
    }
    
    return result;
  }

  /**
   * Map HTTP update request to partial MetricDto
   */
  static toUpdateMetricRequest(httpRequest: HttpUpdateMetricRequest): Partial<MetricDto> {
    const result: Partial<MetricDto> = {};
    
    if (httpRequest.framework) result.framework = httpRequest.framework;
    if (httpRequest.industry) result.industry = httpRequest.industry;
    if (httpRequest.code) result.code = httpRequest.code;
    if (httpRequest.entityId) result.entityId = httpRequest.entityId;
    if (httpRequest.value !== undefined) result.value = httpRequest.value;
    if (httpRequest.unitIri) result.unitIri = httpRequest.unitIri;
    if (httpRequest.asOf) result.asOf = httpRequest.asOf;
    if (httpRequest.source) result.source = httpRequest.source;
    
    return result;
  }

  /**
   * Map HTTP query params to Application query params
   */
  static toMetricQueryParams(httpParams: HttpMetricQueryParams): MetricQueryParams {
    const result: MetricQueryParams = {};
    
    if (httpParams.framework) result.framework = httpParams.framework;
    if (httpParams.industry) result.industry = httpParams.industry;
    if (httpParams.entityId) result.entityId = httpParams.entityId;
    if (httpParams.code) result.code = httpParams.code;
    if (httpParams.fromDate) result.fromDate = httpParams.fromDate;
    if (httpParams.toDate) result.toDate = httpParams.toDate;
    if (httpParams.page) result.page = parseInt(httpParams.page, 10);
    if (httpParams.size) result.size = parseInt(httpParams.size, 10);
    
    return result;
  }

  /**
   * Map Application response to HTTP response
   */
  static toHttpMetricResponse(appResponse: MetricResponse): HttpMetricResponse {
    return {
      id: appResponse.id,
      framework: appResponse.framework,
      industry: appResponse.industry,
      code: appResponse.code,
      entityId: appResponse.entityId,
      value: appResponse.value,
      unitIri: appResponse.unitIri,
      asOf: appResponse.asOf,
      source: appResponse.source,
      createdAt: appResponse.createdAt,
      updatedAt: appResponse.updatedAt
    };
  }

  /**
   * Map Application batch response to HTTP batch response
   */
  static toHttpBatchMetricResponse(appResponse: BatchMetricResponse): HttpBatchMetricResponse {
    return {
      success: appResponse.success.map(metric => this.toHttpMetricResponse(metric)),
      failed: appResponse.failed
    };
  }

  /**
   * Map Application paginated response to HTTP paginated response
   */
  static toHttpPaginatedResponse(
    appResponse: PaginatedResponse<MetricResponse>
  ): HttpPaginatedMetricResponse {
    return {
      data: appResponse.data.map(metric => this.toHttpMetricResponse(metric)),
      pagination: appResponse.pagination,
      timestamp: appResponse.timestamp,
      status: appResponse.status
    };
  }

  /**
   * Map Application base response to HTTP success response
   */
  static toHttpSuccessResponse<T>(
    appResponse: BaseResponse<T>,
    transformer?: (data: T) => any
  ): HttpSuccessResponse<any> {
    return {
      data: transformer ? transformer(appResponse.data) : appResponse.data,
      timestamp: appResponse.timestamp,
      status: 'success'
    };
  }

  /**
   * Map Application validation response to HTTP validation response
   */
  static toHttpValidationResponse(
    appResponse: BaseResponse<{ valid: boolean; errors: string[] }>
  ): HttpMetricValidationResponse {
    return {
      valid: appResponse.data.valid,
      errors: appResponse.data.errors,
      timestamp: appResponse.timestamp,
      status: appResponse.status
    };
  }
}