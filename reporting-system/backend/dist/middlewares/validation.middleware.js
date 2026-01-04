"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBodyParams = exports.validateQueryParams = void 0;
const errors_1 = require("../errors");
/**
 * Validation Middleware
 * Validates required query parameters
 */
/**
 * Validate query parameters exist
 */
const validateQueryParams = (requiredParams) => {
    return (req, res, next) => {
        const missingParams = requiredParams.filter((param) => !req.query[param]);
        if (missingParams.length > 0) {
            throw new errors_1.ValidationError(`Missing required parameters: ${missingParams.join(", ")}`);
        }
        next();
    };
};
exports.validateQueryParams = validateQueryParams;
/**
 * Validate body parameters exist
 */
const validateBodyParams = (requiredParams) => {
    return (req, res, next) => {
        const missingParams = requiredParams.filter((param) => !req.body[param]);
        if (missingParams.length > 0) {
            throw new errors_1.ValidationError(`Missing required parameters: ${missingParams.join(", ")}`);
        }
        next();
    };
};
exports.validateBodyParams = validateBodyParams;
