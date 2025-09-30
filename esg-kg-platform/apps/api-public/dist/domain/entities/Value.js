import { UnitIri } from '../value-objects/UnitIri';
import { ValidationError } from '../errors/domain-errors';
export class Value {
    _amount;
    _unitIri;
    _precision;
    _isEstimated;
    _confidence;
    _source;
    constructor(props) {
        this.validateProps(props);
        this._amount = props.amount;
        this._unitIri = new UnitIri(props.unitIri);
        this._precision = props.precision ?? this.calculateDefaultPrecision(props.amount);
        this._isEstimated = props.isEstimated ?? false;
        this._confidence = props.confidence ?? 1.0;
        if (props.source) {
            this._source = props.source;
        }
    }
    get amount() { return this._amount; }
    get unitIri() { return this._unitIri; }
    get precision() { return this._precision; }
    get isEstimated() { return this._isEstimated; }
    get confidence() { return this._confidence; }
    get source() { return this._source; }
    getFormattedAmount() {
        return this._amount.toFixed(this._precision);
    }
    getDisplayString() {
        const formattedAmount = this.getFormattedAmount();
        const unitDisplay = this._unitIri.getDisplayName();
        if (!unitDisplay) {
            return formattedAmount;
        }
        return `${formattedAmount} ${unitDisplay}`;
    }
    isZero() {
        return Math.abs(this._amount) < Math.pow(10, -this._precision);
    }
    isPositive() {
        return this._amount > 0;
    }
    isNegative() {
        return this._amount < 0;
    }
    isReasonable() {
        if (!isFinite(this._amount)) {
            return false;
        }
        if (Math.abs(this._amount) > 1e15 || (this._amount !== 0 && Math.abs(this._amount) < 1e-15)) {
            return false;
        }
        return true;
    }
    getUnitType() {
        return this._unitIri.unitType;
    }
    isComparableWith(other) {
        return this._unitIri.isCompatibleWith(other._unitIri);
    }
    compareTo(other) {
        if (!this.isComparableWith(other)) {
            throw new ValidationError(`Cannot compare values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
        }
        if (this._amount < other._amount)
            return -1;
        if (this._amount > other._amount)
            return 1;
        return 0;
    }
    equals(other) {
        if (!this.isComparableWith(other)) {
            return false;
        }
        const epsilon = Math.pow(10, -Math.min(this._precision, other._precision));
        return Math.abs(this._amount - other._amount) < epsilon;
    }
    add(other) {
        if (!this.isComparableWith(other)) {
            throw new ValidationError(`Cannot add values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
        }
        const resultPrecision = Math.min(this._precision, other._precision);
        const resultConfidence = Math.min(this._confidence, other._confidence);
        return new Value({
            amount: this._amount + other._amount,
            unitIri: this._unitIri.value,
            precision: resultPrecision,
            isEstimated: this._isEstimated || other._isEstimated,
            confidence: resultConfidence,
            source: `${this._source || 'unknown'} + ${other._source || 'unknown'}`
        });
    }
    subtract(other) {
        if (!this.isComparableWith(other)) {
            throw new ValidationError(`Cannot subtract values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
        }
        const resultPrecision = Math.min(this._precision, other._precision);
        const resultConfidence = Math.min(this._confidence, other._confidence);
        return new Value({
            amount: this._amount - other._amount,
            unitIri: this._unitIri.value,
            precision: resultPrecision,
            isEstimated: this._isEstimated || other._isEstimated,
            confidence: resultConfidence,
            source: `${this._source || 'unknown'} - ${other._source || 'unknown'}`
        });
    }
    multiplyBy(multiplier) {
        if (!isFinite(multiplier)) {
            throw new ValidationError('Multiplier must be a finite number');
        }
        return new Value({
            amount: this._amount * multiplier,
            unitIri: this._unitIri.value,
            precision: this._precision,
            isEstimated: this._isEstimated,
            confidence: this._confidence,
            source: `${this._source || 'unknown'} * ${multiplier}`
        });
    }
    divideBy(divisor) {
        if (!isFinite(divisor) || divisor === 0) {
            throw new ValidationError('Divisor must be a finite non-zero number');
        }
        return new Value({
            amount: this._amount / divisor,
            unitIri: this._unitIri.value,
            precision: this._precision,
            isEstimated: this._isEstimated,
            confidence: this._confidence,
            source: `${this._source || 'unknown'} / ${divisor}`
        });
    }
    abs() {
        if (this._amount >= 0) {
            return this;
        }
        return new Value({
            amount: Math.abs(this._amount),
            unitIri: this._unitIri.value,
            precision: this._precision,
            isEstimated: this._isEstimated,
            confidence: this._confidence,
            source: `abs(${this._source || 'unknown'})`
        });
    }
    toDto() {
        return {
            amount: this._amount,
            unitIri: this._unitIri.value,
            precision: this._precision,
            isEstimated: this._isEstimated,
            confidence: this._confidence,
            source: this._source,
            displayString: this.getDisplayString(),
            unitType: this._unitIri.unitType
        };
    }
    clone() {
        const props = {
            amount: this._amount,
            unitIri: this._unitIri.value,
            precision: this._precision,
            isEstimated: this._isEstimated,
            confidence: this._confidence
        };
        if (this._source) {
            props.source = this._source;
        }
        return new Value(props);
    }
    static zero(unitIri) {
        return new Value({
            amount: 0,
            unitIri,
            precision: 2
        });
    }
    static fromNumber(amount, unitIri) {
        return new Value({
            amount,
            unitIri
        });
    }
    static createEstimate(amount, unitIri, confidence = 0.8) {
        return new Value({
            amount,
            unitIri,
            isEstimated: true,
            confidence,
            source: 'estimated'
        });
    }
    validateProps(props) {
        const errors = [];
        if (typeof props.amount !== 'number') {
            errors.push('amount must be a number');
        }
        else if (!isFinite(props.amount)) {
            errors.push('amount must be finite');
        }
        if (props.precision !== undefined) {
            if (typeof props.precision !== 'number' || props.precision < 0 || props.precision > 15) {
                errors.push('precision must be between 0 and 15');
            }
        }
        if (props.confidence !== undefined) {
            if (typeof props.confidence !== 'number' || props.confidence < 0 || props.confidence > 1) {
                errors.push('confidence must be between 0 and 1');
            }
        }
        if (errors.length > 0) {
            throw new ValidationError(`Invalid Value properties: ${errors.join(', ')}`);
        }
    }
    calculateDefaultPrecision(amount) {
        if (amount === 0)
            return 0;
        const magnitude = Math.abs(amount);
        if (magnitude >= 1000000)
            return 0;
        if (magnitude >= 1000)
            return 1;
        if (magnitude >= 1)
            return 2;
        if (magnitude >= 0.01)
            return 3;
        return 4;
    }
}
//# sourceMappingURL=Value.js.map