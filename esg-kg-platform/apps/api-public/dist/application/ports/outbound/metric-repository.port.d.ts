import { MetricDto, MetricQueryParams } from '@esg-platform/dto';
export interface MetricRepositoryPort {
    save(metric: MetricDto): Promise<string>;
    saveBatch(metrics: MetricDto[]): Promise<string[]>;
    findById(id: string): Promise<MetricDto | null>;
    findMany(params: MetricQueryParams): Promise<{
        metrics: MetricDto[];
        totalCount: number;
    }>;
    update(id: string, metric: Partial<MetricDto>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    findByEntityAndFramework(entityId: string, framework: string, fromDate?: string, toDate?: string): Promise<MetricDto[]>;
}
//# sourceMappingURL=metric-repository.port.d.ts.map