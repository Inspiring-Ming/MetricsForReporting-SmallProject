export type Framework = 'SASB' | 'GRI' | 'TCFD' | 'EU_TAXONOMY' | 'CSRD';
export declare class MetricCode {
    private readonly _value;
    private readonly _framework;
    constructor(value: string, framework: Framework);
    get value(): string;
    get framework(): Framework;
    isValidForFramework(): boolean;
    getCategory(): string;
    getMetricNumber(): string;
    equals(other: MetricCode): boolean;
    toString(): string;
    toNormalizedString(): string;
    static fromString(value: string, framework: Framework): MetricCode;
    static tryParseFramework(value: string): Framework | null;
    private validateCode;
    private validateFrameworkFormat;
}
//# sourceMappingURL=MetricCode.d.ts.map