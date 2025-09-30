export enum StatusCodes {
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

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: StatusCodes;
  
  constructor(
    message: string, 
    public readonly details?: ErrorDetails | ErrorDetails[],
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Validation Errors
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}

export class MetricValidationError extends DomainError {
  readonly code = 'METRIC_VALIDATION_ERROR';
  readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}

export class SchemaValidationError extends DomainError {
  readonly code = 'SCHEMA_VALIDATION_ERROR';
  readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;

  constructor(field: string, expectedType: string, receivedValue: any, cause?: Error) {
    super(
      `Schema validation failed for field '${field}'`,
      {
        field,
        code: 'INVALID_TYPE',
        message: `Expected ${expectedType}, received ${typeof receivedValue}`
      },
      cause
    );
  }
}

// Business Logic Errors
export class MetricNotFoundError extends DomainError {
  readonly code = 'METRIC_NOT_FOUND';
  readonly statusCode = StatusCodes.NOT_FOUND;

  constructor(metricId: string, cause?: Error) {
    super(`Metric with ID '${metricId}' not found`, { metricId }, cause);
  }
}

export class DuplicateMetricError extends DomainError {
  readonly code = 'DUPLICATE_METRIC';
  readonly statusCode = StatusCodes.CONFLICT;

  constructor(
    framework: string, 
    industry: string, 
    code: string, 
    entityId: string, 
    asOf: string,
    cause?: Error
  ) {
    super(
      `Metric already exists for ${framework}/${industry}/${code}/${entityId} at ${asOf}`, 
      { framework, industry, code, entityId, asOf },
      cause
    );
  }
}

export class ComputationMethodNotFoundError extends DomainError {
  readonly code = 'COMPUTATION_METHOD_NOT_FOUND';
  readonly statusCode = StatusCodes.NOT_FOUND;

  constructor(code: string, framework: string, industry: string, cause?: Error) {
    super(
      `Computation method '${code}' not found for ${framework}/${industry}`, 
      { code, framework, industry },
      cause
    );
  }
}

export class ComputationFailedError extends DomainError {
  readonly code = 'COMPUTATION_FAILED';
  readonly statusCode = StatusCodes.BAD_REQUEST;

  constructor(computationCode: string, reason: string, cause?: Error) {
    super(
      `Computation '${computationCode}' failed: ${reason}`, 
      { computationCode, reason },
      cause
    );
  }
}

// Infrastructure Errors
export class GraphDbConnectionError extends DomainError {
  readonly code = 'GRAPHDB_CONNECTION_ERROR';
  readonly statusCode = StatusCodes.SERVICE_UNAVAILABLE;

  constructor(endpoint: string, cause?: Error) {
    super(`Failed to connect to GraphDB at ${endpoint}`, { endpoint }, cause);
  }
}

export class GraphDbQueryError extends DomainError {
  readonly code = 'GRAPHDB_QUERY_ERROR';
  readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  constructor(query: string, reason: string, cause?: Error) {
    super(`GraphDB query failed: ${reason}`, { query, reason }, cause);
  }
}

// Rate Limiting
export class RateLimitExceededError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = StatusCodes.TOO_MANY_REQUESTS;

  constructor(limit: number, windowMs: number, cause?: Error) {
    super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, { limit, windowMs }, cause);
  }
}

// Generic HTTP Errors
export class BadRequestError extends DomainError {
  readonly code = 'BAD_REQUEST';
  readonly statusCode = StatusCodes.BAD_REQUEST;
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = StatusCodes.UNAUTHORIZED;

  constructor(message = 'Unauthorized access', cause?: Error) {
    super(message, undefined, cause);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = StatusCodes.FORBIDDEN;

  constructor(message = 'Access forbidden', cause?: Error) {
    super(message, undefined, cause);
  }
}

export class InternalServerError extends DomainError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  constructor(message = 'Internal server error', cause?: Error) {
    super(message, undefined, cause);
  }
}