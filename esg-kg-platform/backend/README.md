# ESG Knowledge Graph Backend API

ESG Knowledge Graph platform backend API server built with Express + TypeScript, providing comprehensive ESG metrics and knowledge graph data services.

## 🚀 Installation & Setup

### Requirements
- Node.js >= 16.0.0
- npm >= 7.0.0
- GraphDB server running (default: localhost:7200)

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables (create .env file)
cp .env.example .env
# Edit .env with your GraphDB configuration
```

### Start Server
```bash
# Development mode (with hot reload)
npm run dev

# Production build and start
npm run build
npm start
```

Server will start at http://localhost:3000

## 📚 API Endpoints

All responses follow a consistent format. List endpoints return `{result: [...]}`, object endpoints return the data directly.

### 🏥 Health & System
- **GET /api/health** - Health check and server status
- **GET /api/repositories** - List GraphDB repositories

### 🔍 Knowledge Graph Query APIs

#### Industry & Framework APIs
- **GET /api/kg/frameworks?industry={industry}** - Get reporting frameworks for industry
- **GET /api/kg/categories?industry={industry}&framework={framework}** - Get categories in framework
- **GET /api/kg/metrics?industry={industry}&category_label={category}&framework={framework}** - Get metrics in category

#### Metric Information APIs  
- **GET /api/kg/metrics/uris?industry={industry}&category_label={category}&framework={framework}** - Get metric URIs (high performance)
- **GET /api/kg/metrics/attributes?metric_label={metric_label}** - Get metric attributes
- **GET /api/kg/datapoints/attributes?metric={metric}** - Get data point attributes

#### Data Source APIs
- **GET /api/kg/datasource?source={source}** - Get data source information
- **GET /api/kg/metrics/best-datasource?metric_id={metric_id}** - Get best data source for metric

#### Model & Implementation APIs
- **GET /api/kg/models/implementation?model_label={model_label}** - Get implementation for model
- **GET /api/kg/implementations/details?implementation_label={implementation_label}** - Get implementation details
- **GET /api/kg/implementations** - Get all implementations
- **GET /api/kg/implementations/by-calculation-type?calculation_type={calculation_type}** - Get implementations by calculation type
- **GET /api/kg/calculation-types** - Get all calculation types

#### Metric Metadata & Lineage APIs
- **GET /api/metric/{id}** - Get metric metadata
- **GET /api/metric/{id}/datasets** - Get metric data lineage

### ⚙️ Computation APIs
- **GET /api/computation/method?metric_label={metric_label}** - Get metric computation method
- **GET /api/computation/implementation?implementation_label={implementation_label}** - Get implementation info
- **GET /api/computation/implementations?calculation_type={calculation_type}** - Get implementations by type
- **GET /api/computation/supported-types** - Get supported calculation types

### 🔧 Data Management APIs
- **POST /api/sparql** - Execute SPARQL queries
- **POST /api/upload-ttl** - Upload TTL files to GraphDB
- **POST /api/wizard/preview** - Preview TTL from wizard data
- **POST /api/wizard/validate-draft** - Validate draft TTL
- **POST /api/wizard/submit** - Submit validated TTL
- **POST /api/shacl/validate-repo** - Validate repository with SHACL

## 💡 API Usage Examples

### Get Calculation Types
```bash
curl "http://localhost:3000/api/kg/calculation-types"

# Response:
{
  "result": [
    {
      "calculationType": "intensity_ratio",
      "count": 2,
      "modelLabels": ["Water Intensity", "Carbon Intensity"]
    },
    {
      "calculationType": "percentage_ratio", 
      "count": 1,
      "modelLabels": ["Renewable Energy Use"]
    }
  ]
}
```

### Get Reporting Frameworks
```bash
curl "http://localhost:3000/api/kg/frameworks?industry=Technology"

# Response:
{
  "result": ["SASB", "GRI", "TCFD"]
}
```

### Get Categories
```bash
curl "http://localhost:3000/api/kg/categories?industry=Technology&framework=SASB"

# Response:  
{
  "result": ["Data Security", "Energy Management", "Employee Engagement"]
}
```

### Get Metrics
```bash
curl "http://localhost:3000/api/kg/metrics?industry=Technology&category_label=Data%20Security&framework=SASB"

# Response:
{
  "result": ["Data breaches", "Customer privacy", "Data governance"]
}
```

### Get Metric Attributes
```bash
curl "http://localhost:3000/api/kg/metrics/attributes?metric_label=Data%20breaches"

# Response:
{
  "metricLabel": "Data breaches",
  "attributes": {
    "hasUnit": "number",
    "hasType": "SASBRequirement",
    "hasMetricType": "Quantitative"
  }
}
```

### Execute SPARQL Query
```bash
curl -X POST "http://localhost:3000/api/sparql" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"}'
```

### Upload TTL Data
```bash
curl -X POST "http://localhost:3000/api/upload-ttl" \
  -H "Content-Type: application/json" \
  -d '{"ttl": "@prefix esg: <http://example.org/esg#> .\nesg:TestMetric a esg:Metric ."}'
```

## ⚙️ Environment Variables

Configure the following variables in `.env` file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# GraphDB Configuration  
GRAPHDB_URL=http://localhost:7200
GRAPHDB_REPOSITORY=esg-knowledge-graph

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🏗️ Architecture

The backend provides a comprehensive API layer for ESG knowledge graph operations:
- **Knowledge Graph Querying**: Retrieve industries, frameworks, categories, and metrics
- **Data Lineage**: Track metric data sources and calculation models  
- **Computation Services**: Access calculation methods and implementations
- **GraphDB Integration**: Direct SPARQL query execution and TTL data management
- **Validation Services**: SHACL-based data validation

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production  
- `npm start` - Start production server
- `npm run clean` - Clean build files
- `npm run lint` - Run code linting
- `npm test` - Run tests

## 📝 Development Notes

1. All source code is in the `src/` directory
2. Uses TypeScript for type safety
3. Follows Express.js best practices  
4. Environment variables are not committed to version control
5. API responses follow consistent format: `{result: [...]}` for lists, direct objects for single items

## 🚀 Deployment

1. Build the project: `npm run build`
2. Set production environment variables  
3. Start the service: `npm start`

---

*ESG Knowledge Graph Backend API - Providing comprehensive ESG data services through a clean REST API interface.*