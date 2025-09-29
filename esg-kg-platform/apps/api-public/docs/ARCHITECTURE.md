# ESG Platform Write Pipeline - Layered Architecture

> Hexagonal architecture with knowledge graph integration and clear responsibility boundaries

## 📋 重要说明：读写分离架构

**当前架构状态**: 本文档描述的是**TypeScript Public API（写服务）**的架构设计。

**职责分工**:
- **🔴 TypeScript Public API**: 专注写入操作（验证、转换、写入GraphDB）
- **🔵 Go Internal API**: 专注读取操作（查询、聚合、报表生成）

**文档中的Query Service**: 已迁移到Go Internal API实现，本文档中保留的Query Service定义仅作为**架构参考契约**，实际读取功能请使用 [Go Internal API](../../api-internal/docs/API_CONTRACTS.md)。

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Interfaces Layer                      │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   HTTP Routes   │  │      HTTP Middleware            │ │
│  │   /public/*     │  │  Auth, Logging, Error, Rate     │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Validation    │ │   Ingest     │ │   Computation    │ │
│  │   Service     │ │   Service    │ │     Service      │ │
│  └───────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ KnowledgeGraph│ │  Provenance  │ │   Audit Trail    │ │
│  │    Service    │ │    Service   │ │     Service      │ │
│  └───────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Application Ports                      │ │
│  │  GraphWriter | ShaclValidator | ModelExecutor      │ │
│  │  [QueryService → Migrated to Go Internal API]      │ │
│  │  TimeProvider | AuditLogger                        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  GraphDB     │ │    SHACL     │ │   Model Query    │ │
│  │   Client     │ │  Validator   │ │     Client       │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Internal API │ │  IRI/Logging │ │   Redis Cache    │ │
│  │   Client     │ │   Adapters   │ │    Client        │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 1. Interfaces Layer

### 1.1 HTTP Routes (`interfaces/http/routes/`)

**Responsibility Boundaries**:
- Handle HTTP protocol-level routing and version management
- Unified path prefix `/public/*` to clearly define public API boundary
- Convert HTTP requests to domain objects for application layer
- Transform application layer responses to standard HTTP responses
- Clear separation: direct measurement ingestion and computation execution

**Specific Routes**:

#### `POST /public/v1/validate`
- **职责**：接收ESG指标数据，返回SHACL验证结果
- **输入**：JSON格式ESG指标或TTL格式RDF数据
- **输出**：验证报告（成功/失败详情）
- **不负责**：具体的验证逻辑实现

#### `POST /public/v1/ingest/metric`  
- **职责**：接收验证通过的ESG直接测量指标，触发写入流程
- **输入**：JSON格式ESG指标数据（仅直接测量值）
- **输出**：写入确认、批次ID、存储位置IRI
- **不负责**：数据转换和存储逻辑
- **约束**：仅接受预计算的数值，不执行计算模型

#### `POST /public/v1/ingest/batch`
- **职责**：批量写入多个ESG直接测量指标
- **输入**：ESG指标数组（仅直接测量数据）
- **输出**：批次处理结果摘要
- **不负责**：事务管理和错误聚合
- **约束**：所有指标必须是预计算的直接测量值

#### `POST /public/v1/compute`
- **职责**：执行知识图谱中定义的计算模型
- **输入**：计算代码、输入参数值、实体信息
- **输出**：计算结果和生成的MetricDto对象
- **不负责**：结果的持久化存储
- **功能**：查询TTL中的模型定义，执行计算逻辑

#### `GET /public/v1/health`
- **职责**：系统健康状态检查
- **输入**：无
- **输出**：依赖服务状态
- **不负责**：具体的健康检查逻辑

### 1.2 HTTP Middleware (`interfaces/http/middleware/`)

#### Authentication Middleware (`auth.ts`)

> 🔧 **开发模式占位符**：当前为本地开发优化，认证功能暂未实现。中间件直接通过所有请求。

**预留功能**（未来实现）：
- JWT Token解析和验证
- Scope权限检查（write:metrics, validate:metrics）
- 将认证信息注入请求上下文
- **边界**：仅处理HTTP层面的认证，不涉及业务授权逻辑

```typescript
// 预留接口定义（当前未使用）
interface AuthContext {
  sub: string;        // 用户标识符
  scopes: string[];   // 权限范围
  issuer: string;     // Token颁发者
  exp: number;        // Token过期时间
}

// 当前开发模式实现
const authMiddleware = () => {
  return (request, reply, next) => {
    // 直接通过，无认证检查
    next();
  };
};
```
```

#### Request Logging Middleware (`logging.ts`)
**职责**：
- 生成唯一请求ID (UUID)
- 记录请求开始时间和基本信息
- 将request-id注入响应头
- **边界**：仅记录HTTP层面信息，业务日志由应用层处理

#### Error Handling Middleware (`error.ts`)
**职责**：
- 捕获未处理异常，转换为RFC 7807格式
- 错误响应标准化
- 敏感信息过滤
- **边界**：仅处理HTTP响应格式，不处理业务错误逻辑

#### Rate Limiting Middleware (`rateLimit.ts`)
**职责**：
- 基于IP/用户的请求频率限制
- 写入操作采用较严格限制（例：10 req/min）
- 验证操作相对宽松（例：100 req/min）
- **边界**：仅处理HTTP层面限流，不涉及业务逻辑限制

## 2. Application Layer (应用层)

### 2.1 Validation Service (`application/services/validation.ts`)

**核心职责**：
- 接收JSON或TTL格式的数据
- 协调SHACL验证流程
- 聚合和格式化验证错误
- 返回结构化验证报告

**详细职责**：

```typescript
interface ValidationService {
  // 主要方法
  validateMetric(data: unknown, format: 'json' | 'ttl'): Promise<ValidationResult>;
  validateBatch(metrics: unknown[]): Promise<BatchValidationResult>;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    fieldCount: number;
    constraintCount: number;
    duration: number;
  };
}
```

**不负责**：
- 具体的SHACL引擎调用（委托给ShaclValidator端口）
- 数据格式转换（委托给基础设施层）
- 错误响应的HTTP格式化（由接口层处理）

### 2.2 Ingest Service (`application/services/ingest.ts`)

**核心职责**：
- JSON到RDF/TTL的语义转换
- IRI生成和命名策略（metricIri, batchId, namedGraph）
- 批次管理和命名图创建
- GraphDB写入事务管理
- 写入结果确认和元数据返回

**详细职责**：

```typescript
interface IngestService {
  // 公共接口
  ingestMetric(metric: ESGMetric, context: IngestContext): Promise<IngestResult>;
  ingestBatch(metrics: ESGMetric[], context: IngestContext): Promise<BatchIngestResult>;
  
  // 内部职责方法
  private generateBatchId(): string;
  private generateNamedGraph(batchId: string, timestamp: Date): string;
  private generateMetricIri(metric: ESGMetric): string;  // 调用 ESGIriStrategy.generateMetricIri()
  private convertToTTL(metric: ESGMetric, metricIri: string, namedGraph: string): string;
  private checkDuplicate(metric: ESGMetric): Promise<string | null>;
}

interface IngestContext {
  requestId: string;
  userId: string;
  timestamp: Date;
  // batchId和namedGraph由IngestService内部生成，不从外部传入
}

interface IngestResult {
  success: boolean;
  batchId: string;
  metricIri: string;
  namedGraph: string;
  triplesCount: number;
  duration: number;
}
```

**负责的具体操作**：
1. **批次管理**：生成唯一batchId，创建对应的命名图IRI
2. **IRI策略**：为指标生成符合规范的IRI（基于framework、industry、code、entityId）
3. **TTL转换**：将JSON格式ESG指标转换为RDF/TTL格式，包含所有必要的三元组
4. **重复检查**：通过SPARQL查询检查是否存在相同的指标
5. **事务写入**：协调GraphDB的事务性写入操作

**不负责**：
- 具体的GraphDB连接管理（委托给GraphWriter端口）
- PROV-O溯源数据生成（委托给Provenance Service）

**实现示例**：
```typescript
class IngestService {
  // IngestService 的 generateMetricIri 方法实现
  private generateMetricIri(metric: ESGMetric): string {
    // 委托给 ESGIriStrategy 的静态方法
    return ESGIriStrategy.generateMetricIri(
      metric.framework,
      metric.industry,
      metric.code,
      metric.entityId,
      metric.asOf
    );
  }
}
```
- 重试和错误恢复逻辑（由基础设施层处理）
- SHACL验证逻辑（委托给ValidationService）

### 2.3 Provenance Service (`application/services/provenance.ts`)

**核心职责**：
- PROV-O元数据构建
- 写入行为溯源记录
- 数据来源和处理活动的追溯链条

**详细职责**：

```typescript
interface ProvenanceService {
  recordIngestActivity(
    batchId: string, 
    metricIri: string, 
    userId: string, 
    writeResult: WriteResult
  ): Promise<ProvenanceRecord>;
  generateProvenanceTriples(record: ProvenanceRecord): Promise<string>; // TTL format
  recordBatchCompletion(batchId: string, status: 'completed' | 'failed'): Promise<void>;
}

interface ProvenanceRecord {
  activityIri: string;        // 写入活动IRI
  agentIri: string;           // 用户代理IRI  
  entityIri: string;          // 指标实体IRI
  batchIri: string;           // 批次IRI
  startedAt: Date;            // 活动开始时间
  endedAt: Date;              // 活动结束时间
  wasAssociatedWith: string;  // 关联的用户
  used: string[];             // 使用的输入数据
  generated: string[];        // 生成的输出数据
}
```

**不负责**：
- 具体的时间获取（委托给TimeProvider端口）
- IRI生成策略（使用基础设施层的IRI服务）
- PROV-O本体的具体实现细节

### 2.4 Computation Service (`application/services/computation.ts`)

**核心职责**：
- 执行知识图谱中定义的计算模型
- 查询TTL中的模型定义和输入要求
- 验证输入参数的完整性和有效性
- 生成计算结果并创建对应的MetricDto

**详细职责**：

```typescript
interface ComputationService {
  // 公共接口
  executeComputation(request: ComputationRequest): Promise<ComputationResult>;
  getComputationMethod(code: string): Promise<ComputationMethod | null>;
  validateInputs(code: string, inputs: Record<string, number>): Promise<ValidationResult>;
  
  // 内部职责方法
  private queryModelFromKG(code: string): Promise<ModelDefinition>;
  private executeModel(model: ModelDefinition, inputs: Record<string, number>): Promise<number>;
  private generateMetricDto(result: ComputationResult): MetricDto;
  private mapUnitTextToIRI(unitText: string): string;
}

interface ComputationRequest {
  framework: string;
  industry: string;
  code: string;
  entityId: string;
  inputValues: Record<string, number>;
  asOf: string;
  source: string;
}

interface ComputationResult {
  value: number;
  unitIri: string;
  computedAt: string;
  method: {
    code: string;
    modelName: string;
    formula?: string;
  };
  inputValues: Record<string, number>;
  generatedMetric: MetricDto;
}

interface ModelDefinition {
  code: string;
  modelName: string;
  formula: string;
  requiredInputs: string[];
  outputUnit: string;
  calculationType: string;
}
```

**职责范围**：
1. **模型查询**：从TTL知识图谱中查询计算模型定义
2. **输入验证**：确保提供的输入参数满足模型要求
3. **计算执行**：根据模型公式执行数值计算
4. **单位映射**：将TTL中的文本单位转换为QUDT IRI
5. **结果生成**：创建符合MetricDto格式的计算结果

**明确边界**：
- ✅ 计算模型执行：基于TTL中的模型定义
- ✅ 结果格式化：生成标准MetricDto对象
- ❌ 结果持久化：由IngestService负责
- ❌ 模型定义管理：存储在TTL知识图谱中
- ❌ 复杂业务逻辑：仅执行数学计算

### 2.5 Application Ports (`application/ports/`)

**设计原则**：依赖倒置，应用层定义接口，基础设施层实现

#### GraphWriter Port
```typescript
interface GraphWriter {
  writeStatements(statements: RDFStatement[], namedGraph: string): Promise<WriteResult>;
  executeSparqlUpdate(query: string): Promise<UpdateResult>;
  executeAskQuery(query: string): Promise<boolean>;
  beginTransaction(): Promise<Transaction>;
}
```

#### GraphReader Port
```typescript
interface GraphReader {
  executeSparqlQuery(query: string): Promise<QueryResult>;
  getTriples(subject?: string, predicate?: string, object?: string): Promise<RDFTriple[]>;
  checkExists(iri: string): Promise<boolean>;
  getMetadata(iri: string): Promise<ResourceMetadata>;
}
```

#### ShaclValidator Port
```typescript
interface ShaclValidator {
  validateData(data: string, format: RDFFormat): Promise<ValidationReport>;
  loadShapes(shapesGraph: string): Promise<void>;
  getConstraintViolations(): Promise<ConstraintViolation[]>;
}
```

#### TimeProvider Port
```typescript
interface TimeProvider {
  now(): Date;
  formatISO(date: Date): string;
  parseISO(dateString: string): Date;
}
```

## 3. Infrastructure Layer (基础设施层)

### 3.1 GraphDB Client (`infrastructure/graphdb/`)

**职责边界**：
- GraphDB HTTP API的具体调用实现
- 连接池管理和连接重试
- SPARQL查询和更新语句执行
- 事务管理和错误处理

**不负责**：
- 业务领域的查询逻辑
- SHACL验证的具体实现
- 应用层的事务边界定义

#### Statements Client (`statements.ts`)
```typescript
class GraphDBStatementsClient implements GraphWriter {
  async writeStatements(statements: RDFStatement[], namedGraph: string): Promise<WriteResult>;
  async deleteStatements(subject: string, namedGraph: string): Promise<DeleteResult>;
}
```

#### SPARQL Client (`sparql.ts`)
```typescript
class GraphDBSparqlClient {
  async executeQuery(query: string): Promise<QueryResult>;
  async executeUpdate(update: string): Promise<UpdateResult>;
}
```

### 3.2 SHACL Validator (`infrastructure/shacl/`)

**职责边界**：
- SHACL引擎的具体实现和调用
- 验证报告的解析和格式化
- 约束违规信息的提取和转换

```typescript
class ShaclValidatorImpl implements ShaclValidator {
  async validateData(data: string, format: RDFFormat): Promise<ValidationReport>;
  private parseViolations(report: string): ConstraintViolation[];
}
```

### 3.3 IRI Strategy (`infrastructure/iri/`)

**职责边界**：
- 提供IRI生成的技术实现
- 命名空间管理和URI编码
- IRI格式的标准化

**注意**：此组件被IngestService内部使用，不对外暴露

```typescript
class ESGIriStrategy {
  // 由IngestService内部调用的工具方法
  static generateMetricIri(framework: string, industry: string, code: string, entityId: string, asOf: string): string;
  static generateBatchIri(batchId: string): string;
  static generateNamedGraph(batchId: string, timestamp: Date): string;
  static encodeUriComponent(value: string): string;
  static buildNamespace(prefix: string): string;
}
```

### 3.4 Logging Adapter (`infrastructure/logging/`)

**职责边界**：
- 结构化日志输出适配
- 日志级别和格式管理
- 外部日志系统集成

```typescript
class StructuredLogger {
  logIngestStart(batchId: string, metricCount: number): void;
  logValidationResult(result: ValidationResult): void;
  logError(error: Error, context: LogContext): void;
}
```

## 职责边界总结

### ✅ 每层负责什么

| 层次 | 核心职责 | 典型组件 |
|------|----------|----------|
| **Interfaces** | HTTP协议适配，请求响应转换 | Routes, Middleware |
| **Application** | 业务流程编排，领域逻辑 | Services, Ports |
| **Infrastructure** | 外部系统集成，技术实现 | Clients, Adapters |

### ❌ 每层不负责什么

| 层次 | 不负责内容 | 原因 |
|------|------------|------|
| **Interfaces** | 业务逻辑，数据验证 | 关注点分离 |
| **Application** | 具体技术实现，外部API调用 | 依赖倒置 |
| **Infrastructure** | 业务规则，流程编排 | 单一职责 |

这种分层设计确保了：
1. **可测试性**：每层都可以独立测试
2. **可维护性**：修改一层不影响其他层
3. **可扩展性**：可以替换基础设施实现
4. **清晰性**：职责边界明确，减少耦合