import { validationResult } from 'express-validator';
export function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error) => ({
            field: 'path' in error ? error.path : 'unknown',
            code: error.type || 'invalid_format',
            message: error.msg
        }));
        const errorResponse = {
            type: 'validation_error',
            title: 'Request Validation Failed',
            status: 400,
            detail: 'The request contains invalid or missing data.',
            instance: req.originalUrl,
            errors: validationErrors,
            timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
    }
    next();
}
export function validatePathParam(paramName, validator) {
    return (req, res, next) => {
        const paramValue = req.params[paramName];
        if (!paramValue) {
            const errorResponse = {
                type: 'validation_error',
                title: 'Missing Path Parameter',
                status: 400,
                detail: `The ${paramName} parameter is required.`,
                instance: req.originalUrl,
                errors: [{
                        field: paramName,
                        code: 'required',
                        message: `${paramName} parameter is required`
                    }],
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
        }
        const validation = validator(paramValue);
        if (!validation.valid) {
            const errorResponse = {
                type: 'validation_error',
                title: 'Invalid Path Parameter',
                status: 400,
                detail: validation.message || `Invalid ${paramName} parameter.`,
                instance: req.originalUrl,
                errors: [{
                        field: paramName,
                        code: 'invalid_format',
                        message: validation.message || `Invalid ${paramName} parameter`
                    }],
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
        }
        next();
    };
}
export function validateQueryParam(paramName, validator, required = false) {
    return (req, res, next) => {
        const paramValue = req.query[paramName];
        if (required && (!paramValue || paramValue.trim() === '')) {
            const errorResponse = {
                type: 'validation_error',
                title: 'Missing Query Parameter',
                status: 400,
                detail: `The ${paramName} query parameter is required.`,
                instance: req.originalUrl,
                errors: [{
                        field: paramName,
                        code: 'required',
                        message: `${paramName} query parameter is required`
                    }],
                timestamp: new Date().toISOString()
            };
            res.status(400).json(errorResponse);
            return;
        }
        if (paramValue) {
            const validation = validator(paramValue);
            if (!validation.valid) {
                const errorResponse = {
                    type: 'validation_error',
                    title: 'Invalid Query Parameter',
                    status: 400,
                    detail: validation.message || `Invalid ${paramName} query parameter.`,
                    instance: req.originalUrl,
                    errors: [{
                            field: paramName,
                            code: 'invalid_format',
                            message: validation.message || `Invalid ${paramName} query parameter`
                        }],
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }
        }
        next();
    };
}
export const pathValidators = {
    uuid: (value) => ({
        valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
        message: 'Must be a valid UUID'
    }),
    nonEmptyString: (value) => ({
        valid: value.trim().length > 0,
        message: 'Must be a non-empty string'
    }),
    alphanumeric: (value) => ({
        valid: /^[a-zA-Z0-9_-]+$/.test(value),
        message: 'Must contain only alphanumeric characters, hyphens, and underscores'
    })
};
export const queryValidators = {
    framework: (value) => ({
        valid: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'].includes(value),
        message: 'Framework must be one of: SASB, GRI, TCFD, EU_TAXONOMY, CSRD'
    }),
    positiveInteger: (value) => {
        const num = parseInt(value, 10);
        return {
            valid: !isNaN(num) && num > 0,
            message: 'Must be a positive integer'
        };
    },
    isoDate: (value) => ({
        valid: !isNaN(Date.parse(value)),
        message: 'Must be a valid ISO date'
    })
};
//# sourceMappingURL=request-validation.js.map