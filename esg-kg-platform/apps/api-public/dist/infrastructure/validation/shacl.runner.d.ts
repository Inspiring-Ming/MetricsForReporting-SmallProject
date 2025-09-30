import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export interface ShaclConfig {
    shapesDirectory: string;
    defaultShapeFormat: string;
    strictMode: boolean;
}
export interface ValidationResult {
    conforms: boolean;
    report?: ValidationReport;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationReport {
    type: string;
    conforms: boolean;
    results: ValidationResultItem[];
}
export interface ValidationResultItem {
    type: string;
    focusNode?: string;
    resultPath?: string;
    value?: string;
    sourceConstraintComponent?: string;
    sourceShape?: string;
    resultMessage?: string;
    resultSeverity?: string;
}
export interface ValidationError {
    path: string;
    message: string;
    value?: string;
    shape?: string;
    severity: 'error' | 'warning' | 'info';
}
export interface ValidationWarning {
    path: string;
    message: string;
    value?: string;
    shape?: string;
}
export interface ShaclShape {
    uri: string;
    targetClass?: string;
    properties: ShaclProperty[];
}
export interface ShaclProperty {
    path: string;
    datatype?: string;
    minCount?: number;
    maxCount?: number;
    pattern?: string;
    in?: string[];
    class?: string;
}
export declare class ShaclValidationError extends DomainError {
    readonly code = "SHACL_VALIDATION_ERROR";
    readonly statusCode = StatusCodes.BAD_REQUEST;
}
export declare class ShaclShapeLoadError extends DomainError {
    readonly code = "SHACL_SHAPE_LOAD_ERROR";
    readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export declare class ShaclRunner {
    private readonly config;
    private shapes;
    private shapesLoaded;
    constructor(config: ShaclConfig);
    validate(rdfData: string, rdfFormat?: string, shapeUri?: string): Promise<ValidationResult>;
    validateMetric(metricData: any, metricType: string): Promise<ValidationResult>;
    loadShapes(): Promise<void>;
    getAvailableShapes(): ShaclShape[];
    getShape(uri: string): ShaclShape | undefined;
    validateSyntax(rdfData: string, format?: string): Promise<ValidationResult>;
    private ensureShapesLoaded;
    private performValidation;
    private parseValidationReport;
    private getSeverityLevel;
    private convertMetricToRdf;
    private getShapeUriForMetricType;
    private loadShapesFromDirectory;
    private checkRdfSyntax;
}
//# sourceMappingURL=shacl.runner.d.ts.map