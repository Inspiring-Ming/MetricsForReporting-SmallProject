import {
  ComputationMethod,
  ComputationRequest,
  ComputationResult,
  Framework,
  BaseResponse,
  PaginatedResponse
} from '@esg-platform/dto';

/**
 * Inbound port for computation-related operations
 * Defines use cases for metric computation and method discovery
 */
export interface ComputationManagementPort {
  /**
   * Get available computation methods by framework and industry
   */
  getComputationMethods(
    framework: Framework,
    industry: string
  ): Promise<BaseResponse<ComputationMethod[]>>;

  /**
   * Get a specific computation method by code
   */
  getComputationMethod(
    framework: Framework,
    industry: string,
    code: string
  ): Promise<BaseResponse<ComputationMethod>>;

  /**
   * Execute a computation using the specified method
   */
  executeComputation(request: ComputationRequest): Promise<BaseResponse<ComputationResult>>;

  /**
   * Validate computation inputs against method requirements
   */
  validateComputationInputs(
    framework: Framework,
    industry: string,
    code: string,
    inputValues: Record<string, number>
  ): Promise<BaseResponse<{ valid: boolean; errors: string[] }>>;

  /**
   * Get computation history for an entity
   */
  getComputationHistory(
    entityId: string,
    framework?: Framework,
    fromDate?: string,
    toDate?: string
  ): Promise<PaginatedResponse<ComputationResult>>;
}