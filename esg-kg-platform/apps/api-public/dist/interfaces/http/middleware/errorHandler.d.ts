import { Request, Response, NextFunction } from 'express';
interface DomainError extends Error {
    code: string;
    statusCode?: number;
}
export declare function errorHandler(error: Error | DomainError, req: Request, res: Response, next: NextFunction): void;
export declare function asyncErrorHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map