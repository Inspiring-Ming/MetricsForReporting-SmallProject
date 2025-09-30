/**
 * Request Logger Middleware - HTTP request/response logging and tracing
 * 
 * Provides:
 * - Request ID generation and tracking
 * - Structured HTTP logging
 * - Performance timing
 * - Request/response correlation
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended Request interface with logging context
 */
export interface RequestWithContext extends Request {
  requestId: string;
  startTime: number;
}

/**
 * Request logging middleware
 * Generates unique request ID and logs request/response details
 */
export function requestLogger(req: RequestWithContext, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log incoming request
  console.log('HTTP Request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error' : 
                 res.statusCode >= 400 ? 'warn' : 'info';

    console.log('HTTP Response', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
      level
    });
  });

  next();
}

/**
 * Performance monitoring middleware
 * Tracks detailed timing metrics for monitoring
 */
export function performanceMonitor(req: RequestWithContext, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;

    // Log performance metrics
    if (durationMs > 1000) { // Log slow requests
      console.warn('Slow Request', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration: `${durationMs.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }

    // Add timing header
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
  });

  next();
}

/**
 * Security headers middleware
 * Adds security-related HTTP headers
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy for JSON APIs
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  next();
}

/**
 * CORS middleware configuration
 * Handles cross-origin resource sharing
 */
export function corsHandler(req: Request, res: Response, next: NextFunction): void {
  const config = req.app.get('config');
  const allowedOrigins = config?.corsOrigins || ['http://localhost:3000'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}