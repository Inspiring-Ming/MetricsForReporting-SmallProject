import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';
export class ShaclValidationError extends DomainError {
    code = 'SHACL_VALIDATION_ERROR';
    statusCode = StatusCodes.BAD_REQUEST;
}
export class ShaclShapeLoadError extends DomainError {
    code = 'SHACL_SHAPE_LOAD_ERROR';
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}
export class ShaclRunner {
    config;
    shapes = new Map();
    shapesLoaded = false;
    constructor(config) {
        this.config = config;
    }
    async validate(rdfData, rdfFormat = 'text/turtle', shapeUri) {
        try {
            await this.ensureShapesLoaded();
            const validationReport = await this.performValidation(rdfData, rdfFormat, shapeUri);
            return this.parseValidationReport(validationReport);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new ShaclValidationError(`SHACL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async validateMetric(metricData, metricType) {
        try {
            const rdfData = this.convertMetricToRdf(metricData, metricType);
            const shapeUri = this.getShapeUriForMetricType(metricType);
            return await this.validate(rdfData, 'text/turtle', shapeUri);
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new ShaclValidationError(`Metric validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async loadShapes() {
        try {
            await this.loadShapesFromDirectory(this.config.shapesDirectory);
            this.shapesLoaded = true;
        }
        catch (error) {
            throw new ShaclShapeLoadError(`Failed to load SHACL shapes: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    getAvailableShapes() {
        return Array.from(this.shapes.values());
    }
    getShape(uri) {
        return this.shapes.get(uri);
    }
    async validateSyntax(rdfData, format = 'text/turtle') {
        try {
            const syntaxValid = await this.checkRdfSyntax(rdfData, format);
            if (syntaxValid) {
                return {
                    conforms: true,
                    errors: [],
                    warnings: []
                };
            }
            else {
                return {
                    conforms: false,
                    errors: [{
                            path: 'syntax',
                            message: 'RDF syntax error detected',
                            severity: 'error'
                        }],
                    warnings: []
                };
            }
        }
        catch (error) {
            throw new ShaclValidationError(`RDF syntax validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined);
        }
    }
    async ensureShapesLoaded() {
        if (!this.shapesLoaded) {
            await this.loadShapes();
        }
    }
    async performValidation(_rdfData, _rdfFormat, _shapeUri) {
        return {
            type: 'sh:ValidationReport',
            conforms: true,
            results: []
        };
    }
    parseValidationReport(report) {
        const errors = [];
        const warnings = [];
        for (const result of report.results) {
            const severity = this.getSeverityLevel(result.resultSeverity);
            if (severity === 'error') {
                const error = {
                    path: result.resultPath || 'unknown',
                    message: result.resultMessage || 'Validation error',
                    severity
                };
                if (result.value)
                    error.value = result.value;
                if (result.sourceShape)
                    error.shape = result.sourceShape;
                errors.push(error);
            }
            else if (severity === 'warning') {
                const warning = {
                    path: result.resultPath || 'unknown',
                    message: result.resultMessage || 'Validation warning'
                };
                if (result.value)
                    warning.value = result.value;
                if (result.sourceShape)
                    warning.shape = result.sourceShape;
                warnings.push(warning);
            }
        }
        return {
            conforms: report.conforms && errors.length === 0,
            report,
            errors,
            warnings
        };
    }
    getSeverityLevel(severity) {
        if (!severity)
            return 'error';
        const s = severity.toLowerCase();
        if (s.includes('violation') || s.includes('error'))
            return 'error';
        if (s.includes('warning'))
            return 'warning';
        return 'info';
    }
    convertMetricToRdf(metricData, metricType) {
        const baseUri = 'https://esg-kg.example.com/metrics/';
        const metricUri = `${baseUri}${metricType}/${metricData.id || 'unknown'}`;
        const rdf = `
@prefix esg: <https://esg-kg.example.com/ontology/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<${metricUri}> a esg:${metricType} ;
  esg:hasValue "${metricData.value || 0}"^^xsd:decimal ;
  esg:hasUnit "${metricData.unit || 'unknown'}" ;
  esg:reportingPeriod "${metricData.period || 'unknown'}" .
`;
        return rdf.trim();
    }
    getShapeUriForMetricType(metricType) {
        const shapeMap = {
            'CarbonEmission': 'https://esg-kg.example.com/shapes/CarbonEmissionShape',
            'WaterUsage': 'https://esg-kg.example.com/shapes/WaterUsageShape',
            'EnergyConsumption': 'https://esg-kg.example.com/shapes/EnergyConsumptionShape',
            'WasteGeneration': 'https://esg-kg.example.com/shapes/WasteGenerationShape'
        };
        return shapeMap[metricType] || 'https://esg-kg.example.com/shapes/DefaultMetricShape';
    }
    async loadShapesFromDirectory(_directory) {
        const defaultShapes = [
            {
                uri: 'https://esg-kg.example.com/shapes/CarbonEmissionShape',
                targetClass: 'https://esg-kg.example.com/ontology/CarbonEmission',
                properties: [
                    {
                        path: 'https://esg-kg.example.com/ontology/hasValue',
                        datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
                        minCount: 1,
                        maxCount: 1
                    },
                    {
                        path: 'https://esg-kg.example.com/ontology/hasUnit',
                        datatype: 'http://www.w3.org/2001/XMLSchema#string',
                        minCount: 1,
                        maxCount: 1,
                        in: ['tCO2e', 'kgCO2e', 'mtCO2e']
                    }
                ]
            },
            {
                uri: 'https://esg-kg.example.com/shapes/DefaultMetricShape',
                targetClass: 'https://esg-kg.example.com/ontology/Metric',
                properties: [
                    {
                        path: 'https://esg-kg.example.com/ontology/hasValue',
                        datatype: 'http://www.w3.org/2001/XMLSchema#decimal',
                        minCount: 1
                    }
                ]
            }
        ];
        for (const shape of defaultShapes) {
            this.shapes.set(shape.uri, shape);
        }
    }
    async checkRdfSyntax(_rdfData, _format) {
        try {
            if (_format === 'text/turtle') {
                return _rdfData.includes('@prefix') || _rdfData.includes('<') || _rdfData.includes('a ');
            }
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=shacl.runner.js.map