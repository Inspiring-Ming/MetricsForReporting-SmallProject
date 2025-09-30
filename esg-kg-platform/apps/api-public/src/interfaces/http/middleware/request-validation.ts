/**
 * Unified Validation Middleware
 * Handles HTTP request validation and error formatting
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { HttpErrorResponse } from '../dtos';

/**
 * Validation middleware that processes express-validator results
 * and returns standardized error responses
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: ValidationError) => ({
      field: 'path' in error ? error.path : 'unknown',
      code: error.type || 'invalid_format',
      message: error.msg
    }));

    const errorResponse: HttpErrorResponse = {
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

/**
 * Parameter validation middleware for path parameters
 */
export function validatePathParam(
  paramName: string, 
  validator: (value: string) => { valid: boolean; message?: string }
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramValue = req.params[paramName];
    
    if (!paramValue) {
      const errorResponse: HttpErrorResponse = {
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
      const errorResponse: HttpErrorResponse = {
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

/**
 * Query parameter validation middleware
 */
export function validateQueryParam(
  paramName: string,
  validator: (value: string) => { valid: boolean; message?: string },
  required = false
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const paramValue = req.query[paramName] as string;
    
    if (required && (!paramValue || paramValue.trim() === '')) {
      const errorResponse: HttpErrorResponse = {
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
        const errorResponse: HttpErrorResponse = {
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

/**
 * Common path parameter validators
 */
export const pathValidators = {
  uuid: (value: string) => ({
    valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    message: 'Must be a valid UUID'
  }),

  nonEmptyString: (value: string) => ({
    valid: value.trim().length > 0,
    message: 'Must be a non-empty string'
  }),

  alphanumeric: (value: string) => ({
    valid: /^[a-zA-Z0-9_-]+$/.test(value),
    message: 'Must contain only alphanumeric characters, hyphens, and underscores'
  })
};

/**
 * Common query parameter validators
 */
export const queryValidators = {
  framework: (value: string) => ({
    valid: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'].includes(value),
    message: 'Framework must be one of: SASB, GRI, TCFD, EU_TAXONOMY, CSRD'
  }),

  positiveInteger: (value: string) => {
    const num = parseInt(value, 10);
    return {
      valid: !isNaN(num) && num > 0,
      message: 'Must be a positive integer'
    };
  },

  isoDate: (value: string) => ({
    valid: !isNaN(Date.parse(value)),
    message: 'Must be a valid ISO date'
  })
};