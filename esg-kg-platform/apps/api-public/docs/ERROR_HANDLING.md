# ESG Platform Error Handling & Retry Strategy

> Exception flow design, error classification, retry mechanisms, and fallback strategies with knowledge graph integration

## Error Classification System

### 1. Client Errors (4xx) - No Retry

#### 422 Unprocessable Entity - Validation Failed
**Trigger Conditions**:
- SHACL constraint violations
- Data integrity check failures
- Business rule validation failures
- Knowledge graph model validation errors
- Calculation model input validation failures

**Enhanced Handling Strategy**:
```typescript
// ValidationService.ts
async validateMetric(data: ESGMetric): Promise<ValidationResult> {
  let violations: ConstraintViolation[] = [];
  
  try {
    // Basic SHACL validation
    violations = await this.shaclValidator.validateData(data);
    
    // Knowledge graph context validation
    if (data.calculationMethod === 'calculation_model') {
      const modelValidation = await this.validateCalculationModel(data.metricData);
      violations.push(...modelValidation.violations);
    }
    
    // Knowledge graph structure validation
    const kgValidation = await this.validateKGContext(data);
    violations.push(...kgValidation.violations);
    
    if (violations.length > 0) {
      throw new ValidationError('VALIDATION_FAILED', violations);
    }
    
    return { isValid: true, violations: [] };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new HttpError(422, 'VALIDATION_FAILED', {
        type: 'https://esg.platform/problems/validation-failed',
        violations: error.violations.map(v => ({
          field: v.path,
          message: v.message,
          code: v.code,
          rejectedValue: v.value
        }))
      });
    }
    throw error;
  }
}

async validateCalculationModel(metricData: CalculatedMetricData): Promise<ValidationResult> {
  // Validate model exists in knowledge graph
  const modelExists = await this.knowledgeGraphService.modelExists(metricData.modelName);
  if (!modelExists) {
    return {
      isValid: false,
      violations: [{
        path: 'metricData.modelName',
        message: `Calculation model '${metricData.modelName}' not found in knowledge graph`,
        code: 'MODEL_NOT_FOUND',
        value: metricData.modelName
      }]
    };
  }
  
  // Validate required inputs
  const requiredInputs = await this.knowledgeGraphService.getModelRequiredInputs(metricData.modelName);
  const providedInputs = Object.keys(metricData.inputMetrics);
  const missingInputs = requiredInputs.filter(input => !providedInputs.includes(input));
  
  if (missingInputs.length > 0) {
    return {
      isValid: false,
      violations: missingInputs.map(input => ({
        path: `metricData.inputMetrics.${input}`,
        message: `Required input '${input}' missing for model '${metricData.modelName}'`,
        code: 'REQUIRED_INPUT_MISSING',
        value: undefined
      }))
    };
  }
  
  return { isValid: true, violations: [] };
}
```

#### 400 Bad Request - Calculation Execution Error
**Trigger Conditions**:
- Calculation model execution failures  
- Invalid input metric combinations
- Model formula evaluation errors (division by zero, etc.)
- Runtime calculation exceptions

**Handling Strategy**:
```typescript
// CalculationService.ts
async executeCalculationModel(
  modelName: string, 
  inputs: Record<string, MetricInput>
): Promise<CalculationResult> {
  try {
    const model = await this.knowledgeGraphService.getModel(modelName);
    if (!model) {
      throw new HttpError(422, 'VALIDATION_FAILED', {
        type: 'https://esg.platform/problems/validation-failed',
        detail: `Calculation model '${modelName}' not found`,
        violations: [{
          path: 'metricData.modelName',
          code: 'MODEL_NOT_FOUND',
          message: `Model '${modelName}' does not exist`
        }]
      });
    }
    
    const result = await this.executeModel(model, inputs);
    return result;
  } catch (error) {
    if (error.code === 'DIVISION_BY_ZERO') {
      throw new HttpError(400, 'CALCULATION_ERROR', {
        type: 'https://esg.platform/problems/calculation-failed',
        detail: 'Division by zero in calculation model',
        modelName,
        formula: model.formula
      });
    }
    throw error;
  }
}
```

#### 409 Conflict - Resource Conflict
**触发条件**:
- 相同 `entityId + framework + industry + code + date` 的指标已存在
- 批次ID重复提交
- 命名图版本冲突

**冲突键定义**：
```typescript
interface ConflictKey {
  entityId: string;    // 报告实体标识符
  framework: string;   // ESG框架 (SASB, GRI, TCFD等)
  industry: string;    // 行业分类 (URL编码后)
  code: string;        // 计算代码标识
  date: string;        // 规范化日期 (YYYY-MM-DD)
}
```

> 📌 **重要**: 冲突检测基于完整的Metric IRI路径组件，与IRI生成策略完全一致：
> `https://esg.platform/data/metric/{entityId}/{framework}/{industry}/{code}/{asOf}`

**处理策略**：
```typescript
// IngestService.ts
async ingestMetric(metric: ESGMetric): Promise<IngestResult> {
  // 检查是否存在重复指标
  const existingIri = await this.checkDuplicate(metric);
  if (existingIri) {
    throw new HttpError(409, 'CONFLICT', {
      type: 'https://esg.platform/problems/conflict',
      detail: 'Metric already exists for this entity, framework, industry, calculation code and date',
      existing: {
        iri: existingIri
      },
      conflictKey: {
        entityId: metric.entityId,
        framework: metric.framework,
        industry: metric.industry,
        code: metric.code,
        date: this.extractDateFromAsOf(metric.asOf)
      }
    });
  }
  
  // 处理计算型指标的模型执行
  let calculationResults: CalculationResults | undefined;
  if (metric.calculationMethod === 'calculation_model') {
    try {
      calculationResults = await this.executeCalculationModel(metric);
    } catch (error) {
      throw new HttpError(400, 'CALCULATION_ERROR', {
        type: 'https://esg.platform/problems/calculation-failed',
        detail: 'Calculation model execution failed during ingestion',
        modelName: metric.metricData.modelName,
        error: error.message
      });
    }
  }
  
  // 执行写入操作
  return await this.performIngestion(metric, calculationResults);
}

private async checkDuplicate(metric: ESGMetric): Promise<string | null> {
  // 构造基于知识图谱结构的规范化 Metric IRI
  const metricIri = this.generateMetricIri(metric);
  
  // 使用ASK查询检查Metric IRI是否存在
  const query = `
    ASK WHERE {
      <${metricIri}> ?p ?o .
    }
  `;
  
  const exists = await this.graphWriter.executeAskQuery(query);
  return exists ? metricIri : null;
}

private generateMetricIri(metric: ESGMetric): string {
  // 提取并规范化冲突键的各个组件
  const entityId = encodeURIComponent(metric.entityId);
  const framework = encodeURIComponent(metric.framework);
  const industry = encodeURIComponent(metric.industry); // 关键：包含行业
  const code = encodeURIComponent(metric.code);
  const date = this.extractDateFromAsOf(metric.asOf); // 规范化为YYYY-MM-DD
  
  // 构造完整的Metric IRI，包含所有冲突键组件
  return `https://esg.platform/data/metric/${entityId}/${framework}/${industry}/${code}/${date}`;
}

private extractDateFromAsOf(asOf: string): string {
  // 将 "2023-12-31T23:59:59Z" 规范化为 "2023-12-31"
  return new Date(asOf).toISOString().split('T')[0];
}

private async executeCalculationModel(metric: ESGMetric): Promise<CalculationResults> {
  if (metric.metricData.type !== 'calculation_model') {
    throw new Error('Invalid metric data type for calculation');
  }
  
  return await this.calculationService.executeModel(
    metric.metricData.modelName,
    metric.metricData.inputMetrics
  );
}
```

### 2. 服务端错误 (5xx) - 重试机制

#### 503 Service Unavailable - GraphDB故障
**触发条件**：
- GraphDB连接超时
- GraphDB服务不可用
- SHACL验证服务离线

**重试策略 - 指数退避**：
```typescript
// infrastructure/retry/RetryPolicy.ts
interface RetryConfig {
  maxAttempts: number;      // 最大重试次数
  baseDelay: number;        // 基础延迟 (ms)
  maxDelay: number;         // 最大延迟 (ms)
  backoffMultiplier: number; // 退避倍数
  jitter: boolean;          // 随机抖动
}

const GRAPHDB_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,          // 1秒
  maxDelay: 30000,          // 30秒
  backoffMultiplier: 2,
  jitter: true
};

class ExponentialBackoffRetry {
  async execute<T>(operation: () => Promise<T>, config: RetryConfig): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxAttempts || !this.isRetryable(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    if (config.jitter) {
      // 添加±25%的随机抖动
      const jitterRange = cappedDelay * 0.25;
      return cappedDelay + (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return cappedDelay;
  }
  
  private isRetryable(error: Error): boolean {
    // GraphDB连接错误
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('timeout') ||
        error.message.includes('503')) {
      return true;
    }
    
    // SHACL验证服务错误
    if (error instanceof ShaclServiceError && error.isTemporary) {
      return true;
    }
    
    return false;
  }
}
```

#### 500 Internal Server Error - 断路器模式
**触发条件**：
- GraphDB频繁失败
- 系统资源不足
- 未预期的内部错误

**断路器实现**：
```typescript
// infrastructure/circuitBreaker/CircuitBreaker.ts
enum CircuitState {
  CLOSED = 'CLOSED',     // 正常状态
  OPEN = 'OPEN',         // 断路状态  
  HALF_OPEN = 'HALF_OPEN' // 半开状态
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // 失败阈值
  recoveryTimeout: number;     // 恢复超时
  monitoringPeriod: number;    // 监控周期
  successThreshold: number;    // 成功阈值（半开->关闭）
}

const GRAPHDB_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,         // 5次失败后断路
  recoveryTimeout: 60000,      // 60秒后尝试恢复
  monitoringPeriod: 300000,    // 5分钟监控周期
  successThreshold: 3          // 连续3次成功后恢复
};

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.config.recoveryTimeout) {
        throw new ServiceUnavailableError('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

## 错误传播和转换

### 错误转换链路
```
Infrastructure Error → Application Error → HTTP Error → RFC 7807 Response
```

### 1. 基础设施层错误
```typescript
// infrastructure/errors/
class GraphDBConnectionError extends Error {
  constructor(public readonly cause: Error) {
    super(`GraphDB connection failed: ${cause.message}`);
    this.name = 'GraphDBConnectionError';
  }
}

class ShaclValidationServiceError extends Error {
  constructor(
    public readonly violations: ConstraintViolation[],
    public readonly isTemporary = false
  ) {
    super('SHACL validation failed');
    this.name = 'ShaclValidationServiceError';
  }
}
```

### 2. 应用层错误
```typescript
// application/errors/
class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

class ValidationError extends DomainError {
  constructor(violations: ConstraintViolation[]) {
    super('VALIDATION_FAILED', 'Data validation failed', { violations });
  }
}

class ConflictError extends DomainError {
  constructor(existingResource: any) {
    super('CONFLICT', 'Resource already exists', { existing: existingResource });
  }
}
```

### 3. HTTP错误映射
```typescript
// interfaces/http/errorMapping.ts
class ErrorMapper {
  static toHttpError(error: Error): HttpError {
    // 应用层错误映射
    if (error instanceof ValidationError) {
      return new HttpError(422, error.code, {
        type: 'https://esg.platform/problems/validation-failed',
        title: 'Validation Failed',
        detail: error.message,
        errors: error.details.violations
      });
    }
    
    if (error instanceof ConflictError) {
      return new HttpError(409, error.code, {
        type: 'https://esg.platform/problems/conflict',
        title: 'Resource Conflict',
        detail: error.message,
        existing: error.details.existing
      });
    }
    
    // 基础设施层错误映射
    if (error instanceof GraphDBConnectionError || 
        error instanceof ShaclValidationServiceError) {
      return new HttpError(503, 'SERVICE_UNAVAILABLE', {
        type: 'https://esg.platform/problems/service-unavailable',
        title: 'Service Unavailable',
        detail: 'Dependent service is temporarily unavailable'
      });
    }
    
    // 未知错误
    return new HttpError(500, 'INTERNAL_SERVER_ERROR', {
      type: 'https://esg.platform/problems/internal-error',
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred'
    });
  }
}
```

## 异常恢复策略

### 1. 数据一致性保证
```typescript
// application/services/TransactionalIngestService.ts
class TransactionalIngestService {
  async ingestBatch(metrics: ESGMetric[]): Promise<BatchIngestResult> {
    const batchId = await this.provenance.createBatch();
    const transaction = await this.graphWriter.beginTransaction();
    
    try {
      const results = [];
      
      for (const metric of metrics) {
        // 验证 -> 转换 -> 写入 -> 记录溯源
        const validationResult = await this.validateMetric(metric);
        if (!validationResult.isValid) {
          throw new ValidationError(validationResult.violations);
        }
        
        const ttl = await this.convertToTTL(metric, batchId);
        const writeResult = await transaction.writeStatements(ttl);
        const provenanceRecord = await this.provenance.recordActivity(metric, writeResult);
        
        results.push({ metric, writeResult, provenanceRecord });
      }
      
      await transaction.commit();
      await this.provenance.completeBatch(batchId);
      
      return { batchId, results, status: 'completed' };
      
    } catch (error) {
      await transaction.rollback();
      await this.provenance.failBatch(batchId, error);
      throw error;
    }
  }
}
```

### 2. 补偿操作
```typescript
// application/compensation/
class CompensationService {
  async compensateFailedIngest(batchId: string): Promise<void> {
    const batch = await this.provenance.getBatch(batchId);
    
    if (batch.status === 'partial') {
      // 清理部分写入的数据
      await this.graphWriter.deleteByNamedGraph(batch.namedGraph);
      await this.provenance.markAsCompensated(batchId);
    }
  }
  
  async retryFailedItems(batchId: string): Promise<RetryResult> {
    const failedItems = await this.provenance.getFailedItems(batchId);
    const retryResults = [];
    
    for (const item of failedItems) {
      try {
        const result = await this.ingestService.ingestMetric(item.metric);
        retryResults.push({ item, result, status: 'success' });
      } catch (error) {
        retryResults.push({ item, error, status: 'failed' });
      }
    }
    
    return { batchId, retryResults };
  }
}
```

## 错误监控和告警

### 1. 错误指标收集
```typescript
// infrastructure/monitoring/ErrorMetrics.ts
class ErrorMetrics {
  private static readonly counters = {
    validationErrors: new Counter('validation_errors_total'),
    conflictErrors: new Counter('conflict_errors_total'),
    graphdbErrors: new Counter('graphdb_errors_total'),
    shaclErrors: new Counter('shacl_errors_total')
  };
  
  private static readonly histograms = {
    retryDuration: new Histogram('retry_duration_seconds'),
    errorRecoveryTime: new Histogram('error_recovery_time_seconds')
  };
  
  static recordValidationError(violationCount: number): void {
    this.counters.validationErrors.inc({ violation_count: violationCount });
  }
  
  static recordGraphDBError(operation: string, errorType: string): void {
    this.counters.graphdbErrors.inc({ operation, error_type: errorType });
  }
  
  static recordRetryAttempt(attempt: number, duration: number): void {
    this.histograms.retryDuration.observe({ attempt }, duration);
  }
}
```

### 2. 告警规则
```yaml
# monitoring/alerts.yml
groups:
  - name: esg-platform-errors
    rules:
      - alert: HighValidationErrorRate
        expr: rate(validation_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High validation error rate detected"
          
      - alert: GraphDBConnectionFailures
        expr: rate(graphdb_errors_total{error_type="connection"}[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "GraphDB connection failures"
          
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state{service="graphdb"} == 1
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "GraphDB circuit breaker is open"
```

## 错误处理最佳实践

### 1. 快速失败原则
- 输入验证在最外层进行
- 不可重试的错误立即返回
- 避免无意义的重试浪费资源

### 2. 错误信息安全
- 敏感信息不出现在错误响应中
- 生产环境不暴露内部错误堆栈
- 错误日志与用户响应分离

### 3. 用户体验优化
- 提供具体的错误修复建议
- 错误消息使用用户友好的语言
- 支持错误码查询和文档链接