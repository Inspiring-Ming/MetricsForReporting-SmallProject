export declare enum StatusCodes {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503
}
export interface ErrorDetails {
    field?: string;
    code?: string;
    message?: string;
    [key: string]: any;
}
export declare abstract class DomainError extends Error {
    readonly details?: (ErrorDetails | ErrorDetails[]) | undefined;
    readonly cause?: Error | undefined;
    abstract readonly code: string;
    abstract readonly statusCode: StatusCodes;
    constructor(message: string, details?: (ErrorDetails | ErrorDetails[]) | undefined, cause?: Error | undefined);
}
export declare class ValidationError extends DomainError {
    readonly code = "VALIDATION_ERROR";
    readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}
export declare class MetricValidationError extends DomainError {
    readonly code = "METRIC_VALIDATION_ERROR";
    readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}
export declare class SchemaValidationError extends DomainError {
    readonly code = "SCHEMA_VALIDATION_ERROR";
    readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    constructor(field: string, expectedType: string, receivedValue: any, cause?: Error);
}
export declare class MetricNotFoundError extends DomainError {
    readonly code = "METRIC_NOT_FOUND";
    readonly statusCode = StatusCodes.NOT_FOUND;
    constructor(metricId: string, cause?: Error);
}
export declare class DuplicateMetricError extends DomainError {
    readonly code = "DUPLICATE_METRIC";
    readonly statusCode = StatusCodes.CONFLICT;
    constructor(framework: string, industry: string, code: string, entityId: string, asOf: string, cause?: Error);
}
export declare class ComputationMethodNotFoundError extends DomainError {
    readonly code = "COMPUTATION_METHOD_NOT_FOUND";
    readonly statusCode = StatusCodes.NOT_FOUND;
    constructor(code: string, framework: string, industry: string, cause?: Error);
}
export declare class ComputationFailedError extends DomainError {
    readonly code = "COMPUTATION_FAILED";
    readonly statusCode = StatusCodes.BAD_REQUEST;
    constructor(computationCode: string, reason: string, cause?: Error);
}
export declare class GraphDbConnectionError extends DomainError {
    readonly code = "GRAPHDB_CONNECTION_ERROR";
    readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    constructor(endpoint: string, cause?: Error);
}
export declare class GraphDbQueryError extends DomainError {
    readonly code = "GRAPHDB_QUERY_ERROR";
    readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    constructor(query: string, reason: string, cause?: Error);
}
export declare class RateLimitExceededError extends DomainError {
    readonly code = "RATE_LIMIT_EXCEEDED";
    readonly statusCode = StatusCodes.TOO_MANY_REQUESTS;
    constructor(limit: number, windowMs: number, cause?: Error);
}
export declare class BadRequestError extends DomainError {
    readonly code = "BAD_REQUEST";
    readonly statusCode = StatusCodes.BAD_REQUEST;
}
export declare class UnauthorizedError extends DomainError {
    readonly code = "UNAUTHORIZED";
    readonly statusCode = StatusCodes.UNAUTHORIZED;
    constructor(message?: string, cause?: Error);
}
export declare class ForbiddenError extends DomainError {
    readonly code = "FORBIDDEN";
    readonly statusCode = StatusCodes.FORBIDDEN;
    constructor(message?: string, cause?: Error);
}
export declare class InternalServerError extends DomainError {
    readonly code = "INTERNAL_SERVER_ERROR";
    readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    constructor(message?: string, cause?: Error);
}
//# sourceMappingURL=domain-errors.d.ts.map