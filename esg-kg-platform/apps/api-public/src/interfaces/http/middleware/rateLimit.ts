/**
 * Rate Limiting Middleware - Request throttling and quota management
 * 
 * Provides:
 * - Per-IP rate limiting
 * - Different limits for different endpoints
 * - Idempotency key handling
 * - Rate limit headers
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General rate limiting for public API
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    type: 'rate_limit_exceeded',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Too many requests from this IP, please try again later.',
    instance: '/api',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use IP address as the key, with fallback
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * Strict rate limiting for write operations (POST, PUT, DELETE)
 */
export const writeOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 write operations per 5 minutes
  message: {
    type: 'write_rate_limit_exceeded',
    title: 'Too Many Write Operations',
    status: 429,
    detail: 'Too many write operations from this IP, please slow down.',
    instance: '/api',
    timestamp: new Date().toISOString()
  },
  skip: (req: Request) => {
    // Only apply to write operations
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  },
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * Heavy operation rate limiting (computations, large queries)
 */
export const heavyOperationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 heavy operations per 10 minutes
  message: {
    type: 'computation_rate_limit_exceeded',
    title: 'Too Many Heavy Operations',
    status: 429,
    detail: 'Too many computation requests from this IP, please wait before trying again.',
    instance: '/api/computations',
    timestamp: new Date().toISOString()
  },
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * Authentication-aware rate limiting
 * Different limits for authenticated vs anonymous users
 */
export const createAuthAwareRateLimit = (
  anonymousLimit: number,
  authenticatedLimit: number,
  windowMs: number = 15 * 60 * 1000
) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      // Check if user is authenticated (from auth middleware)
      const isAuthenticated = req.headers.authorization || (req as any).auth;
      return isAuthenticated ? authenticatedLimit : anonymousLimit;
    },
    message: (req: Request) => ({
      type: 'rate_limit_exceeded',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: `Rate limit exceeded for ${(req as any).auth ? 'authenticated' : 'anonymous'} users.`,
      instance: req.path,
      timestamp: new Date().toISOString()
    }),
    keyGenerator: (req: Request) => {
      // Use user ID for authenticated users, IP for anonymous
      const userId = (req as any).auth?.sub;
      return userId || req.ip || req.connection.remoteAddress || 'unknown';
    }
  });
};

/**
 * Idempotency middleware
 * Prevents duplicate operations using idempotency keys
 */
const idempotencyCache = new Map<string, { response: any; expiresAt: number }>();

export function idempotencyHandler(req: Request, res: Response, next: Function): void {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  // Only apply to write operations
  if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !idempotencyKey) {
    return next();
  }

  // Check for existing response
  const cached = idempotencyCache.get(idempotencyKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('Idempotency hit', {
      key: idempotencyKey,
      path: req.path,
      method: req.method
    });

    // Return cached response
    res.status(200).json({
      ...cached.response,
      _idempotent: true,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to cache response
  res.json = function(data: any) {
    // Cache successful responses for 24 hours
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(idempotencyKey, {
        response: data,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      // Cleanup expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        const now = Date.now();
        for (const [key, value] of idempotencyCache.entries()) {
          if (value.expiresAt <= now) {
            idempotencyCache.delete(key);
          }
        }
      }
    }

    return originalJson(data);
  };

  next();
}