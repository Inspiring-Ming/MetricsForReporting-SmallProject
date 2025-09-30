import { ComputationMethod, ComputationRequest, ComputationResult, Framework, BaseResponse, PaginatedResponse } from '@esg-platform/dto';
export interface ComputationManagementPort {
    getComputationMethods(framework: Framework, industry: string): Promise<BaseResponse<ComputationMethod[]>>;
    getComputationMethod(framework: Framework, industry: string, code: string): Promise<BaseResponse<ComputationMethod>>;
    executeComputation(request: ComputationRequest): Promise<BaseResponse<ComputationResult>>;
    validateComputationInputs(framework: Framework, industry: string, code: string, inputValues: Record<string, number>): Promise<BaseResponse<{
        valid: boolean;
        errors: string[];
    }>>;
    getComputationHistory(entityId: string, framework?: Framework, fromDate?: string, toDate?: string): Promise<PaginatedResponse<ComputationResult>>;
}
//# sourceMappingURL=computation-management.port.d.ts.map