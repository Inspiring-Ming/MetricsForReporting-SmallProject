import { ComputationMethod, Framework } from '@esg-platform/dto';
export interface KnowledgeGraphPort {
    executeSparqlQuery(query: string): Promise<Record<string, unknown>[]>;
    getComputationMethods(framework: Framework, industry: string): Promise<ComputationMethod[]>;
    getComputationMethod(framework: Framework, industry: string, code: string): Promise<ComputationMethod | null>;
    getFrameworks(): Promise<Framework[]>;
    getIndustries(framework: Framework): Promise<string[]>;
    getMetricCodes(framework: Framework, industry: string): Promise<string[]>;
    getMetricDefinitions(framework: Framework, industry?: string): Promise<Array<{
        code: string;
        name: string;
        description: string;
        unit: string;
    }>>;
    validateMetricStructure(metric: unknown): Promise<{
        valid: boolean;
        violations: Array<{
            path: string;
            message: string;
        }>;
    }>;
    entityExists(entityId: string): Promise<boolean>;
    getEntity(entityId: string): Promise<{
        iri: string;
        type: string;
        properties: Record<string, unknown>;
    } | null>;
}
//# sourceMappingURL=knowledge-graph.port.d.ts.map