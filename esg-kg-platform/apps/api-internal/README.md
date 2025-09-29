# ESG Platform Internal API

> Go language high-performance read service: specialized for queries, aggregation, read-only security boundaries

## 🎯 Service Positioning

### Core Responsibilities
- **🔍 High-Performance Queries**: Optimized SPARQL query execution
- **📊 Data Aggregation**: Cross-time, cross-entity data aggregation
- **📈 Time Series**: Trend analysis and historical data comparison
- **💾 Smart Caching**: Multi-layer caching strategy, Redis + in-memory cache
- **🔒 Read-Only Security**: Strict SELECT-only constraints, prohibiting modification operations

### Technical Features
- **Language**: Go 1.22+
- **Framework**: Chi Router + custom middleware
- **Database**: GraphDB (RDF4J)
- **Cache**: Redis Cluster
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured JSON logging

## 🏗️ Project Structure

```
apps/api-internal/
├── cmd/
│   └── api/
│       └── main.go                   # Application entry point
├── internal/
│   ├── interfaces/
│   │   └── http/
│   │       ├── router.go            # Route configuration (/internal/v1/*)
│   │       ├── middleware/          # Middleware (auth, logging, rate limiting)
│   │       └── handlers/            # HTTP handlers
│   │           ├── metrics.go       # Metric queries
│   │           ├── sparql.go        # SPARQL queries
│   │           ├── timeseries.go    # Time series
│   │           └── health.go        # Health checks
│   ├── application/
│   │   ├── services/               # Application service layer
│   │   │   ├── metric_service.go   # Metric query service
│   │   │   ├── query_service.go    # SPARQL query service
│   │   │   └── report_service.go   # Report generation service
│   │   └── ports/                  # Port interface definitions
│   │       ├── graph_reader.go     # GraphDB read interface
│   │       ├── cache.go            # Cache interface
│   │       └── rdb_reader.go       # RDB read interface (optional)
│   ├── infrastructure/
│   │   ├── graph/                  # GraphDB adapter
│   │   │   ├── client.go          # RDF4J client
│   │   │   └── query_builder.go   # SPARQL query builder
│   │   ├── cache/                  # Redis adapter
│   │   │   ├── redis_client.go    # Redis client
│   │   │   └── serializer.go      # Serializer
│   │   └── monitoring/             # Monitoring adapter
│   │       ├── prometheus.go      # Metrics collection
│   │       └── health_check.go    # Health checks
│   └── domain/
│       ├── entities/              # Domain entities
│       └── valueobjects/          # Value objects
├── docs/
│   ├── API_CONTRACTS.md           # API contract documentation  
│   ├── ARCHITECTURE.md            # Architecture design documentation
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── PERFORMANCE.md             # Performance tuning guide
├── configs/
│   ├── config.yaml                # Configuration file
│   └── docker-compose.yml         # Local development environment
├── scripts/
│   ├── build.sh                   # Build script
│   └── migrate.sh                 # Data migration script
├── go.mod
├── go.sum
├── Dockerfile
└── Makefile
```

## 🚀 Quick Start

### Prerequisites
- Go 1.22+
- GraphDB 10.0+
- Redis 7.0+
- Docker & Docker Compose

### Local Development

#### 1. Clone project and install dependencies
```bash
cd esg-kg-platform/apps/api-internal
go mod download
```

#### 2. Start dependency services
```bash
# Start GraphDB and Redis
docker-compose -f ../../infra/compose.yml up -d graphdb redis

# Wait for services to start
make wait-for-services
```

#### 3. Configure environment variables
```bash
# Copy configuration file
cp configs/config.example.yaml configs/config.yaml

# Edit configuration
export GRAPHDB_ENDPOINT=http://localhost:7200
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=your-jwt-secret
```

#### 4. Start service
```bash
# Development mode
make run

# Or run directly
go run cmd/api/main.go
```

#### 5. Verify service
```bash
# Health check
curl http://localhost:3002/internal/v1/healthz

# Query metrics
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:3002/internal/v1/metrics?framework=SASB&limit=5
```

## 🔧 Configuration Guide

### Configuration File (`configs/config.yaml`)
```yaml
server:
  port: 3002
  host: "0.0.0.0"
  read_timeout: 30s
  write_timeout: 30s

graphdb:
  endpoint: "http://graphdb:7200"
  repository: "esg-repo"
  timeout: 30s
  max_connections: 100
  
redis:
  url: "redis://redis:6379/0"
  password: ""
  max_retries: 3
  pool_size: 100
  
cache:
  default_ttl: 1h
  max_size: 1GB
  eviction_policy: "lru"

auth:
  jwt_secret: "${JWT_SECRET}"
  required_audience: "teammate-api"
  required_scope: "esg.read"

monitoring:
  enabled: true
  prometheus_port: 9090
  log_level: "info"
  
performance:
  max_query_time: 30s
  max_concurrent_queries: 50
  cache_compression: true
```

### Environment Variables
| Variable Name | Description | Default Value |
|---------------|-------------|---------------|
| `PORT` | Service port | 3002 |
| `GRAPHDB_ENDPOINT` | GraphDB address | http://localhost:7200 |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing key | (required) |
| `LOG_LEVEL` | Log level | info |

## 📊 API Usage Examples

### Authentication Setup
```bash
# Get JWT Token (example)
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Set authentication header
AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"
```

### Query Metric Data
```bash
# Get banking industry metrics under SASB framework
curl -H "$AUTH_HEADER" \
  "http://localhost:3002/internal/v1/metrics?framework=SASB&industry=Commercial%20Banks&limit=10"

# Query by entity ID
curl -H "$AUTH_HEADER" \
  "http://localhost:3002/internal/v1/metrics?entityId=bank-001&limit=5"

# Date range query
curl -H "$AUTH_HEADER" \
  "http://localhost:3002/internal/v1/metrics?from=2023-01-01&to=2023-12-31"
```

### Time Series Queries
```bash
# Get time series for specific computation code
curl -H "$AUTH_HEADER" \
  "http://localhost:3002/internal/v1/metrics/FN-CB-410a.1/timeseries?startDate=2023-01-01&endDate=2023-12-31&interval=monthly"

# Multi-entity aggregation
curl -H "$AUTH_HEADER" \
  "http://localhost:3002/internal/v1/metrics/FN-CB-410a.1/timeseries?aggregation=sum&interval=quarterly"
```

### SPARQL Queries
```bash
# Execute custom SPARQL query
curl -X POST -H "$AUTH_HEADER" \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT ?entity ?value WHERE { ?m esg:entityId ?entity ; esg:value ?value . } LIMIT 10" \
  "http://localhost:3002/internal/v1/sparql"

# JSON format query
curl -X POST -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * WHERE { ?s ?p ?o } LIMIT 5", "timeout": 10000}' \
  "http://localhost:3002/internal/v1/sparql"
```

## 📈 Performance Optimization

### Caching Strategy
- **L1 Cache**: Application memory, 5-minute TTL, LRU eviction
- **L2 Cache**: Redis distributed cache, 1-hour TTL
- **Cache Penetration Protection**: Bloom filter + null value cache
- **Cache Breakdown Protection**: Distributed lock prevents concurrent rebuilding

### Query Optimization
- **Index Optimization**: Build indexes on asOf, framework, entityId
- **Query Rewriting**: Automatic SPARQL query performance optimization
- **Result Pagination**: Support both cursor and offset pagination
- **Concurrency Control**: Limit maximum concurrent queries

### Monitoring Metrics
- **Response Time**: P95 < 200ms, P99 < 500ms
- **Throughput**: > 1000 QPS
- **Cache Hit Rate**: > 85%
- **Error Rate**: < 0.1%

## 🔧 Development Tools

### Make Commands
```bash
make build          # Build binary files
make test           # Run tests
make test-coverage  # Test coverage
make lint          # Code check
make format        # Code formatting
make run           # Run development server
make docker-build  # Build Docker image
make clean         # Clean build files
```

### Debug Tools
```bash
# Enable pprof performance analysis
go run -race cmd/api/main.go -pprof

# Access performance analysis page
open http://localhost:6060/debug/pprof/

# Memory analysis
go tool pprof http://localhost:3002/debug/pprof/heap

# CPU analysis
go tool pprof http://localhost:3002/debug/pprof/profile
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build image
make docker-build

# Run container
docker run -d \
  -p 3002:3002 \
  -e GRAPHDB_ENDPOINT=http://graphdb:7200 \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=your-secret \
  esg-internal-api:latest
```

### Health Check
```bash
# Kubernetes health check config
livenessProbe:
  httpGet:
    path: /internal/v1/healthz
    port: 3002
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /internal/v1/healthz
    port: 3002
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📚 Related Documentation

- [API Contract Documentation](./docs/API_CONTRACTS.md) - Complete API input/output specifications
- [Architecture Design Documentation](./docs/ARCHITECTURE.md) - Detailed architecture design and implementation
- [Public API Documentation](../api-public/docs/API_CONTRACTS.md) - Write service API
- [Deployment Guide](../../docs/DEPLOYMENT.md) - Production environment deployment instructions
- [Performance Tuning](./docs/PERFORMANCE.md) - Performance optimization best practices

## 🤝 Development Contribution

### Code Standards
- Follow Go official code style
- Use `gofmt` and `golint` to check code
- Unit test coverage > 80%
- All public functions must have documentation comments

### Commit Standards
```bash
# Feature development
git commit -m "feat(metrics): add time series aggregation"

# Bug fixes  
git commit -m "fix(cache): resolve redis connection leak"

# Documentation updates
git commit -m "docs(api): update SPARQL query examples"
```

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2025-09-28
