import { MetricCode, Framework } from '../value-objects/MetricCode';
import { UnitIri } from '../value-objects/UnitIri';
export interface MetricProps {
    framework: Framework;
    industry: string;
    code: string;
    entityId: string;
    value: number;
    unitIri: string;
    asOf: Date;
    source: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface MetricIdentity {
    framework: Framework;
    industry: string;
    code: string;
    entityId: string;
    asOf: Date;
}
export declare class Metric {
    private readonly _id;
    private readonly _framework;
    private readonly _industry;
    private readonly _code;
    private readonly _entityId;
    private readonly _value;
    private readonly _unitIri;
    private readonly _asOf;
    private readonly _source;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: MetricProps);
    get id(): string;
    get framework(): Framework;
    get industry(): string;
    get code(): MetricCode;
    get entityId(): string;
    get value(): number;
    get unitIri(): UnitIri;
    get asOf(): Date;
    get source(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    getIdentity(): MetricIdentity;
    generateIri(): string;
    isSameMetric(other: Metric): boolean;
    isDirectMeasurement(): boolean;
    isComputedValue(): boolean;
    getReportingPeriodType(): 'annual' | 'quarterly' | 'monthly' | 'daily' | 'point-in-time';
    toDto(): {
        id: string;
        framework: Framework;
        industry: string;
        code: string;
        entityId: string;
        value: number;
        unitIri: string;
        asOf: string;
        source: string;
        createdAt: string;
        updatedAt: string;
    };
    toRdfTriples(metricIri?: string): string;
    touch(): void;
    clone(): Metric;
    static fromDto(dto: any): Metric;
    static createIdentityHash(identity: MetricIdentity): string;
    private validateProps;
    private generateId;
}
//# sourceMappingURL=Metric.d.ts.map