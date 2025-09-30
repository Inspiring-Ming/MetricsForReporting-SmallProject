/**
 * SHACL Validator - RDF data validation using SHACL shapes
 * 
 * Responsibilities:
 * - Validate RDF data against SHACL shapes
 * - Parse validation reports
 * - Provide typed validation results
 * - Handle SHACL shape loading and management
 */

import { DomainError, StatusCodes } from '../../domain/errors/domain-errors';

export interface ShaclConfig {
  shapesDirectory: string;
  defaultShapeFormat: string;
  strictMode: boolean;
}

export interface ValidationResult {
  conforms: boolean;
  report?: ValidationReport;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationReport {
  type: string;
  conforms: boolean;
  results: ValidationResultItem[];
}

export interface ValidationResultItem {
  type: string;
  focusNode?: string;
  resultPath?: string;
  value?: string;
  sourceConstraintComponent?: string;
  sourceShape?: string;
  resultMessage?: string;
  resultSeverity?: string;
}

export interface ValidationError {
  path: string;
  message: string;
  value?: string;
  shape?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  path: string;
  message: string;
  value?: string;
  shape?: string;
}

export interface ShaclShape {
  uri: string;
  targetClass?: string;
  properties: ShaclProperty[];
}

export interface ShaclProperty {
  path: string;
  datatype?: string;
  minCount?: number;
  maxCount?: number;
  pattern?: string;
  in?: string[];
  class?: string;
}

export class ShaclValidationError extends DomainError {
  readonly code = 'SHACL_VALIDATION_ERROR';
  readonly statusCode = StatusCodes.BAD_REQUEST;
}

export class ShaclShapeLoadError extends DomainError {
  readonly code = 'SHACL_SHAPE_LOAD_ERROR';
  readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
}

export class ShaclRunner {
  private readonly config: ShaclConfig;
  private shapes: Map<string, ShaclShape> = new Map();
  private shapesLoaded: boolean = false;

  constructor(config: ShaclConfig) {
    this.config = config;
  }

  /**
   * Validate RDF data against SHACL shapes
   */
  async validate(
    rdfData: string, 
    rdfFormat: string = 'text/turtle',
    shapeUri?: string
  ): Promise<ValidationResult> {
    try {
      await this.ensureShapesLoaded();

      // Simulate SHACL validation
      // In production, use a SHACL validation library like rdf-validate-shacl
      const validationReport = await this.performValidation(rdfData, rdfFormat, shapeUri);
      
      return this.parseValidationReport(validationReport);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new ShaclValidationError(
        `SHACL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate specific metric data
   */
  async validateMetric(
    metricData: any,
    metricType: string
  ): Promise<ValidationResult> {
    try {
      // Convert metric data to RDF format
      const rdfData = this.convertMetricToRdf(metricData, metricType);
      
      // Get appropriate shape for metric type
      const shapeUri = this.getShapeUriForMetricType(metricType);
      
      return await this.validate(rdfData, 'text/turtle', shapeUri);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new ShaclValidationError(
        `Metric validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load SHACL shapes from directory
   */
  async loadShapes(): Promise<void> {
    try {
      // Simulate loading shapes from directory
      // In production, read actual SHACL shape files
      await this.loadShapesFromDirectory(this.config.shapesDirectory);
      this.shapesLoaded = true;
    } catch (error) {
      throw new ShaclShapeLoadError(
        `Failed to load SHACL shapes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get available shapes
   */
  getAvailableShapes(): ShaclShape[] {
    return Array.from(this.shapes.values());
  }

  /**
   * Get shape by URI
   */
  getShape(uri: string): ShaclShape | undefined {
    return this.shapes.get(uri);
  }

  /**
   * Validate RDF syntax only (without SHACL constraints)
   */
  async validateSyntax(rdfData: string, format: string = 'text/turtle'): Promise<ValidationResult> {
    try {
      // Simulate RDF syntax validation
      const syntaxValid = await this.checkRdfSyntax(rdfData, format);
      
      if (syntaxValid) {
        return {
          conforms: true,
          errors: [],
          warnings: []
        };
      } else {
        return {
          conforms: false,
          errors: [{
            path: 'syntax',
            message: 'RDF syntax error detected',
            severity: 'error' as const
          }],
          warnings: []
        };
      }
    } catch (error) {
      throw new ShaclValidationError(
        `RDF syntax validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Private helper methods

  private async ensureShapesLoaded(): Promise<void> {
    if (!this.shapesLoaded) {
      await this.loadShapes();
    }
  }

  private async performValidation(
    _rdfData: string, 
    _rdfFormat: string,
    _shapeUri?: string
  ): Promise<ValidationReport> {
    // Simulate SHACL validation process
    // In production, use actual SHACL validation library
    return {
      type: 'sh:ValidationReport',
      conforms: true,
      results: []
    };
  }

  private parseValidationReport(report: ValidationReport): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const result of report.results) {
      const severity = this.getSeverityLevel(result.resultSeverity);
      
      if (severity === 'error') {
        const error: ValidationError = {
          path: result.resultPath || 'unknown',
          message: result.resultMessage || 'Validation error',
          severity
        };
        if (result.value) error.value = result.value;
        if (result.sourceShape) error.shape = result.sourceShape;
        errors.push(error);
      } else if (severity === 'warning') {
        const warning: ValidationWarning = {
          path: result.resultPath || 'unknown',
          message: result.resultMessage || 'Validation warning'
        };
        if (result.value) warning.value = result.value;
        if (result.sourceShape) warning.shape = result.sourceShape;
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

  private getSeverityLevel(severity?: string): 'error' | 'warning' | 'info' {
    if (!severity) return 'error';
    
    const s = severity.toLowerCase();
    if (s.includes('violation') || s.includes('error')) return 'error';
    if (s.includes('warning')) return 'warning';
    return 'info';
  }

  private convertMetricToRdf(metricData: any, metricType: string): string {
    // Simulate conversion of metric data to RDF
    // In production, implement proper JSON-LD or direct RDF generation
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

  private getShapeUriForMetricType(metricType: string): string {
    // Map metric types to SHACL shape URIs
    const shapeMap: Record<string, string> = {
      'CarbonEmission': 'https://esg-kg.example.com/shapes/CarbonEmissionShape',
      'WaterUsage': 'https://esg-kg.example.com/shapes/WaterUsageShape',
      'EnergyConsumption': 'https://esg-kg.example.com/shapes/EnergyConsumptionShape',
      'WasteGeneration': 'https://esg-kg.example.com/shapes/WasteGenerationShape'
    };
    
    return shapeMap[metricType] || 'https://esg-kg.example.com/shapes/DefaultMetricShape';
  }

  private async loadShapesFromDirectory(_directory: string): Promise<void> {
    // Simulate loading SHACL shapes from files
    // In production, read actual .ttl or .rdf files containing SHACL shapes
    
    const defaultShapes: ShaclShape[] = [
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

  private async checkRdfSyntax(_rdfData: string, _format: string): Promise<boolean> {
    // Simulate RDF syntax validation
    // In production, use an RDF parser to validate syntax
    try {
      // Simple heuristic checks for Turtle format
      if (_format === 'text/turtle') {
        return _rdfData.includes('@prefix') || _rdfData.includes('<') || _rdfData.includes('a ');
      }
      return true;
    } catch {
      return false;
    }
  }
}
