export type UnitType = 'mass' | 'energy' | 'volume' | 'count' | 'currency' | 'time' | 'percentage' | 'ratio' | 'area' | 'emission' | 'rate' | 'other';
export declare class UnitIri {
    private readonly _value;
    private readonly _unitType;
    constructor(value: string);
    get value(): string;
    get unitType(): UnitType;
    isQudtUnit(): boolean;
    getQudtUnitCode(): string | null;
    isMassUnit(): boolean;
    isEnergyUnit(): boolean;
    isEmissionUnit(): boolean;
    isCurrencyUnit(): boolean;
    isPercentageUnit(): boolean;
    isCountUnit(): boolean;
    getDisplayName(): string;
    isCompatibleWith(other: UnitIri): boolean;
    equals(other: UnitIri): boolean;
    toString(): string;
    static fromQudtCode(unitCode: string): UnitIri;
    static kilogram(): UnitIri;
    static tonne(): UnitIri;
    static cubicMeter(): UnitIri;
    static kilowattHour(): UnitIri;
    static count(): UnitIri;
    static percentage(): UnitIri;
    static usd(): UnitIri;
    private validateIri;
    private detectUnitType;
}
//# sourceMappingURL=UnitIri.d.ts.map