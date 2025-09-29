# ESG Platform Write Pipeline Design

> Complete responsibility division, exception flow, monitoring strategy and interaction sequence design

## Overall Design Principles

### Core Goals
- **Clear Responsibilities**: Three-layer architecture with clear division, avoiding cross-layer coupling
- **Controllable Exceptions**: Complete error classification, retry mechanisms and fallback strategies
- **Full Observability**: Structured logging, performance monitoring and health checks
- **Standard Contracts**: Unified input/output formats and RFC 7807 error responses

### 架构概览
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                              │
│         (Form Validation + Error Handling)              │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────┐
│                 Interfaces Layer                        │
│  Routes (/public/*)  │  Middleware (Auth+Log+Error+Rate) │
└─────────────────────┬───────────────────────────────────┘
                      │ Domain Objects
┌─────────────────────▼───────────────────────────────────┐
│                Application Layer                         │
│  Validation Service  │  Ingest Service  │  Provenance   │
│       ↕             │       ↕         │      ↕        │
│   Port Interfaces   │   Port Interfaces │ Port Interfaces│
└─────────────────────┬───────────────────────────────────┘
                      │ Technical Protocols
┌─────────────────────▼───────────────────────────────────┐
│              Infrastructure Layer                       │
│  GraphDB Client  │  SHACL Validator  │  IRI + Logging  │
└─────────────────────────────────────────────────────────┘
```

## Design Documentation Structure

### 📋 1. [Layered Responsibility Architecture](./ARCHITECTURE.md)
**Content**: Responsibility division and boundary definition under hexagonal architecture
- **Interfaces Layer**: HTTP Routes + Middleware
- **Application Layer**: Business services + Port definitions  
- **Infrastructure Layer**: External system adapters

**Key Responsibility Boundaries**:
- Interface layer only handles HTTP protocol adaptation, no business logic
- Application layer orchestrates business processes, decoupled from infrastructure through ports
- Infrastructure layer focuses on technical implementation, contains no business rules

### 🔄 2. [Error Handling and Retry Strategy](./ERROR_HANDLING.md)  
**Content**: Exception classification, retry mechanisms and fallback strategies
- **4xx Client Errors**: No retry (422 validation failure, 409 conflict)
- **5xx Server Errors**: Exponential backoff retry + Circuit breaker
- **Error Propagation Chain**: Infrastructure → Application → HTTP → RFC7807

**Retry Configuration**:
- GraphDB connection: Max 3 times, 1s→2s→4s exponential backoff
- Circuit breaker: Opens after 5 failures, attempts recovery after 60s
- Compensation mechanism: Automatic rollback and cleanup for failed transactions

### 📊 3. [Observability Strategy](./OBSERVABILITY.md)
**Content**: Logging, health checks, performance monitoring
- **Structured Logging**: JSON format, includes requestId, batchId, performance metrics
- **Health Checks**: GraphDB + SHACL service connectivity checks
- **Performance Monitoring**: Prometheus metrics + Grafana dashboard
- **Rate Limiting**: Multi-level limits (global/user/operation level)

**Key Metrics**:
- Validation response time P95 < 500ms
- Write response time P95 < 1000ms  
- System availability > 99.5%
- Error rate < 1%

### 📝 4. [API Input/Output Contracts](./API_CONTRACTS.md)
**Content**: Input/output specifications for each route and service
- **Write Endpoints**: `/validate`, `/ingest/metric`, `/ingest/batch` 
- **Read Endpoints**: `/metrics/{path}`, `/metrics?query`, `/frameworks`, `/codes`
- **Service Level Contracts**: Application layer service interface definitions
- **Port Level Contracts**: Infrastructure adapter interfaces

**Standardization Elements**:
- RFC 7807 error response format
- JSON Schema data validation  
- Unified error code system
- Structured field-level error information
- Complete CRUD operation support

### 🔄 5. [Sequence Diagrams and Interaction Flows](./SEQUENCE_DIAGRAMS.md)
**Content**: Detailed sequence diagrams for validation and write processes

#### Validation Flow
```
Frontend → Routes → Middleware → ValidationService → ShaclValidator → Result
```
#### Write Flow  
```
Frontend → Routes → IngestService → [Validate → Convert → Write → Provenance] → Result
```

## Key Design Decisions

### ✅ Adopted Patterns

1. **Hexagonal Architecture**: Separation of business logic and technical implementation through ports and adapters
2. **Dependency Inversion**: Application layer defines interfaces, infrastructure layer implements
3. **Event-Driven Logging**: Structured events recorded at key business nodes
4. **Fail Fast**: Client errors return immediately, no invalid retries
5. **Progressive Degradation**: Non-critical feature failures don't affect core write process

### ❌ Avoided Anti-Patterns

1. **Cross-Layer Calls**: Avoid interface layer directly calling infrastructure layer
2. **Business Logic Leakage**: Infrastructure layer contains no business decisions
3. **Excessive Retry**: Clear distinction between retryable and non-retryable errors
4. **Single Point of Failure**: Connection pools and circuit breakers prevent dependency service failures
5. **Inconsistent Errors**: Unified error format and encoding standards

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Independent testing per layer, ports use mocks
- **Integration Tests**: End-to-end API tests including error scenarios
- **Performance Tests**: Load testing to verify SLA targets
- **Chaos Engineering**: Dependency service failure testing

### Monitoring and Alerts
- **Business Metrics**: Validation success rate, write success rate, response time
- **Technical Metrics**: Error rate, connection pool status, memory usage
- **Dependency Monitoring**: GraphDB availability, SHACL service status
- **Exception Alerts**: Circuit breaker opening, abnormal retry counts

### Operations Support
- **Observability**: Full-chain log tracing and metric monitoring
- **Troubleshooting**: Detailed error information and diagnostic interfaces
- **Capacity Planning**: Performance baselines and scaling recommendations
- **Emergency Response**: Degradation switches and emergency procedures

## Scalability Considerations

### Horizontal Scaling
- Stateless service design supporting multi-instance deployment
- Connection pool and caching strategy optimization
- Load balancing and service discovery

### Feature Extension  
- New ESG framework support (port extension)
- Multi-data source integration (adapter extension)
- Asynchronous processing mode (message queue)

### Technology Evolution
- Microservice splitting strategy
- Event sourcing pattern
- CQRS read-write separation

## 🌐 Frontend Integration Important Notice

### ⚠️ Strict Content-Type Limits

**Core Rule**: **Ingest endpoints only accept application/json; TTL only allowed in validate endpoint**

#### Correct Approach ✅

```javascript
// ✅ Data Write - Must be JSON format
fetch('/public/v1/ingest/metric', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    framework: "SASB",
    industry: "Commercial Banks",
    code: "FN-CB-410a.1",  // Computation code: calls registered small business loan balance calculation logic
    entityId: "bank-001",
    value: 1250000.00,
    unitIri: "http://qudt.org/vocab/unit/USD",
    asOf: "2023-12-31T23:59:59Z",
    source: "Annual Report 2023"
  })
});

// ✅ Data Validation - Supports JSON and TTL
fetch('/public/v1/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'text/turtle' },  // Only validation endpoint supports TTL
  body: '@prefix esg: <...> .'
});
```

#### Common Mistakes ❌

```javascript
// ❌ Wrong: Don't POST TTL to write endpoints
fetch('/public/v1/ingest/metric', {
  method: 'POST', 
  headers: { 'Content-Type': 'text/turtle' },  // 🚫 Write endpoints don't support TTL
  body: '@prefix esg: <...> .'
});
```

**Architecture Explanation**: JSON→TTL conversion handled internally by IngestService, frontend doesn't need to worry about RDF format conversion.

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-28
