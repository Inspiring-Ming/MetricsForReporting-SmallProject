/**
 * Domain Layer - 领域层导出
 * 
 * 导出所有领域实体、值对象和错误类型
 */

// Entities (实体)
export * from './entities/Metric';
export * from './entities/Value';

// Value Objects (值对象)
export * from './value-objects/MetricCode';
export * from './value-objects/UnitIri';
export { SimpleValue } from './value-objects/Value';

// Domain Errors (领域错误)
export * from './errors/domain-errors';

// Type aliases for convenience
export type { Framework } from './value-objects/MetricCode';
export type { UnitType } from './value-objects/UnitIri';