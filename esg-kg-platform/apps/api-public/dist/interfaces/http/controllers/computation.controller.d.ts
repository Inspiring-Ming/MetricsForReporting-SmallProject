import { Request, Response, NextFunction } from 'express';
import { ComputationManagementPort } from '../../../application/ports/inbound';
export declare class ComputationController {
    private readonly computationService;
    constructor(computationService: ComputationManagementPort);
    executeComputation(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComputationMethods(req: Request, res: Response, next: NextFunction): Promise<void>;
    getComputationMethod(req: Request, res: Response, next: NextFunction): Promise<void>;
    validateComputationInputs(req: Request, res: Response, next: NextFunction): Promise<void>;
    discoverMethods(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=computation.controller.d.ts.map