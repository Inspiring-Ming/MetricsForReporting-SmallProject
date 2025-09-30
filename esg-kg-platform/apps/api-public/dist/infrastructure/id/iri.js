import { config } from '../../config/config';
const DEFAULT_IRI_CONFIG = {
    baseUri: 'https://esg-kg.example.com',
    ontologyNamespace: 'http://example.org/esg#',
    metricsNamespace: 'https://esg-kg.example.com/metrics/',
    batchNamespace: 'https://esg-kg.example.com/batches/',
    namedGraphNamespace: 'https://esg-kg.example.com/graphs/'
};
export class ESGIriStrategy {
    static config;
    static initialize(iriConfig) {
        const envConfig = {
            baseUri: `http://${config.host}:${config.port}` || DEFAULT_IRI_CONFIG.baseUri,
            ontologyNamespace: DEFAULT_IRI_CONFIG.ontologyNamespace,
            metricsNamespace: DEFAULT_IRI_CONFIG.metricsNamespace,
            batchNamespace: DEFAULT_IRI_CONFIG.batchNamespace,
            namedGraphNamespace: DEFAULT_IRI_CONFIG.namedGraphNamespace
        };
        this.config = { ...envConfig, ...iriConfig };
    }
    static getConfig() {
        if (!this.config) {
            this.initialize();
        }
        return this.config;
    }
    static generateMetricIri(framework, industry, code, entityId, asOf) {
        const config = this.getConfig();
        const normalizedFramework = this.encodeUriComponent(framework.toString());
        const normalizedIndustry = this.encodeUriComponent(industry.replace(/\s+/g, '-').toLowerCase());
        const normalizedCode = this.encodeUriComponent(code);
        const normalizedEntityId = this.encodeUriComponent(entityId);
        const normalizedAsOf = this.normalizeDate(asOf);
        return `${config.metricsNamespace}${normalizedFramework}/${normalizedIndustry}/${normalizedCode}/${normalizedEntityId}/${normalizedAsOf}`;
    }
    static generateBatchIri(batchId) {
        const config = this.getConfig();
        const normalizedBatchId = this.encodeUriComponent(batchId);
        return `${config.batchNamespace}${normalizedBatchId}`;
    }
    static generateNamedGraph(batchId, timestamp) {
        const config = this.getConfig();
        const normalizedBatchId = this.encodeUriComponent(batchId);
        const timestampStr = timestamp.toISOString().replace(/[:.]/g, '').replace('T', 'T').replace('Z', 'Z');
        return `${config.namedGraphNamespace}${normalizedBatchId}/${timestampStr}`;
    }
    static generateActivityIri(activityType, activityId) {
        const config = this.getConfig();
        const normalizedActivityType = this.encodeUriComponent(activityType.replace(/\s+/g, '-').toLowerCase());
        const normalizedActivityId = this.encodeUriComponent(activityId);
        return `${config.baseUri}/activities/${normalizedActivityType}/${normalizedActivityId}`;
    }
    static generateAgentIri(agentType, agentId) {
        const config = this.getConfig();
        const normalizedAgentId = this.encodeUriComponent(agentId);
        return `${config.baseUri}/agents/${agentType}/${normalizedAgentId}`;
    }
    static generateValidationIri(validationType, validationId) {
        const config = this.getConfig();
        const normalizedValidationType = this.encodeUriComponent(validationType.toLowerCase());
        const normalizedValidationId = this.encodeUriComponent(validationId);
        return `${config.baseUri}/validations/${normalizedValidationType}/${normalizedValidationId}`;
    }
    static buildNamespace(prefix) {
        const config = this.getConfig();
        const namespaces = {
            'esg': config.ontologyNamespace,
            'metrics': config.metricsNamespace,
            'batches': config.batchNamespace,
            'graphs': config.namedGraphNamespace,
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'xsd': 'http://www.w3.org/2001/XMLSchema#',
            'qudt': 'http://qudt.org/schema/qudt/',
            'unit': 'http://qudt.org/vocab/unit/',
            'prov': 'http://www.w3.org/ns/prov#',
            'foaf': 'http://xmlns.com/foaf/0.1/',
            'dct': 'http://purl.org/dc/terms/'
        };
        return namespaces[prefix] || `${config.baseUri}/${prefix}#`;
    }
    static validateIri(iri) {
        const errors = [];
        if (!iri || typeof iri !== 'string') {
            errors.push('IRI must be a non-empty string');
            return { isValid: false, errors };
        }
        try {
            new URL(iri);
        }
        catch {
            errors.push('IRI must be a valid URL');
        }
        if (!iri.startsWith('http://') && !iri.startsWith('https://')) {
            errors.push('IRI must use HTTP or HTTPS protocol');
        }
        if (iri.length > 2048) {
            errors.push('IRI length should not exceed 2048 characters');
        }
        const invalidChars = /[<>"{}|\\^`\s]/.exec(iri);
        if (invalidChars) {
            errors.push(`IRI contains invalid characters: ${invalidChars[0]}`);
        }
        return { isValid: errors.length === 0, errors };
    }
    static encodeUriComponent(value) {
        if (!value)
            return '';
        const cleaned = value
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[\/\\]/g, '-')
            .replace(/[<>"{}|^`]/g, '')
            .replace(/[()]/g, '')
            .replace(/[,;]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return encodeURIComponent(cleaned)
            .replace(/%20/g, '-')
            .replace(/%2D/g, '-');
    }
    static normalizeDate(dateInput) {
        let date;
        if (typeof dateInput === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }
            date = new Date(dateInput);
        }
        else {
            date = dateInput;
        }
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date input: ${dateInput}`);
        }
        const isoString = date.toISOString().split('T')[0];
        if (!isoString) {
            throw new Error(`Failed to format date: ${dateInput}`);
        }
        return isoString;
    }
    static extractLocalName(iri) {
        const lastSlash = iri.lastIndexOf('/');
        const lastHash = iri.lastIndexOf('#');
        const splitPoint = Math.max(lastSlash, lastHash);
        return splitPoint >= 0 ? iri.substring(splitPoint + 1) : iri;
    }
    static extractNamespace(iri) {
        const lastSlash = iri.lastIndexOf('/');
        const lastHash = iri.lastIndexOf('#');
        const splitPoint = Math.max(lastSlash, lastHash);
        return splitPoint >= 0 ? iri.substring(0, splitPoint + 1) : iri;
    }
    static isEsgNamespace(iri) {
        const config = this.getConfig();
        return iri.startsWith(config.baseUri) ||
            iri.startsWith(config.ontologyNamespace);
    }
    static generateTempIri(resourceType, identifier) {
        const config = this.getConfig();
        const timestamp = Date.now();
        const normalizedType = this.encodeUriComponent(resourceType);
        const normalizedId = this.encodeUriComponent(identifier);
        return `${config.baseUri}/temp/${normalizedType}/${normalizedId}/${timestamp}`;
    }
}
export { DEFAULT_IRI_CONFIG };
//# sourceMappingURL=iri.js.map