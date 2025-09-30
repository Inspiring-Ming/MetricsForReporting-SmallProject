import { ComputationRequest, ComputationResult } from '@esg-platform/dto';
export interface ComputationExecutorPort {
    executeComputation(request: ComputationRequest): Promise<ComputationResult>;
    executeExternalComputation(modelName: string, inputData: Record<string, unknown>): Promise<{
        value: number;
        metadata?: Record<string, unknown>;
    }>;
    isModelAvailable(modelName: string): Promise<boolean>;
    getModelStats(modelName: string): Promise<{
        totalExecutions: number;
        averageExecutionTime: number;
        successRate: number;
    }>;
}
//# sourceMappingURL=computation-executor.port.d.ts.map