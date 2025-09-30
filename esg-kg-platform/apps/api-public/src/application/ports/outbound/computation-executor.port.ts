import { ComputationRequest, ComputationResult } from '@esg-platform/dto';

/**
 * Outbound port for computation execution
 * Defines the contract for executing computational models
 */
export interface ComputationExecutorPort {
  /**
   * Execute a computation using platform models
   */
  executeComputation(request: ComputationRequest): Promise<ComputationResult>;

  /**
   * Execute computation via external API
   */
  executeExternalComputation(
    modelName: string,
    inputData: Record<string, unknown>
  ): Promise<{
    value: number;
    metadata?: Record<string, unknown>;
  }>;

  /**
   * Check if a computation model is available
   */
  isModelAvailable(modelName: string): Promise<boolean>;

  /**
   * Get model execution statistics
   */
  getModelStats(modelName: string): Promise<{
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  }>;
}