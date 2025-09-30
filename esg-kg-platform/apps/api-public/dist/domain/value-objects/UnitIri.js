import { ValidationError } from '../errors/domain-errors';
export class UnitIri {
    _value;
    _unitType;
    constructor(value) {
        this.validateIri(value);
        this._value = value.trim();
        this._unitType = this.detectUnitType(this._value);
    }
    get value() {
        return this._value;
    }
    get unitType() {
        return this._unitType;
    }
    isQudtUnit() {
        return this._value.startsWith('http://qudt.org/vocab/unit/');
    }
    getQudtUnitCode() {
        if (!this.isQudtUnit()) {
            return null;
        }
        const parts = this._value.split('/');
        return parts[parts.length - 1] || null;
    }
    isMassUnit() {
        return this._unitType === 'mass';
    }
    isEnergyUnit() {
        return this._unitType === 'energy';
    }
    isEmissionUnit() {
        return this._unitType === 'emission';
    }
    isCurrencyUnit() {
        return this._unitType === 'currency';
    }
    isPercentageUnit() {
        return this._unitType === 'percentage';
    }
    isCountUnit() {
        return this._unitType === 'count';
    }
    getDisplayName() {
        const unitCode = this.getQudtUnitCode();
        if (!unitCode) {
            return this._value;
        }
        const displayNames = {
            'KiloGM': 'kg',
            'Tonne': 't',
            'GM': 'g',
            'M3': 'm³',
            'L': 'L',
            'KiloW-HR': 'kWh',
            'MegaW-HR': 'MWh',
            'J': 'J',
            'KiloJ': 'kJ',
            'MegaJ': 'MJ',
            'NUM': 'count',
            'UNITLESS': '',
            'PERCENT': '%',
            'USD': 'USD',
            'EUR': 'EUR',
            'GBP': 'GBP',
            'YR': 'year',
            'MO': 'month',
            'DAY': 'day',
            'HR': 'hour'
        };
        return displayNames[unitCode] || unitCode;
    }
    isCompatibleWith(other) {
        return this._unitType === other._unitType;
    }
    equals(other) {
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
    static fromQudtCode(unitCode) {
        return new UnitIri(`http://qudt.org/vocab/unit/${unitCode}`);
    }
    static kilogram() {
        return UnitIri.fromQudtCode('KiloGM');
    }
    static tonne() {
        return UnitIri.fromQudtCode('Tonne');
    }
    static cubicMeter() {
        return UnitIri.fromQudtCode('M3');
    }
    static kilowattHour() {
        return UnitIri.fromQudtCode('KiloW-HR');
    }
    static count() {
        return UnitIri.fromQudtCode('NUM');
    }
    static percentage() {
        return UnitIri.fromQudtCode('PERCENT');
    }
    static usd() {
        return UnitIri.fromQudtCode('USD');
    }
    validateIri(value) {
        if (!value || value.trim().length === 0) {
            throw new ValidationError('UnitIri value cannot be empty');
        }
        const trimmedValue = value.trim();
        if (!/^https?:\/\/.+/.test(trimmedValue)) {
            throw new ValidationError('UnitIri must be a valid HTTP or HTTPS IRI');
        }
        if (trimmedValue.length > 200) {
            throw new ValidationError('UnitIri must be 200 characters or less');
        }
        try {
            new URL(trimmedValue);
        }
        catch {
            throw new ValidationError('UnitIri contains invalid URL characters');
        }
    }
    detectUnitType(_iri) {
        const unitCode = this.getQudtUnitCode();
        if (!unitCode) {
            return 'other';
        }
        const massUnits = ['GM', 'KiloGM', 'Tonne', 'LB', 'OZ'];
        if (massUnits.includes(unitCode)) {
            return 'mass';
        }
        if (unitCode.includes('CO2') || unitCode.includes('tCO2e') || unitCode.includes('kgCO2e')) {
            return 'emission';
        }
        const energyUnits = ['J', 'KiloJ', 'MegaJ', 'W-HR', 'KiloW-HR', 'MegaW-HR', 'BTU'];
        if (energyUnits.includes(unitCode)) {
            return 'energy';
        }
        const volumeUnits = ['L', 'MilliL', 'M3', 'FT3', 'GAL'];
        if (volumeUnits.includes(unitCode)) {
            return 'volume';
        }
        const areaUnits = ['M2', 'FT2', 'HECTARE', 'ACRE'];
        if (areaUnits.includes(unitCode)) {
            return 'area';
        }
        const currencyUnits = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];
        if (currencyUnits.includes(unitCode)) {
            return 'currency';
        }
        const timeUnits = ['SEC', 'MIN', 'HR', 'DAY', 'WK', 'MO', 'YR'];
        if (timeUnits.includes(unitCode)) {
            return 'time';
        }
        if (unitCode === 'PERCENT' || unitCode === 'FRACTION') {
            return 'percentage';
        }
        if (unitCode === 'NUM' || unitCode === 'UNITLESS') {
            return 'count';
        }
        if (unitCode.includes('-PER-')) {
            return 'rate';
        }
        return 'other';
    }
}
//# sourceMappingURL=UnitIri.js.map