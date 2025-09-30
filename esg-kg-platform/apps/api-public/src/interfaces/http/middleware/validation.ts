/**
 * Validation Middleware - HTTP request validation using express-validator
 * 
 * Provides validation rules for different endpoints and data types
 */

import { body, param, query } from 'express-validator';

/**
 * Common validation rules
 */
export const commonValidation = {
  framework: body('framework')
    .isIn(['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'])
    .withMessage('Framework must be one of: SASB, GRI, TCFD, EU_TAXONOMY, CSRD'),
  
  industry: body('industry')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Industry must be a non-empty string with max 100 characters'),

  entityId: body('entityId')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Entity ID must be a non-empty string with max 50 characters'),

  code: body('code')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Code must be a non-empty string with max 50 characters'),

  value: body('value')
    .isNumeric()
    .withMessage('Value must be a number'),

  unitIri: body('unitIri')
    .isURL()
    .withMessage('Unit IRI must be a valid URL'),

  asOf: body('asOf')
    .isISO8601()
    .withMessage('AsOf date must be in ISO 8601 format'),

  source: body('source')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Source must be a non-empty string with max 100 characters'),

  idempotencyKey: body('idempotencyKey')
    .optional()
    .isUUID()
    .withMessage('Idempotency key must be a valid UUID')
};

/**
 * Metric validation rules
 */
export const metricValidation = {
  // Create single metric
  create: [
    commonValidation.framework,
    commonValidation.industry,
    commonValidation.entityId,
    commonValidation.code,
    commonValidation.value,
    commonValidation.unitIri,
    commonValidation.asOf,
    commonValidation.source,
    commonValidation.idempotencyKey
  ],

  // Update metric (all fields optional)
  update: [
    body('framework').optional().isIn(['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD']),
    body('industry').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('entityId').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('code').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('value').optional().isNumeric(),
    body('unitIri').optional().isURL(),
    body('asOf').optional().isISO8601(),
    body('source').optional().isString().trim().isLength({ min: 1, max: 100 })
  ],

  // Batch create metrics
  batch: [
    body('metrics')
      .isArray({ min: 1, max: 1000 })
      .withMessage('Metrics array must contain 1-1000 items'),
    body('metrics.*.framework')
      .isIn(['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'])
      .withMessage('Each metric framework must be valid'),
    body('metrics.*.industry')
      .isString().trim().isLength({ min: 1, max: 100 })
      .withMessage('Each metric industry must be valid'),
    body('metrics.*.entityId')
      .isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Each metric entityId must be valid'),
    body('metrics.*.code')
      .isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Each metric code must be valid'),
    body('metrics.*.value')
      .isNumeric()
      .withMessage('Each metric value must be numeric'),
    body('metrics.*.unitIri')
      .isURL()
      .withMessage('Each metric unitIri must be a valid URL'),
    body('metrics.*.asOf')
      .isISO8601()
      .withMessage('Each metric asOf must be in ISO 8601 format'),
    body('metrics.*.source')
      .isString().trim().isLength({ min: 1, max: 100 })
      .withMessage('Each metric source must be valid'),
    commonValidation.idempotencyKey
  ],

  // Query parameters
  query: [
    query('framework')
      .optional()
      .isIn(['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'])
      .withMessage('Framework must be valid if provided'),
    query('industry')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Industry must be valid if provided'),
    query('entityId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Entity ID must be valid if provided'),
    query('code')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Code must be valid if provided'),
    query('fromDate')
      .optional()
      .isISO8601()
      .withMessage('From date must be in ISO 8601 format'),
    query('toDate')
      .optional()
      .isISO8601()
      .withMessage('To date must be in ISO 8601 format'),
    query('page')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Page must be a positive integer (1-10000)'),
    query('size')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Size must be between 1 and 1000')
  ],

  // Path parameters
  id: [
    param('id')
      .isUUID()
      .withMessage('Metric ID must be a valid UUID')
  ]
};

/**
 * Computation validation rules
 */
export const computationValidation = {
  // Execute computation
  execute: [
    body('formula')
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Formula must be a non-empty string with max 1000 characters'),
    body('inputs')
      .isObject()
      .withMessage('Inputs must be an object with numeric values')
      .custom((value) => {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Inputs must be an object');
        }
        for (const [key, val] of Object.entries(value)) {
          if (typeof val !== 'number' || isNaN(val as number)) {
            throw new Error(`Input '${key}' must be a valid number`);
          }
        }
        return true;
      }),
    commonValidation.framework,
    commonValidation.industry,
    commonValidation.entityId,
    commonValidation.asOf
  ],

  // Discover methods
  discoverMethods: [
    body('metricCode')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Metric code must be a non-empty string with max 50 characters'),
    commonValidation.framework,
    commonValidation.industry,
    body('availableInputs')
      .optional()
      .isArray()
      .withMessage('Available inputs must be an array of strings')
  ],

  // Query parameters for methods
  methodsQuery: [
    query('framework')
      .notEmpty()
      .isIn(['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'])
      .withMessage('Framework is required and must be valid'),
    query('industry')
      .notEmpty()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Industry is required and must be valid')
  ],

  // Method code parameter
  methodCode: [
    param('code')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Method code must be a valid string')
  ]
};

/**
 * Knowledge Graph validation rules
 */
export const knowledgeGraphValidation = {
  // SPARQL query
  sparqlQuery: [
    body('query')
      .isString()
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('SPARQL query must be a non-empty string with max 10000 characters'),
    body('format')
      .optional()
      .isIn(['json', 'turtle', 'xml'])
      .withMessage('Format must be one of: json, turtle, xml'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 300000 })
      .withMessage('Timeout must be between 1000ms and 300000ms (5 minutes)')
  ],

  // Entity search
  entitySearch: [
    query('term')
      .notEmpty()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search term is required (1-200 characters)'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
    query('entityType')
      .optional()
      .isURL()
      .withMessage('Entity type must be a valid URI')
  ],

  // Entity URI parameter
  entityUri: [
    param('uri')
      .custom((value) => {
        try {
          // Decode and validate as URI
          const decoded = decodeURIComponent(value);
          new URL(decoded);
          return true;
        } catch {
          throw new Error('Entity URI must be a valid encoded URI');
        }
      })
  ]
};