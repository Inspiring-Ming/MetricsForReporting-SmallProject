"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../errors");
/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */
const errorHandler = (err, req, res, next) => {
    // Handle our custom AppError
    if (err instanceof errors_1.AppError) {
        console.error("❌ Error:", {
            status: err.statusCode,
            message: err.message,
            path: req.path,
            method: req.method,
            isOperational: err.isOperational,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
        res.status(err.statusCode).json({
            error: err.message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
        return;
    }
    // Handle unknown errors (fallback)
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ Unhandled Error:", {
        status,
        message,
        path: req.path,
        method: req.method,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
