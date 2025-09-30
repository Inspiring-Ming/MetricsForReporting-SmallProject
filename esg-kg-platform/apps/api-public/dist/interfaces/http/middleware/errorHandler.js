export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }
    const isDomainError = 'code' in error;
    const statusCode = isDomainError ?
        error.statusCode || mapErrorCodeToStatus(error.code) :
        500;
    const errorResponse = {
        type: isDomainError ? error.code : 'internal_server_error',
        title: getErrorTitle(statusCode),
        status: statusCode,
        detail: error.message || 'An unexpected error occurred',
        instance: req.path,
        timestamp: new Date().toISOString()
    };
    if (req.app.get('config')?.nodeEnv === 'development') {
        errorResponse.stack = error.stack;
    }
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
function mapErrorCodeToStatus(errorCode) {
    const statusMap = {
        'validation_error': 400,
        'invalid_format': 400,
        'missing_required_field': 400,
        'invalid_parameter': 400,
        'unauthorized': 401,
        'insufficient_permissions': 403,
        'token_expired': 401,
        'invalid_token': 401,
        'not_found': 404,
        'resource_not_found': 404,
        'metric_not_found': 404,
        'entity_not_found': 404,
        'duplicate_resource': 409,
        'conflict': 409,
        'idempotency_conflict': 409,
        'rate_limit_exceeded': 429,
        'business_rule_violation': 422,
        'computation_failed': 422,
        'invalid_computation_inputs': 422,
        'external_service_unavailable': 503,
        'database_connection_error': 503,
        'knowledge_graph_unavailable': 503,
        'internal_error': 500
    };
    return statusMap[errorCode] || 500;
}
function getErrorTitle(statusCode) {
    const titleMap = {
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
export function asyncErrorHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map