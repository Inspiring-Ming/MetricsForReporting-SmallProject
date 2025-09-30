import { Framework } from '@esg-platform/dto';
export interface BusinessValidationError {
    code: string;
    message: string;
    field?: string;
}
export interface BusinessValidationResult {
    valid: boolean;
    errors: BusinessValidationError[];
}
export declare class BusinessValidationService {
    validateComputationRequest(framework: Framework, industry: string, entityId: string, asOf: string, inputValues: Record<string, number>): BusinessValidationResult;
    validateMetricBusinessRules(framework: Framework, industry: string, code: string, value: number, unitIri: string, asOf: string): BusinessValidationResult;
    validateDateRange(fromDate?: string, toDate?: string): BusinessValidationResult;
    private isFrameworkCompatibleWithIndustry;
    private validateInputValueRanges;
    private isEntityAccessible;
    private isValidMetricCode;
    private isUnitCompatibleWithMetric;
    private validateMetricValueRange;
    private hasPeriodOverlapConflict;
}
//# sourceMappingURL=business-validation.service.d.ts.map