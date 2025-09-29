# DTO to SHACL Mapping Documentation

> Ensuring consistency between JSON Schema (packages/dto) and SHACL Rules (packages/shacl)

## Overview

This document provides the definitive mapping between JSON Schema properties in `metric.schema.json` and SHACL shape constraints in the rules files. This ensures that validation rules are consistent across frontend form validation, API request validation, and RDF/GraphDB validation layers.

## Core Field Mappings

| JSON Schema Property | SHACL Path | SHACL Shape | Validation Rules |
|---------------------|------------|-------------|------------------|
| `framework` | `esg:framework` | `esg:MetricShape` | Required, enum: SASB\|GRI\|TCFD\|EU_TAXONOMY\|CSRD |
| `industry` | `esg:industry` | `esg:MetricShape` | Required, string, 1-100 chars, alphanumeric+spaces |
| `code` | `esg:code` | `esg:MetricShape` | Required, computation code ID, 1-50 chars, alphanumeric+hyphens |
| `entityId` | `esg:entityId` | `esg:MetricShape` | Required, string, 1-100 chars, alphanumeric+hyphens |
| `value` | `esg:value` | `esg:MetricShape` | Required, number, minimum: 0 |
| `unitIri` | `esg:unitIri` | `esg:MetricShape` | Required, IRI format, HTTP(S) pattern |
| `asOf` | `esg:asOf` | `esg:MetricShape` | Required, ISO 8601 datetime |
| `source` | `esg:source` | `esg:MetricShape` | Required, string, 1-500 chars |

## Detailed Validation Alignment

### 1. Framework Field

**JSON Schema**:
```json
{
  "framework": {
    "type": "string",
    "enum": ["SASB", "GRI", "TCFD", "EU_TAXONOMY", "CSRD"]
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:framework ;
    sh:name "framework" ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:datatype xsd:string ;
    sh:in ( "SASB" "GRI" "TCFD" "EU_TAXONOMY" "CSRD" ) ;
] ;
```

**Error Code**: `INVALID_ENUM_VALUE` when not in allowed values

### 2. Industry Field

**JSON Schema**:
```json
{
  "industry": {
    "type": "string",
    "minLength": 1,
    "maxLength": 100,
    "pattern": "^[A-Za-z0-9\\s\\-_]+$"
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:industry ;
    sh:name "industry" ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
    sh:minLength 1 ;
    sh:maxLength 100 ;
    sh:pattern "^[A-Za-z0-9\\s\\-_]+$" ;
] ;
```

**Error Codes**: 
- `REQUIRED_FIELD_MISSING` if missing
- `PATTERN_MISMATCH` if invalid characters
- `VALUE_TOO_LARGE` if > 100 chars

### 3. Code Field (Computation Code)

> **📌 重要**: `code`字段代表平台内部注册的运算代码，不是简单的标识符。每个code对应一个特定的指标计算逻辑，是平台提供的计算服务接口。

**JSON Schema**:
```json
{
  "code": {
    "type": "string",
    "minLength": 1,
    "maxLength": 50,
    "pattern": "^[A-Za-z0-9\\-._]+$"
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:code ;
    sh:name "code" ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
    sh:minLength 1 ;
    sh:maxLength 50 ;
    sh:pattern "^[A-Za-z0-9\\-._]+$" ;
] ;
```

**Framework-Specific Patterns**:
- SASB: `^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\\.[0-9]+$`  
- GRI: `^[0-9]{3}-[0-9]+$`

### 4. EntityId Field

**JSON Schema**:
```json
{
  "entityId": {
    "type": "string", 
    "minLength": 1,
    "maxLength": 100,
    "pattern": "^[A-Za-z0-9\\-._]+$"
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:entityId ;
    sh:name "entityId" ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
    sh:minLength 1 ;
    sh:maxLength 100 ;
    sh:pattern "^[A-Za-z0-9\\-._]+$" ;
] ;
```

### 5. Value Field

**JSON Schema**:
```json
{
  "value": {
    "type": "number",
    "minimum": 0
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:value ;
    sh:name "value" ;
    sh:minCount 1 ;
    sh:datatype xsd:decimal ;
    sh:minInclusive 0 ;
] ;
```

**Additional Constraints**:
- Percentage units: 0-100 range
- Fraction units: 0-1 range

### 6. UnitIri Field

**JSON Schema**:
```json
{
  "unitIri": {
    "type": "string",
    "format": "uri", 
    "pattern": "^https?://"
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:unitIri ;
    sh:name "unitIri" ;
    sh:minCount 1 ;
    sh:nodeKind sh:IRI ;
    sh:pattern "^https?://" ;
] ;
```

**QUDT Validation**: Must reference approved QUDT units in `esg:UnitConstraintShape`

### 7. AsOf Field

**JSON Schema**:
```json
{
  "asOf": {
    "type": "string",
    "format": "date-time"
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:asOf ;
    sh:name "asOf" ;
    sh:minCount 1 ;
    sh:datatype xsd:dateTime ;
] ;
```

**Temporal Constraints**:
- Not in future (business rule)
- Not before 1900-01-01
- OWL-Time integration for temporal reasoning

### 8. Source Field

**JSON Schema**:
```json
{
  "source": {
    "type": "string",
    "minLength": 1, 
    "maxLength": 500
  }
}
```

**SHACL Rule**:
```turtle
sh:property [
    sh:path esg:source ;
    sh:name "source" ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
    sh:minLength 1 ;
    sh:maxLength 500 ;
] ;
```

**Provenance Patterns**:
- Must reference formal documents (Report, Annual, etc.)
- Should include year (20XX format)

## Cross-Validation Rules

### Framework-Code Consistency

| Framework | Code Pattern | SHACL Shape |
|-----------|--------------|-------------|
| SASB | `FN-CB-410a.1` | `esg:SASBFrameworkShape` |
| GRI | `201-1` | `esg:GRIFrameworkShape` |
| TCFD | Custom | Future implementation |

### Industry-Unit Compatibility  

| Industry | Allowed Units | SHACL Shape |
|----------|---------------|-------------|
| Commercial Banks | Currency, Percentage, Count | `esg:BankingMetricsConstraints` |
| Manufacturing | Mass, Energy, Volume | Future implementation |

## Error Code Mappings

### JSON Schema → SHACL → API Error

| Validation Failure | JSON Schema | SHACL Violation | API Error Code |
|-------------------|-------------|-----------------|----------------|
| Missing required field | `required` | `sh:minCount 1` | `REQUIRED_FIELD_MISSING` |
| Wrong data type | `type` | `sh:datatype` | `INVALID_DATA_TYPE` |
| Invalid format | `format` | `sh:nodeKind` | `INVALID_FORMAT` |
| Pattern mismatch | `pattern` | `sh:pattern` | `PATTERN_MISMATCH` |
| Value out of range | `minimum/maximum` | `sh:minInclusive` | `VALUE_OUT_OF_RANGE` |
| Invalid enum value | `enum` | `sh:in` | `INVALID_ENUM_VALUE` |

## Implementation Checklist

### Frontend (TypeScript)
- [ ] JSON Schema validation before API calls
- [ ] Field-level error messages matching error codes
- [ ] Real-time validation feedback
- [ ] Unit selection from QUDT vocabulary

### API Layer (TypeScript/Go)  
- [ ] JSON Schema validation on request
- [ ] RFC 7807 error responses
- [ ] SHACL validation before GraphDB insertion
- [ ] Consistent error codes across services

### GraphDB Layer
- [ ] SHACL shapes imported into repository
- [ ] Validation on RDF insertion
- [ ] Named graph organization for versions
- [ ] SPARQL queries respecting constraints

## Maintenance Guidelines

### Adding New Fields
1. Update `metric.schema.json` with new property
2. Add corresponding SHACL property constraint
3. Update this mapping documentation
4. Add field-level error codes to `ERROR_CODES.md`
5. Update TypeScript/Go type definitions

### Modifying Constraints
1. Ensure JSON Schema and SHACL changes are synchronized
2. Update validation error messages
3. Test with sample data
4. Version control for backward compatibility

### QUDT Unit Extensions
1. Add new units to approved list in `esg:UnitConstraintShape`
2. Update JSON Schema examples
3. Document business rationale
4. Test unit-value compatibility

## Testing Strategy

### Unit Tests
- Validate each field independently
- Test boundary conditions (min/max lengths, ranges)
- Verify pattern matching (regex consistency)
- Cross-field validation scenarios

### Integration Tests  
- End-to-end validation pipeline
- Error response format consistency
- GraphDB SHACL validation
- Performance with large datasets

### Sample Valid Data
```json
{
  "framework": "SASB",
  "industry": "Commercial Banks", 
  "code": "FN-CB-410a.1",
  "entityId": "bank-001",
  "value": 1250000.00,
  "unitIri": "http://qudt.org/vocab/unit/USD",
  "asOf": "2023-12-31T23:59:59Z",
  "source": "Annual Report 2023"
}
```

### Sample Invalid Data with Expected Errors
```json
{
  "framework": "INVALID",           // → INVALID_ENUM_VALUE
  "industry": "",                   // → VALUE_TOO_SMALL  
  "code": "invalid@code",           // → PATTERN_MISMATCH
  "entityId": "",                   // → REQUIRED_FIELD_MISSING
  "value": -100,                    // → VALUE_OUT_OF_RANGE
  "unitIri": "not-a-uri",          // → INVALID_IRI_FORMAT
  "asOf": "invalid-date",          // → INVALID_DATETIME_FORMAT
  "source": ""                     // → REQUIRED_FIELD_MISSING
}
```

This mapping ensures that validation is consistent across all layers of the ESG Knowledge Graph Platform, providing reliable data quality and user experience.