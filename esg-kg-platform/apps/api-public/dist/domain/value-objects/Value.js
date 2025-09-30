import { ValidationError } from '../errors/domain-errors';
export class SimpleValue {
    _amount;
    _unitIri;
    constructor(amount, unitIri) {
        this.validate(amount, unitIri);
        this._amount = amount;
        this._unitIri = unitIri;
    }
    get amount() {
        return this._amount;
    }
    get unitIri() {
        return this._unitIri;
    }
    toPlainObject() {
        return {
            amount: this._amount,
            unitIri: this._unitIri
        };
    }
    equals(other) {
        return this._amount === other._amount && this._unitIri === other._unitIri;
    }
    toString() {
        return `${this._amount} ${this._unitIri}`;
    }
    static fromData(data) {
        return new SimpleValue(data.amount, data.unitIri);
    }
    static fromJson(json) {
        try {
            const data = JSON.parse(json);
            return SimpleValue.fromData(data);
        }
        catch (error) {
            throw new ValidationError('Invalid JSON format for SimpleValue', undefined, error instanceof Error ? error : undefined);
        }
    }
    validate(amount, unitIri) {
        if (typeof amount !== 'number') {
            throw new ValidationError('Amount must be a number');
        }
        if (!isFinite(amount)) {
            throw new ValidationError('Amount must be finite');
        }
        if (!unitIri || typeof unitIri !== 'string') {
            throw new ValidationError('UnitIri must be a non-empty string');
        }
        if (!unitIri.startsWith('http://') && !unitIri.startsWith('https://')) {
            throw new ValidationError('UnitIri must be a valid HTTP or HTTPS IRI');
        }
    }
}
//# sourceMappingURL=Value.js.map