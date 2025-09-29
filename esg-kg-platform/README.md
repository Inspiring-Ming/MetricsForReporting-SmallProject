# ESG Knowledge Graph Platform

A comprehensive platform for ESG (Environmental, Social, and Governance) metrics ingestion, validation, and reporting using Knowledge Graph technology.

## Architecture Overview

This platform follows a **dual-API architecture** with clear separation of concerns:

- **🔴 Public API (Write Service)**: TypeScript/Fastify service for data ingestion and validation
- **🔵 Internal API (Read Service)**: Go service optimized for high-performance queries and reporting

### Service Responsibilities

| Service | Technology | Purpose | Key Features |
|---------|------------|---------|--------------|
| **Public API** | TypeScript + Fastify | **Write Operations** | • JSON to RDF conversion<br>• SHACL validation<br>• Data ingestion<br>• Authentication |
| **Internal API** | Go + Chi Router | **Read Operations** | • High-performance SPARQL queries<br>• Time-series data retrieval<br>• Report generation<br>• Caching layer |

### 🧮 Computational Code System

The platform uses a **computation code system** to manage ESG metric calculation logic:

#### Core Concepts
- **Code ≠ Simple ID**: `code` is not a simple identifier, it is a **computation code** registered in the platform
- **One-to-One Mapping**: Each `code` matches one specific metric calculation method
- **Computation Service**: `code` is a service interface that uses registered code versions to compute metrics
- **Version Control**: Each calculation logic has version management to ensure consistent and traceable results

#### Workflow
```
Client Request → Specify Code → Platform Executes Logic → Returns Metric Value
```

#### Example
```javascript
// Client specifies computation code
{
  "framework": "SASB",
  "industry": "Commercial Banks", 
  "code": "FN-CB-410a.1",  // This is computation code for "Small Business Loan Balance Calculation Logic v1.2.3"
  "entityId": "bank-001",
  // ... other parameters
}

// Platform internal execution:
// code "FN-CB-410a.1" → Call registered calculation algorithm → Generate metric value
```

This design ensures:
- ✅ **Standardization**: Same code gives consistent results across different times and clients
- ✅ **Reusability**: Same calculation logic can be used by multiple entities  
- ✅ **Maintainability**: Calculation logic is centrally managed for easy updates and fixes
- ✅ **Traceability**: Every calculation has clear code version records

## 🏗️ Project Structure

```
esg-kg-platform/
├─ apps/                              # Application services
│  ├─ api-public/                     # 📝 TypeScript Write Service (Fastify)
│  │  ├─ src/
│  │  │  ├─ main.ts                   # Entry point
│  │  │  ├─ interfaces/http/          # HTTP controllers & routes
│  │  │  ├─ application/              # Business use cases
│  │  │  ├─ domain/                   # Domain models & entities
│  │  │  └─ infrastructure/           # External system adapters
│  │  └─ Dockerfile
│  │
│  ├─ api-internal/                   # 📊 Go Read Service (Chi/Gin)
│  │  ├─ cmd/internal-api/            # Application entry point
│  │  ├─ internal/
│  │  │  ├─ interfaces/http/          # HTTP handlers & middleware
│  │  │  ├─ application/              # Business services
│  │  │  ├─ domain/                   # Domain entities
│  │  │  └─ infrastructure/           # Data access layer
│  │  └─ Dockerfile
│  │
│  └─ web/                            # 🌐 Frontend (Future)
│
├─ packages/                          # Shared libraries
│  ├─ dto/                           # TypeScript types & JSON schemas
│  ├─ shacl/                         # SHACL validation rules
│  └─ utils-ts/                      # Shared TypeScript utilities
│
├─ contracts/                         # API contracts
│  ├─ public-api/v1/openapi.yaml     # Public API specification
│  └─ internal-api/v1/openapi.yaml   # Internal API specification
│
├─ infra/                            # Infrastructure configuration
│  ├─ compose.yml                    # Docker Compose for local dev
│  ├─ graphdb/                       # GraphDB configuration
│  ├─ docker/                        # Service Dockerfiles
│  └─ gateway/                       # API Gateway configuration
│
├─ scripts/                          # Development & deployment scripts
├─ docs/                             # Architecture & API documentation
└─ Makefile                          # Development workflow automation
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following tools installed:

### Required Tools
- **Node.js** LTS (v18+) - [Download](https://nodejs.org/)
- **pnpm** (v8+) - [Installation Guide](https://pnpm.io/installation)
- **Go** (v1.22+) - [Download](https://golang.org/dl/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Make** - Usually pre-installed on macOS/Linux

### Verification
```bash
# Check versions
node --version    # Should be v18+
pnpm --version    # Should be v8+
go version        # Should be go1.22+
docker --version  # Should be 20+
make --version    # Any recent version
```

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/Inspiring-Ming/MetricsForReporting-SmallProject.git
cd MetricsForReporting-SmallProject/esg-kg-platform

# Install all dependencies and start infrastructure
make setup
```

### 2. Start Development Services

**Option A: Full Development Environment**
```bash
# Terminal 1: Infrastructure (GraphDB, Redis)
make up

# Terminal 2: Public API (Write Service)
make dev-public

# Terminal 3: Internal API (Read Service)  
make dev-internal
```

**Option B: Step-by-step**
```bash
# 1. Start infrastructure services
make up

# 2. Install dependencies
make install

# 3. Start services individually (in separate terminals)
make dev-public    # TypeScript service on :3001
make dev-internal  # Go service on :3002
```

### 3. Verify Installation
```bash
# Check if services are running
curl http://localhost:3001/public/v1/health    # Public API
curl http://localhost:3002/internal/v1/healthz # Internal API

# Check GraphDB REST API
curl http://localhost:7200/rest/repositories

# Access GraphDB Workbench
open http://localhost:7200
```

#### GraphDB Access Information

- **GraphDB Workbench URL**: http://localhost:7200
- **Default Credentials**: No authentication required for local development
- **Repository Name**: `esg-repo` (auto-configured with SHACL validation)
- **SPARQL Endpoint**: http://localhost:7200/repositories/esg-repo
- **Graph Store Protocol**: http://localhost:7200/repositories/esg-repo/rdf-graphs/service

**Repository Features**:
- ✅ SHACL validation enabled for data quality
- ✅ OWL reasoning for semantic inference  
- ✅ Full-text search indexing
- ✅ Named graph support for provenance tracking
- ✅ Geo-spatial querying (GeoSPARQL)

**First-time Setup**:
1. Open GraphDB Workbench at http://localhost:7200
2. The `esg-repo` repository should be automatically available
3. Navigate to "Import" → "RDF" to load initial ontologies
4. Use "SPARQL" tab to run queries against ESG data

## 📚 Development Workflow

### Available Make Targets

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make setup` | Complete setup: dependencies + infrastructure |
| `make up` | Start infrastructure services (GraphDB, Redis) |
| `make down` | Stop all infrastructure services |
| `make dev-public` | Start Public API in development mode |
| `make dev-internal` | Start Internal API in development mode |
| `make build` | Build all services for production |
| `make test` | Run all tests (TypeScript + Go) |
| `make lint` | Run linters for all services |
| `make format` | Format code for all services |
| `make gen` | Generate client code from OpenAPI specs |
| `make clean` | Clean all build artifacts and containers |

### Environment Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Customize values in `.env` file as needed

3. Key environment variables:
   - `GRAPHDB_URL`: GraphDB connection URL
   - `JWT_SECRET`: JWT signing secret
   - `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

## 🌐 Frontend Integration Guide

> ⚠️ **Important Notice: Strict Content-Type Limits**

### Data Format Requirements

**Core Rule**: **Ingest endpoints only accept application/json; TTL only allowed in validate endpoint**

**✅ Correct Data Submission**:
- **Write Endpoints** (`/public/v1/ingest/metric`, `/public/v1/ingest/batch`): **Only accept `application/json`**
- **Validate Endpoint** (`/public/v1/validate`): Supports both `application/json` and `text/turtle`

**❌ Common Mistakes**:
```javascript
// ❌ Wrong: Don't POST TTL directly to write endpoints
fetch('/public/v1/ingest/metric', {
  method: 'POST',
  headers: { 'Content-Type': 'text/turtle' },  // 🚫 Write endpoints don't support TTL
  body: '@prefix esg: <...> .'
});

// ✅ Correct: Always use JSON format for data submission
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
```

### Architecture Explanation

**JSON → TTL Conversion** handled internally by `IngestService`:
1. Frontend submits ESG metric data in JSON format
2. IngestService automatically generates standardized Metric IRI
3. Internal conversion to RDF/TTL format and writes to GraphDB
4. TTL conversion is completely transparent to frontend

**Validation Workflow**:
- To validate TTL format, use the separate `/public/v1/validate` endpoint
- This endpoint supports both JSON and TTL formats for validation testing
- After validation passes, data writing still requires JSON format calls to write endpoints

### TypeScript Interface Definitions

```typescript
// Standard ESG Metric Interface
interface ESGMetric {
  framework: "SASB" | "GRI" | "TCFD" | "EU_TAXONOMY" | "CSRD";
  industry: string;
  code: string;  // Platform registered computation code ID, each code maps to specific metric calculation logic
  entityId: string;
  value: number;
  unitIri: string;
  asOf: string;  // ISO 8601 datetime
  source: string;
}

// API Response Type
interface IngestResponse {
  success: true;
  batchId: string;
  metricIri: string;
  namedGraph: string;
  triplesCount: number;
  duration: number;
}

// Error Response Type (RFC 7807)
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  violations?: FieldError[];
}
```

## 🔌 API Endpoints

### 🔴 Public API (Write Service) - Port 3001
**Focused on data ingestion pipeline**:
```
POST /public/v1/validate             # Data validation (JSON + TTL)
POST /public/v1/ingest/metric        # Single metric ingestion (JSON format only)
POST /public/v1/ingest/batch         # Batch metric ingestion (JSON format only)
GET  /public/v1/health               # Health check
```

> ⚠️ **Important**: Write endpoints (`/ingest/*`) only accept `application/json` format, TTL format only allowed in validation endpoint.

### 🔵 Internal API (Read Service) - Port 3002  
**Focused on high-performance queries and knowledge graph navigation**:
```
GET  /internal/v1/frameworks                 # Get reporting frameworks for specific industry
GET  /internal/v1/categories                 # Get categories under framework
GET  /internal/v1/metrics                    # Get metric lists under category
GET  /internal/v1/metric-codes               # Get computation codes for metrics
POST /internal/v1/computation-methods        # Get calculation methods for computation codes
POST /internal/v1/compute                    # Execute computation model
POST /internal/v1/sparql                     # SPARQL queries (SELECT only)
GET  /internal/v1/healthz                    # Health check
```

> 📋 **Separation of Concerns**: Write operations handled by TypeScript service, read operations optimized by Go service, ensuring best performance and security boundaries.

## 🌐 Service Access & Configuration

### GraphDB Knowledge Graph Database
- **Workbench UI**: http://localhost:7200
- **SPARQL Endpoint**: http://localhost:7200/repositories/esg-repo  
- **Repository**: `esg-repo` (auto-configured)
- **Authentication**: None required (local development)
- **Features**: SHACL validation, OWL reasoning, full-text search

### Redis Cache
- **Host**: localhost:6379
- **Database**: 0 (configurable in `.env`)
- **Authentication**: None required (local development)

### ESG Data Model
- **Base IRI**: `https://kg.example.org/`
- **Metric Pattern**: `https://kg.example.org/esg/metric/{entityId}/{framework}/{industry}/{code}/{asOf}`
  - `code`: Platform registered computation code, corresponding to specific metric calculation logic
- **Named Graphs**: `urn:g/{yyyy-mm-dd}/ingest-{batchId}`
- **Supported Ontologies**: QUDT, OWL-Time, PROV-O, SHACL

For detailed IRI patterns and naming conventions, see [docs/NAMING-CONVENTIONS.md](docs/NAMING-CONVENTIONS.md).

## 🧪 Testing

### Run All Tests
```bash
make test
```

### Run Specific Tests
```bash
# TypeScript tests
cd apps/api-public && pnpm test

# Go tests  
cd apps/api-internal && make test

# Integration tests
cd apps/api-public && pnpm test:integration
```

## 📦 Building for Production

### Build All Services
```bash
make build
```

### Build Individual Services
```bash
# TypeScript service
cd apps/api-public && pnpm build

# Go service
cd apps/api-internal && make build
```

### Docker Images
```bash
# Build all Docker images
docker compose -f infra/compose.yml build

# Build specific service
docker build -f apps/api-public/Dockerfile -t esg-kg-public .
docker build -f apps/api-internal/Dockerfile -t esg-kg-internal .
```

## 🔧 Configuration

### GraphDB Setup
1. Access GraphDB Workbench: http://localhost:7200
2. Create repository: `esg-repo` 
3. Import initial schemas from `packages/shacl/rules/`

### SHACL Validation
- Rules located in: `packages/shacl/rules/`
- Validation triggered automatically during ingestion
- Custom shapes can be added for domain-specific validation

## 📖 Documentation

- **Architecture Decisions**: [docs/ADR-0001-architecture.md](docs/ADR-0001-architecture.md)
- **API Contracts**: [contracts/](contracts/)
- **Security Guide**: [docs/SECURITY.md](docs/SECURITY.md)  
- **Versioning Strategy**: [docs/VERSIONING.md](docs/VERSIONING.md)

## 🛡️ Security

- **Authentication**: JWT-based authentication for API access
- **Authorization**: Scope-based permissions (`esg.ingest`, `esg.read`, `esg.validate`)
- **Data Validation**: SHACL-based validation for all ingested data
- **Rate Limiting**: Configurable rate limits on all endpoints

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and use provided linters
2. **Testing**: Add tests for new features
3. **Documentation**: Update relevant documentation
4. **API Changes**: Update OpenAPI specifications in `contracts/`

### Development Guidelines
- Use Clean Architecture principles
- Maintain separation between Public (write) and Internal (read) APIs
- Follow semantic versioning for API changes
- Write comprehensive tests

## 📋 Troubleshooting

### Common Issues

**GraphDB Connection Issues**
```bash
# Check if GraphDB is running
docker ps | grep graphdb

# View GraphDB logs
docker logs esg-kg-platform-graphdb-1
```

**Port Conflicts**
```bash
# Check what's using the ports
lsof -i :3001  # Public API
lsof -i :3002  # Internal API  
lsof -i :7200  # GraphDB
```

**Dependency Issues**
```bash
# Clean and reinstall
make clean
make install
```

## 🚀 Deployment Configuration

### Domain Configuration

All `esg.platform` in documentation are example domains, replace them for production deployment:

**Configuration Items to Replace**:
```bash
# Environment Variables
DOMAIN_NAME=your-company.com
API_BASE_URL=https://api.your-company.com

# IRI Base Paths
METRIC_IRI_BASE=https://your-company.com/data/metric
PROBLEM_TYPE_BASE=https://your-company.com/problems
ONTOLOGY_BASE=https://your-company.com/ontology
```

**Affected Files**:
- `packages/dto/ERROR_CODES.md` - RFC 7807 error type URIs
- `apps/api-public/docs/API_CONTRACTS.md` - IRI generation examples
- `apps/api-public/docs/ERROR_HANDLING.md` - Error type examples
- Application config files with IRI generation logic

### SSL Certificates

Production environment must use HTTPS:
```bash
# Configure SSL certificate paths
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/private.key
```

## �📞 Support

For questions and support:
- Check [documentation](docs/)
- Review [API contracts](contracts/)
- Check existing issues in the repository

## 📄 License

[Add your license information here]