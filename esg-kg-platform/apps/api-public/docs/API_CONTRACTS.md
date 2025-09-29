# ESG Platform Public API 输入输出清单

> TypeScript写入服务：数据验证、写入、转换的完整契约定义

## 🏗️ 双API架构分工

### 🔴 Public API (TypeScript) - **写入专用**
本服务专注于ESG数据的**写入流水线**：
- ✅ **数据验证**: JSON Schema + SHACL验证
- ✅ **数据写入**: 单条和批量指标写入
- ✅ **格式转换**: JSON → RDF/TTL转换
- ✅ **事务处理**: 原子性写入和回滚
- ✅ **溯源记录**: 完整的数据来源追踪

### 🔵 Internal API (Go) - **读取专用**  
所有**查询、聚合、只读**操作由高性能Go服务处理：
- � **框架查询**: /internal/v1/frameworks - 获取行业报告框架
- 🏷️ **分类查询**: /internal/v1/categories - 获取框架下的分类
- 📊 **指标查询**: /internal/v1/metrics - 获取分类下的指标
- � **代码查询**: /internal/v1/metric-codes - 获取指标的运算代码
- ⚙️ **计算方法**: /internal/v1/computation-methods - 获取计算方法
- 🧮 **模型执行**: /internal/v1/compute - 执行计算模型
- 🔍 **SPARQL查询**: /internal/v1/sparql - 直接图查询
- 💾 **缓存优化**: Redis分层缓存策略
- 🔒 **只读安全**: 严格的SELECT-only约束

> 📖 **完整读取API文档**: [Internal API Contracts](../../../api-internal/docs/API_CONTRACTS.md)

## 通用请求头说明

所有API端点支持以下标准请求头：

- **Authorization**: `Bearer <JWT_TOKEN>` - JWT认证令牌（必需）
- **Content-Type**: `application/json` - 请求体格式（写入端点必需）
- **X-Request-ID**: 可选的请求追踪ID，用于日志关联
- **Idempotency-Key**: 可选的幂等性密钥，确保相同请求的幂等性处理

### Idempotency-Key 行为规范

当提供 `Idempotency-Key` 时：

1. **首次请求**：正常处理并保存键值-结果映射，返回正常响应（如 201 Created）
2. **重复请求**：
   - 相同键值 + 相同请求体 → 返回原始结果（包括相同的 batchId/namedGraph）
   - 相同键值 + 不同请求体 → 返回 409 Conflict 错误
3. **过期策略**：键值映射保持 24 小时后自动清理
4. **格式要求**：建议使用 UUID v4 格式，最大长度 255 字符

**示例**：
```bash
# 首次请求 - 返回 201 Created
curl -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
     -H "Content-Type: application/json" \
     -d '{"entityId": "COMP123", ...}' \
     POST /public/v1/metrics

# 重复请求 - 返回原始 201 结果
curl -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
     -H "Content-Type: application/json" \
     -d '{"entityId": "COMP123", ...}' \
     POST /public/v1/metrics
```

> ⚠️ **重要**：`batchId` 和 `namedGraph` 始终由服务端生成，不接受外部传入。如需幂等性保证，请使用 `Idempotency-Key` 请求头。

## Code与Metric的关系说明

### 📊 Code的本质定义

**Code** 不是简单的标识符，而是平台内部的**运算代码系统**：

- **一对一映射**: 每个code对应一个具体的指标(metric)
- **计算逻辑**: code封装了特定的指标计算方法和业务规则
- **服务接口**: code是平台对外暴露的"用内部已注册的code版本来算指标"的服务接口
- **版本管理**: 每个code都有版本控制，确保计算逻辑的一致性和可追溯性

### 🔄 工作流程

1. **Code注册**: 平台内部注册各种指标的计算逻辑，每个逻辑分配唯一的code
2. **客户端调用**: 客户端通过指定code来请求特定的指标计算服务  
3. **计算执行**: 平台根据code执行相应的计算逻辑
4. **结果返回**: 返回计算得出的指标值及相关元数据

### 💡 使用示例

```
code: "FN-CB-410a.1" 
→ 对应计算逻辑: "小企业贷款余额统计算法 v1.0.2"
→ 输出指标: 该银行的小企业贷款余额数值
```

这种设计确保了指标计算的标准化、可复用性和业务逻辑的集中管理。

## Metric IRI 生成策略

所有Metric IRI遵循统一格式：
```
https://esg.platform/data/metric/{entityId}/{framework}/{industry}/{code}/{asOf}
```

> 📌 **部署说明**：`esg.platform` 是示例域名，实际部署时需要替换为您的真实域名（如：`your-company.com` 或 `api.your-esg-platform.com`）

**组成部分**：
- `entityId`: 报告实体的唯一标识符
- `framework`: ESG框架标识 (SASB, GRI, TCFD等)  
- `industry`: 行业分类名称 (URL编码处理)
- `code`: 平台内部注册的运算代码标识，用于指标计算的服务接口。每个code对应一个具体的指标计算逻辑
- `asOf`: 报告日期 (YYYY-MM-DD格式)

**时间戳规范化**：
- 📅 **输入**: 客户端可提交完整ISO时间戳 `2023-12-31T23:59:59Z`
- 🔄 **规范化**: 服务端自动提取UTC日期部分转为 `2023-12-31` 
- 🔗 **IRI中使用**: 仅使用日期部分，确保同一天的所有时间戳映射到相同IRI
- ⚠️ **冲突检测**: 同一实体+框架+代码+日期视为重复，不论具体时间

**编码规范**：
- 空格和特殊字符使用URL编码 (例: `Commercial Banks` → `Commercial%20Banks`)
- 大小写保持原样，不做转换

**示例**：`https://esg.platform/data/metric/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31`

> 📝 **说明**：此格式确保成功响应、冲突检测、缓存管理中的IRI完全一致，避免客户端状态管理混乱。

## 1. HTTP Routes 输入输出规范

### 1.1 POST /public/v1/validate

#### 输入 (Input)
**Content-Type**: `application/json` 或 `text/turtle`

**JSON格式输入**:
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

> 📌 **Code字段说明**: `code`字段不是简单的标识符，而是平台内部注册的**运算代码**。每个code对应一个特定的指标计算方法和逻辑。当客户端使用某个code时，实际上是在调用平台提供的"用内部已注册的code版本来算指标"的服务接口。平台会根据code执行相应的计算逻辑来生成或验证指标值。

**TTL格式输入**:
```turtle
@prefix esg: <https://esg.platform/ontology/> .
@prefix qudt: <http://qudt.org/vocab/unit/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

esg:metric_001 a esg:Metric ;
    esg:framework "SASB" ;
    esg:industry "Commercial Banks" ;
    esg:code "FN-CB-410a.1" ;
    esg:entityId "bank-001" ;
    esg:value 1250000.00 ;
    esg:unitIri qudt:USD ;
    esg:asOf "2023-12-31T23:59:59Z"^^xsd:dateTime ;
    esg:source "Annual Report 2023" .
```

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json | text/turtle
X-Request-ID: optional-request-id
Idempotency-Key: optional-idempotency-key
```

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "isValid": true,
  "summary": {
    "constraintsChecked": 15,
    "fieldCount": 8,
    "duration": 245
  },
  "violations": [],
  "warnings": []
}
```

**验证失败响应 (422 Unprocessable Entity)**:
```http
Content-Type: application/problem+json
X-Request-ID: req_abc123def456
```

```json
{
  "type": "https://esg.platform/problems/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Data violates 3 SHACL constraints",
  "instance": "/public/v1/validate",
  "errors": [
    {
      "field": "framework",
      "code": "INVALID_ENUM_VALUE",
      "message": "Framework must be one of: SASB, GRI, TCFD, EU_TAXONOMY, CSRD",
      "value": "INVALID_FRAMEWORK"
    },
    {
      "field": "value",
      "code": "VALUE_TOO_SMALL",
      "message": "Value must be non-negative",
      "value": -100
    }
  ]
}
```

#### 错误码清单
| 状态码 | 错误码 | 描述 | 重试 |
|--------|--------|------|------|
| 400 | `INVALID_CONTENT_TYPE` | 不支持的Content-Type | ❌ |
| 400 | `INVALID_JSON` | JSON格式错误 | ❌ |  
| 400 | `MALFORMED_TTL` | TTL格式错误 | ❌ |
| 401 | `UNAUTHORIZED` | JWT Token无效 | ❌ |
| 403 | `FORBIDDEN` | 缺少validate:metrics权限 | ❌ |
| 422 | `VALIDATION_FAILED` | SHACL验证失败 | ❌ |
| 429 | `RATE_LIMIT_EXCEEDED` | 速率限制 | ✅ |
| 503 | `SERVICE_UNAVAILABLE` | SHACL服务不可用 | ✅ |

### 1.2 POST /public/v1/ingest/metric

#### 输入 (Input)
**Content-Type**: `application/json`

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

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Request-ID: optional-request-id
Idempotency-Key: optional-idempotency-key
```

#### 输出 (Output)

**成功响应 (201 Created)**:

**响应头**:
```http
Location: /public/v1/metrics/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31
Content-Type: application/json
X-Request-ID: req_abc123def456
```

**响应体**:
```json
{
  "success": true,
  "batchId": "batch_abc123def456",
  "metricIri": "https://esg.platform/data/metric/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31",
  "namedGraph": "https://esg.platform/graphs/batch_abc123def456",
  "triplesCount": 15,
  "duration": 1250,
  "location": "/public/v1/metrics/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31"
}
```

**冲突错误响应 (409 Conflict)**:
```http
Content-Type: application/problem+json
X-Request-ID: req_abc123def456
```

```json
{
  "type": "https://esg.platform/problems/conflict",
  "title": "Resource Conflict",
  "status": 409,
  "detail": "Metric already exists for this entity, framework, calculation code and date",
  "instance": "/public/v1/ingest",
  "existing": {
    "iri": "https://esg.platform/data/metric/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31"
  }
}
```

**无效JSON响应 (400 Bad Request)**:
```http
Content-Type: application/problem+json
X-Request-ID: req_abc123def456
```

```json
{
  "type": "https://esg.platform/problems/invalid-json",
  "title": "Invalid JSON",
  "status": 400,
  "detail": "Request body contains malformed JSON",
  "instance": "/public/v1/ingest"
}
```

**验证失败响应 (422 Unprocessable Entity)**:
```http
Content-Type: application/problem+json
X-Request-ID: req_abc123def456
```

```json
{
  "type": "https://esg.platform/problems/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Metric data failed validation constraints",
  "instance": "/public/v1/ingest",
  "errors": [
    {
      "field": "value",
      "code": "VALUE_TOO_SMALL",
      "message": "Value must be non-negative",
      "value": -100
    }
  ]
}
```

**服务不可用响应 (503 Service Unavailable)**:
```json
{
  "type": "https://esg.platform/problems/service-unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "GraphDB service is currently unavailable",
  "instance": "/public/v1/ingest",
  "retryAfter": "30s"
}
```

#### 错误码清单
| 状态码 | 错误码 | 描述 | 重试 |
|--------|--------|------|------|
| 400 | `INVALID_CONTENT_TYPE` | 不支持的Content-Type | ❌ |
| 400 | `INVALID_JSON` | JSON格式错误 | ❌ |
| 401 | `UNAUTHORIZED` | JWT Token无效 | ❌ |
| 403 | `FORBIDDEN` | 缺少write:metrics权限 | ❌ |
| 409 | `CONFLICT` | 指标已存在 | ❌ |
| 422 | `VALIDATION_FAILED` | 预写入验证失败 | ❌ |
| 429 | `RATE_LIMIT_EXCEEDED` | 写入速率限制 | ✅ |
| 503 | `SERVICE_UNAVAILABLE` | GraphDB不可用 | ✅ |

### 1.3 POST /public/v1/ingest/batch

#### 输入 (Input)
**Content-Type**: `application/json`

```json
{
  "metrics": [
    {
      "framework": "SASB",
      "industry": "Commercial Banks", 
      "code": "FN-CB-410a.1",
      "entityId": "bank-001",
      "value": 1250000.00,
      "unitIri": "http://qudt.org/vocab/unit/USD",
      "asOf": "2023-12-31T23:59:59Z",
      "source": "Annual Report 2023"
    },
    {
      "framework": "GRI",
      "industry": "Commercial Banks",
      "code": "201-1", 
      "entityId": "bank-001",
      "value": 2500000.00,
      "unitIri": "http://qudt.org/vocab/unit/USD",
      "asOf": "2023-12-31T23:59:59Z",
      "source": "Annual Report 2023"
    }
  ],
  "options": {
    "validateFirst": true,
    "stopOnError": false,
    "transactional": true
  }
}
```

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Request-ID: optional-request-id
Idempotency-Key: optional-idempotency-key
```

#### 输出 (Output)

**成功响应 (201 Created)**:
```json
{
  "batchId": "batch_abc123def456",
  "status": "completed",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "duration": 3450
  },
  "results": [
    {
      "index": 0,
      "success": true,
      "metricIri": "https://esg.platform/data/metric/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31",
      "triplesCount": 15
    },
    {
      "index": 1,
      "success": true,
      "metricIri": "https://esg.platform/data/metric/bank-001/GRI/Commercial%20Banks/201-1/2023-12-31", 
      "triplesCount": 12
    }
  ],
  "namedGraph": "https://esg.platform/graphs/batch_abc123def456"
}
```

**部分失败响应 (207 Multi-Status)**:
```json
{
  "batchId": "batch_abc123def456",
  "status": "partial",
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1,
    "duration": 2100
  },
  "results": [
    {
      "index": 0,
      "success": true,
      "metricIri": "https://esg.platform/data/metric/bank-001/SASB/Commercial%20Banks/FN-CB-410a.1/2023-12-31",
      "triplesCount": 15
    },
    {
      "index": 1,
      "success": false,
      "error": {
        "code": "CONFLICT",
        "message": "Metric already exists",
        "existing": {
          "iri": "https://esg.platform/data/metric/bank-001/GRI/Commercial%20Banks/201-1/2023-12-31"
        }
      }
    }
  ]
}
```

#### 错误码清单
| 状态码 | 错误码 | 描述 | 重试 |
|--------|--------|------|------|
| 400 | `INVALID_CONTENT_TYPE` | 不支持的Content-Type | ❌ |
| 400 | `INVALID_JSON` | JSON格式错误 | ❌ |
| 400 | `INVALID_BATCH_SIZE` | 批量大小超出限制 | ❌ |
| 401 | `UNAUTHORIZED` | JWT Token无效 | ❌ |
| 403 | `FORBIDDEN` | 缺少write:metrics权限 | ❌ |
| 409 | `CONFLICT` | 批量中存在冲突指标 | ❌ |
| 422 | `VALIDATION_FAILED` | 批量验证失败 | ❌ |
| 429 | `RATE_LIMIT_EXCEEDED` | 批量写入速率限制 | ✅ |
| 503 | `SERVICE_UNAVAILABLE` | GraphDB不可用 | ✅ |

### 1.4 GET /public/v1/health

#### 输入 (Input)
**无请求体**

**Headers**:
```http
Accept: application/json
```

#### 输出 (Output)

**健康响应 (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-28T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "graphdb": "healthy",
    "shacl_validator": "healthy"
  }
}
```

**不健康响应 (503 Service Unavailable)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-09-28T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "graphdb": "unhealthy",
    "shacl_validator": "healthy"
  }
}
```

> **📋 读取类端点已迁移**: 所有查询、聚合、只读操作已迁移至 [Go Internal API](../../../api-internal/docs/API_CONTRACTS.md)。本服务专注于写入操作，确保职责分离和性能优化。

## 2. Application Services 输入输出规范

### 2.1 ValidationService

#### validateMetric()

**输入**:
```typescript
interface ValidateMetricInput {
  data: ESGMetric | string;     // JSON object or TTL string
  format: 'json' | 'ttl';
  context: RequestContext;
}

interface RequestContext {
  requestId: string;
  userId: string;
  timestamp: Date;
}
```

**输出**:
```typescript
interface ValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
  warnings: ValidationWarning[];
  summary: {
    constraintsChecked: number;
    fieldCount: number;
    duration: number;
  };
}

interface ConstraintViolation {
  path: string;           // e.g., "esg:framework"
  constraint: string;     // e.g., "sh:in"
  message: string;        
  value?: any;
  severity: 'error' | 'warning';
}
```

**异常**:
- `ValidationServiceError` - 服务内部错误
- `ShaclEngineError` - SHACL引擎错误
- `DataFormatError` - 数据格式错误

#### validateBatch()

**输入**:
```typescript
interface ValidateBatchInput {
  metrics: ESGMetric[];
  options: {
    stopOnFirstError: boolean;
    maxConcurrent: number;
  };
  context: RequestContext;
}
```

**输出**:
```typescript
interface BatchValidationResult {
  isValid: boolean;
  results: IndividualValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duration: number;
  };
}

interface IndividualValidationResult {
  index: number;
  metricId: string;
  isValid: boolean;
  violations: ConstraintViolation[];
}
```

### 2.2 IngestService

#### ingestMetric()

**输入**:
```typescript
interface IngestMetricInput {
  metric: ESGMetric;
  context: IngestContext;
}

interface IngestContext {
  requestId: string;
  batchId: string;
  userId: string;
  timestamp: Date;
  namedGraph?: string;
  skipValidation?: boolean;
}
```

**输出**:
```typescript
interface IngestResult {
  success: boolean;
  metricIri: string;
  namedGraph: string;
  triplesCount: number;
  duration: number;
  phases: {
    validation?: number;
    conversion: number;
    write: number;
    provenance: number;
  };
}
```

**异常**:
- `ConflictError` - 指标已存在
- `ValidationError` - 预写入验证失败
- `GraphWriteError` - GraphDB写入失败
- `ProvenanceError` - 溯源记录失败

#### ingestBatch()

**输入**:
```typescript
interface IngestBatchInput {
  metrics: ESGMetric[];
  options: {
    validateFirst: boolean;
    stopOnError: boolean;
    transactional: boolean;
  };
  context: IngestContext;
}
```

**输出**:
```typescript
interface BatchIngestResult {
  batchId: string;
  status: 'completed' | 'partial' | 'failed';
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
  results: IndividualIngestResult[];
  namedGraph: string;
}

interface IndividualIngestResult {
  index: number;
  success: boolean;
  metricIri?: string;
  triplesCount?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 2.3 ProvenanceService

#### createBatch()

**输入**:
```typescript
interface CreateBatchInput {
  userId: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}
```

**输出**:
```typescript
interface BatchMetadata {
  batchId: string;
  createdAt: Date;
  createdBy: string;
  namedGraph: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  metadata: Record<string, any>;
}
```

#### recordActivity()

**输入**:
```typescript
interface RecordActivityInput {
  batch: BatchMetadata;
  metric: ESGMetric;
  writeResult: WriteResult;
  activity: string;
}
```

**输出**:
```typescript
interface ProvenanceRecord {
  activityIri: string;
  agentIri: string;
  entityIri: string;
  startedAt: Date;
  endedAt: Date;
  wasAssociatedWith: string;
  used: string[];
  generated: string[];
}
```

## 3. Infrastructure Layer 输入输出规范

### 3.1 GraphWriter Port

#### writeStatements()

**输入**:
```typescript
interface WriteStatementsInput {
  statements: RDFStatement[];
  namedGraph: string;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

interface RDFStatement {
  subject: string;
  predicate: string;
  object: string | RDFLiteral;
  namedGraph?: string;
}
```

**输出**:
```typescript
interface WriteResult {
  success: boolean;
  triplesCount: number;
  duration: number;
  transactionId?: string;
}
```

### 3.2 ShaclValidator Port

#### validateData()

**输入**:
```typescript
interface ValidateDataInput {
  data: string;
  format: RDFFormat;
  shapesGraph?: string;
}

type RDFFormat = 'turtle' | 'n-triples' | 'rdf-xml' | 'json-ld';
```

**输出**:
```typescript
interface ValidationReport {
  conforms: boolean;
  violations: ShaclViolation[];
  metadata: {
    shapesCount: number;
    validationTime: number;
  };
}

interface ShaclViolation {
  focusNode: string;
  path: string;
  value?: any;
  constraint: string;
  severity: string;
  message: string;
}
```

## 4. 错误响应标准格式

### RFC 7807 Problem Details
```typescript
interface ProblemDetails {
  type: string;           // URI标识错误类型
  title: string;          // 简短描述
  status: number;         // HTTP状态码
  detail: string;         // 详细描述
  instance?: string;      // 出错的具体实例
  
  // 扩展字段
  errors?: FieldError[];  // 字段级错误
  timestamp?: string;     // 错误时间
  requestId?: string;     // 请求ID
  traceId?: string;       // 链路追踪ID
}

interface FieldError {
  field: string;          // 字段路径
  code: string;           // 错误代码
  message: string;        // 错误消息
  value?: any;           // 错误值
  constraint?: any;       // 约束信息
}
```

### 常用错误类型 URI
```
https://esg.platform/problems/validation-failed
https://esg.platform/problems/conflict  
https://esg.platform/problems/forbidden
https://esg.platform/problems/service-unavailable
https://esg.platform/problems/rate-limit-exceeded
https://esg.platform/problems/internal-error
```

## 前端集成重要说明

### ⚠️ Content-Type 严格限制

**关键原则**：**写入端点仅接受JSON，TTL仅用于验证端点**

#### 正确的集成方式

**✅ 数据写入** - 必须使用JSON：
```javascript
// 单个指标写入
const response = await fetch('/public/v1/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',  // 🟢 必须是JSON
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': 'unique-operation-id'  // 🟢 幂等性保证
  },
  body: JSON.stringify({
    framework: "SASB",
    industry: "Commercial Banks", 
    code: "FN-CB-410a.1",
    entityId: "bank-001",
    value: 1250000.00,
    unitIri: "http://qudt.org/vocab/unit/USD",
    asOf: "2023-12-31T23:59:59Z",
    source: "Annual Report 2023"
  })
});

// 批量指标写入
const batchResponse = await fetch('/public/v1/ingest/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',  // 🟢 必须是JSON
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': 'batch-operation-unique-id'  // 🟢 批量幂等性保证
  },
  body: JSON.stringify({
    metrics: [/* ESGMetric[] */],
    options: { validateFirst: true }
  })
});
```

**✅ 数据验证** - 支持JSON和TTL：
```javascript
// JSON验证
const validateJson = await fetch('/public/v1/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(metric)
});

// TTL验证（仅用于格式测试）
const validateTtl = await fetch('/public/v1/validate', {
  method: 'POST', 
  headers: { 'Content-Type': 'text/turtle' },
  body: `@prefix esg: <https://esg.platform/ontology/> .
         esg:metric_001 a esg:Metric ;
         esg:framework "SASB" .`
});
```

#### ❌ 常见错误

```javascript
// 🚫 错误：试图直接POST TTL到写入端点
fetch('/public/v1/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'text/turtle' },  // ❌ 写入端点不支持
  body: '@prefix esg: <...> .'
});

// 🚫 错误：使用错误的Content-Type
fetch('/public/v1/ingest/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },   // ❌ 只支持application/json
  body: JSON.stringify(data)
});
```

### 架构职责分工

- **前端职责**：提交符合JSON Schema的指标数据，可选择性提供Idempotency-Key
- **IngestService职责**：
  - `batchId` 和 `namedGraph` 内部生成（不接受外部传入）
  - JSON→TTL转换、Metric IRI生成
  - GraphDB事务写入、溯源记录
- **验证流程**：JSON Schema验证 → SHACL验证 → 数据写入
- **幂等性保证**：通过Idempotency-Key实现，而非外部batchId

### 错误处理最佳实践

```javascript
async function ingestMetric(metric: ESGMetric): Promise<IngestResponse> {
  try {
    const response = await fetch('/public/v1/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(metric)
    });
    
    if (!response.ok) {
      const problem: ProblemDetails = await response.json();
      
      switch (problem.status) {
        case 400:
          throw new ValidationError(problem.detail, problem.violations);
        case 409:
          throw new ConflictError(problem.detail, problem.existing?.iri);
        case 422:
          throw new ValidationError(problem.detail, problem.violations);
        case 503:
          throw new ServiceUnavailableError(problem.detail, problem.retryAfter);
        default:
          throw new APIError(problem.detail);
      }
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Ingest failed:', error);
    throw error;
  }
}
```

这份清单确保了API的输入输出格式标准化、错误处理一致性，为前端集成和系统集成提供了明确的契约定义。