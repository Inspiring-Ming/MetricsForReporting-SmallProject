# ESG Knowledge Graph Platform - System Architecture Documentation

> **Project**: MetricsForReporting-SmallProject  
> **Repository**: Inspiring-Ming/MetricsForReporting-SmallProject  
> **Branch**: liam/esg-kg  
> **Last Updated**: November 3, 2025

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Details](#component-details)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Technology Stack](#technology-stack)
8. [Deployment Architecture](#deployment-architecture)
9. [Security & Configuration](#security--configuration)
10. [Performance Optimization](#performance-optimization)

---

## 1. System Overview

### 1.1 Project Description

The **ESG Knowledge Graph Platform** is a comprehensive data management and reporting system that leverages semantic web technologies (RDF/SPARQL/SHACL) to automate ESG (Environmental, Social, and Governance) report generation and metric calculations.

### 1.2 Key Features

- ✅ **Knowledge Graph-Driven**: Structured storage of ESG standards, metrics, and relationships
- ✅ **Dual Computation Modes**: Direct measurement + dynamic model calculation
- ✅ **Complete Data Lineage**: Full traceability from raw data to computed results
- ✅ **Multi-Standard Alignment**: Support for SASB, GRI, TCFD, Eurofidai mappings
- ✅ **Visual Editor (Wizard)**: Low-code interface for knowledge graph editing
- ✅ **Quality Assurance**: SHACL-based automatic validation
- ✅ **Microservices Architecture**: Independent deployment and horizontal scaling
- ✅ **Containerized Deployment**: Docker Compose one-click startup

### 1.3 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer (Frontend)                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │  Old Frontend        │         │  New Frontend (Wizard)   │  │
│  │  React + Vite        │         │  Next.js + Tailwind      │  │
│  │  Port: 5173          │         │  Port: 5172              │  │
│  └──────────────────────┘         └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway & Proxy Layer                     │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │  Vite Dev Proxy      │         │  Next.js Rewrites        │  │
│  │  (Old Frontend)      │         │  (New Frontend)          │  │
│  │  /api → 3000         │         │  /api/* → backend:3000   │  │
│  │  /SAGE → 3001        │         │                          │  │
│  └──────────────────────┘         └──────────────────────────┘  │
│              Docker Network: esg-network (bridge)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer (Backend)                       │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │  SAGE Backend        │         │  ESG-KG Platform Backend │  │
│  │  Port: 3001          │         │  Port: 3000              │  │
│  │  Express + TS        │         │  Express + TS            │  │
│  └──────────────────────┘         └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Computation Layer                             │
│                Python Models (via python-shell)                  │
│           percentage_ratio.py | intensity_ratio.py               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                        │
│  ┌─────────────────┐              ┌──────────────────────────┐  │
│  │  GraphDB        │              │  AWS DynamoDB            │  │
│  │  Port: 7200     │              │  Cloud Service           │  │
│  │  RDF Triple     │              │  NoSQL Key-Value Store   │  │
│  │  Store          │              │                          │  │
│  └─────────────────┘              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Layers

### 2.1 Five-Layer Architecture

The system adopts a **five-layer architecture** to ensure separation of concerns and maintainability:

#### **Layer 1: Presentation Layer**

**Purpose**: User interface and interaction

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| Old Frontend | React 18 + Vite 4 + TypeScript | 5173 | ESG report generation dashboard |
| New Frontend | Next.js 14 + Tailwind CSS | 5172 | Knowledge graph visual editor (Wizard) |

**Key Features**:
- **Old Frontend**: 
  - Multi-dimensional filtering (industry, framework, category, metric, year)
  - Real-time metric calculation
  - PDF/Excel report generation
  - Data provenance visualization
  
- **New Frontend (Wizard)**:
  - Form-based RDF triple creation
  - Real-time TTL preview
  - SHACL validation
  - Eurofidai dataset alignment interface

#### **Layer 2: API Gateway & Proxy Layer**

**Purpose**: Request routing and load balancing between frontend and backend services

This layer consists of **two separate proxy configurations** (not a centralized API gateway):

##### **2.1 Old Frontend Proxy (Vite Dev Server)**

**Configuration** (`frontend/vite.config.ts`):
```typescript
export default defineConfig({
  server: { 
    proxy: { 
      "^/SAGE/report": { 
        target: "http://localhost:3001", 
        changeOrigin: true 
      },
      '^/SAGE/reports': { 
        target: 'http://localhost:3001', 
        changeOrigin: true 
      },
      "^/api": { 
        target: "http://localhost:3000",  // ESG-KG Backend
        changeOrigin: true 
      },
      "^/SAGE": { 
        target: "http://localhost:3001",  // SAGE Backend
        changeOrigin: true 
      }
    } 
  }
})
```

**Routing Rules**:
| Request Pattern | Target Backend | Purpose |
|----------------|----------------|---------|
| `/api/*` | Port 3000 (ESG-KG) | Knowledge graph queries, wizard operations |
| `/SAGE/report*` | Port 3001 (SAGE) | Report generation |
| `/SAGE/*` | Port 3001 (SAGE) | DynamoDB queries, model computation |

**How it works**:
```
Browser → http://localhost:5173/api/kg/frameworks
  ↓ Vite Dev Proxy intercepts
  ↓ Rewrites to: http://localhost:3000/api/kg/frameworks
  ↓ Forwards request
ESG-KG Backend (3000) ← Receives request
  ↓ Returns response
Browser ← Receives response (appears to come from :5173)
```

##### **2.2 New Frontend Proxy (Next.js Rewrites)**

**Configuration** (`esg-kg-platform/frontend/next.config.ts`):
```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/:path*'
      }
    ];
  }
};
```

**Routing Rules**:
| Request Pattern | Target | Environment |
|----------------|--------|-------------|
| `/api/:path*` | `http://localhost:3000/api/:path*` | Development |
| `/api/:path*` | `http://backend:3000/api/:path*` | Docker (production) |

**Environment Variable**:
```bash
# Development
BACKEND_URL=http://localhost:3000

# Docker Container (set in docker-compose.yml)
BACKEND_URL=http://backend:3000
```

**How it works in Docker**:
```
Browser → http://localhost:5172/api/sparql
  ↓ Next.js Rewrites (server-side)
  ↓ Rewrites to: http://backend:3000/api/sparql
  ↓ Internal Docker network request
ESG-KG Backend Container ← Receives request
  ↓ Returns response
Browser ← Receives response (appears to come from :5172)
```

##### **2.3 Docker Network Layer**

**Network Configuration**:
- Network Name: `esg-network`
- Driver: `bridge`
- Internal DNS: Enabled (automatic)

**Container Hostnames**:
```yaml
services:
  graphdb:     # Accessible as: graphdb:7200
  backend:     # Accessible as: backend:3000
  frontend:    # Accessible as: frontend:5172
```

**Network Topology**:
```
Docker Bridge Network: esg-network (172.18.0.0/16)

┌────────────────────────────────────────────────────────────┐
│  graphdb:7200          backend:3000        frontend:5172   │
│  (172.18.0.2)          (172.18.0.3)        (172.18.0.4)    │
└────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    Port 7200:7200       Port 3000:3000      Port 5172:5172
         │                    │                    │
         └────────────────────┴────────────────────┘
                    Host: localhost
```

**Key Points**:
- ✅ **No centralized API Gateway**: Each frontend has its own proxy
- ✅ **Development vs Production**: Different proxy targets based on environment
- ✅ **CORS Handled**: `changeOrigin: true` prevents CORS issues
- ✅ **Path Preservation**: Original request paths are maintained
- ✅ **Docker DNS**: Containers use service names (e.g., `backend:3000`) instead of `localhost`

#### **Layer 3: Service Layer**

**Purpose**: Business logic processing

##### **SAGE Backend (Port 3001)**

**Architecture**: Traditional MVC pattern

**Core Functions**:
- DynamoDB query operations
- GraphDB SPARQL queries
- Python model execution via `python-shell`
- Metric calculation orchestration
- Report generation

**Directory Structure**:
```
backend/code/
├── index.ts                 # Main entry point
├── dynamoDB/
│   ├── dynamoDBHandler.ts   # DynamoDB operations
│   └── CSVtoDynamoJSON.ts   # Data import utility
├── KG/
│   └── queryGraph.ts        # GraphDB SPARQL queries
├── metricComputation/
│   └── getMetricComputationMethod.ts  # Computation logic
├── interface/
│   └── interface.ts         # TypeScript interfaces
└── utils/
    ├── callout.ts           # HTTP request helper
    └── generalHelper.ts     # General utilities
```

##### **ESG-KG Platform Backend (Port 3000)**

**Architecture**: Layered architecture (Controller → Service → Repository)

**Core Functions**:
- SPARQL query service
- TTL file upload
- Wizard data to RDF conversion
- SHACL validation
- Knowledge graph queries
- Metric metadata services

**Directory Structure**:
```
esg-kg-platform/backend/src/
├── server.ts                # Express server
├── index.ts                 # Module exports
├── config/
│   └── index.ts             # Configuration management
├── controllers/             # Request handlers
│   ├── healthController.ts
│   ├── sparqlController.ts
│   ├── wizardController.ts
│   ├── knowledgeGraphController.ts
│   └── metricComputationController.ts
├── services/                # Business logic
│   ├── sparqlService.ts
│   ├── wizardService.ts
│   ├── knowledgeGraphService.ts
│   ├── metricComputationService.ts
│   ├── ttlService.ts
│   └── shaclService.ts
├── repositories/            # Data access
│   ├── graphDBRepository.ts
│   └── knowledgeGraphRepository.ts
├── routers/                 # Route configuration
├── middlewares/             # Express middlewares
│   └── errorHandler.ts
└── types/                   # TypeScript type definitions
```

#### **Layer 4: Computation Layer**

**Purpose**: Execute mathematical models for ESG metric calculations

This layer bridges **Node.js backend** with **Python computational models**, enabling complex metric calculations that cannot be directly measured from data sources.

**Why Python?**
- 🧮 Native mathematical operations
- 📊 Future extensibility (NumPy, Pandas, scikit-learn)
- 🔄 Easy model versioning and testing
- 🚀 Better performance for numerical computations

**Architecture**: **Synchronous Python Process Execution via `python-shell`**

**Communication Flow**:
```
Node.js (SAGE Backend)
  ↓ 1. Prepare input values from DynamoDB
  ↓ 2. Call PythonShell.run(filePath, {args: [val1, val2, ...]})
  ↓
Python Process (spawned)
  ↓ 3. Parse sys.argv[] 
  ↓ 4. Execute calculation function
  ↓ 5. Print JSON to stdout: {"result": number}
  ↓ 6. Exit process
  ↓
Node.js
  ↓ 7. Parse stdout JSON
  ↓ 8. Return result to frontend
```

---

**Python Models** (`/backend/models_computing/`):

##### **Model 1: percentage_ratio.py**

**Purpose**: Calculate percentage ratios between two metrics

**Function Signature**:
```python
def percentage_ratio_model(m1: float, m2: float) -> float:
    """
    Calculate the percentage ratio of m1 to m2.
    
    Formula: (m1 / m2) × 100
    
    Args:
        m1: Numerator metric value
        m2: Denominator metric value
    
    Returns:
        Percentage value (0-100+)
    
    Example:
        Renewable Energy = 50 MWh
        Total Energy = 200 MWh
        Result = (50/200) × 100 = 25%
    """
    return (m1/m2) * 100
```

**Use Cases**:
- Renewable energy percentage: `(Renewable Energy / Total Energy) × 100`
- Women in board ratio: `(Female Directors / Total Directors) × 100`
- Waste recycling rate: `(Recycled Waste / Total Waste) × 100`
- Market share: `(Company Revenue / Industry Revenue) × 100`

**Execution Example**:
```bash
# Command
$ python percentage_ratio.py 50 200

# Output
{"result": 25.0}
```

**Node.js Integration**:
```typescript
const result = await PythonShell.run('percentage_ratio.py', {
  args: ['50', '200']
});
// result = ["{\"result\": 25.0}"]
const parsed = JSON.parse(result[result.length - 1]);
// parsed.result = 25.0
```

---

##### **Model 2: intensity_ratio.py**

**Purpose**: Calculate intensity metrics (aggregated numerators divided by a denominator)

**Function Signature**:
```python
def intensity_ratio_model(*args: float) -> float:
    """
    Calculate intensity ratio with variable numerators.
    
    Formula: (sum of all numerators) / denominator
    
    Args:
        *args: Variable number of arguments
               - First N-1 args: Numerator values (to be summed)
               - Last arg: Denominator value
    
    Returns:
        Intensity value (float)
    
    Raises:
        ValueError: If less than 2 arguments or denominator is zero
    
    Examples:
        # GHG Intensity
        Scope1 = 100 tCO2e, Scope2 = 50 tCO2e, Revenue = 200M USD
        Result = (100 + 50) / 200 = 0.75 tCO2e/M USD
        
        # Water Intensity
        Water1 = 300 m³, Water2 = 200 m³, Production = 1000 units
        Result = (300 + 200) / 1000 = 0.5 m³/unit
    """
    if len(args) < 2:
        raise ValueError("At least 2 inputs required (numerator(s) and denominator)")
    
    denominator = float(args[-1])
    
    if denominator == 0:
        raise ValueError("Denominator cannot be zero")
    
    numerators_sum = sum(float(x) for x in args[:-1])
    
    return numerators_sum / denominator
```

**Use Cases**:
- **GHG Emissions Intensity**: `(Scope1 + Scope2 + Scope3) / Revenue`
- **Water Intensity**: `(Water Withdrawal + Water Consumption) / Production Units`
- **Energy Intensity**: `(Grid + Renewable + Fuel Energy) / Revenue`
- **Waste Intensity**: `(Hazardous + Non-hazardous Waste) / Output`

**Execution Examples**:
```bash
# Example 1: GHG Intensity (3 inputs)
$ python intensity_ratio.py 100 50 200
{"result": 0.75}

# Example 2: Water Intensity (4 inputs: 3 numerators + 1 denominator)
$ python intensity_ratio.py 300 200 150 1000
{"result": 0.65}
# Calculation: (300 + 200 + 150) / 1000 = 0.65
```

**Node.js Integration**:
```typescript
// GHG Intensity Calculation
const scope1 = 100;  // From DynamoDB
const scope2 = 50;   // From DynamoDB
const revenue = 200; // From DynamoDB

const result = await PythonShell.run('intensity_ratio.py', {
  args: [scope1.toString(), scope2.toString(), revenue.toString()]
});

const parsed = JSON.parse(result[result.length - 1]);
// parsed.result = 0.75
```

---

**Complete Execution Flow in SAGE Backend**:

```typescript
// File: backend/code/metricComputation/getMetricComputationMethod.ts

async function modelExecution(
  perm_id: string,
  calculation_type: string,  // "percentage_ratio" or "intensity_ratio"
  year: string,
  metricArray: string[]      // ["Scope1Emissions", "Scope2Emissions", "TotalRevenue"]
): Promise<ModelExecutionResult> {
  
  // Step 1: Fetch metric values from DynamoDB
  const metricValues: number[] = [];
  for (const metricLabel of metricArray) {
    const metricData = await getMetric(perm_id, metricLabel, year);
    metricValues.push(metricData.metric_value);
  }
  // metricValues = [100, 50, 200]
  
  // Step 2: Call Python model
  const pythonScript = `${calculation_type}.py`;  // "intensity_ratio.py"
  const args = metricValues.map(v => v.toString()); // ["100", "50", "200"]
  
  const output = await PythonShell.run(pythonScript, { args });
  // output = ["{\"result\": 0.75}"]
  
  // Step 3: Parse result
  const result = JSON.parse(output[output.length - 1]);
  // result.result = 0.75
  
  // Step 4: Return with metadata
  return {
    value: result.result,
    implementation: pythonScript,
    pillar: "E",
    metricInfo: [/* input metrics metadata */]
  };
}
```

---

**Error Handling**:

```python
# intensity_ratio.py includes validation
if len(sys.argv) < 3:
    print(json.dumps({"error": "At least 2 arguments required"}))
    sys.exit(1)

try:
    metrics = [float(arg) for arg in sys.argv[1:]]
    result = intensity_ratio_model(*metrics)
    print(json.dumps({"result": result}))
except ValueError as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
```

**Node.js Error Handling**:
```typescript
try {
  const output = await PythonShell.run(pythonScript, { args });
  const result = JSON.parse(output[output.length - 1]);
  
  if (result.error) {
    throw new Error(`Python error: ${result.error}`);
  }
  
  return result.result;
} catch (error) {
  throw HTTPError(500, `Model execution failed: ${error.message}`);
}
```

---

**Key Design Decisions**:

1. **No External Dependencies**: Python scripts use only standard library
   - ✅ Faster startup time
   - ✅ No dependency management issues
   - ✅ Easy deployment

2. **JSON Communication**: Simple, language-agnostic data exchange
   - ✅ Type-safe parsing
   - ✅ Error messages included in response
   - ✅ Extensible for complex return types

3. **Synchronous Execution**: Wait for Python process to complete
   - ✅ Simpler error handling
   - ✅ Guaranteed result order
   - ❌ Blocks Node.js event loop (acceptable for <1s calculations)

4. **Variable Arguments**: Support flexible input counts
   - ✅ `intensity_ratio.py` handles 2+ inputs
   - ✅ Extensible for future models with varying parameter counts

---

**Future Enhancements** (not yet implemented):

1. **Model Registry in GraphDB**:
   ```turtle
   esg:PercentageRatioModel
     esg:hasImplementation esg:PercentageRatioPyImpl ;
     esg:requiresMinInputs 2 ;
     esg:requiresMaxInputs 2 ;
     esg:hasVersion "1.0.0" .
   ```

2. **Async Execution for Heavy Models**:
   ```typescript
   // Use child_process.spawn for long-running models
   const pythonProcess = spawn('python', ['complex_model.py', ...args]);
   ```

3. **Model Caching**:
   ```typescript
   const cacheKey = `${calculation_type}:${args.join(',')}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   ```

4. **NumPy/Pandas Support** for statistical models:
   ```python
   import pandas as pd
   import numpy as np
   
   def regression_model(data: pd.DataFrame) -> float:
       # Advanced statistical calculations
       pass
   ```

#### **Layer 5: Data Persistence Layer**

**Purpose**: Data storage and retrieval

##### **GraphDB (Port 7200)**

**Type**: RDF Triple Store (Ontotext GraphDB 11.1.1)

**Configuration**:
- Repository ID: `esg-repo`
- Ruleset: `owl-horst-optimized`
- Query Timeout: 60 seconds
- Max Results: 1,000,000

**Stored Data**:
- Ontology structure (Industry → Framework → Category → Metric)
- Metric definitions and attributes
- Calculation models and formulas
- Python implementation mappings
- Data source alignments (Eurofidai, Bloomberg, etc.)
- External standard mappings (GRI, UNGC, ISO26000)

##### **AWS DynamoDB**

**Type**: NoSQL Key-Value Store

**Table**: `ESG-Metrics-Data`

**Key Schema**:
- Partition Key: `PK` = `COMP#{perm_id}`
- Sort Key: `SK` = `YEAR#{year}#METRIC#{metric_name}`

**Stored Data**:
- Company historical metric values
- Disclosure dates
- Data providers
- ESG pillar (E/S/G)
- Units and descriptions

---

## 3. Component Details

### 3.1 Frontend Components

#### 3.1.1 Old Frontend (React + Vite)

**Main Components**:

```typescript
// App.tsx - Main Dashboard Component
- Global State: framework, category, metric, year, industry
- Row Management: CalcRow[] for multi-metric calculation
- Modal State: Result details and data provenance
- API Integration: Calls to both backends (3000, 3001)

Key Features:
├── Company Industry Lookup (from DynamoDB)
├── Framework/Category/Metric Selection (from GraphDB)
├── Metric Computation Method Retrieval (from GraphDB)
├── Direct Measurement Value Fetching (from DynamoDB)
├── Model Execution (Python via Backend)
└── Report Generation (PDF/Excel)
```

**API Routes** (`/frontend/src/api/esg.ts`):
```typescript
getCompanyIndustryReq()      → GET /SAGE/dynamoDB/retrieve/industry
getReportFrameworkReq()      → GET /api/kg/frameworks
getCategoriesReq()           → GET /api/kg/categories
getMetricsReq()              → GET /api/kg/metrics
getMetricComputationMethodReq() → GET /api/computation/method
getMetricValueReq()          → GET /SAGE/dynamoDB/metric/value
modelExecutionReq()          → POST /SAGE/model/computation
generateReportReq()          → POST /SAGE/report/generate
```

#### 3.1.2 New Frontend (Next.js Wizard)

**Page Component** (`/esg-kg-platform/frontend/src/app/page.tsx`):

```typescript
State Management:
├── Form State: industry, framework, category, metric
├── Mode State: "select" vs "new" for each entity
├── Dataset Variables: Eurofidai alignment array
├── Model & Implementation: calculation details
├── TTL Preview: generated RDF triples
├── Validation State: SHACL validation results
└── Options State: loaded from GraphDB

Workflow:
1. Load existing entities from GraphDB (SPARQL queries)
2. User fills form (select existing or create new)
3. Generate TTL preview
4. Validate with SHACL
5. Submit to GraphDB
```

**Key Features**:
- Dynamic form generation based on calculation method
- Real-time TTL syntax highlighting
- Triple count estimation
- Validation feedback with error messages
- File upload support for TTL files

### 3.2 Backend Components

#### 3.2.1 SAGE Backend Services

**Competency Questions Implementation**:

```typescript
// CQ1: Which Industry does [company X] belong to?
getCompanyIndustry(perm_id: string): Promise<{result: string}>
  → DynamoDB Query: PK=COMP#{perm_id}, Project: industry

// CQ2: Which Reporting Framework applies to [specific industry]?
getReportFramework(industry: string): Promise<{result: string[]}>
  → GraphDB SPARQL: Industry -reportsUsing-> ReportingFramework

// CQ3: What Categories are included within the [reporting framework]?
getCategoriesByIndustryAndReportFramework(industry, framework)
  → GraphDB SPARQL: Framework -includes-> Category

// CQ4: Which Metrics are classified under [specific category]?
getMetricsByIndustryAndCategory(industry, categoryLabel, framework)
  → GraphDB SPARQL: Category -consistsOf-> Metric

// CQ5: How is the value of [specific metric] calculated?
getMetricComputationMethod(metric_label: string)
  → GraphDB SPARQL: Metric attributes + calculation method
  → Returns: direct_measurement | calculation_model

// CQ6: Which Implementation is used to execute [specific model]?
getImplementationByModel(model_label: string)
  → GraphDB SPARQL: Model -hasImplementation-> Implementation
  → Returns: {language, filePath, functionName}

// CQ7: What Metrics are required as inputs for calculating [model]?
// (Embedded in CQ5 response via requiresInputFrom)

// CQ8: What are the historical Values of [specific datapoint]?
getMetricValue(perm_id, metric_name, year)
  → DynamoDB Get: PK=COMP#{perm_id}, SK=YEAR#{year}#METRIC#{name}
```

**Model Execution Flow**:

```typescript
modelExecution(perm_id, calculation_type, year, metricArray[]) {
  1. For each input metric in metricArray:
     a. getDataPointAttribute() → get obtainedFrom (DatasetVariable)
     b. getMetric() → fetch value from DynamoDB
     c. Collect: {metric_name, value, unit, provider, source}
  
  2. Validate all metrics have same pillar (E/S/G)
  
  3. handleComputationMethod(calculation_type, values[]):
     - Build Python command: python {type}.py {values...}
     - Execute via PythonShell.run()
     - Parse JSON output: {result: number}
  
  4. Return: {
       value: computed_result,
       implementation: "{type}.py",
       pillar: "E|S|G",
       metricInfo: [{name, value, source, ...}, ...]
     }
}
```

#### 3.2.2 ESG-KG Platform Backend Services

**Service Layer Architecture**:

```typescript
// WizardService - Converts form data to RDF triples
class WizardService {
  previewWizardData(payload: WizardPayload): TripleResult
    → Validates payload
    → Builds RDF triples from form data
    → Returns: {ttl: string, triples: Triple[], count: number}
  
  submitWizardData(ttl: string, graph?: string): Promise<{ok, graph}>
    → Writes TTL to GraphDB
    → Target graph: http://example.org/graph/esg
  
  validateDraftData(ttl: string): Promise<ValidationResult>
    → Writes to temp graph: http://example.org/tmp/validate/{uuid}
    → SHACL validation
    → Deletes temp graph
}

// KnowledgeGraphService - Handles KG queries
class KnowledgeGraphService {
  getReportFrameworks(industry)
  getCategoriesByIndustryAndFramework(industry, framework)
  getMetricsByIndustryAndCategory(industry, category, framework)
  getMetricAttributes(metric_label)
  getImplementationByModel(model_label)
  getBestDataSourceForMetric(metric_id)
  // ... 20+ query methods
}

// MetricComputationService - Provides computation metadata
class MetricComputationService {
  getMetricComputationMethod(metric_label): ComputationMethodResponse {
    → Queries metric attributes from GraphDB
    → Determines: direct_measurement | calculation_model
    → For direct: includes data source info
    → For model: includes formula, inputs, implementation
  }
}

// ShaclService - Data quality validation
class ShaclService {
  validateRepository(shapesTtl: string): Promise<string>
    → POST to GraphDB SHACL endpoint
    → Returns validation report (TTL format)
  
  parseValidationReport(reportTtl): ValidationReport
    → Extracts violations
    → Counts severity levels
    → Returns: {isValid, violations[], summary}
}

// TTLService - File upload management
class TTLService {
  uploadTTLFile(ttl, graph?, baseUri?): Promise<UploadResult>
    → Validates TTL syntax
    → Validates URI formats
    → Writes to GraphDB
}

// SparqlService - Custom SPARQL execution
class SparqlService {
  executeSparqlQuery(query, infer?, sameAs?): Promise<QueryResult>
    → Supports SELECT, CONSTRUCT, DESCRIBE, ASK
    → Returns JSON or TTL based on query type
}
```

**Repository Layer**:

```typescript
// GraphDBRepository - Low-level GraphDB operations
class GraphDBRepository {
  listRepositories()
  executeSparqlQuery(query, infer?, sameAs?)
  writeTurtleData(ttl, graph?)
  uploadTTLFile(ttl, graph?, baseUri?)
  validateWithShacl(shapesTtl)
  deleteGraph(graphUri)
  getRepositorySize()
}

// KnowledgeGraphRepository - Domain-specific queries
class KnowledgeGraphRepository {
  // Encapsulates SPARQL query construction
  // Handles result binding parsing
  // Provides strongly-typed responses
}
```

### 3.3 Database Components

#### 3.3.1 GraphDB Configuration

**Repository Configuration** (`repo-config.ttl`):

```turtle
@prefix rep: <http://www.openrdf.org/config/repository#> .
@prefix graphdb: <http://www.ontotext.com/config/graphdb#> .

[] a rep:Repository ;
   rep:repositoryID "esg-repo" ;
   rep:repositoryType "graphdb:FreeSailRepository" ;
   graphdb:ruleset "owl-horst-optimized" ;
   graphdb:disable-sameAs "true" ;
   graphdb:enable-context-index "true" ;
   graphdb:query-timeout "60" ;
   graphdb:query-limit-results "1000000" .
```

**SHACL Shapes** (`esg_shapes.ttl`):

```turtle
# Validates all resources have labels
esg:HasLabelShape
  sh:targetClass rdfs:Resource
  sh:property [ sh:path rdfs:label ; sh:minCount 1 ]

# Validates Industry-Framework relationship
esg:IndustryShape
  sh:targetClass esg:Industry
  sh:property [ sh:path esg:reportsUsing ; sh:minCount 1 ]

# Validates Metric calculation method
esg:MetricShape
  sh:targetClass esg:Metric
  sh:property [
    sh:path esg:hasCalculationMethod
    sh:in ("direct_measurement" "calculation_model")
  ]
```

#### 3.3.2 DynamoDB Schema

**Table Structure**:

```json
{
  "TableName": "ESG-Metrics-Data",
  "KeySchema": [
    {"AttributeName": "PK", "KeyType": "HASH"},
    {"AttributeName": "SK", "KeyType": "RANGE"}
  ],
  "AttributeDefinitions": [
    {"AttributeName": "PK", "AttributeType": "S"},
    {"AttributeName": "SK", "AttributeType": "S"},
    {"AttributeName": "industry", "AttributeType": "S"},
    {"AttributeName": "metric_year", "AttributeType": "S"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "industry-year-index",
      "KeySchema": [
        {"AttributeName": "industry", "KeyType": "HASH"},
        {"AttributeName": "metric_year", "KeyType": "RANGE"}
      ]
    }
  ]
}
```

**Item Example**:

```json
{
  "PK": "COMP#5054883975",
  "SK": "YEAR#2023#METRIC#CO2_SCOPE1",
  "company_name": "DXC Technology",
  "industry": "Semiconductors",
  "metric_name": "CO2_SCOPE1",
  "metric_value": 12500.5,
  "metric_unit": "tCO2e",
  "metric_year": "2023",
  "data_type": "Quantitative",
  "pillar": "E",
  "provider_name": "Eurofidai",
  "reported_date": "2024-03-15",
  "disclosure": "Voluntary"
}
```

---

## 4. Data Flow Diagrams

### 4.1 Flow 1: ESG Report Generation (Old Frontend)

```
┌─────────────┐
│   User      │ Input: perm_id = "5054883975", year = "2023"
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend (Port 5173)                                    │
│  - Initialize dashboard                                      │
│  - Display company input form                                │
└──────┬───────────────────────────────────────────────────────┘
       │ GET /SAGE/dynamoDB/retrieve/industry?perm_id=5054883975
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend (Port 3001)                                    │
│  Function: getCompanyIndustry()                              │
└──────┬───────────────────────────────────────────────────────┘
       │ Query: PK=COMP#5054883975, Project: industry
       ▼
┌──────────────────────────────────────────────────────────────┐
│  AWS DynamoDB                                                │
│  Table: ESG-Metrics-Data                                     │
│  Return: {result: "Semiconductors"}                          │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - Display industry: "Semiconductors"                        │
│  - Auto-fetch reporting frameworks                           │
└──────┬───────────────────────────────────────────────────────┘
       │ GET /api/kg/frameworks?industry=Semiconductors
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend (Port 3000)                                  │
│  Service: KnowledgeGraphService.getReportFrameworks()        │
└──────┬───────────────────────────────────────────────────────┘
       │ SPARQL Query:
       │ SELECT ?frameworkLabel WHERE {
       │   ?industry rdfs:label "Semiconductors" ;
       │             esg:reportsUsing ?framework .
       │   ?framework rdfs:label ?frameworkLabel .
       │ }
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB (Port 7200)                                         │
│  Repository: esg-repo                                        │
│  Return: {result: ["SASB Semiconductors"]}                   │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - User selects: "SASB Semiconductors"                       │
│  - Fetch categories                                          │
└──────┬───────────────────────────────────────────────────────┘
       │ GET /api/kg/categories?industry=...&framework=...
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend → GraphDB                                    │
│  Return: {result: ["Energy Management", "Water Management"]}│
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - User selects category: "Energy Management"                │
│  - Fetch metrics                                             │
└──────┬───────────────────────────────────────────────────────┘
       │ GET /api/kg/metrics?industry=...&category_label=...
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend → GraphDB                                    │
│  Return: {result: ["Total Energy Consumed", "Grid Electricity"]} │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - User selects metric: "GHG Emissions Intensity"            │
│  - Fetch computation method                                  │
└──────┬───────────────────────────────────────────────────────┘
       │ GET /api/computation/method?metric_label=GHG+Emissions+Intensity
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend                                              │
│  Service: MetricComputationService.getMetricComputationMethod()│
└──────┬───────────────────────────────────────────────────────┘
       │ SPARQL: Query metric attributes
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB                                                     │
│  Return: {                                                   │
│    measureMethod: "calculation_model",                       │
│    isCalculatedBy: "GHG Intensity Model",                    │
│    hasCalculationType: "intensity_ratio",                    │
│    requiresInputFrom: ["Scope1Emissions", "Scope2Emissions", │
│                        "TotalRevenue"]                       │
│  }                                                           │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - Display required inputs                                   │
│  - User clicks "Calculate"                                   │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /SAGE/model/computation
       │ Body: {
       │   perm_id: "5054883975",
       │   calculation_type: "intensity_ratio",
       │   year: "2023",
       │   metricArray: ["Scope1Emissions", "Scope2Emissions", "TotalRevenue"]
       │ }
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend                                                │
│  Function: modelExecution()                                  │
│  Step 1: For each input metric, get DatasetVariable         │
└──────┬───────────────────────────────────────────────────────┘
       │ SPARQL: getDataPointAttribute("Scope1Emissions")
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB                                                     │
│  Return: {obtainedFrom: "CO2_SCOPE1", sourceFrom: "Eurofidai"}│
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend                                                │
│  Step 2: Fetch metric values from DynamoDB                   │
└──────┬───────────────────────────────────────────────────────┘
       │ DynamoDB Query: PK=COMP#5054883975, SK=YEAR#2023#METRIC#CO2_SCOPE1
       ▼
┌──────────────────────────────────────────────────────────────┐
│  DynamoDB                                                    │
│  Return: {metric_value: 100, unit: "tCO2e", provider: "Eurofidai"}│
│  (Repeat for Scope2 → 50, Revenue → 200)                    │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend                                                │
│  Step 3: Execute Python model                                │
│  Command: python intensity_ratio.py 100 50 200               │
└──────┬───────────────────────────────────────────────────────┘
       │ PythonShell.run()
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Python Process                                              │
│  File: /backend/models_computing/intensity_ratio.py          │
│  Calculation: (100 + 50) / 200 = 0.75                        │
│  Output: {"result": 0.75}                                    │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend                                                │
│  Return: {                                                   │
│    value: 0.75,                                              │
│    implementation: "intensity_ratio.py",                     │
│    pillar: "E",                                              │
│    metricInfo: [                                             │
│      {metric_name: "CO2_SCOPE1", value: 100, source: "Eurofidai"},│
│      {metric_name: "CO2_SCOPE2", value: 50, source: "Eurofidai"}, │
│      {metric_name: "TOTAL_REVENUE", value: 200, source: "Bloomberg"}│
│    ]                                                         │
│  }                                                           │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - Display result: 0.75 tCO2e / million USD                  │
│  - Show data lineage in modal                                │
│  - User clicks "Generate Report"                             │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /SAGE/report/generate
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SAGE Backend                                                │
│  - Generate PDF/Excel with all calculated metrics            │
│  - Include data provenance information                       │
│  Return: {fileURL: "/reports/ESG_Report_2023.pdf"}          │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Old Frontend                                                │
│  - Open report in new tab                                    │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Flow 2: Knowledge Graph Editing (Wizard)

```
┌─────────────┐
│   User      │ Opens Wizard at localhost:5172
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend (Wizard)                                       │
│  Step 1: Load existing entities from GraphDB                 │
└──────┬───────────────────────────────────────────────────────┘
       │ SPARQL Queries to populate dropdowns
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB                                                     │
│  Query 1: SELECT ?industry WHERE {?industry a esg:Industry}  │
│  Query 2: SELECT ?framework WHERE {?framework a esg:ReportingFramework}│
│  Query 3: SELECT ?category WHERE {?category a esg:Category}  │
│  Query 4: SELECT ?metric WHERE {?metric a esg:Metric}        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend                                                │
│  Step 2: User fills form                                     │
│  - Industry: "Commercial Banks" (select existing)            │
│  - Framework: "SASB Commercial Banks" (select existing)      │
│  - Category: "Financed Emissions" (select existing)          │
│  - Metric: (create new)                                      │
│    • Code: FIN-001                                           │
│    • Label: "Financed Emissions Scope 3"                     │
│    • Type: "SASBRequirement"                                 │
│    • Unit: "tCO2e"                                           │
│    • Calculation Method: "direct_measurement"                │
│  - Dataset Variable:                                         │
│    • Label: "CO2INDIRECTSCOPE3"                              │
│    • Source: "Eurofidai Dataset"                             │
│    • Confidence: 0.75                                        │
└──────┬───────────────────────────────────────────────────────┘
       │ Click "Preview TTL"
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend                                                │
│  Build WizardPayload JSON and send to backend                │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /api/wizard/preview
       │ Body: {WizardPayload}
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend                                              │
│  Service: WizardService.previewWizardData()                  │
│  - Validate payload structure                                │
│  - Generate RDF triples                                      │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Generated TTL (15 triples)                                  │
│                                                              │
│  @prefix esg: <http://example.org/esg#> .                    │
│  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .     │
│                                                              │
│  esg:FinancedEmissionsScope3 a esg:Metric ;                  │
│      rdfs:label "Financed Emissions Scope 3" ;               │
│      esg:hasCode "FIN-001" ;                                 │
│      esg:hasType "SASBRequirement" ;                         │
│      esg:hasUnit "tCO2e" ;                                   │
│      esg:hasCalculationMethod "direct_measurement" ;         │
│      esg:obtainedFrom esg:CO2INDIRECTSCOPE3 .                │
│                                                              │
│  esg:CO2INDIRECTSCOPE3 a esg:DatasetVariable ;               │
│      rdfs:label "CO2INDIRECTSCOPE3" ;                        │
│      esg:sourceFrom esg:EurofidaiDataset ;                   │
│      esg:alignmentConfidence 0.75 .                          │
│                                                              │
│  esg:FinancedEmissions esg:consistsOf esg:FinancedEmissionsScope3 .│
└──────┬───────────────────────────────────────────────────────┘
       │ Return: {ttl: "...", triples: [...], count: 15}
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend                                                │
│  - Display TTL in syntax-highlighted textarea                │
│  - Show triple count: "15 triples generated"                 │
│  - User clicks "Validate Draft"                              │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /api/wizard/validate-draft
       │ Body: {ttl: "..."}
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend                                              │
│  Service: WizardService.validateDraftData()                  │
│  - Generate temp graph URI: http://example.org/tmp/validate/{uuid}│
└──────┬───────────────────────────────────────────────────────┘
       │ Write TTL to temp graph
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB                                                     │
│  - Load TTL into temporary graph                             │
│  - Execute SHACL validation against esg_shapes.ttl           │
│  - Check constraints:                                        │
│    ✓ All resources have rdfs:label                           │
│    ✓ Metric has hasCalculationMethod                         │
│    ✓ direct_measurement has obtainedFrom                     │
│    ✓ hasUnit is a string                                     │
└──────┬───────────────────────────────────────────────────────┘
       │ Return validation report (TTL)
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend                                              │
│  - Parse SHACL report                                        │
│  - Delete temp graph                                         │
│  Return: {ok: true, message: "Validation passed"}            │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend                                                │
│  - Display green checkmark ✅ "Validation Passed"            │
│  - Enable "Submit" button                                    │
│  - User clicks "Submit to GraphDB"                           │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /api/wizard/submit
       │ Body: {ttl: "...", graph: "http://example.org/graph/esg"}
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ESG-KG Backend                                              │
│  Service: WizardService.submitWizardData()                   │
└──────┬───────────────────────────────────────────────────────┘
       │ POST /repositories/esg-repo/statements?context=<graph>
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GraphDB                                                     │
│  - Persist triples to main graph                             │
│  - Update indices                                            │
│  Return: HTTP 204 No Content (success)                       │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  New Frontend                                                │
│  - Display success message: "Data submitted successfully!"   │
│  - Reset form                                                │
│  - New metric now available in Old Frontend for calculations │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Flow 3: SPARQL Custom Query

```
User → New Frontend → POST /api/sparql
         ↓
   ESG-KG Backend (SparqlController)
         ↓
   SparqlService.executeSparqlQuery()
         ↓
   GraphDBRepository.executeSparqlQuery()
         ↓
   HTTP POST to GraphDB:7200/repositories/esg-repo
   Headers:
     Content-Type: application/x-www-form-urlencoded
     Accept: application/sparql-results+json
   Body: query=SELECT+%3Fs+%3Fp+%3Fo+WHERE+...
         ↓
   GraphDB executes query
         ↓
   Return: {
     results: {
       vars: ["s", "p", "o"],
       bindings: [{s: {...}, p: {...}, o: {...}}, ...]
     }
   }
         ↓
   Frontend displays results in table
```

### 4.4 Flow 4: SHACL Repository Validation

```
User → New Frontend → POST /api/shacl/validate-repo
       Body: {shapesTtl: "..."}
         ↓
   ESG-KG Backend (ShaclController)
         ↓
   ShaclService.validateRepository()
         ↓
   GraphDBRepository.validateWithShacl()
         ↓
   HTTP POST to GraphDB:7200/repositories/esg-repo/rdf-graphs/service?action=validate
   Body: shapes TTL content
         ↓
   GraphDB SHACL Engine validates all triples
         ↓
   Generate validation report (TTL format):
   @prefix sh: <http://www.w3.org/ns/shacl#> .
   [] a sh:ValidationReport ;
      sh:conforms false ;
      sh:result [
        a sh:ValidationResult ;
        sh:focusNode esg:BrokenMetric ;
        sh:resultPath esg:hasUnit ;
        sh:resultMessage "hasUnit is required" ;
        sh:resultSeverity sh:Violation
      ] .
         ↓
   ShaclService.parseValidationReport()
         ↓
   Extract violations and convert to JSON
         ↓
   Return: {
     isValid: false,
     violations: [{focusNode, message, severity}],
     summary: {totalViolations: 1}
   }
         ↓
   Frontend displays violations with red indicators
```

---

## 5. Data Models

### 5.1 GraphDB Ontology Structure

#### 5.1.1 Core Class Hierarchy

```turtle
# Top-Level Structure
esg:Industry
  ├─ rdfs:label: xsd:string
  ├─ esg:hasCode: xsd:string
  └─ esg:reportsUsing → esg:ReportingFramework (1..*)

esg:ReportingFramework
  ├─ rdfs:label: xsd:string
  ├─ esg:hasCode: xsd:string
  ├─ esg:sourceDocument: xsd:string
  └─ esg:includes → esg:Category (1..*)

esg:Category
  ├─ rdfs:label: xsd:string
  ├─ esg:hasCode: xsd:string
  ├─ rdfs:comment: xsd:string
  └─ esg:consistsOf → esg:Metric (1..*)

esg:Metric
  ├─ rdfs:label: xsd:string (required)
  ├─ esg:hasCode: xsd:string
  ├─ esg:hasType: enum ["SASBRequirement", "Input Metric", "Manual"]
  ├─ esg:hasMetricType: enum ["Quantitative", "Discussion"]
  ├─ esg:hasCalculationMethod: enum ["direct_measurement", "calculation_model"]
  ├─ esg:hasUnit: xsd:string (required)
  ├─ esg:hasDescription: xsd:string
  │
  ├─ [IF direct_measurement]
  │   └─ esg:obtainedFrom → esg:DatasetVariable (1..*)
  │
  └─ [IF calculation_model]
      └─ esg:isCalculatedBy → esg:Model (1)
```

#### 5.1.2 Data Source Model

```turtle
esg:DatasetVariable
  ├─ rdfs:label: xsd:string
  ├─ esg:sourceFrom → esg:DataSource
  ├─ esg:hasDataType: xsd:string
  ├─ esg:hasOriginalUnit: xsd:string
  └─ esg:hasDescription: xsd:string

esg:DataSource
  ├─ rdfs:label: xsd:string
  ├─ esg:hasProvider: xsd:string
  ├─ esg:hasFileName: xsd:string
  ├─ esg:hasCoverage: xsd:string
  ├─ esg:hasRecordCount: xsd:integer
  └─ esg:disclosureType: enum ["Regulatory", "Voluntary", "Estimated"]

# Eurofidai Alignment
esg:Metric
  └─ esg:alignedWithEurofidai → esg:EurofidaiVariable
      ├─ esg:alignmentConfidence: xsd:decimal (0.0-1.0)
      ├─ esg:unitCompatible: xsd:boolean
      └─ esg:alignmentReason: xsd:string

esg:EurofidaiVariable
  ├─ rdfs:label: xsd:string
  ├─ rdfs:comment: xsd:string
  └─ esg:eurofidaiCode: xsd:string
```

#### 5.1.3 Calculation Model Structure

```turtle
esg:Model
  ├─ rdfs:label: xsd:string
  ├─ esg:hasCalculationType: enum ["percentage_ratio", "intensity_ratio", ...]
  ├─ esg:hasMathematicalExpression: xsd:string
  ├─ esg:hasFormula: xsd:string
  ├─ esg:requiresInputFrom: xsd:string (comma-separated metric labels)
  └─ esg:hasImplementation → esg:Implementation (1)

esg:Implementation
  ├─ rdfs:label: xsd:string
  ├─ esg:hasLanguage: xsd:string (e.g., "Python", "JavaScript")
  ├─ esg:hasFilePath: xsd:string (e.g., "/backend/models_computing/intensity_ratio.py")
  ├─ esg:hasFunctionName: xsd:string
  ├─ esg:hasInputParameters: xsd:string
  ├─ esg:hasReturnType: xsd:string
  └─ esg:hasValidation: xsd:string
```

#### 5.1.4 External Standards Mapping

```turtle
# GRI Alignment
esg:Metric
  └─ esg:mappedToGRI → gri:Indicator
      ├─ gri:standardCode: "GRI 305-1"
      ├─ gri:description: "Direct GHG emissions"
      └─ gri:scope: "Scope 1"

# UN Global Compact Alignment
esg:Metric
  └─ esg:mappedToUNGC → ungc:Principle
      ├─ ungc:principleNumber: 7
      ├─ ungc:title: "Precautionary approach to environmental challenges"
      └─ ungc:pillar: "Environment"

# ISO 26000 Alignment
esg:Metric
  └─ esg:mappedToISO → iso:CoreSubject
      ├─ iso:subjectCode: "6.5.5"
      ├─ iso:title: "Climate change mitigation and adaptation"
      └─ iso:coreSubject: "The Environment"
```

#### 5.1.5 Example RDF Instance

```turtle
@prefix esg: <http://example.org/esg#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Industry
esg:CommercialBanks a esg:Industry ;
    rdfs:label "Commercial Banks" ;
    esg:hasCode "FIN-CB" ;
    esg:reportsUsing esg:SASBCommercialBanks .

# Framework
esg:SASBCommercialBanks a esg:ReportingFramework ;
    rdfs:label "SASB Commercial Banks" ;
    esg:sourceDocument "commercial-banks-standard_en-gb.pdf" ;
    esg:includes esg:FinancedEmissions .

# Category
esg:FinancedEmissions a esg:Category ;
    rdfs:label "Financed Emissions" ;
    esg:hasCode "CB-FE" ;
    rdfs:comment "Greenhouse gas emissions from financed activities" ;
    esg:consistsOf esg:FinancedEmissionsScope3 .

# Metric (Direct Measurement)
esg:FinancedEmissionsScope3 a esg:Metric ;
    rdfs:label "Financed Emissions Scope 3" ;
    esg:hasCode "CB-FE-001" ;
    esg:hasType "SASBRequirement" ;
    esg:hasMetricType "Quantitative" ;
    esg:hasCalculationMethod "direct_measurement" ;
    esg:hasUnit "tCO2e" ;
    esg:hasDescription "Total Scope 3 emissions from financed activities" ;
    esg:obtainedFrom esg:CO2INDIRECTSCOPE3_DataVar ;
    esg:alignedWithEurofidai esg:CO2INDIRECTSCOPE3_Eurofidai .

# Dataset Variable
esg:CO2INDIRECTSCOPE3_DataVar a esg:DatasetVariable ;
    rdfs:label "CO2 Indirect Scope 3" ;
    esg:sourceFrom esg:EurofidaiDataSource ;
    esg:hasDataType "Quantitative" ;
    esg:hasOriginalUnit "tCO2e" .

# Data Source
esg:EurofidaiDataSource a esg:DataSource ;
    rdfs:label "Eurofidai Dataset" ;
    esg:hasProvider "Eurofidai" ;
    esg:hasFileName "eurofidai_esg_2023.csv" ;
    esg:hasCoverage "2014-2025" ;
    esg:hasRecordCount 50000 ;
    esg:disclosureType "Regulatory" .

# Eurofidai Alignment
esg:CO2INDIRECTSCOPE3_Eurofidai a esg:EurofidaiVariable ;
    rdfs:label "CO2INDIRECTSCOPE3" ;
    rdfs:comment "Eurofidai variable for Scope 3 emissions" ;
    esg:alignmentConfidence 0.75 ;
    esg:unitCompatible true ;
    esg:alignmentReason "Direct mapping to Scope 3 reporting requirement" .

# Metric (Calculation Model)
esg:GHGEmissionsIntensity a esg:Metric ;
    rdfs:label "GHG Emissions Intensity" ;
    esg:hasCode "CB-GHG-INT" ;
    esg:hasType "Input Metric" ;
    esg:hasMetricType "Quantitative" ;
    esg:hasCalculationMethod "calculation_model" ;
    esg:hasUnit "tCO2e/million USD" ;
    esg:isCalculatedBy esg:GHGIntensityModel .

# Model
esg:GHGIntensityModel a esg:Model ;
    rdfs:label "GHG Intensity Model" ;
    esg:hasCalculationType "intensity_ratio" ;
    esg:hasMathematicalExpression "(Scope1 + Scope2) / Revenue" ;
    esg:hasFormula "intensity = total_emissions / revenue" ;
    esg:requiresInputFrom "Scope1Emissions, Scope2Emissions, TotalRevenue" ;
    esg:hasImplementation esg:IntensityRatioImplementation .

# Implementation
esg:IntensityRatioImplementation a esg:Implementation ;
    rdfs:label "Intensity Ratio Python Implementation" ;
    esg:hasLanguage "Python" ;
    esg:hasFilePath "/backend/models_computing/intensity_ratio.py" ;
    esg:hasFunctionName "intensity_ratio_model" ;
    esg:hasInputParameters "*args (variable numerators, last arg is denominator)" ;
    esg:hasReturnType "float" ;
    esg:hasValidation "Denominator cannot be zero; minimum 2 arguments required" .

# External Standards
esg:FinancedEmissionsScope3
    esg:mappedToGRI gri:GRI305-3 ;
    esg:mappedToUNGC ungc:Principle7 ;
    esg:mappedToISO iso:6.5.5 .
```

### 5.2 DynamoDB Data Model

#### 5.2.1 Table Schema

```json
{
  "TableName": "ESG-Metrics-Data",
  "BillingMode": "PAY_PER_REQUEST",
  "KeySchema": [
    {
      "AttributeName": "PK",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "SK",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {"AttributeName": "PK", "AttributeType": "S"},
    {"AttributeName": "SK", "AttributeType": "S"},
    {"AttributeName": "industry", "AttributeType": "S"},
    {"AttributeName": "metric_year", "AttributeType": "S"},
    {"AttributeName": "pillar", "AttributeType": "S"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "industry-year-index",
      "KeySchema": [
        {"AttributeName": "industry", "KeyType": "HASH"},
        {"AttributeName": "metric_year", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "pillar-year-index",
      "KeySchema": [
        {"AttributeName": "pillar", "KeyType": "HASH"},
        {"AttributeName": "metric_year", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}
```

#### 5.2.2 Access Patterns

| Pattern | Index | Key Condition | Example |
|---------|-------|---------------|---------|
| Get specific metric for company | Primary | PK=COMP#{perm_id}, SK=YEAR#{year}#METRIC#{name} | Get CO2_SCOPE1 for company 5054883975 in 2023 |
| Get all metrics for company in year | Primary | PK=COMP#{perm_id}, SK begins_with YEAR#{year}# | Get all 2023 metrics for company |
| Get company industry | Primary | PK=COMP#{perm_id}, Limit=1, Project=industry | Quick industry lookup |
| Get industry metrics by year | GSI1 | industry={industry}, metric_year={year} | All Semiconductor metrics in 2023 |
| Get E/S/G metrics by year | GSI2 | pillar={E\|S\|G}, metric_year={year} | All Environmental metrics in 2023 |

#### 5.2.3 Item Structure

```json
{
  "PK": "COMP#5054883975",
  "SK": "YEAR#2023#METRIC#CO2_SCOPE1",
  
  "company_name": "DXC Technology Co",
  "industry": "Semiconductors",
  "headquarter_country": "USA",
  
  "metric_name": "CO2_SCOPE1",
  "metric_description": "Direct greenhouse gas emissions",
  "metric_value": 12500.5,
  "metric_unit": "tCO2e",
  "metric_year": "2023",
  "metric_period": 12,
  
  "data_type": "Quantitative",
  "metric_type": "Absolute",
  "pillar": "E",
  
  "disclosure": "Voluntary",
  "provider_name": "Eurofidai",
  "reported_date": "2024-03-15",
  
  "nb_points_of_observations": 365,
  "data_quality_score": 0.95,
  "verification_status": "Third-party verified",
  
  "created_at": "2024-03-20T10:30:00Z",
  "updated_at": "2024-03-20T10:30:00Z"
}
```

#### 5.2.4 Data Import Process

```typescript
// CSVtoDynamoJSON.ts workflow
CSV File (Eurofidai raw data)
  ↓ Parse with csv-parser
  ↓ Transform each row
  ↓ Generate PK/SK keys
  ↓ Map to DynamoDB JSON format
  ↓ Write to dynamodb_import.json
  ↓ Import via AWS CLI or SDK
  ↓
DynamoDB Table
```

**CSV to DynamoDB Mapping**:

| CSV Column | DynamoDB Field | Transformation |
|------------|----------------|----------------|
| perm_id | PK | "COMP#" + perm_id |
| metric_year, metric_name | SK | "YEAR#" + year + "#METRIC#" + name |
| metric_value | metric_value | String → Number (if numeric) |
| All other columns | Same name | Direct mapping |

### 5.3 API Request/Response Models

#### 5.3.1 TypeScript Interfaces

```typescript
// Knowledge Graph Response Types
export interface FrameworkResult {
  result: string[];  // ["SASB Commercial Banks", "GRI", ...]
}

export interface CategoryResult {
  result: string[];  // ["Data Security", "Financed Emissions", ...]
}

export interface MetricResult {
  result: string[];  // ["Number Data Breaches", "Financed Emissions Scope 3", ...]
}

// Computation Method Response
export interface MetricComputationMethodResponse {
  metric_label: string;
  computation_method: "direct_measurement" | "calculation_model";
  attributes: Record<string, string>;
  data_sources?: DataSourceReference[];  // for direct measurement
  model?: ModelReference;                 // for calculation model
  implementation?: ImplementationReference;
}

export interface DataSourceReference {
  dataSourceID: string;
  disclosureType: string;
  description: string;
}

export interface ModelReference {
  modelLabel: string;
  calculationType: string;
  formula?: string;
  mathematicalExpression?: string;
  description: string;
}

export interface ImplementationReference {
  implementationLabel: string;
  language: string;
  filePath: string;
  functionName: string;
  description: string;
}

// Metric Value Response
export interface MetricValueResponse {
  value: number | string;
  pillar: "E" | "S" | "G";
  reported_date: string;
  unit?: string;
  provider?: string;
}

// Model Execution Response
export interface ModelExecutionResponse {
  value: number;
  implementation: string;
  pillar: "E" | "S" | "G";
  metricInfo: MetricInfo[];
}

export interface MetricInfo {
  metric_name: string;
  value: number;
  metric_type?: string;
  unit?: string;
  description?: string;
  provider?: string;
  source?: string;
}

// Wizard Payload
export interface WizardPayload {
  graph?: string;
  industry?: {iri?: string; label?: string; code?: string};
  framework?: {iri?: string; label?: string; sourceDocument?: string; code?: string};
  category?: {iri?: string; label?: string; code?: string};
  metric: {
    iri?: string;
    code: string;
    label: string;
    hasType: string;
    hasCalculationMethod: "direct_measurement" | "calculation_model";
    hasMetricType: string;
    hasUnit: string;
    hasDescription?: string;
  };
  datasetVariables?: DatasetVariable[];
  model?: {
    iri?: string;
    label: string;
    calculationType?: string;
    formula?: string;
    mathematicalExpression?: string;
    requiresInputFrom?: string[];
  };
  implementation?: {
    iri?: string;
    label?: string;
    language?: string;
    filePath?: string;
    func?: string;
    returnType?: string;
    validation?: string;
  };
}

export interface DatasetVariable {
  iri?: string;
  label: string;
  alignmentReason?: string;
  confidenceScore?: number | string;
  isUnitCompatible?: string;
  sources: DataSource[];
}

export interface DataSource {
  iri?: string;
  label: string;
  fileName?: string;
  description?: string;
  coverage?: string;
  recordCount?: number | string;
}

// SHACL Validation Result
export interface ValidationResult {
  ok: boolean;
  graph?: string;
  report?: string;
  message?: string;
  raw?: string;
  violations?: Violation[];
  summary?: {
    totalViolations: number;
    severities: Record<string, number>;
  };
}

export interface Violation {
  focusNode?: string;
  resultPath?: string;
  value?: string;
  message?: string;
  severity?: string;
  sourceShape?: string;
}
```

---

## 6. API Reference

### 6.1 SAGE Backend APIs (Port 3001)

#### 6.1.1 Health Check

```http
GET /SAGE/dynamoDB/echo
```

**Response**:
```json
"SAGE DynamoDB API is running😍😍"
```

#### 6.1.2 Company Industry Query (CQ1)

```http
GET /SAGE/dynamoDB/retrieve/industry?perm_id={perm_id}
```

**Parameters**:
- `perm_id` (required): Company permanent ID

**Response**:
```json
{
  "result": "Semiconductors"
}
```

#### 6.1.3 Metric Value Retrieval

```http
GET /SAGE/dynamoDB/retrieve?perm_id={perm_id}&metric_name={name}&year={year}
```

**Parameters**:
- `perm_id` (required): Company ID
- `metric_name` (required): Metric name
- `year` (required): Reporting year

**Response**:
```json
{
  "PK": "COMP#5054883975",
  "SK": "YEAR#2023#METRIC#CO2_SCOPE1",
  "metric_value": 12500.5,
  "metric_unit": "tCO2e",
  "pillar": "E",
  "reported_date": "2024-03-15",
  "provider_name": "Eurofidai"
}
```

#### 6.1.4 Metric Historical Value (CQ8)

```http
GET /SAGE/dynamoDB/metric/value?perm_id={perm_id}&metric_name={name}&year={year}
```

**Response**:
```json
{
  "value": 12500.5,
  "pillar": "E",
  "reported_date": "2024-03-15"
}
```

#### 6.1.5 Model Computation

```http
POST /SAGE/model/computation
Content-Type: application/json
```

**Request Body**:
```json
{
  "perm_id": "5054883975",
  "calculation_type": "intensity_ratio",
  "year": "2023",
  "metricArray": ["Scope1Emissions", "Scope2Emissions", "TotalRevenue"]
}
```

**Response**:
```json
{
  "value": 0.75,
  "implementation": "intensity_ratio.py",
  "pillar": "E",
  "metricInfo": [
    {
      "metric_name": "CO2_SCOPE1",
      "value": 100,
      "metric_type": "Quantitative",
      "unit": "tCO2e",
      "description": "Direct GHG emissions",
      "provider": "Eurofidai",
      "source": "Eurofidai Dataset"
    },
    {
      "metric_name": "CO2_SCOPE2",
      "value": 50,
      "unit": "tCO2e",
      "provider": "Eurofidai",
      "source": "Eurofidai Dataset"
    },
    {
      "metric_name": "TOTAL_REVENUE",
      "value": 200,
      "unit": "million USD",
      "provider": "Bloomberg",
      "source": "Bloomberg Terminal"
    }
  ]
}
```

### 6.2 ESG-KG Platform Backend APIs (Port 3000)

#### 6.2.1 Health & System APIs

```http
GET /api/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-03T10:30:00Z",
    "graphdb": {
      "connected": true,
      "url": "http://localhost:7200"
    }
  }
}
```

```http
GET /api/repositories
```

**Response**:
```json
{
  "success": true,
  "data": ["esg-repo", "default"],
  "total": 2
}
```

#### 6.2.2 Knowledge Graph Query APIs

**Get Reporting Frameworks (CQ2)**:

```http
GET /api/kg/frameworks?industry={industry}
```

**Response**:
```json
{
  "result": ["SASB Commercial Banks", "GRI Standards"]
}
```

**Get Categories (CQ3)**:

```http
GET /api/kg/categories?industry={industry}&framework={framework}
```

**Response**:
```json
{
  "result": [
    "Data Security",
    "Financial Inclusion and Capacity Building",
    "Financed Emissions",
    "Business Ethics",
    "Systemic Risk Management"
  ]
}
```

**Get Metrics (CQ4)**:

```http
GET /api/kg/metrics?industry={industry}&category_label={category}&framework={framework}
```

**Response**:
```json
{
  "result": [
    "Number Data Breaches",
    "Percentage Personal Data Breaches",
    "Account Holders Affected",
    "Data Security Risk Approach"
  ]
}
```

**Get Metric URIs (High Performance)**:

```http
GET /api/kg/metrics/uris?industry={industry}&category_label={category}&framework={framework}
```

**Response**:
```json
{
  "result": [
    "http://example.org/esg#NumberDataBreaches",
    "http://example.org/esg#PercentagePersonalDataBreaches"
  ]
}
```

**Get Metric Attributes**:

```http
GET /api/kg/metrics/attributes?metric_label={metric_label}
```

**Response**:
```json
{
  "label": "Financed Emissions Scope 3",
  "hasCode": "CB-FE-001",
  "hasType": "SASBRequirement",
  "hasMetricType": "Quantitative",
  "hasCalculationMethod": "direct_measurement",
  "hasUnit": "tCO2e",
  "obtainedFrom": "CO2INDIRECTSCOPE3",
  "alignedWithEurofidai": "CO2INDIRECTSCOPE3"
}
```

**Get Data Source Info**:

```http
GET /api/kg/datasource?source={source}
```

**Response**:
```json
{
  "label": "Eurofidai Dataset",
  "hasProvider": "Eurofidai",
  "hasFileName": "eurofidai_esg_2023.csv",
  "hasCoverage": "2014-2025",
  "hasRecordCount": 50000,
  "disclosureType": "Regulatory"
}
```

**Get Model Implementation (CQ6)**:

```http
GET /api/kg/models/implementation?model_label={model_label}
```

**Response**:
```json
{
  "label": "Intensity Ratio Python Implementation",
  "language": "Python",
  "filePath": "/backend/models_computing/intensity_ratio.py",
  "functionName": "intensity_ratio_model",
  "description": "Calculate intensity ratio metrics"
}
```

**Get All Implementations**:

```http
GET /api/kg/implementations
```

**Response**:
```json
{
  "result": [
    {
      "label": "Percentage Ratio Implementation",
      "language": "Python",
      "filePath": "/backend/models_computing/percentage_ratio.py",
      "functionName": "percentage_ratio_model"
    },
    {
      "label": "Intensity Ratio Implementation",
      "language": "Python",
      "filePath": "/backend/models_computing/intensity_ratio.py",
      "functionName": "intensity_ratio_model"
    }
  ]
}
```

**Get Implementations by Calculation Type**:

```http
GET /api/kg/implementations/by-calculation-type?calculation_type={type}
```

**Response**:
```json
{
  "result": [
    {
      "label": "Intensity Ratio Implementation",
      "calculationType": "intensity_ratio",
      "filePath": "/backend/models_computing/intensity_ratio.py"
    }
  ]
}
```

**Get All Calculation Types**:

```http
GET /api/kg/calculation-types
```

**Response**:
```json
{
  "result": [
    {
      "calculationType": "intensity_ratio",
      "count": 2,
      "modelLabels": ["GHG Intensity Model", "Water Intensity Model"]
    },
    {
      "calculationType": "percentage_ratio",
      "count": 1,
      "modelLabels": ["Renewable Energy Ratio Model"]
    }
  ]
}
```

#### 6.2.3 Metric Computation APIs

**Get Computation Method (CQ5)**:

```http
GET /api/computation/method?metric_label={metric_label}
```

**Response (Direct Measurement)**:
```json
{
  "metric_label": "Financed Emissions Scope 3",
  "computation_method": "direct_measurement",
  "attributes": {
    "hasCalculationMethod": "direct_measurement",
    "obtainedFrom": "CO2INDIRECTSCOPE3"
  },
  "data_sources": [
    {
      "dataSourceID": "Eurofidai Dataset",
      "disclosureType": "Regulatory",
      "description": "Data source for Financed Emissions Scope 3"
    }
  ]
}
```

**Response (Calculation Model)**:
```json
{
  "metric_label": "GHG Emissions Intensity",
  "computation_method": "calculation_model",
  "attributes": {
    "hasCalculationMethod": "calculation_model",
    "isCalculatedBy": "GHG Intensity Model",
    "hasCalculationType": "intensity_ratio"
  },
  "model": {
    "modelLabel": "GHG Intensity Model",
    "calculationType": "intensity_ratio",
    "formula": "intensity = total_emissions / revenue",
    "mathematicalExpression": "(Scope1 + Scope2) / Revenue",
    "description": "Calculate GHG emissions per unit of revenue"
  },
  "implementation": {
    "implementationLabel": "Intensity Ratio Implementation",
    "language": "Python",
    "filePath": "/backend/models_computing/intensity_ratio.py",
    "functionName": "intensity_ratio_model",
    "description": "Python implementation of intensity ratio calculation"
  }
}
```

**Get Implementation Info**:

```http
GET /api/computation/implementation?implementation_label={label}
```

**Get Supported Calculation Types**:

```http
GET /api/computation/supported-types
```

**Response**:
```json
{
  "result": ["percentage_ratio", "intensity_ratio"]
}
```

#### 6.2.4 Data Management APIs

**Execute SPARQL Query**:

```http
POST /api/sparql
Content-Type: application/json
```

**Request**:
```json
{
  "query": "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10",
  "infer": false,
  "sameAs": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "vars": ["s", "p", "o"],
    "bindings": [
      {
        "s": {"type": "uri", "value": "http://example.org/esg#Industry1"},
        "p": {"type": "uri", "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},
        "o": {"type": "uri", "value": "http://example.org/esg#Industry"}
      }
    ],
    "total": 10
  },
  "meta": {
    "queryType": "SELECT",
    "executionTime": 45
  }
}
```

**Upload TTL File**:

```http
POST /api/upload-ttl
Content-Type: application/json
```

**Request**:
```json
{
  "ttl": "@prefix esg: <http://example.org/esg#> . esg:NewMetric a esg:Metric .",
  "graph": "http://example.org/graph/esg",
  "baseUri": "http://example.org/esg#"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "TTL file uploaded successfully",
  "graph": "http://example.org/graph/esg",
  "repository": "esg-repo"
}
```

**Wizard Preview**:

```http
POST /api/wizard/preview
Content-Type: application/json
```

**Request**: (WizardPayload JSON)

**Response**:
```json
{
  "ttl": "@prefix esg: <http://example.org/esg#> ...",
  "triples": [
    {
      "subject": "esg:NewMetric",
      "predicate": "rdf:type",
      "object": "esg:Metric"
    }
  ],
  "count": 15
}
```

**Validate Draft**:

```http
POST /api/wizard/validate-draft
Content-Type: application/json
```

**Request**:
```json
{
  "ttl": "@prefix esg: <http://example.org/esg#> ...",
  "graph": "http://example.org/graph/esg"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "graph": "http://example.org/tmp/validate/uuid-1234",
  "report": undefined
}
```

**Response (Failure)**:
```json
{
  "ok": false,
  "graph": "http://example.org/tmp/validate/uuid-1234",
  "message": "SHACL validation failed for draft",
  "raw": "sh:ValidationResult ..."
}
```

**Submit Wizard Data**:

```http
POST /api/wizard/submit
Content-Type: application/json
```

**Request**:
```json
{
  "ttl": "@prefix esg: <http://example.org/esg#> ...",
  "graph": "http://example.org/graph/esg"
}
```

**Response**:
```json
{
  "ok": true,
  "graph": "http://example.org/graph/esg"
}
```

**SHACL Repository Validation**:

```http
POST /api/shacl/validate-repo
Content-Type: application/json
```

**Request**:
```json
{
  "shapesTtl": "@prefix sh: <http://www.w3.org/ns/shacl#> ..."
}
```

**Response**:
```json
{
  "isValid": false,
  "violations": [
    {
      "focusNode": "esg:BrokenMetric",
      "resultPath": "esg:hasUnit",
      "message": "hasUnit is required for all metrics",
      "severity": "Violation"
    }
  ],
  "summary": {
    "totalViolations": 1,
    "severities": {
      "Violation": 1
    }
  }
}
```

### 6.3 Error Responses

All APIs follow a consistent error format:

```json
{
  "ok": false,
  "error": "Error message here",
  "statusCode": 404,
  "code": "RESOURCE_NOT_FOUND"
}
```

**Common HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no body
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## 7. Technology Stack

### 7.1 Frontend Technologies

| Category | Old Frontend | New Frontend (Wizard) |
|----------|-------------|----------------------|
| **Framework** | React 18.2.0 | Next.js 14.0.0 |
| **Build Tool** | Vite 4.x | Next.js built-in |
| **Language** | TypeScript 5.0+ | TypeScript 5.0+ |
| **Styling** | CSS Modules | Tailwind CSS 3.3+ |
| **HTTP Client** | Axios 1.6+ | Fetch API |
| **Animation** | - | Framer Motion 10+ |
| **State Management** | React useState/useEffect | React useState/useEffect |
| **Icons** | - | Lucide React |

**Development Dependencies**:
```json
{
  "@vitejs/plugin-react": "^4.2.0",
  "@types/react": "^18.2.0",
  "eslint": "^8.57.0",
  "typescript": "^5.0.0",
  "vite": "^4.5.0"
}
```

### 7.2 Backend Technologies

| Category | SAGE Backend | ESG-KG Backend |
|----------|-------------|----------------|
| **Runtime** | Node.js 16+ | Node.js 16+ |
| **Framework** | Express 4.18+ | Express 4.18+ |
| **Language** | TypeScript 5.0+ | TypeScript 5.0+ |
| **Architecture** | MVC Pattern | Layered (Controller-Service-Repository) |
| **Python Bridge** | python-shell 5.0+ | - |
| **AWS SDK** | @aws-sdk/client-dynamodb 3.x | - |
| **HTTP Client** | Axios 1.6+ | Fetch API |
| **Validation** | - | SHACL via GraphDB |

**Key Dependencies**:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "dotenv": "^16.0.3",
  "python-shell": "^5.0.0",
  "@aws-sdk/client-dynamodb": "^3.400.0",
  "@aws-sdk/lib-dynamodb": "^3.400.0",
  "http-errors": "^2.0.0",
  "morgan": "^1.10.0"
}
```

### 7.3 Database Technologies

#### 7.3.1 GraphDB

- **Vendor**: Ontotext GraphDB
- **Version**: 11.1.1
- **Type**: RDF Triple Store
- **Standards**: SPARQL 1.1, RDF4J, SHACL
- **Inference**: OWL-Horst Optimized
- **License**: Free Edition

**Configuration**:
- Heap Size: 2GB
- Query Timeout: 60 seconds
- Max Results: 1,000,000
- Context Index: Enabled
- SameAs: Disabled

#### 7.3.2 DynamoDB

- **Vendor**: AWS DynamoDB
- **Type**: NoSQL Key-Value Store
- **Billing**: Pay-per-request
- **Consistency**: Eventually consistent reads (default)
- **Encryption**: At rest with AWS KMS

### 7.4 Computation Layer

- **Language**: Python 3.8+
- **Bridge**: python-shell (Node.js to Python)
- **Libraries**: Standard library only (no external dependencies)

**Python Models**:
```python
# percentage_ratio.py
import sys, json

def percentage_ratio_model(m1, m2):
    return (m1/m2) * 100

if __name__ == "__main__":
    m1 = float(sys.argv[1])
    m2 = float(sys.argv[2])
    print(json.dumps({"result": percentage_ratio_model(m1, m2)}))
```

### 7.5 DevOps & Infrastructure

| Component | Technology | Version |
|-----------|-----------|---------|
| **Containerization** | Docker | 24.0+ |
| **Orchestration** | Docker Compose | 2.20+ |
| **CI/CD** | GitHub Actions | - |
| **Version Control** | Git | 2.40+ |
| **Package Manager** | npm / pnpm | 9.x / 8.x |

---

## 8. Deployment Architecture

### 8.1 Docker Compose Configuration

```yaml
version: '3.8'

services:
  # GraphDB Database Service
  graphdb:
    image: ontotext/graphdb:11.1.1
    container_name: esg-graphdb
    ports:
      - "7200:7200"
    environment:
      GDB_HEAP_SIZE: "2g"
    volumes:
      - ./graphDB/data:/opt/graphdb/home
      - ./graphDB/import:/opt/graphdb/home/graphdb-import:ro
      - ./graphDB/conf:/opt/graphdb/home/conf:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7200/rest/repositories"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - esg-network

  # Data Initialization Service
  init-loader:
    image: curlimages/curl:8.10.1
    container_name: esg-init-loader
    depends_on:
      graphdb:
        condition: service_healthy
    volumes:
      - ./graphDB/repo-config.ttl:/work/repo-config.ttl:ro
      - ./graphDB/import:/work/import:ro
    command: [sh, -c, "...initialization script..."]
    restart: "no"
    networks:
      - esg-network

  # Backend API Service
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: esg-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      GRAPHDB_URL: http://graphdb:7200
      GRAPHDB_REPO: esg-repo
    volumes:
      - ./graphDB/import:/app/graphDB/import:ro
    depends_on:
      graphdb:
        condition: service_healthy
      init-loader:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - esg-network

  # Frontend Web Application
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: esg-frontend
    ports:
      - "5172:5172"
    environment:
      NODE_ENV: production
      BACKEND_URL: http://backend:3000
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5172"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - esg-network

networks:
  esg-network:
    driver: bridge
```

### 8.2 Service Startup Sequence

```
1. Docker Compose Up
   ↓
2. GraphDB Service Starts
   ↓ (Wait for healthcheck: 30-60s)
3. GraphDB Healthy
   ↓
4. Init-Loader Starts
   - Check if repository exists
   - Create repository if needed
   - Import TTL data if empty
   ↓ (Completion: 1-3 minutes)
5. Init-Loader Completes
   ↓
6. Backend Service Starts
   - Connect to GraphDB
   - Load configurations
   ↓ (Healthcheck: 10-30s)
7. Backend Healthy
   ↓
8. Frontend Service Starts
   - Build Next.js app
   - Connect to backend
   ↓ (Healthcheck: 10-20s)
9. All Services Ready
   ↓
✅ System Available
   - GraphDB UI: http://localhost:7200
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5172
```

### 8.3 Volume Mounts

```
Host → Container Mappings:

GraphDB:
  ./graphDB/data → /opt/graphdb/home
    Purpose: Persist database state
  
  ./graphDB/import → /opt/graphdb/home/graphdb-import (read-only)
    Purpose: TTL files for import
  
  ./graphDB/conf → /opt/graphdb/home/conf (read-only)
    Purpose: Configuration files

Init-Loader:
  ./graphDB/repo-config.ttl → /work/repo-config.ttl (read-only)
    Purpose: Repository configuration
  
  ./graphDB/import → /work/import (read-only)
    Purpose: Access to TTL import files

Backend:
  ./graphDB/import → /app/graphDB/import (read-only)
    Purpose: Access to initial TTL for reset functionality
```

### 8.4 Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Host Network (macOS)                                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Docker Bridge Network: esg-network                      │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  graphdb     │  │  backend     │  │  frontend    │  │  │
│  │  │  :7200       │  │  :3000       │  │  :5172       │  │  │
│  │  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘  │  │
│  │          │                 │                 │          │  │
│  │  Internal DNS Resolution:                                │  │
│  │  - graphdb:7200 → 172.18.0.2                            │  │
│  │  - backend:3000 → 172.18.0.3                            │  │
│  │  - frontend:5172 → 172.18.0.4                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Port Forwarding:                                               │
│  - localhost:7200 → graphdb:7200                                │
│  - localhost:3000 → backend:3000                                │
│  - localhost:5172 → frontend:5172                               │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Environment Variables

**Backend (.env)**:
```bash
# Server
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# GraphDB
GRAPHDB_URL=http://graphdb:7200
GRAPHDB_REPO=esg-repo
DEFAULT_GRAPH=http://example.org/graph/esg
INITIAL_TTL_PATH=/app/graphDB/import/esg_knowledge_graph_latest.ttl

# Security
CORS_ORIGIN=*
LOG_LEVEL=info

# AWS (for SAGE backend)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2
```

**Frontend (.env)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=production
```

### 8.6 Deployment Commands

```bash
# Start all services
cd esg-kg-platform
make up
# OR
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes (reset)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend

# Execute commands in container
docker exec -it esg-backend sh
docker exec -it esg-graphdb bash

# Import additional TTL
docker cp new_data.ttl esg-graphdb:/opt/graphdb/home/graphdb-import/
```

---

## 9. Security & Configuration

### 9.1 Security Considerations

#### 9.1.1 Authentication & Authorization

**Current State**: No authentication (development only)

**Production Recommendations**:
```typescript
// JWT-based authentication
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Apply to protected routes
app.use('/api/wizard', authenticateToken);
app.use('/api/upload-ttl', authenticateToken);
```

#### 9.1.2 CORS Configuration

**Current**:
```typescript
app.use(cors({ origin: '*' }));
```

**Production**:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 9.1.3 Input Validation

```typescript
// SPARQL Injection Prevention
const sanitizeSparqlInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/[;]/g, '')
    .trim();
};

// TTL Validation
const validateTTL = (ttl: string): boolean => {
  const hasPrefixes = /@prefix/.test(ttl);
  const hasTriples = /\s+\.\s*$/m.test(ttl);
  return hasPrefixes && hasTriples;
};
```

#### 9.1.4 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 9.2 Configuration Management

#### 9.2.1 Environment-Specific Configs

```typescript
// config/index.ts
export const config = {
  development: {
    GRAPHDB_URL: 'http://localhost:7200',
    LOG_LEVEL: 'debug',
    CORS_ORIGIN: '*'
  },
  production: {
    GRAPHDB_URL: process.env.GRAPHDB_URL,
    LOG_LEVEL: 'error',
    CORS_ORIGIN: process.env.ALLOWED_ORIGINS
  }
}[process.env.NODE_ENV || 'development'];
```

#### 9.2.2 Secrets Management

**Development**: `.env` file (gitignored)

**Production Recommendations**:
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets
- Azure Key Vault

### 9.3 Data Privacy

#### 9.3.1 PII Handling

- Company `perm_id` is anonymized (not actual company names in APIs)
- No personal employee data stored
- All ESG metrics are aggregated corporate-level data

#### 9.3.2 Data Retention

```typescript
// DynamoDB TTL configuration
{
  "AttributeName": "expiresAt",
  "Enabled": true
}

// Set expiration when writing
const item = {
  PK: "COMP#123",
  SK: "YEAR#2020#METRIC#CO2",
  expiresAt: Math.floor(Date.now() / 1000) + (7 * 365 * 24 * 60 * 60) // 7 years
};
```

---

## 10. Performance Optimization

### 10.1 GraphDB Optimization

#### 10.1.1 Index Configuration

```turtle
# Enable context index for named graph queries
graphdb:enable-context-index "true"

# Disable sameAs for faster queries
graphdb:disable-sameAs "true"

# Set appropriate heap size
GDB_HEAP_SIZE=2g
```

#### 10.1.2 Query Optimization

**Use LIMIT and OFFSET**:
```sparql
SELECT ?metric ?label
WHERE {
  ?metric a esg:Metric ;
          rdfs:label ?label .
}
ORDER BY ?label
LIMIT 100
OFFSET 0
```

**Use FILTER efficiently**:
```sparql
# Bad: Filter after all joins
SELECT ?metric WHERE {
  ?industry esg:reportsUsing ?framework .
  ?framework esg:includes ?category .
  ?category esg:consistsOf ?metric .
  FILTER(?industry = esg:CommercialBanks)
}

# Good: Filter early
SELECT ?metric WHERE {
  esg:CommercialBanks esg:reportsUsing ?framework .
  ?framework esg:includes ?category .
  ?category esg:consistsOf ?metric .
}
```

**Use OPTIONAL sparingly**:
```sparql
# Avoid multiple OPTIONAL blocks
SELECT ?metric ?label ?description WHERE {
  ?metric a esg:Metric ;
          rdfs:label ?label .
  OPTIONAL { ?metric esg:hasDescription ?description }
  OPTIONAL { ?metric esg:hasUnit ?unit }
  OPTIONAL { ?metric esg:hasCode ?code }
}

# Better: Query twice if needed
```

#### 10.1.3 Result Set Management

```typescript
// Provide URI-only queries for large datasets
async getMetricUrisByIndustryAndCategory(): Promise<string[]> {
  // Returns only URIs, not labels
  // ~10x faster for large result sets
}
```

### 10.2 DynamoDB Optimization

#### 10.2.1 Key Design

```
✅ Good: Composite sort key
PK: COMP#5054883975
SK: YEAR#2023#METRIC#CO2_SCOPE1

❌ Bad: Separate attributes
PK: 5054883975
year: 2023
metric_name: CO2_SCOPE1
```

#### 10.2.2 Batch Operations

```typescript
// Use BatchGetItem for multiple metrics
const params = {
  RequestItems: {
    'ESG-Metrics-Data': {
      Keys: [
        {PK: 'COMP#123', SK: 'YEAR#2023#METRIC#CO2_SCOPE1'},
        {PK: 'COMP#123', SK: 'YEAR#2023#METRIC#CO2_SCOPE2'},
        {PK: 'COMP#123', SK: 'YEAR#2023#METRIC#REVENUE'}
      ]
    }
  }
};

const result = await docClient.batchGet(params).promise();
```

#### 10.2.3 Global Secondary Indexes

```typescript
// Use GSI for non-key queries
const params = {
  TableName: 'ESG-Metrics-Data',
  IndexName: 'industry-year-index',
  KeyConditionExpression: 'industry = :industry AND metric_year = :year',
  ExpressionAttributeValues: {
    ':industry': 'Semiconductors',
    ':year': '2023'
  }
};
```

### 10.3 Caching Strategy

#### 10.3.1 In-Memory Cache

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getCachedFrameworks(industry: string): Promise<string[]> {
  const cacheKey = `frameworks:${industry}`;
  const cached = cache.get<string[]>(cacheKey);
  
  if (cached) return cached;
  
  const result = await getReportFrameworks(industry);
  cache.set(cacheKey, result);
  return result;
}
```

#### 10.3.2 Redis Cache (Production)

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedWithRedis(key: string, fetchFn: () => Promise<any>) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = await fetchFn();
  await redis.setex(key, 600, JSON.stringify(result));
  return result;
}
```

### 10.4 Frontend Optimization

#### 10.4.1 Code Splitting

```typescript
// Lazy load heavy components
const WizardForm = lazy(() => import('./components/WizardForm'));
const ReportViewer = lazy(() => import('./components/ReportViewer'));

<Suspense fallback={<Loading />}>
  <WizardForm />
</Suspense>
```

#### 10.4.2 Debounced API Calls

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedFetch = useMemo(
  () => debounce((query: string) => {
    fetchSuggestions(query);
  }, 500),
  []
);
```

#### 10.4.3 Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={metrics.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{metrics[index]}</div>
  )}
</FixedSizeList>
```

### 10.5 Monitoring & Profiling

#### 10.5.1 Query Performance Logging

```typescript
const startTime = Date.now();
const result = await executeSparqlQuery(query);
const duration = Date.now() - startTime;

console.log(`Query executed in ${duration}ms`);
if (duration > 1000) {
  console.warn(`Slow query detected: ${query}`);
}
```

#### 10.5.2 Application Metrics

```typescript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route?.path, res.statusCode.toString()).observe(duration);
  });
  next();
});
```

---

## 11. Appendix

### 11.1 Glossary

- **ESG**: Environmental, Social, and Governance
- **SASB**: Sustainability Accounting Standards Board
- **GRI**: Global Reporting Initiative
- **TCFD**: Task Force on Climate-related Financial Disclosures
- **RDF**: Resource Description Framework
- **SPARQL**: SPARQL Protocol and RDF Query Language
- **SHACL**: Shapes Constraint Language
- **TTL**: Turtle (Terse RDF Triple Language)
- **Eurofidai**: European academic ESG dataset
- **perm_id**: Permanent company identifier
- **CQ**: Competency Question (SPARQL query requirement)

### 11.2 Useful Resources

- GraphDB Documentation: https://graphdb.ontotext.com/documentation/
- SPARQL 1.1 Specification: https://www.w3.org/TR/sparql11-query/
- SHACL Specification: https://www.w3.org/TR/shacl/
- SASB Standards: https://www.sasb.org/standards/
- GRI Standards: https://www.globalreporting.org/standards/

### 11.3 Contact & Support

- **Repository**: https://github.com/Inspiring-Ming/MetricsForReporting-SmallProject
- **Branch**: liam/esg-kg
- **Documentation Last Updated**: November 3, 2025

---

**End of System Architecture Documentation**

