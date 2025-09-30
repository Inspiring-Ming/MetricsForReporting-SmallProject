export type IdGenerationStrategy = 'uuid' | 'iri' | 'sequential';
export interface IdGeneratorPort {
    generate(strategy?: IdGenerationStrategy): Promise<string>;
    generateIri(type: string, identifier: string): Promise<string>;
    generateBatch(count: number, strategy?: IdGenerationStrategy): Promise<string[]>;
    validateId(id: string, strategy: IdGenerationStrategy): boolean;
}
//# sourceMappingURL=id-generator.port.d.ts.map