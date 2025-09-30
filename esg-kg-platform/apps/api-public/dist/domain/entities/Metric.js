import { MetricCode } from '../value-objects/MetricCode';
import { UnitIri } from '../value-objects/UnitIri';
import { MetricValidationError } from '../errors/domain-errors';
import { ESGIriStrategy } from '../../infrastructure/id/iri';
export class Metric {
    _id;
    _framework;
    _industry;
    _code;
    _entityId;
    _value;
    _unitIri;
    _asOf;
    _source;
    _createdAt;
    _updatedAt;
    constructor(props) {
        this.validateProps(props);
        this._id = props.id || this.generateId(props);
        this._framework = props.framework;
        this._industry = props.industry.trim();
        this._code = new MetricCode(props.code, props.framework);
        this._entityId = props.entityId.trim();
        this._value = props.value;
        this._unitIri = new UnitIri(props.unitIri);
        this._asOf = new Date(props.asOf);
        this._source = props.source.trim();
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }
    get id() { return this._id; }
    get framework() { return this._framework; }
    get industry() { return this._industry; }
    get code() { return this._code; }
    get entityId() { return this._entityId; }
    get value() { return this._value; }
    get unitIri() { return this._unitIri; }
    get asOf() { return new Date(this._asOf); }
    get source() { return this._source; }
    get createdAt() { return new Date(this._createdAt); }
    get updatedAt() { return new Date(this._updatedAt); }
    getIdentity() {
        return {
            framework: this._framework,
            industry: this._industry,
            code: this._code.value,
            entityId: this._entityId,
            asOf: this.asOf
        };
    }
    generateIri() {
        const asOfStr = this._asOf.toISOString().split('T')[0];
        if (!asOfStr) {
            throw new MetricValidationError('Failed to format asOf date', {
                errors: [`Invalid date: ${this._asOf}`]
            });
        }
        return ESGIriStrategy.generateMetricIri(this._framework, this._industry, this._code.value, this._entityId, asOfStr);
    }
    isSameMetric(other) {
        const thisIdentity = this.getIdentity();
        const otherIdentity = other.getIdentity();
        return (thisIdentity.framework === otherIdentity.framework &&
            thisIdentity.industry === otherIdentity.industry &&
            thisIdentity.code === otherIdentity.code &&
            thisIdentity.entityId === otherIdentity.entityId &&
            thisIdentity.asOf.getTime() === otherIdentity.asOf.getTime());
    }
    isDirectMeasurement() {
        const source = this._source.toLowerCase();
        const directIndicators = [
            'annual report', 'sustainability report', 'financial filing',
            'regulatory filing', 'company disclosure', 'direct measurement',
            'sensor data', 'meter reading'
        ];
        return directIndicators.some(indicator => source.includes(indicator));
    }
    isComputedValue() {
        return !this.isDirectMeasurement();
    }
    getReportingPeriodType() {
        const source = this._source.toLowerCase();
        if (source.includes('annual'))
            return 'annual';
        if (source.includes('quarterly') || source.includes('q1') || source.includes('q2') ||
            source.includes('q3') || source.includes('q4'))
            return 'quarterly';
        if (source.includes('monthly'))
            return 'monthly';
        if (source.includes('daily'))
            return 'daily';
        return 'point-in-time';
    }
    toDto() {
        return {
            id: this._id,
            framework: this._framework,
            industry: this._industry,
            code: this._code.value,
            entityId: this._entityId,
            value: this._value,
            unitIri: this._unitIri.value,
            asOf: this._asOf.toISOString(),
            source: this._source,
            createdAt: this._createdAt.toISOString(),
            updatedAt: this._updatedAt.toISOString()
        };
    }
    toRdfTriples(metricIri) {
        const iri = metricIri || this.generateIri();
        const asOfDate = this._asOf.toISOString().split('T')[0];
        return `
@prefix esg: <http://example.org/esg#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix qudt: <http://qudt.org/schema/qudt/> .

<${iri}> a esg:Metric ;
    esg:framework "${this._framework}" ;
    esg:industry "${this._industry}" ;
    esg:code "${this._code.value}" ;
    esg:entityId "${this._entityId}" ;
    esg:value "${this._value}"^^xsd:decimal ;
    esg:unitIri <${this._unitIri.value}> ;
    esg:asOf "${asOfDate}"^^xsd:date ;
    esg:source "${this._source}" ;
    esg:createdAt "${this._createdAt.toISOString()}"^^xsd:dateTime ;
    esg:updatedAt "${this._updatedAt.toISOString()}"^^xsd:dateTime .
`.trim();
    }
    touch() {
        this._updatedAt = new Date();
    }
    clone() {
        return new Metric({
            id: this._id,
            framework: this._framework,
            industry: this._industry,
            code: this._code.value,
            entityId: this._entityId,
            value: this._value,
            unitIri: this._unitIri.value,
            asOf: this._asOf,
            source: this._source,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt
        });
    }
    static fromDto(dto) {
        const props = {
            id: dto.id,
            framework: dto.framework,
            industry: dto.industry,
            code: dto.code,
            entityId: dto.entityId,
            value: dto.value,
            unitIri: dto.unitIri,
            asOf: new Date(dto.asOf),
            source: dto.source
        };
        if (dto.createdAt) {
            props.createdAt = new Date(dto.createdAt);
        }
        if (dto.updatedAt) {
            props.updatedAt = new Date(dto.updatedAt);
        }
        return new Metric(props);
    }
    static createIdentityHash(identity) {
        const identityString = `${identity.framework}|${identity.industry}|${identity.code}|${identity.entityId}|${identity.asOf.toISOString()}`;
        let hash = 0;
        for (let i = 0; i < identityString.length; i++) {
            const char = identityString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    validateProps(props) {
        const errors = [];
        if (!props.framework) {
            errors.push('framework is required');
        }
        if (!props.industry || props.industry.trim().length === 0) {
            errors.push('industry is required');
        }
        else if (props.industry.length > 100) {
            errors.push('industry must be 100 characters or less');
        }
        if (!props.entityId || props.entityId.trim().length === 0) {
            errors.push('entityId is required');
        }
        else if (props.entityId.length > 100) {
            errors.push('entityId must be 100 characters or less');
        }
        if (typeof props.value !== 'number') {
            errors.push('value must be a number');
        }
        else if (!isFinite(props.value)) {
            errors.push('value must be finite');
        }
        if (!props.asOf) {
            errors.push('asOf is required');
        }
        else {
            const asOfDate = new Date(props.asOf);
            if (isNaN(asOfDate.getTime())) {
                errors.push('asOf must be a valid date');
            }
            else if (asOfDate > new Date()) {
                errors.push('asOf cannot be in the future');
            }
        }
        if (!props.source || props.source.trim().length === 0) {
            errors.push('source is required');
        }
        else if (props.source.length > 500) {
            errors.push('source must be 500 characters or less');
        }
        if (errors.length > 0) {
            throw new MetricValidationError('Invalid metric properties', { errors });
        }
    }
    generateId(props) {
        const identity = {
            framework: props.framework,
            industry: props.industry,
            code: props.code,
            entityId: props.entityId,
            asOf: new Date(props.asOf)
        };
        return Metric.createIdentityHash(identity);
    }
}
//# sourceMappingURL=Metric.js.map