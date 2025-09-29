# ESG Platform API Error Codes

> RFC 7807 Problem Details for HTTP APIs Compliance

## Overview

This document defines standardized error codes and problem details for the ESG Knowledge Graph Platform, ensuring consistent error handling across all API services (TypeScript and Go).

> 📌 **部署说明**：文档中所有的 `esg.platform` 都是示例域名，实际部署时需要替换为您的真实域名。

All error responses follow the [RFC 7807](https://tools.ietf.org/html/rfc7807) specification with the following structure:

```json
{
  "type": "https://esg.platform/problems/validation-failed",
  "title": "Validation Failed", 
  "status": 400,
  "detail": "The metric data contains invalid values",
  "instance": "/metrics/12345",
  "errors": [
    {
      "field": "unitIri",
      "code": "INVALID_IRI_FORMAT",
      "message": "Must be a valid HTTP(S) IRI"
    }
  ]
}
```

## Error Code Registry

### 1. Client Errors (4xx)

#### INVALID_CONTENT_TYPE
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/invalid-content-type`
- **Title**: "Invalid Content Type"
- **Description**: Unsupported Content-Type header
- **Use Cases**: Client sending text/plain when application/json expected

#### INVALID_JSON
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/invalid-json`
- **Title**: "Invalid JSON"
- **Description**: Request body contains malformed JSON syntax
- **Use Cases**: JSON parsing errors, syntax violations

#### MALFORMED_TTL
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/malformed-ttl`
- **Title**: "Malformed TTL"
- **Description**: Request body contains invalid Turtle/TTL syntax
- **Use Cases**: TTL parsing errors, RDF syntax violations

#### INVALID_BATCH_SIZE
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/invalid-batch-size`
- **Title**: "Invalid Batch Size"
- **Description**: Batch size exceeds configured limits
- **Use Cases**: Too many metrics in single batch request

#### VALIDATION_FAILED
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/validation-failed`
- **Title**: "Validation Failed"
- **Description**: Request data does not meet JSON Schema or SHACL constraints
- **Common Fields**: `errors[]` array with field-level validation details

**Sub-codes**:
- `REQUIRED_FIELD_MISSING`: Required field not provided
- `INVALID_DATA_TYPE`: Field type doesn't match schema  
- `INVALID_FORMAT`: Format validation failed (e.g., date-time, IRI)
- `VALUE_OUT_OF_RANGE`: Numeric value outside allowed bounds
- `INVALID_ENUM_VALUE`: Value not in allowed enumeration
- `PATTERN_MISMATCH`: String doesn't match regex pattern

#### CONFLICT
- **HTTP Status**: 409 Conflict
- **Type URI**: `https://esg.platform/problems/conflict`
- **Title**: "Resource Conflict"
- **Description**: Request conflicts with current resource state
- **Use Cases**: 
  - Duplicate metric submissions with different data
  - Concurrent updates on same resource
  - Idempotency key reused with different request body

#### NOT_FOUND
- **HTTP Status**: 404 Not Found
- **Type URI**: `https://esg.platform/problems/not-found`
- **Title**: "Resource Not Found"
- **Description**: Requested resource does not exist
- **Use Cases**: Metric not found, invalid IRI path

#### INVALID_QUERY_PARAMS
- **HTTP Status**: 400 Bad Request
- **Type URI**: `https://esg.platform/problems/invalid-query-params`
- **Title**: "Invalid Query Parameters"
- **Description**: Query parameters are malformed or invalid
- **Use Cases**: Invalid date format, unsupported computation codes

#### FORBIDDEN
- **HTTP Status**: 403 Forbidden  
- **Type URI**: `https://esg.platform/problems/forbidden`
- **Title**: "Access Forbidden"
- **Description**: Client lacks permission for the requested operation
- **Use Cases**: Read-only API access, entity-level permissions

### 2. Server Errors (5xx Server Errors)

#### INTERNAL_SERVER_ERROR
- **HTTP Status**: 500 Internal Server Error
- **Type URI**: `https://esg.platform/problems/internal-error`
- **Title**: "Internal Server Error"
- **Description**: Unexpected server-side error occurred

#### SERVICE_UNAVAILABLE
- **HTTP Status**: 503 Service Unavailable
- **Type URI**: `https://esg.platform/problems/service-unavailable` 
- **Title**: "Service Unavailable"
- **Description**: Dependent service (GraphDB, validation service) is unavailable

#### SHACL_VALIDATION_ERROR
- **HTTP Status**: 500 Internal Server Error
- **Type URI**: `https://esg.platform/problems/shacl-validation-error`
- **Title**: "SHACL Validation Error"
- **Description**: RDF data failed SHACL shape validation in GraphDB

## Error Arrays: `errors` vs `violations`

### Use `errors` for RFC 7807 Problem Details
All HTTP error responses (4xx, 5xx) should use `errors[]` array following RFC 7807 standard.

### Use `violations` for SHACL Validation Reports  
Only the `/validate` endpoint success responses use `violations[]` to return SHACL-specific constraint violations.

**Example - RFC 7807 Error Response**:
```json
{
  "type": "https://esg.platform/problems/validation-failed",
  "errors": [{"field": "value", "code": "VALUE_TOO_SMALL"}]
}
```

**Example - SHACL Validation Success**:
```json
{
  "isValid": false,
  "violations": [{"path": "esg:value", "constraint": "sh:minInclusive"}]
}
```

## Field-Level Error Structure

For RFC 7807 validation errors, include detailed field-level information:

```json
{
  "field": "unitIri",
  "code": "INVALID_IRI_FORMAT", 
  "message": "Must be a valid HTTP(S) IRI starting with http:// or https://",
  "value": "invalid-uri",
  "constraint": {
    "type": "format",
    "expected": "uri"
  }
}
```

### Standard Field Error Codes

| Code | Description | Example |
|------|-------------|---------|
| `REQUIRED_FIELD_MISSING` | Required field not provided | `framework` field missing |
| `INVALID_DATA_TYPE` | Wrong data type | String provided for numeric `value` |
| `INVALID_IRI_FORMAT` | Invalid IRI format | `unitIri` not a valid HTTP IRI |
| `INVALID_DATETIME_FORMAT` | Invalid ISO 8601 datetime | `asOf` field format error |
| `VALUE_TOO_SMALL` | Numeric value below minimum | `value` < 0 |
| `VALUE_TOO_LARGE` | Numeric value above maximum | String length > maxLength |
| `INVALID_FRAMEWORK` | Framework not in allowed list | `framework` not in enum |
| `INVALID_PATTERN` | String pattern validation failed | computation `code` contains invalid characters |
| `INVALID_CONTENT_TYPE` | Unsupported media type | Content-Type not application/json or text/turtle |
| `MALFORMED_SYNTAX` | Syntax parsing error | JSON or TTL syntax violation |
| `BATCH_SIZE_EXCEEDED` | Array size exceeds limit | metrics array > maxBatchSize |

## Implementation Guidelines

### TypeScript (api-public)

```typescript
export interface ProblemDetails {
  type: string;
  title: string; 
  status: number;
  detail: string;
  instance?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
  value?: any;
  constraint?: any;
}
```

### Go (api-internal)

```go
type ProblemDetails struct {
    Type     string       `json:"type"`
    Title    string       `json:"title"`
    Status   int          `json:"status"`
    Detail   string       `json:"detail"`
    Instance *string      `json:"instance,omitempty"`
    Errors   []FieldError `json:"errors,omitempty"`
}

type FieldError struct {
    Field      string      `json:"field"`
    Code       string      `json:"code"`
    Message    string      `json:"message"`
    Value      interface{} `json:"value,omitempty"`
    Constraint interface{} `json:"constraint,omitempty"`
}
```

## Error Response Examples

### JSON Schema Validation Error

```json
{
  "type": "https://esg.platform/problems/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request contains 3 validation errors", 
  "instance": "/public/v1/ingest",
  "errors": [
    {
      "field": "framework",
      "code": "REQUIRED_FIELD_MISSING",
      "message": "Framework is required"
    },
    {
      "field": "value", 
      "code": "INVALID_DATA_TYPE",
      "message": "Value must be a number",
      "value": "not-a-number"
    },
    {
      "field": "unitIri",
      "code": "INVALID_IRI_FORMAT", 
      "message": "Must be a valid HTTP(S) IRI",
      "value": "invalid-uri"
    }
  ]
}
```

### SHACL Validation Error

```json
{
  "type": "https://esg.platform/problems/shacl-validation-error",
  "title": "SHACL Validation Error", 
  "status": 500,
  "detail": "RDF data violates SHACL constraints",
  "instance": "/public/v1/validate",
  "errors": [
    {
      "field": "unitIri",
      "code": "SHACL_CONSTRAINT_VIOLATION",
      "message": "Unit IRI does not reference a valid QUDT unit",
      "constraint": {
        "shape": "esg:UnitConstraintShape",
        "path": "esg:hasUnit"
      }
    }
  ]
}
```

## Cross-Service Consistency

- Both TypeScript and Go services MUST use identical error codes and structure
- Error type URIs MUST be consistent across services
- Field names MUST match the JSON Schema property names exactly
- HTTP status codes MUST follow REST conventions and RFC 7807 guidelines

## Monitoring and Logging

- Log all error responses with correlation IDs for debugging
- Track error frequency by code for system health monitoring  
- Include request context (user, entity, operation) in error logs
- Never expose sensitive data in error responses or logs