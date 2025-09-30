export interface ValueData {
    amount: number;
    unitIri: string;
}
export declare class SimpleValue {
    private readonly _amount;
    private readonly _unitIri;
    constructor(amount: number, unitIri: string);
    get amount(): number;
    get unitIri(): string;
    toPlainObject(): ValueData;
    equals(other: SimpleValue): boolean;
    toString(): string;
    static fromData(data: ValueData): SimpleValue;
    static fromJson(json: string): SimpleValue;
    private validate;
}
//# sourceMappingURL=Value.d.ts.map