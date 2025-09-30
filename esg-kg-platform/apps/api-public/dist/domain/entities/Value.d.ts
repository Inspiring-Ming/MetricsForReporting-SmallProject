import { UnitIri, UnitType } from '../value-objects/UnitIri';
export interface ValueProps {
    amount: number;
    unitIri: string;
    precision?: number;
    isEstimated?: boolean;
    confidence?: number;
    source?: string;
}
export declare class Value {
    private readonly _amount;
    private readonly _unitIri;
    private readonly _precision;
    private readonly _isEstimated;
    private readonly _confidence;
    private readonly _source?;
    constructor(props: ValueProps);
    get amount(): number;
    get unitIri(): UnitIri;
    get precision(): number;
    get isEstimated(): boolean;
    get confidence(): number;
    get source(): string | undefined;
    getFormattedAmount(): string;
    getDisplayString(): string;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    isReasonable(): boolean;
    getUnitType(): UnitType;
    isComparableWith(other: Value): boolean;
    compareTo(other: Value): number;
    equals(other: Value): boolean;
    add(other: Value): Value;
    subtract(other: Value): Value;
    multiplyBy(multiplier: number): Value;
    divideBy(divisor: number): Value;
    abs(): Value;
    toDto(): {
        amount: number;
        unitIri: string;
        precision: number;
        isEstimated: boolean;
        confidence: number;
        source: string | undefined;
        displayString: string;
        unitType: UnitType;
    };
    clone(): Value;
    static zero(unitIri: string): Value;
    static fromNumber(amount: number, unitIri: string): Value;
    static createEstimate(amount: number, unitIri: string, confidence?: number): Value;
    private validateProps;
    private calculateDefaultPrecision;
}
//# sourceMappingURL=Value.d.ts.map