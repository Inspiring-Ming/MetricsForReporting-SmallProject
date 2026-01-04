"use strict";
/**
 * Custom Error Classes
 * Provides structured error handling with proper HTTP status codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadTooLargeError = exports.ValidationError = exports.DatabaseError = exports.InternalServerError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
/**
 * Base Application Error
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * 404 Not Found Error
 */
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 400 Bad Request Error
 */
class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 500 Internal Server Error
 */
class InternalServerError extends AppError {
    constructor(message) {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Database Error (500)
 */
class DatabaseError extends AppError {
    constructor(message) {
        super(message, 500);
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
/**
 * Payload Too Large Error (413)
 */
class PayloadTooLargeError extends AppError {
    constructor(message) {
        super(message, 413);
    }
}
exports.PayloadTooLargeError = PayloadTooLargeError;
