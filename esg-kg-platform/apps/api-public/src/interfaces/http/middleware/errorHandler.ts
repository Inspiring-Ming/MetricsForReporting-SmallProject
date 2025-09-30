/**
 * Error Handler Middleware - HTTP error mapping and response standardization
 * 
 * Maps business/domain errors to HTTP status codes and standardized error responses
 */

import { Request, Response, NextFunction } from 'express';
import { HttpErrorResponse } from '../dtos';

/**
 * Domain error types that can be thrown by application services
 */
interface DomainError extends Error {
  code: string;
  statusCode?: number;
}

/**
 * Error handler middleware
 * Maps domain errors to HTTP responses with proper status codes
 */
export function errorHandler(
  error: Error | DomainError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Extract error information
  const isDomainError = 'code' in error;
  const statusCode = isDomainError ? 
    (error as DomainError).statusCode || mapErrorCodeToStatus((error as DomainError).code) : 
    500;

  const errorResponse: HttpErrorResponse = {
    type: isDomainError ? (error as DomainError).code : 'internal_server_error',
    title: getErrorTitle(statusCode),
    status: statusCode,
    detail: error.message || 'An unexpected error occurred',
    instance: req.path,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (req.app.get('config')?.nodeEnv === 'development') {
    (errorResponse as any).stack = error.stack;
  }

  // Log error for monitoring (don't log client errors)
  if (statusCode >= 500) {
    console.error('Server Error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      timestamp: errorResponse.timestamp
    });
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Map domain error codes to HTTP status codes
 */
function mapErrorCodeToStatus(errorCode: string): number {
  const statusMap: Record<string, number> = {
    // Validation errors
    'validation_error': 400,
    'invalid_format': 400,
    'missing_required_field': 400,
    'invalid_parameter': 400,
    
    // Authentication/Authorization errors
    'unauthorized': 401,
    'insufficient_permissions': 403,
    'token_expired': 401,
    'invalid_token': 401,
    
    // Resource errors
    'not_found': 404,
    'resource_not_found': 404,
    'metric_not_found': 404,
    'entity_not_found': 404,
    
    // Conflict errors
    'duplicate_resource': 409,
    'conflict': 409,
    'idempotency_conflict': 409,
    
    // Rate limiting
    'rate_limit_exceeded': 429,
    
    // Business logic errors
    'business_rule_violation': 422,
    'computation_failed': 422,
    'invalid_computation_inputs': 422,
    
    // External service errors
    'external_service_unavailable': 503,
    'database_connection_error': 503,
    'knowledge_graph_unavailable': 503,
    
    // Default server error
    'internal_error': 500
  };

  return statusMap[errorCode] || 500;
}

/**
 * Get human-readable error title based on status code
 */
function getErrorTitle(statusCode: number): string {
  const titleMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };

  return titleMap[statusCode] || 'Error';
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}