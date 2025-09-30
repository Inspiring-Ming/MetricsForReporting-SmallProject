import { Framework } from '../../domain/value-objects/MetricCode';
export interface IriConfig {
    baseUri: string;
    ontologyNamespace: string;
    metricsNamespace: string;
    batchNamespace: string;
    namedGraphNamespace: string;
}
declare const DEFAULT_IRI_CONFIG: IriConfig;
export declare class ESGIriStrategy {
    private static config;
    static initialize(iriConfig?: Partial<IriConfig>): void;
    static getConfig(): IriConfig;
    static generateMetricIri(framework: Framework | string, industry: string, code: string, entityId: string, asOf: string): string;
    static generateBatchIri(batchId: string): string;
    static generateNamedGraph(batchId: string, timestamp: Date): string;
    static generateActivityIri(activityType: string, activityId: string): string;
    static generateAgentIri(agentType: 'system' | 'user' | 'organization', agentId: string): string;
    static generateValidationIri(validationType: string, validationId: string): string;
    static buildNamespace(prefix: string): string;
    static validateIri(iri: string): {
        isValid: boolean;
        errors: string[];
    };
    static encodeUriComponent(value: string): string;
    static normalizeDate(dateInput: string | Date): string;
    static extractLocalName(iri: string): string;
    static extractNamespace(iri: string): string;
    static isEsgNamespace(iri: string): boolean;
    static generateTempIri(resourceType: string, identifier: string): string;
}
export { DEFAULT_IRI_CONFIG };
//# sourceMappingURL=iri.d.ts.map