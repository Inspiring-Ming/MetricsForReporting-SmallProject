import { Request, Response } from 'express';
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const writeOperationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const heavyOperationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const createAuthAwareRateLimit: (anonymousLimit: number, authenticatedLimit: number, windowMs?: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare function idempotencyHandler(req: Request, res: Response, next: Function): void;
//# sourceMappingURL=rateLimit.d.ts.map