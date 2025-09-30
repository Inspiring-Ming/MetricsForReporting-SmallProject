import { Request, Response, NextFunction } from 'express';
export interface RequestWithContext extends Request {
    requestId: string;
    startTime: number;
}
export declare function requestLogger(req: RequestWithContext, res: Response, next: NextFunction): void;
export declare function performanceMonitor(req: RequestWithContext, res: Response, next: NextFunction): void;
export declare function securityHeaders(_req: Request, res: Response, next: NextFunction): void;
export declare function corsHandler(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map