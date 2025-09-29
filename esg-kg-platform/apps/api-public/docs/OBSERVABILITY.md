# ESG Platform Observability Strategy

> Comprehensive design for logging, health checks, performance monitoring, and rate limiting with knowledge graph integration

## 1. Logging Strategy

### 1.1 Structured Logging Standards

**Log Format**: JSON structured logs for easy retrieval and analysis
```json
{
  "timestamp": "2025-09-28T10:30:00.000Z",
  "level": "INFO",
  "service": "api-public",
  "version": "1.0.0",
  "requestId": "req_abc123def456",
  "batchId": "batch_789xyz012",
  "userId": "user_456",
  "operation": "ingest.metric",
  "duration": 1250,
  "status": "success",
  "metadata": {
    "framework": "SASB",
    "industry": "Commercial Banks", 
    "category": "Commercial & Investment Banking",
    "metricName": "Small Business Loan Balance",
    "code": "FN-CB-410a.1",
    "calculationMethod": "direct_measurement",
    "triplesCount": 15
  },
  "calculationDetails": {
    "modelUsed": "GHGEmissionIntensityModel",
    "executionTime": 45,
    "inputCount": 3
  },
  "tags": ["esg", "metric", "validation", "knowledge-graph"]
}
```

**Enhanced Knowledge Graph Logging**:
```json
{
  "timestamp": "2025-09-28T10:30:15.000Z",
  "level": "INFO", 
  "service": "api-public",
  "operation": "calculation.model.execute",
  "requestId": "req_abc123def456",
  "status": "success",
  "metadata": {
    "modelName": "GHGEmissionIntensityModel",
    "formula": "(Scope1Emission + Scope2Emission) / Revenue",
    "inputs": {
      "Scope1Emission": {"value": 12500.0, "unit": "tons CO2e"},
      "Scope2Emission": {"value": 8200.0, "unit": "tons CO2e"}, 
      "Revenue": {"value": 500.0, "unit": "million USD"}
    },
    "result": {
      "value": 41.4,
      "unit": "tons CO2e per million USD"
    },
    "executionTime": 45
  },
  "tags": ["calculation", "model", "knowledge-graph"]
}
```

### 1.2 Log Level Definitions

#### DEBUG - Debug Information
```typescript
// For development and troubleshooting
logger.debug('Knowledge graph model validation started', {
  requestId: context.requestId,
  modelName: 'GHGEmissionIntensityModel',
  inputCount: Object.keys(inputs).length,
  validationRules: validationRulesCount
});

logger.debug('SHACL validation started', {
  requestId: context.requestId,
  dataSize: data.length,
  shapesCount: shapesLoaded.count,
  knowledgeGraphContext: {
    framework: data.framework,
    industry: data.industry,
    category: data.category
  }
});
```

#### INFO - Business Events
```typescript
// Important business process milestones - Direct measurement
logger.info('Direct metric ingestion completed', {
  requestId: context.requestId,
  batchId: result.batchId,
  metricIri: result.metricIri,
  triplesCount: result.triplesCount,
  duration: performance.now() - startTime,
  namedGraph: result.namedGraph,
  calculationMethod: 'direct_measurement',
  metricDetails: {
    framework: metric.framework,
    industry: metric.industry,
    category: metric.category,
    metricName: metric.metricName
  }
});

// Important business process milestones - Calculated metric
logger.info('Calculated metric ingestion completed', {
  requestId: context.requestId,
  batchId: result.batchId,
  metricIri: result.metricIri,
  triplesCount: result.triplesCount,
  duration: performance.now() - startTime,
  namedGraph: result.namedGraph,
  calculationMethod: 'calculation_model',
  calculationResults: {
    modelUsed: result.calculationResults.modelUsed,
    calculatedValue: result.calculationResults.calculatedValue,
    executionTime: result.calculationResults.executionTime,
    inputCount: Object.keys(result.calculationResults.inputsUsed).length
  },
  metricDetails: {
    framework: metric.framework,
    industry: metric.industry,
    category: metric.category,
    metricName: metric.metricName
  }
});
```

#### WARN - 潜在问题
```typescript
// 需要关注但不影响功能的情况
logger.warn('GraphDB connection slow', {
  requestId: context.requestId,
  connectionTime: connectionDuration,
  threshold: CONNECTION_WARN_THRESHOLD,
  endpoint: graphdbConfig.endpoint
});

logger.warn('Calculation model execution slow', {
  requestId: context.requestId,
  modelName: 'GHGEmissionIntensityModel',
  executionTime: modelExecutionTime,
  threshold: MODEL_EXECUTION_WARN_THRESHOLD,
  inputCount: Object.keys(inputs).length
});
```

#### ERROR - 错误事件  
```typescript
// 操作失败和异常情况
logger.error('SHACL validation failed', {
  requestId: context.requestId,
  batchId: context.batchId,
  error: error.message,
  violations: error.violations.map(v => ({
    path: v.path,
    constraint: v.constraint,
    value: v.value
  })),
  stack: error.stack
});

logger.error('Calculation model execution failed', {
  requestId: context.requestId,
  modelName: failedModel.name,
  error: error.message,
  inputs: failedInputs,
  formula: failedModel.formula,
  executionTime: performance.now() - modelStartTime,
  stack: error.stack
});
```

### 1.3 操作级日志策略

#### 请求生命周期日志
```typescript
// interfaces/http/middleware/requestLogging.ts
class RequestLoggingMiddleware {
  async logRequest(req: Request, res: Response, next: NextFunction) {
    const requestId = generateRequestId();
    const startTime = performance.now();
    
    // 请求开始
    logger.info('Request started', {
      requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length'),
      userId: req.auth?.sub
    });
    
    res.on('finish', () => {
      const duration = performance.now() - startTime;
      
      // 请求完成
      logger.info('Request completed', {
        requestId,
        statusCode: res.statusCode,
        duration,
        responseSize: res.get('Content-Length')
      });
    });
    
    next();
  }
}
```

#### 验证流程日志
```typescript
// application/services/ValidationService.ts
class ValidationService {
  async validateMetric(data: ESGMetric, context: RequestContext): Promise<ValidationResult> {
    logger.info('Validation started', {
      requestId: context.requestId,
      framework: data.framework,
      industry: data.industry,
      code: data.code  // 运算代码：对应特定的指标计算逻辑
    });
    
    const startTime = performance.now();
    
    try {
      const violations = await this.shaclValidator.validateData(data);
      const duration = performance.now() - startTime;
      
      if (violations.length === 0) {
        logger.info('Validation successful', {
          requestId: context.requestId,
          duration,
          constraintsChecked: violations.totalConstraints
        });
      } else {
        logger.warn('Validation failed', {
          requestId: context.requestId,
          duration,
          violationCount: violations.length,
          violationTypes: violations.map(v => v.constraint)
        });
      }
      
      return { isValid: violations.length === 0, violations, duration };
      
    } catch (error) {
      logger.error('Validation error', {
        requestId: context.requestId,
        duration: performance.now() - startTime,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

#### 写入流程日志
```typescript
// application/services/IngestService.ts  
class IngestService {
  async ingestMetric(metric: ESGMetric, context: IngestContext): Promise<IngestResult> {
    const operationId = `ingest_${generateId()}`;
    
    logger.info('Ingest operation started', {
      requestId: context.requestId,
      batchId: context.batchId,
      operationId,
      entityId: metric.entityId,
      framework: metric.framework,
      code: metric.code  // 运算代码：调用平台内部注册的计算逻辑
    });
    
    const startTime = performance.now();
    
    try {
      // TTL转换阶段
      const conversionStart = performance.now();
      const ttl = await this.convertToTTL(metric);
      const conversionDuration = performance.now() - conversionStart;
      
      logger.debug('TTL conversion completed', {
        requestId: context.requestId,
        operationId,
        conversionDuration,
        ttlSize: ttl.length
      });
      
      // GraphDB写入阶段
      const writeStart = performance.now();
      const writeResult = await this.graphWriter.writeStatements(ttl, context.namedGraph);
      const writeDuration = performance.now() - writeStart;
      
      logger.debug('GraphDB write completed', {
        requestId: context.requestId,
        operationId,
        writeDuration,
        triplesCount: writeResult.triplesCount
      });
      
      // 溯源记录阶段
      const provenanceStart = performance.now();
      const provenanceRecord = await this.provenance.recordActivity(metric, writeResult);
      const provenanceDuration = performance.now() - provenanceStart;
      
      logger.debug('Provenance recorded', {
        requestId: context.requestId,
        operationId,
        provenanceDuration,
        activityIri: provenanceRecord.activityIri
      });
      
      const totalDuration = performance.now() - startTime;
      
      logger.info('Ingest operation completed', {
        requestId: context.requestId,
        batchId: context.batchId,
        operationId,
        metricIri: writeResult.metricIri,
        triplesCount: writeResult.triplesCount,
        namedGraph: context.namedGraph,
        totalDuration,
        phases: {
          conversion: conversionDuration,
          write: writeDuration,
          provenance: provenanceDuration
        }
      });
      
      return writeResult;
      
    } catch (error) {
      logger.error('Ingest operation failed', {
        requestId: context.requestId,
        batchId: context.batchId,
        operationId,
        duration: performance.now() - startTime,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

## 2. 健康检查策略

### 2.1 健康检查端点设计

#### `/public/v1/health` - 综合健康状态
```typescript
// interfaces/http/routes/health.ts
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  dependencies: DependencyHealth[];
  metrics: HealthMetrics;
}

interface DependencyHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

class HealthController {
  async getHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkGraphDB(),
      this.checkShaclValidator(),
      this.checkAuthService()
    ]);
    
    const dependencies = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: DEPENDENCY_NAMES[index],
          status: 'down' as const,
          lastCheck: new Date().toISOString(),
          error: result.reason.message
        };
      }
    });
    
    const overallStatus = this.calculateOverallStatus(dependencies);
    
    return {
      status: overallStatus,
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies,
      metrics: await this.getHealthMetrics()
    };
  }
}
```

### 2.2 依赖服务检查

#### GraphDB连通性检查
```typescript
// infrastructure/health/GraphDBHealthCheck.ts
class GraphDBHealthCheck {
  async check(): Promise<DependencyHealth> {
    const startTime = performance.now();
    
    try {
      // 简单查询测试连通性
      const query = 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o } LIMIT 1';
      await this.graphClient.executeQuery(query);
      
      const responseTime = performance.now() - startTime;
      
      return {
        name: 'GraphDB',
        status: responseTime < 1000 ? 'up' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'GraphDB',
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
```

#### SHACL验证器检查
```typescript
// infrastructure/health/ShaclHealthCheck.ts
class ShaclHealthCheck {
  async check(): Promise<DependencyHealth> {
    const startTime = performance.now();
    
    try {
      // 使用简单测试数据验证SHACL服务
      const testData = `
        @prefix esg: <https://esg.platform/ontology/> .
        esg:testMetric esg:framework "TEST" .
      `;
      
      await this.shaclValidator.validateData(testData, 'turtle');
      
      const responseTime = performance.now() - startTime;
      
      return {
        name: 'SHACL Validator',
        status: responseTime < 2000 ? 'up' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        name: 'SHACL Validator',
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
```

### 2.3 健康状态计算逻辑
```typescript
class HealthStatusCalculator {
  calculateOverallStatus(dependencies: DependencyHealth[]): HealthStatus['status'] {
    const criticalDeps = ['GraphDB', 'SHACL Validator'];
    const criticalStatuses = dependencies
      .filter(dep => criticalDeps.includes(dep.name))
      .map(dep => dep.status);
    
    // 任何关键依赖down -> unhealthy
    if (criticalStatuses.includes('down')) {
      return 'unhealthy';
    }
    
    // 关键依赖degraded -> degraded
    if (criticalStatuses.includes('degraded')) {
      return 'degraded';
    }
    
    // 非关键依赖问题不影响整体状态
    return 'healthy';
  }
}
```

## 3. 性能监控策略

### 3.1 关键指标定义

#### 业务指标
```typescript
// infrastructure/monitoring/BusinessMetrics.ts
class BusinessMetrics {
  private static readonly counters = {
    // 请求计数
    requestsTotal: new Counter('http_requests_total', ['method', 'path', 'status']),
    
    // 验证结果计数
    validationsTotal: new Counter('validations_total', ['framework', 'result']),
    
    // 写入计数
    ingestionsTotal: new Counter('ingestions_total', ['framework', 'industry']),
    
    // 错误计数
    errorsTotal: new Counter('errors_total', ['type', 'source'])
  };
  
  private static readonly histograms = {
    // 请求延迟
    requestDuration: new Histogram('http_request_duration_seconds', ['method', 'path']),
    
    // 验证耗时
    validationDuration: new Histogram('validation_duration_seconds', ['framework']),
    
    // 写入耗时  
    ingestionDuration: new Histogram('ingestion_duration_seconds', ['phase']),
    
    // 批次大小
    batchSize: new Histogram('batch_size_metrics', ['operation'])
  };
  
  private static readonly gauges = {
    // 活跃连接数
    activeConnections: new Gauge('active_connections', ['service']),
    
    // 队列长度
    queueLength: new Gauge('queue_length', ['type']),
    
    // 内存使用
    memoryUsage: new Gauge('memory_usage_bytes', ['type'])
  };
}
```

#### 系统指标
```typescript
// infrastructure/monitoring/SystemMetrics.ts
class SystemMetrics {
  static recordRequestMetrics(req: Request, res: Response, duration: number) {
    BusinessMetrics.counters.requestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString()
    });
    
    BusinessMetrics.histograms.requestDuration.observe({
      method: req.method,
      path: req.route?.path || req.path
    }, duration / 1000);
  }
  
  static recordValidationMetrics(framework: string, isValid: boolean, duration: number) {
    BusinessMetrics.counters.validationsTotal.inc({
      framework,
      result: isValid ? 'success' : 'failure'
    });
    
    BusinessMetrics.histograms.validationDuration.observe({
      framework
    }, duration / 1000);
  }
  
  static recordIngestionMetrics(metric: ESGMetric, phase: string, duration: number) {
    BusinessMetrics.counters.ingestionsTotal.inc({
      framework: metric.framework,
      industry: metric.industry
    });
    
    BusinessMetrics.histograms.ingestionDuration.observe({
      phase
    }, duration / 1000);
  }
}
```

### 3.2 性能阈值和告警
```yaml
# monitoring/performance-alerts.yml
groups:
  - name: performance
    rules:
      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency is above 5 seconds"
          
      - alert: ValidationSlowdown
        expr: histogram_quantile(0.90, validation_duration_seconds) > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "SHACL validation is taking too long"
          
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error rate is above 5%"
```

## 4. 速率限制策略

### 4.1 多层速率限制

#### 全局速率限制
```typescript
// interfaces/http/middleware/globalRateLimit.ts
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1分钟窗口
  max: 1000,                   // 每分钟最多1000请求
  message: {
    type: 'https://esg.platform/problems/rate-limit-exceeded',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Global rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

#### 用户级速率限制
```typescript
// interfaces/http/middleware/userRateLimit.ts
const userLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1分钟窗口
  max: (req) => {
    // 根据用户权限设置不同限制
    const scopes = req.auth?.scopes || [];
    if (scopes.includes('write:metrics:batch')) {
      return 100;              // 批量权限：100 req/min
    }
    return 20;                 // 普通权限：20 req/min
  },
  keyGenerator: (req) => req.auth?.sub || req.ip,
  message: {
    type: 'https://esg.platform/problems/rate-limit-exceeded', 
    title: 'User Rate Limit Exceeded',
    status: 429,
    detail: 'User-specific rate limit exceeded'
  }
});
```

#### 操作级速率限制
```typescript
// interfaces/http/middleware/operationRateLimit.ts
const createOperationLimiter = (operation: string, limits: RateLimitConfig) => {
  return rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    keyGenerator: (req) => `${req.auth?.sub || req.ip}:${operation}`,
    message: {
      type: 'https://esg.platform/problems/rate-limit-exceeded',
      title: `${operation} Rate Limit Exceeded`, 
      status: 429,
      detail: `Rate limit for ${operation} operation exceeded`
    }
  });
};

// 写入操作限制（较严格）
const ingestLimiter = createOperationLimiter('ingest', {
  windowMs: 60 * 1000,         // 1分钟
  max: 10                      // 每分钟最多10次写入
});

// 验证操作限制（相对宽松）
const validateLimiter = createOperationLimiter('validate', {
  windowMs: 60 * 1000,         // 1分钟  
  max: 100                     // 每分钟最多100次验证
});
```

### 4.2 动态速率调整
```typescript
// infrastructure/rateLimit/AdaptiveRateLimit.ts
class AdaptiveRateLimiter {
  private currentLimits = new Map<string, number>();
  private errorRates = new Map<string, number>();
  
  adjustLimits(): void {
    for (const [operation, errorRate] of this.errorRates) {
      const currentLimit = this.currentLimits.get(operation) || DEFAULT_LIMITS[operation];
      
      if (errorRate > 0.1) {
        // 错误率高，降低限制
        const newLimit = Math.max(currentLimit * 0.8, MIN_LIMITS[operation]);
        this.currentLimits.set(operation, newLimit);
        
        logger.warn('Rate limit decreased due to high error rate', {
          operation,
          errorRate,
          oldLimit: currentLimit,
          newLimit
        });
        
      } else if (errorRate < 0.01) {
        // 错误率低，可以放松限制
        const newLimit = Math.min(currentLimit * 1.1, MAX_LIMITS[operation]);
        this.currentLimits.set(operation, newLimit);
        
        logger.info('Rate limit increased due to low error rate', {
          operation,
          errorRate,
          oldLimit: currentLimit,
          newLimit
        });
      }
    }
  }
}
```

## 5. 可观测性集成

### 5.1 日志聚合配置
```yaml
# logging/logstash.yml
input:
  beats:
    port: 5044

filter:
  if [service] == "api-public" {
    json {
      source => "message"
    }
    
    if [operation] {
      mutate {
        add_tag => ["esg-operation"]
      }
    }
  }

output:
  elasticsearch:
    hosts => ["elasticsearch:9200"]
    index => "esg-platform-%{+YYYY.MM.dd}"
```

### 5.2 监控仪表板
```json
{
  "dashboard": {
    "title": "ESG Platform - API Public",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Response Time P95",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)",
            "legendFormat": "P95 Latency"
          }
        ]
      },
      {
        "title": "Validation Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(validations_total{result=\"success\"}[5m]) / rate(validations_total[5m])",
            "legendFormat": "Success Rate"
          }
        ]
      }
    ]
  }
}
```

这套可观测性策略为ESG平台提供了全面的监控、日志和性能管理能力，确保系统运行状况的透明性和可控性。