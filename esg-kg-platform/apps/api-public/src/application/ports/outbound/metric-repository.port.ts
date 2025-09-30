import { MetricDto, MetricQueryParams } from '@esg-platform/dto';

/**
 * Outbound port for metric data persistence
 * Defines the contract for storing and retrieving metric data
 */
export interface MetricRepositoryPort {
  /**
   * Save a single metric
   */
  save(metric: MetricDto): Promise<string>;

  /**
   * Save multiple metrics in batch
   */
  saveBatch(metrics: MetricDto[]): Promise<string[]>;

  /**
   * Find a metric by ID
   */
  findById(id: string): Promise<MetricDto | null>;

  /**
   * Query metrics with filtering and pagination
   */
  findMany(params: MetricQueryParams): Promise<{
    metrics: MetricDto[];
    totalCount: number;
  }>;

  /**
   * Update an existing metric
   */
  update(id: string, metric: Partial<MetricDto>): Promise<boolean>;

  /**
   * Delete a metric by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if a metric exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find metrics by entity ID and framework
   */
  findByEntityAndFramework(
    entityId: string,
    framework: string,
    fromDate?: string,
    toDate?: string
  ): Promise<MetricDto[]>;
}