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

import { MetricManagementPort } from '../ports/inbound/metric-management.port';
import { MetricRepositoryPort } from '../ports/outbound/metric-repository.port';
import { CachePort } from '../ports/outbound/cache.port';

/**
 * Metric Management Service Implementation
 * 
 * Clean Architecture Compliance:
 * ✅ Depends only on ports (abstractions), not infrastructure (concretions)
 * ✅ Contains pure business logic and orchestration
 * ✅ Uses correct DTO structure from @esg-platform/dto
 * ✅ Implements exact interface signatures from MetricManagementPort
 * 
 * Responsibilities:
 * - Validate business rules for metric operations
 * - Orchestrate metric CRUD operations through repository port
 * - Coordinate caching through cache port
 * - Generate consistent IDs through ID generator port
 */
export class MetricManagementService implements MetricManagementPort {
  constructor(
    private readonly metricRepository: MetricRepositoryPort,
    private readonly cache: CachePort
  ) {}

  async createMetric(request: CreateMetricRequest): Promise<BaseResponse<MetricResponse>> {
    try {
      const timestamp = new Date().toISOString();
      
      // Validate business rules
      const validationResult = this.validateCreateRequest(request);
      if (!validationResult.valid) {
        return {
          data: null as unknown as MetricResponse,
          timestamp,
          status: 'error'
        };
      }

      // Check for duplicates using business logic
      const existingMetric = await this.findDuplicateMetric(request);
      if (existingMetric) {
        return {
          data: null as unknown as MetricResponse,
          timestamp,
          status: 'error'
        };
      }

      // Delegate persistence to repository (repository will handle ID generation)
      const savedId = await this.metricRepository.save(request);

      // Clear related cache entries
      await this.invalidateRelatedCache(request);

      // Create response following DTO structure
      const response: MetricResponse = {
        ...request,
        id: savedId,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      return {
        data: response,
        timestamp,
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to create metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createMetricsBatch(request: BatchMetricRequest): Promise<BaseResponse<BatchMetricResponse>> {
    const timestamp = new Date().toISOString();
    const successResults: MetricResponse[] = [];
    const failedResults: BatchMetricResponse['failed'] = [];

    // Process each metric individually using business logic
    for (let i = 0; i < request.metrics.length; i++) {
      const metricRequest = request.metrics[i];
      
      if (!metricRequest) {
        failedResults.push({
          index: i,
          errors: [{
            field: 'general',
            code: 'INVALID_REQUEST',
            message: 'Metric request is null or undefined'
          }]
        });
        continue;
      }

      try {
        const result = await this.createMetric(metricRequest);
        if (result.status === 'success' && result.data) {
          successResults.push(result.data);
        } else {
          failedResults.push({
            index: i,
            errors: [{
              field: 'general',
              code: 'VALIDATION_FAILED',
              message: 'Metric validation failed'
            }]
          });
        }
      } catch (error) {
        failedResults.push({
          index: i,
          errors: [{
            field: 'general',
            code: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          }]
        });
      }
    }

    const batchResponse: BatchMetricResponse = {
      success: successResults,
      failed: failedResults
    };

    return {
      data: batchResponse,
      timestamp,
      status: 'success'
    };
  }

  async queryMetrics(params: MetricQueryParams): Promise<PaginatedResponse<MetricResponse>> {
    const timestamp = new Date().toISOString();
    
    try {
      // Check cache first for frequently accessed queries
      const cacheKey = this.buildCacheKey('metrics-query', params);
      const cached = await this.cache.get<{ metrics: MetricDto[]; totalCount: number }>(cacheKey);
      
      let metricsData: { metrics: MetricDto[]; totalCount: number };
      
      if (cached) {
        metricsData = cached;
      } else {
        // Delegate to repository
        metricsData = await this.metricRepository.findMany(params);
        
        // Cache the result for 5 minutes
        await this.cache.set(cacheKey, metricsData, 300);
      }

      // Convert DTOs to responses (add ID, timestamps)
      const metricResponses: MetricResponse[] = metricsData.metrics.map(dto => ({
        ...dto,
        id: this.generateIdFromDto(dto),
        createdAt: new Date().toISOString(), // Would come from repository in real implementation
        updatedAt: new Date().toISOString()
      }));

      return {
        data: metricResponses,
        timestamp,
        status: 'success',
        pagination: {
          page: params.page || 1,
          size: params.size || 10,
          total: metricsData.totalCount,
          hasNext: this.calculateHasNext(params, metricsData.totalCount)
        }
      };
    } catch (error) {
      throw new Error(`Failed to query metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMetricById(id: string): Promise<BaseResponse<MetricResponse>> {
    const timestamp = new Date().toISOString();
    
    try {
      // Try cache first
      const cacheKey = `metric:${id}`;
      const cached = await this.cache.get<MetricDto>(cacheKey);
      
      let metricDto: MetricDto | null;
      
      if (cached) {
        metricDto = cached;
      } else {
        // Delegate to repository
        metricDto = await this.metricRepository.findById(id);
        
        if (metricDto) {
          // Cache for 10 minutes
          await this.cache.set(cacheKey, metricDto, 600);
        }
      }

      if (!metricDto) {
        return {
          data: null as unknown as MetricResponse,
          timestamp,
          status: 'error'
        };
      }

      // Convert DTO to response
      const response: MetricResponse = {
        ...metricDto,
        id,
        createdAt: new Date().toISOString(), // Would come from repository
        updatedAt: new Date().toISOString()
      };

      return {
        data: response,
        timestamp,
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to get metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMetric(id: string, request: Partial<MetricDto>): Promise<BaseResponse<MetricResponse>> {
    const timestamp = new Date().toISOString();
    
    try {
      // Validate update request using business rules
      const validationResult = this.validateUpdateRequest(request);
      if (!validationResult.valid) {
        return {
          data: null as unknown as MetricResponse,
          timestamp,
          status: 'error'
        };
      }

      // Delegate to repository
      const success = await this.metricRepository.update(id, request);
      
      if (!success) {
        return {
          data: null as unknown as MetricResponse,
          timestamp,
          status: 'error'
        };
      }

      // Get updated metric
      const updatedMetric = await this.metricRepository.findById(id);
      
      if (!updatedMetric) {
        throw new Error('Failed to retrieve updated metric');
      }

      // Clear cache
      await this.cache.delete(`metric:${id}`);

      // Convert to response
      const response: MetricResponse = {
        ...updatedMetric,
        id,
        createdAt: new Date().toISOString(), // Would come from repository
        updatedAt: timestamp
      };

      return {
        data: response,
        timestamp,
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to update metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteMetric(id: string): Promise<BaseResponse<void>> {
    const timestamp = new Date().toISOString();
    
    try {
      const success = await this.metricRepository.delete(id);
      
      if (success) {
        // Clear cache
        await this.cache.delete(`metric:${id}`);
      }

      return {
        data: undefined,
        timestamp,
        status: success ? 'success' : 'error'
      };
    } catch (error) {
      throw new Error(`Failed to delete metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateMetric(metric: MetricDto): Promise<BaseResponse<{ valid: boolean; errors: string[] }>> {
    const timestamp = new Date().toISOString();
    
    try {
      const validationResult = this.validateMetricData(metric);
      
      return {
        data: {
          valid: validationResult.valid,
          errors: validationResult.errors
        },
        timestamp,
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to validate metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods containing pure business logic

  private validateCreateRequest(request: CreateMetricRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields according to DTO structure
    if (!request.framework || request.framework.trim() === '') {
      errors.push('Framework is required');
    }

    if (!request.industry || request.industry.trim() === '') {
      errors.push('Industry is required');
    }

    if (!request.code || request.code.trim() === '') {
      errors.push('Code is required');
    }

    if (!request.entityId || request.entityId.trim() === '') {
      errors.push('EntityId is required');
    }

    if (request.value === null || request.value === undefined) {
      errors.push('Value is required');
    }

    if (typeof request.value === 'number' && (isNaN(request.value) || !isFinite(request.value))) {
      errors.push('Value must be a valid number');
    }

    if (!request.unitIri || request.unitIri.trim() === '') {
      errors.push('UnitIri is required');
    }

    if (!request.asOf || request.asOf.trim() === '') {
      errors.push('AsOf date is required');
    }

    if (!request.source || request.source.trim() === '') {
      errors.push('Source is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateUpdateRequest(updates: Partial<MetricDto>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (updates.value !== undefined) {
      if (typeof updates.value === 'number' && (isNaN(updates.value) || !isFinite(updates.value))) {
        errors.push('Value must be a valid number');
      }
    }

    if (updates.framework !== undefined && (!updates.framework || updates.framework.trim() === '')) {
      errors.push('Framework cannot be empty');
    }

    if (updates.industry !== undefined && (!updates.industry || updates.industry.trim() === '')) {
      errors.push('Industry cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateMetricData(metric: MetricDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metric.framework) errors.push('Framework is required');
    if (!metric.industry) errors.push('Industry is required');
    if (!metric.code) errors.push('Code is required');
    if (!metric.entityId) errors.push('EntityId is required');
    if (metric.value === null || metric.value === undefined) errors.push('Value is required');
    if (!metric.unitIri) errors.push('UnitIri is required');
    if (!metric.asOf) errors.push('AsOf is required');
    if (!metric.source) errors.push('Source is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async findDuplicateMetric(request: CreateMetricRequest): Promise<MetricDto | null> {
    // Use repository to find potential duplicates based on business rules
    const queryParams: MetricQueryParams = {
      framework: request.framework,
      industry: request.industry,
      code: request.code,
      entityId: request.entityId,
      size: 1
    };

    const result = await this.metricRepository.findMany(queryParams);
    return result.metrics.length > 0 ? result.metrics[0] || null : null;
  }

  private async invalidateRelatedCache(request: CreateMetricRequest): Promise<void> {
    // Business logic for cache invalidation patterns
    const patterns = [
      `metrics-query:${request.framework}:${request.industry}`,
      `metrics-query:${request.framework}`,
      'metrics-query:all'
    ];

    for (const pattern of patterns) {
      try {
        await this.cache.delete(pattern);
      } catch (error) {
        // Silently continue if cache invalidation fails - this is not critical for business operations
        // In a production system, this would be handled by a proper logging service through a port
      }
    }
  }

  private buildCacheKey(prefix: string, params: MetricQueryParams): string {
    const keyParts = [prefix];
    
    if (params.framework) keyParts.push(`fw:${params.framework}`);
    if (params.industry) keyParts.push(`ind:${params.industry}`);
    if (params.code) keyParts.push(`code:${params.code}`);
    if (params.entityId) keyParts.push(`entity:${params.entityId}`);
    if (params.page) keyParts.push(`page:${params.page}`);
    if (params.size) keyParts.push(`size:${params.size}`);

    return keyParts.join(':');
  }

  private calculateHasNext(params: MetricQueryParams, totalCount: number): boolean {
    const page = params.page || 1;
    const size = params.size || 10;
    return (page * size) < totalCount;
  }

  private generateIdFromDto(dto: MetricDto): string {
    // Business logic to generate consistent ID from DTO properties
    const parts = [dto.framework, dto.industry, dto.code, dto.entityId, dto.asOf];
    return parts.join('::');
  }
}