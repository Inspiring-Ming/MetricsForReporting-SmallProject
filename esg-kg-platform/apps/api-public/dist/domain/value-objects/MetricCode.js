import { ValidationError } from '../errors/domain-errors';
export class MetricCode {
    _value;
    _framework;
    constructor(value, framework) {
        this.validateCode(value, framework);
        this._value = value.trim();
        this._framework = framework;
    }
    get value() {
        return this._value;
    }
    get framework() {
        return this._framework;
    }
    isValidForFramework() {
        return this.validateFrameworkFormat(this._value, this._framework);
    }
    getCategory() {
        switch (this._framework) {
            case 'SASB':
                const sasbParts = this._value.split('-');
                if (sasbParts.length >= 2) {
                    return `${sasbParts[0]}-${sasbParts[1]}`;
                }
                return this._value;
            case 'GRI':
                const griParts = this._value.split('-');
                return griParts[0] || this._value;
            default:
                return this._value;
        }
    }
    getMetricNumber() {
        switch (this._framework) {
            case 'SASB':
                const sasbParts = this._value.split('-');
                if (sasbParts.length >= 3) {
                    return sasbParts.slice(2).join('-');
                }
                return this._value;
            case 'GRI':
                const griParts = this._value.split('-');
                return griParts[1] || this._value;
            default:
                return this._value;
        }
    }
    equals(other) {
        return this._value === other._value && this._framework === other._framework;
    }
    toString() {
        return this._value;
    }
    toNormalizedString() {
        return `${this._framework}:${this._value}`;
    }
    static fromString(value, framework) {
        return new MetricCode(value, framework);
    }
    static tryParseFramework(value) {
        if (/^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\.[0-9]+$/.test(value)) {
            return 'SASB';
        }
        if (/^[0-9]{3}-[0-9]+$/.test(value)) {
            return 'GRI';
        }
        return null;
    }
    validateCode(value, framework) {
        if (!value || value.trim().length === 0) {
            throw new ValidationError('MetricCode value cannot be empty');
        }
        const trimmedValue = value.trim();
        if (trimmedValue.length > 50) {
            throw new ValidationError('MetricCode value must be 50 characters or less');
        }
        if (!/^[A-Za-z0-9\-._]+$/.test(trimmedValue)) {
            throw new ValidationError('MetricCode contains invalid characters. Only letters, numbers, hyphens, dots and underscores are allowed');
        }
        if (!this.validateFrameworkFormat(trimmedValue, framework)) {
            throw new ValidationError(`MetricCode "${trimmedValue}" is not valid for framework ${framework}`);
        }
    }
    validateFrameworkFormat(value, framework) {
        switch (framework) {
            case 'SASB':
                return /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\.[0-9]+$/.test(value);
            case 'GRI':
                return /^[0-9]{3}-[0-9]+$/.test(value);
            case 'TCFD':
                return value.length >= 2 && value.length <= 50;
            case 'EU_TAXONOMY':
                return value.length >= 2 && value.length <= 50;
            case 'CSRD':
                return value.length >= 2 && value.length <= 50;
            default:
                return false;
        }
    }
}
//# sourceMappingURL=MetricCode.js.map