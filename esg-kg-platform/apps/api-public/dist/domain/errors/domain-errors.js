export var StatusCodes;
(function (StatusCodes) {
    StatusCodes[StatusCodes["OK"] = 200] = "OK";
    StatusCodes[StatusCodes["CREATED"] = 201] = "CREATED";
    StatusCodes[StatusCodes["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    StatusCodes[StatusCodes["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    StatusCodes[StatusCodes["FORBIDDEN"] = 403] = "FORBIDDEN";
    StatusCodes[StatusCodes["NOT_FOUND"] = 404] = "NOT_FOUND";
    StatusCodes[StatusCodes["CONFLICT"] = 409] = "CONFLICT";
    StatusCodes[StatusCodes["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    StatusCodes[StatusCodes["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    StatusCodes[StatusCodes["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    StatusCodes[StatusCodes["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(StatusCodes || (StatusCodes = {}));
export class DomainError extends Error {
    details;
    cause;
    constructor(message, details, cause) {
        super(message);
        this.details = details;
        this.cause = cause;
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export class ValidationError extends DomainError {
    code = 'VALIDATION_ERROR';
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}
export class MetricValidationError extends DomainError {
    code = 'METRIC_VALIDATION_ERROR';
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}
export class SchemaValidationError extends DomainError {
    code = 'SCHEMA_VALIDATION_ERROR';
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    constructor(field, expectedType, receivedValue, cause) {
        super(`Schema validation failed for field '${field}'`, {
            field,
            code: 'INVALID_TYPE',
            message: `Expected ${expectedType}, received ${typeof receivedValue}`
        }, cause);
    }
}
export class MetricNotFoundError extends DomainError {
    code = 'METRIC_NOT_FOUND';
    statusCode = StatusCodes.NOT_FOUND;
    constructor(metricId, cause) {
        super(`Metric with ID '${metricId}' not found`, { metricId }, cause);
    }
}
export class DuplicateMetricError extends DomainError {
    code = 'DUPLICATE_METRIC';
    statusCode = StatusCodes.CONFLICT;
    constructor(framework, industry, code, entityId, asOf, cause) {
        super(`Metric already exists for ${framework}/${industry}/${code}/${entityId} at ${asOf}`, { framework, industry, code, entityId, asOf }, cause);
    }
}
export class ComputationMethodNotFoundError extends DomainError {
    code = 'COMPUTATION_METHOD_NOT_FOUND';
    statusCode = StatusCodes.NOT_FOUND;
    constructor(code, framework, industry, cause) {
        super(`Computation method '${code}' not found for ${framework}/${industry}`, { code, framework, industry }, cause);
    }
}
export class ComputationFailedError extends DomainError {
    code = 'COMPUTATION_FAILED';
    statusCode = StatusCodes.BAD_REQUEST;
    constructor(computationCode, reason, cause) {
        super(`Computation '${computationCode}' failed: ${reason}`, { computationCode, reason }, cause);
    }
}
export class GraphDbConnectionError extends DomainError {
    code = 'GRAPHDB_CONNECTION_ERROR';
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    constructor(endpoint, cause) {
        super(`Failed to connect to GraphDB at ${endpoint}`, { endpoint }, cause);
    }
}
export class GraphDbQueryError extends DomainError {
    code = 'GRAPHDB_QUERY_ERROR';
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    constructor(query, reason, cause) {
        super(`GraphDB query failed: ${reason}`, { query, reason }, cause);
    }
}
export class RateLimitExceededError extends DomainError {
    code = 'RATE_LIMIT_EXCEEDED';
    statusCode = StatusCodes.TOO_MANY_REQUESTS;
    constructor(limit, windowMs, cause) {
        super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, { limit, windowMs }, cause);
    }
}
export class BadRequestError extends DomainError {
    code = 'BAD_REQUEST';
    statusCode = StatusCodes.BAD_REQUEST;
}
export class UnauthorizedError extends DomainError {
    code = 'UNAUTHORIZED';
    statusCode = StatusCodes.UNAUTHORIZED;
    constructor(message = 'Unauthorized access', cause) {
        super(message, undefined, cause);
    }
}
export class ForbiddenError extends DomainError {
    code = 'FORBIDDEN';
    statusCode = StatusCodes.FORBIDDEN;
    constructor(message = 'Access forbidden', cause) {
        super(message, undefined, cause);
    }
}
export class InternalServerError extends DomainError {
    code = 'INTERNAL_SERVER_ERROR';
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    constructor(message = 'Internal server error', cause) {
        super(message, undefined, cause);
    }
}
//# sourceMappingURL=domain-errors.js.map