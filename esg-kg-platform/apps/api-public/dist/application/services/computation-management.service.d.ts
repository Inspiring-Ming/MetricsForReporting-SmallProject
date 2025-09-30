import { ComputationMethod, ComputationRequest, ComputationResult, Framework, BaseResponse, PaginatedResponse } from '@esg-platform/dto';
import { ComputationManagementPort } from '../ports/inbound/computation-management.port';
import { KnowledgeGraphPort } from '../ports/outbound/knowledge-graph.port';
import { CachePort } from '../ports/outbound/cache.port';
export declare class ComputationManagementService implements ComputationManagementPort {
    private readonly knowledgeGraph;
    private readonly cache;
    constructor(knowledgeGraph: KnowledgeGraphPort, cache: CachePort);
    getComputationMethods(framework: Framework, industry: string): Promise<BaseResponse<ComputationMethod[]>>;
    getComputationMethod(framework: Framework, industry: string, code: string): Promise<BaseResponse<ComputationMethod>>;
    executeComputation(request: ComputationRequest): Promise<BaseResponse<ComputationResult>>;
    validateComputationInputs(framework: Framework, industry: string, code: string, inputValues: Record<string, number>): Promise<BaseResponse<{
        valid: boolean;
        errors: string[];
    }>>;
    getComputationHistory(entityId: string, framework?: Framework, fromDate?: string, toDate?: string): Promise<PaginatedResponse<ComputationResult>>;
    private validateComputationRequest;
    private validateInputsAgainstMethod;
    private executeComputationLogic;
    private executePlatformFormula;
    private evaluateMathExpression;
    private isValidFramework;
}
//# sourceMappingURL=computation-management.service.d.ts.map