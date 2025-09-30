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

/**
 * Inbound port for metric management operations
 * Defines the use cases for metric-related business logic
 */
export interface MetricManagementPort {
  /**
   * Create a single metric entry
   */
  createMetric(request: CreateMetricRequest): Promise<BaseResponse<MetricResponse>>;

  /**
   * Create multiple metrics in batch
   */
  createMetricsBatch(request: BatchMetricRequest): Promise<BaseResponse<BatchMetricResponse>>;

  /**
   * Query metrics with filtering and pagination
   */
  queryMetrics(params: MetricQueryParams): Promise<PaginatedResponse<MetricResponse>>;

  /**
   * Get a specific metric by ID
   */
  getMetricById(id: string): Promise<BaseResponse<MetricResponse>>;

  /**
   * Update an existing metric
   */
  updateMetric(id: string, request: Partial<MetricDto>): Promise<BaseResponse<MetricResponse>>;

  /**
   * Delete a metric by ID
   */
  deleteMetric(id: string): Promise<BaseResponse<void>>;

  /**
   * Validate metric data without persisting
   */
  validateMetric(metric: MetricDto): Promise<BaseResponse<{ valid: boolean; errors: string[] }>>;
}