# ESG Platform 错误处理与重试策略

> 异常流设计、错误分类、重试机制和降级策略

## 错误分类体系

### 1. 客户端错误 (4xx) - 不重试

#### 422 Unprocessable Entity - SHACL验证失败
**触发条件**：
- SHACL约束违反
- 数据完整性检查失败
- 业务规则验证不通过

**处理策略**：
```typescript
// ValidationService.ts
async validateMetric(data: ESGMetric): Promise<ValidationResult> {
  let violations: ConstraintViolation[] = [];
  
  try {
    violations = await this.shaclValidator.validateData(data);
    if (violations.length > 0) {
      throw new ValidationError('VALIDATION_FAILED', violations);
    }
    // 验证通过
    return { isValid: true, violations: [] };
  } catch (error) {
    // 不重试，直接返回422
    if (error instanceof ValidationError) {
      throw new HttpError(422, 'VALIDATION_FAILED', {
        type: 'https://esg.platform/problems/validation-failed',
        violations: error.violations.map(v => ({
          path: v.path,
          message: v.message,
          value: v.value
        }))
      });
    }
    throw error; // 重新抛出其他类型错误
  }
}
```

#### 409 Conflict - 幂等性冲突
**触发条件**：
- 相同 `计算代码(code) + entityId + asOf` 的指标已存在
- 批次ID重复提交
- 命名图版本冲突

**处理策略**：
```typescript
// IngestService.ts
async ingestMetric(metric: ESGMetric): Promise<IngestResult> {
  const existingIri = await this.checkDuplicate(metric);
  if (existingIri) {
    throw new HttpError(409, 'CONFLICT', {
      type: 'https://esg.platform/problems/conflict',
      detail: 'Metric already exists for this entity, framework, calculation code and date',
      existing: {
        iri: existingIri
      }
    });
  }
}

private async checkDuplicate(metric: ESGMetric): Promise<string | null> {
  // 构造规范化的Metric IRI (注意：code是运算代码，对应特定的计算逻辑)
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