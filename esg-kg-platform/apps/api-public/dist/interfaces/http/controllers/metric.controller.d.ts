import { Request, Response, NextFunction } from 'express';
import { MetricManagementPort } from '../../../application/ports/inbound';
export declare class MetricController {
    private readonly metricService;
    constructor(metricService: MetricManagementPort);
    createMetric(req: Request, res: Response, next: NextFunction): Promise<void>;
    createMetricsBatch(req: Request, res: Response, next: NextFunction): Promise<void>;
    queryMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMetricById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateMetric(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteMetric(req: Request, res: Response, next: NextFunction): Promise<void>;
    validateMetric(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=metric.controller.d.ts.map