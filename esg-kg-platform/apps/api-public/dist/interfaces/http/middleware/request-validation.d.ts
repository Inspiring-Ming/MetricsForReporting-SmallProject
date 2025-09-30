import { Request, Response, NextFunction } from 'express';
export declare function validateRequest(req: Request, res: Response, next: NextFunction): void;
export declare function validatePathParam(paramName: string, validator: (value: string) => {
    valid: boolean;
    message?: string;
}): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateQueryParam(paramName: string, validator: (value: string) => {
    valid: boolean;
    message?: string;
}, required?: boolean): (req: Request, res: Response, next: NextFunction) => void;
export declare const pathValidators: {
    uuid: (value: string) => {
        valid: boolean;
        message: string;
    };
    nonEmptyString: (value: string) => {
        valid: boolean;
        message: string;
    };
    alphanumeric: (value: string) => {
        valid: boolean;
        message: string;
    };
};
export declare const queryValidators: {
    framework: (value: string) => {
        valid: boolean;
        message: string;
    };
    positiveInteger: (value: string) => {
        valid: boolean;
        message: string;
    };
    isoDate: (value: string) => {
        valid: boolean;
        message: string;
    };
};
//# sourceMappingURL=request-validation.d.ts.map