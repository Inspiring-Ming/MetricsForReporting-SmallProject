# ESG Platform Internal API 可观测性策略

> Go语言结构化日志、Prometheus指标、链路追踪和性能监控的全面设计

## 1. 结构化日志策略

### 1.1 slog标准日志格式

基于Go 1.21+的`log/slog`标准库，提供高性能结构化日志：

```go
// internal/infrastructure/logging/logger.go
package logging

import (
    "log/slog"
    "os"
    "time"
)

type LogConfig struct {
    Level      slog.Level `json:"level"`      // DEBUG, INFO, WARN, ERROR
    Format     string     `json:"format"`     // "json" or "text"
    Output     string     `json:"output"`     // "stdout", "stderr", or file path
    AddSource  bool       `json:"addSource"`  // Include source file:line
    Service    string     `json:"service"`    // Service name
    Version    string     `json:"version"`    // Service version
}

func NewLogger(config LogConfig) *slog.Logger {
    opts := &slog.HandlerOptions{
        Level:     config.Level,
        AddSource: config.AddSource,
    }
    
    var handler slog.Handler
    if config.Format == "json" {
        handler = slog.NewJSONHandler(os.Stdout, opts)
    } else {
        handler = slog.NewTextHandler(os.Stdout, opts)
    }
    
    logger := slog.New(handler)
    
    // 添加全局上下文字段
    return logger.With(
        slog.String("service", config.Service),
        slog.String("version", config.Version),
        slog.String("environment", getEnv("ENVIRONMENT", "development")),
    )
}
```

### 1.2 日志级别和用途

#### DEBUG - 调试信息
```go
// 详细的执行路径和数据状态
logger.Debug("Processing metrics query",
    slog.String("requestId", requestID),
    slog.String("industry", query.Industry),
    slog.String("framework", query.Framework),
    slog.Int("expectedResults", estimatedCount),
    slog.String("cacheKey", cacheKey),
)

// SPARQL查询详情（开发环境）
logger.Debug("Executing SPARQL query",
    slog.String("requestId", requestID),
    slog.String("query", sparqlQuery),
    slog.Duration("timeout", queryTimeout),
)
```

#### INFO - 业务事件
```go
// 重要业务流程节点
logger.Info("Metric computation completed",
    slog.String("requestId", requestID),
    slog.String("model", "percentage_ratio"),
    slog.Float64("result", 50.0),
    slog.Duration("executionTime", duration),
    slog.String("pythonVersion", "3.11"),
)

// 缓存命中/未命中
logger.Info("Cache operation",
    slog.String("requestId", requestID),
    slog.String("operation", "hit"), // "hit", "miss", "set"
    slog.String("cacheType", "redis"),
    slog.String("key", cacheKey),
    slog.Duration("ttl", ttl),
)

// API请求完成
logger.Info("Request completed",
    slog.String("requestId", requestID),
    slog.String("method", "GET"),
    slog.String("path", "/internal/v1/frameworks"),
    slog.Int("statusCode", 200),
    slog.Duration("duration", requestDuration),
    slog.Int64("responseSize", responseBytes),
    slog.String("userAgent", userAgent),
)
```

#### WARN - 非致命问题
```go
// 外部服务降级
logger.Warn("GraphDB response slow",
    slog.String("requestId", requestID),
    slog.String("endpoint", "http://graphdb:7200/repositories/esg-repo"),
    slog.Duration("responseTime", slowDuration),
    slog.Duration("threshold", 500*time.Millisecond),
    slog.String("action", "continuing with degraded performance"),
)

// 缓存操作失败（非阻塞）
logger.Warn("Cache operation failed",
    slog.String("requestId", requestID),
    slog.String("operation", "set"),
    slog.String("key", cacheKey),
    slog.Any("error", cacheError),
    slog.String("fallback", "serving from primary source"),
)

// 配置问题
logger.Warn("Configuration issue detected",
    slog.String("parameter", "REDIS_MAX_CONNECTIONS"),
    slog.Int("currentValue", currentValue),
    slog.Int("recommendedValue", recommendedValue),
    slog.String("impact", "potential connection pool exhaustion"),
)
```

#### ERROR - 错误状态
```go
// 关键依赖失败
logger.Error("GraphDB connection failed",
    slog.String("requestId", requestID),
    slog.String("endpoint", graphdbURL),
    slog.Any("error", connectionError),
    slog.Int("retryAttempt", retryCount),
    slog.Duration("backoffDelay", backoffDelay),
)

// 业务逻辑错误
logger.Error("Metric code resolution failed",
    slog.String("requestId", requestID),
    slog.String("industry", industry),
    slog.String("framework", framework), 
    slog.String("metric", metricName),
    slog.Any("error", resolutionError),
    slog.String("impact", "client will receive NOT_FOUND error"),
)

// 系统级错误
logger.Error("Panic recovered in HTTP handler",
    slog.String("requestId", requestID),
    slog.String("path", requestPath),
    slog.Any("panic", panicValue),
    slog.String("stackTrace", string(debug.Stack())),
)
```

### 1.3 上下文感知日志

#### 请求上下文传播
```go
// internal/interfaces/http/middleware/logging.go
package middleware

type contextKey string

const (
    RequestIDKey contextKey = "requestId"
    UserIDKey    contextKey = "userId"
    OperationKey contextKey = "operation"
)

func LoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // 生成或获取请求ID
            requestID := r.Header.Get("X-Request-ID")
            if requestID == "" {
                requestID = generateRequestID()
            }
            
            // 将上下文信息注入到请求中
            ctx := context.WithValue(r.Context(), RequestIDKey, requestID)
            ctx = context.WithValue(ctx, OperationKey, r.Method+" "+r.URL.Path)
            
            // 创建请求级别的logger
            requestLogger := logger.With(
                slog.String("requestId", requestID),
                slog.String("operation", r.Method+" "+r.URL.Path),
                slog.String("clientIP", getClientIP(r)),
            )
            
            // 请求开始日志
            requestLogger.Info("Request started",
                slog.String("method", r.Method),
                slog.String("path", r.URL.Path),
                slog.String("query", r.URL.RawQuery),
                slog.String("userAgent", r.UserAgent()),
                slog.Int64("contentLength", r.ContentLength),
            )
            
            // 包装ResponseWriter以捕获响应信息
            wrapped := &responseWriter{
                ResponseWriter: w,
                statusCode:     200,
            }
            
            // 将logger注入到上下文中供下游使用
            ctx = context.WithValue(ctx, "logger", requestLogger)
            
            next.ServeHTTP(wrapped, r.WithContext(ctx))
            
            duration := time.Since(start)
            
            // 请求完成日志
            requestLogger.Info("Request completed",
                slog.Int("statusCode", wrapped.statusCode),
                slog.Duration("duration", duration),
                slog.Int64("responseSize", wrapped.bytesWritten),
            )
        })
    }
}

// 从上下文中获取logger
func GetLogger(ctx context.Context) *slog.Logger {
    if logger, ok := ctx.Value("logger").(*slog.Logger); ok {
        return logger
    }
    return slog.Default() // 降级到默认logger
}
```

### 1.4 服务层日志集成

```go
// internal/application/services/metric_service.go
package services

func (s *MetricService) GetMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    logger := GetLogger(ctx)
    
    logger.Debug("Starting metrics query",
        slog.String("industry", query.Industry),
        slog.String("framework", query.Framework),
        slog.String("category", query.Category),
    )
    
    // 尝试缓存
    cacheKey := s.buildCacheKey("metrics", query)
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        logger.Info("Cache hit for metrics query",
            slog.String("cacheKey", cacheKey),
        )
        return cached.(*MetricsResult), nil
    }
    
    logger.Debug("Cache miss, querying GraphDB",
        slog.String("cacheKey", cacheKey),
    )
    
    start := time.Now()
    result, err := s.graphReader.QueryMetrics(ctx, query)
    queryDuration := time.Since(start)
    
    if err != nil {
        logger.Error("GraphDB query failed",
            slog.Any("error", err),
            slog.Duration("queryDuration", queryDuration),
        )
        return nil, s.handleQueryError(err, "Failed to query metrics from GraphDB")
    }
    
    logger.Info("GraphDB query successful",
        slog.Int("resultCount", len(result.Result)),
        slog.Duration("queryDuration", queryDuration),
    )
    
    // 异步缓存
    go func() {
        if cacheErr := s.cache.Set(context.Background(), cacheKey, result, 30*time.Minute); cacheErr != nil {
            logger.Warn("Failed to cache result",
                slog.String("cacheKey", cacheKey),
                slog.Any("error", cacheErr),
            )
        } else {
            logger.Debug("Result cached successfully",
                slog.String("cacheKey", cacheKey),
            )
        }
    }()
    
    return result, nil
}
```

## 2. Prometheus指标监控

### 2.1 核心业务指标

```go
// internal/infrastructure/metrics/metrics.go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // HTTP请求指标
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_internal_api_requests_total",
            Help: "Total HTTP requests by method, endpoint, and status code",
        },
        []string{"method", "endpoint", "status_code"},
    )
    
    httpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "esg_internal_api_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
        },
        []string{"method", "endpoint"},
    )
    
    // GraphDB查询指标
    graphdbQueryDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "esg_graphdb_query_duration_seconds",
            Help:    "GraphDB SPARQL query duration in seconds",
            Buckets: []float64{.01, .05, .1, .25, .5, 1, 2, 5, 10, 30},
        },
        []string{"query_type"}, // "metrics", "frameworks", "categories", "sparql"
    )
    
    graphdbQueryErrors = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_graphdb_query_errors_total",
            Help: "Total GraphDB query errors by type",
        },
        []string{"error_type"}, // "timeout", "connection", "syntax", "internal"
    )
    
    // 缓存指标
    cacheOperations = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_cache_operations_total",
            Help: "Total cache operations by type and result",
        },
        []string{"operation", "result"}, // operation: "get", "set"; result: "hit", "miss", "error"
    )
    
    cacheSize = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "esg_cache_size_bytes",
            Help: "Current cache size in bytes by cache type",
        },
        []string{"cache_type"}, // "redis", "memory"
    )
    
    // 计算方法查询指标 (追踪计算方法元数据查询情况)
    computationMethodQueries = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_computation_method_queries_total",
            Help: "Total computation method metadata queries by result",
        },
        []string{"result"}, // result: "success", "error", "not_found"
    )
    
    // 系统资源指标
    activeConnections = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "esg_active_connections",
            Help: "Number of active connections by type",
        },
        []string{"connection_type"}, // "graphdb", "redis", "http"
    )
    
    memoryUsage = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "esg_memory_usage_bytes",
            Help: "Memory usage by component",
        },
        []string{"component"}, // "heap", "stack", "cache"
    )
)
```

### 2.2 指标收集中间件

```go
// internal/interfaces/http/middleware/metrics.go
package middleware

func PrometheusMiddleware() func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
            
            next.ServeHTTP(wrapped, r)
            
            duration := time.Since(start)
            statusCode := fmt.Sprintf("%d", wrapped.statusCode)
            
            // 记录请求指标
            httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, statusCode).Inc()
            httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration.Seconds())
        })
    }
}
```

### 2.3 业务指标收集

```go
// internal/application/services/instrumented_metric_service.go
package services

// 装饰器模式：为MetricService添加指标收集
type InstrumentedMetricService struct {
    service MetricServiceInterface
}

func NewInstrumentedMetricService(service MetricServiceInterface) *InstrumentedMetricService {
    return &InstrumentedMetricService{service: service}
}

func (s *InstrumentedMetricService) GetMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    start := time.Now()
    defer func() {
        duration := time.Since(start)
        graphdbQueryDuration.WithLabelValues("metrics").Observe(duration.Seconds())
    }()
    
    result, err := s.service.GetMetrics(ctx, query)
    if err != nil {
        errorType := categorizeError(err)
        graphdbQueryErrors.WithLabelValues(errorType).Inc()
    }
    
    return result, err
}

func categorizeError(err error) string {
    switch {
    case errors.Is(err, context.DeadlineExceeded):
        return "timeout"
    case strings.Contains(err.Error(), "connection"):
        return "connection"
    case strings.Contains(err.Error(), "syntax"):
        return "syntax"
    default:
        return "internal"
    }
}
```

## 3. 健康检查与就绪探针

### 3.1 分层健康检查

```go
// internal/interfaces/http/handlers/health.go
package handlers

type HealthHandler struct {
    healthChecker *health.Checker
}

type HealthStatus struct {
    Status    string            `json:"status"`
    Timestamp string            `json:"timestamp"`
    Version   string            `json:"version"`
    Services  map[string]string `json:"services"`
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()
    
    checks := h.healthChecker.CheckAll(ctx)
    
    status := "healthy"
    services := make(map[string]string)
    
    for name, result := range checks {
        if result.Healthy {
            services[name] = "healthy"
        } else {
            services[name] = "unhealthy"
            status = "unhealthy"
        }
    }
    
    response := HealthStatus{
        Status:    status,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
        Version:   getVersion(),
        Services:  services,
    }
    
    statusCode := http.StatusOK
    if status == "unhealthy" {
        statusCode = http.StatusServiceUnavailable
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(response)
}
```

### 3.2 依赖健康检查

```go
// internal/infrastructure/health/checker.go
package health

type Checker struct {
    graphdb *GraphDBHealthCheck
    redis   *RedisHealthCheck
    python  *PythonHealthCheck
}

type CheckResult struct {
    Healthy      bool          `json:"healthy"`
    ResponseTime time.Duration `json:"responseTime"`
    Error        string        `json:"error,omitempty"`
}

func (c *Checker) CheckAll(ctx context.Context) map[string]CheckResult {
    results := make(map[string]CheckResult)
    
    // 并行执行健康检查
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    checks := map[string]func(context.Context) CheckResult{
        "graphdb":            c.graphdb.Check,
        "redis":              c.redis.Check,
        "computation_engine": c.python.Check,
    }
    
    for name, checkFunc := range checks {
        wg.Add(1)
        go func(name string, fn func(context.Context) CheckResult) {
            defer wg.Done()
            result := fn(ctx)
            mu.Lock()
            results[name] = result
            mu.Unlock()
        }(name, checkFunc)
    }
    
    wg.Wait()
    return results
}
```

### 3.3 GraphDB健康检查

```go
// internal/infrastructure/health/graphdb.go
package health

type GraphDBHealthCheck struct {
    client GraphDBClient
}

func (g *GraphDBHealthCheck) Check(ctx context.Context) CheckResult {
    start := time.Now()
    
    // 简单的ASK查询来测试连通性
    query := "ASK { ?s ?p ?o } LIMIT 1"
    
    _, err := g.client.ExecuteSparqlQuery(ctx, query)
    
    responseTime := time.Since(start)
    
    if err != nil {
        return CheckResult{
            Healthy:      false,
            ResponseTime: responseTime,
            Error:        err.Error(),
        }
    }
    
    return CheckResult{
        Healthy:      true,
        ResponseTime: responseTime,
    }
}
```

## 4. 性能监控与分析

### 4.1 Go运行时指标

```go
// internal/infrastructure/metrics/runtime.go
package metrics

import (
    "runtime"
    "time"
)

// 启动Go运行时指标收集
func StartRuntimeMetrics() {
    ticker := time.NewTicker(30 * time.Second)
    go func() {
        for range ticker.C {
            var m runtime.MemStats
            runtime.ReadMemStats(&m)
            
            // 内存指标
            memoryUsage.WithLabelValues("heap").Set(float64(m.HeapInuse))
            memoryUsage.WithLabelValues("stack").Set(float64(m.StackInuse))
            memoryUsage.WithLabelValues("gc_sys").Set(float64(m.GCSys))
            
            // GC指标
            gcDuration.Set(float64(m.PauseTotalNs) / 1e9)
            gcCount.Set(float64(m.NumGC))
            
            // Goroutine计数
            activeGoroutines.Set(float64(runtime.NumGoroutine()))
        }
    }()
}

var (
    gcDuration = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "esg_gc_duration_seconds_total",
            Help: "Total time spent in garbage collection",
        },
    )
    
    gcCount = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "esg_gc_count_total",
            Help: "Total number of garbage collections",
        },
    )
    
    activeGoroutines = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "esg_goroutines_active",
            Help: "Number of active goroutines",
        },
    )
)
```

### 4.2 查询性能分析

```go
// internal/infrastructure/graphdb/instrumented_client.go
package graphdb

type InstrumentedGraphDBClient struct {
    client GraphDBClientInterface
    logger *slog.Logger
}

func (c *InstrumentedGraphDBClient) QueryMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    start := time.Now()
    
    // 查询复杂度估算
    complexity := c.estimateQueryComplexity(query)
    
    c.logger.Debug("Starting GraphDB query",
        slog.String("queryType", "metrics"),
        slog.String("industry", query.Industry),
        slog.String("framework", query.Framework),
        slog.Int("estimatedComplexity", complexity),
    )
    
    result, err := c.client.QueryMetrics(ctx, query)
    
    duration := time.Since(start)
    
    if err != nil {
        c.logger.Warn("GraphDB query failed",
            slog.String("queryType", "metrics"),
            slog.Duration("duration", duration),
            slog.Any("error", err),
        )
    } else {
        c.logger.Info("GraphDB query completed",
            slog.String("queryType", "metrics"),
            slog.Duration("duration", duration),
            slog.Int("resultCount", len(result.Result)),
            slog.Int("complexity", complexity),
        )
    }
    
    // 记录性能指标
    graphdbQueryDuration.WithLabelValues("metrics").Observe(duration.Seconds())
    
    return result, err
}

func (c *InstrumentedGraphDBClient) estimateQueryComplexity(query MetricsQuery) int {
    complexity := 1
    
    if query.Industry != "" { complexity++ }
    if query.Framework != "" { complexity++ }
    if query.Category != "" { complexity++ }
    
    return complexity
}
```

## 5. 分布式追踪 (OpenTelemetry)

### 5.1 追踪初始化

```go
// internal/infrastructure/tracing/tracer.go
package tracing

import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/trace"
)

func InitTracer(serviceName, jaegerURL string) (func(), error) {
    exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(
        jaeger.WithEndpoint(jaegerURL),
    ))
    if err != nil {
        return nil, err
    }
    
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String(serviceName),
            semconv.ServiceVersionKey.String(getVersion()),
        )),
    )
    
    otel.SetTracerProvider(tp)
    
    return func() { tp.Shutdown(context.Background()) }, nil
}
```

### 5.2 HTTP追踪中间件

```go
// internal/interfaces/http/middleware/tracing.go
package middleware

import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/trace"
)

func TracingMiddleware(serviceName string) func(http.Handler) http.Handler {
    tracer := otel.Tracer(serviceName)
    
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, span := tracer.Start(r.Context(), r.Method+" "+r.URL.Path,
                trace.WithAttributes(
                    attribute.String("http.method", r.Method),
                    attribute.String("http.url", r.URL.String()),
                    attribute.String("http.user_agent", r.UserAgent()),
                    attribute.String("http.remote_addr", r.RemoteAddr),
                ),
            )
            defer span.End()
            
            wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
            
            next.ServeHTTP(wrapped, r.WithContext(ctx))
            
            span.SetAttributes(
                attribute.Int("http.status_code", wrapped.statusCode),
                attribute.Int64("http.response_size", wrapped.bytesWritten),
            )
            
            if wrapped.statusCode >= 400 {
                span.RecordError(fmt.Errorf("HTTP %d", wrapped.statusCode))
            }
        })
    }
}
```

### 5.3 服务层追踪

```go
// internal/application/services/traced_metric_service.go
package services

func (s *TracedMetricService) GetMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    tracer := otel.Tracer("metric-service")
    
    ctx, span := tracer.Start(ctx, "MetricService.GetMetrics",
        trace.WithAttributes(
            attribute.String("query.industry", query.Industry),
            attribute.String("query.framework", query.Framework),
            attribute.String("query.category", query.Category),
        ),
    )
    defer span.End()
    
    result, err := s.service.GetMetrics(ctx, query)
    
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
    } else {
        span.SetAttributes(
            attribute.Int("result.count", len(result.Result)),
        )
        span.SetStatus(codes.Ok, "")
    }
    
    return result, err
}
```

## 6. 告警配置

### 6.1 Prometheus告警规则

```yaml
# alerts/internal-api.yml
groups:
  - name: esg-internal-api
    rules:
      # 高错误率告警
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(esg_internal_api_requests_total{status_code=~"5.."}[5m])) /
            sum(rate(esg_internal_api_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
          service: esg-internal-api
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"
      
      # 响应时间告警
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            sum(rate(esg_internal_api_request_duration_seconds_bucket[5m])) by (le)
          ) > 1.0
        for: 10m
        labels:
          severity: warning
          service: esg-internal-api
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      # GraphDB连接告警
      - alert: GraphDBDown
        expr: |
          esg_active_connections{connection_type="graphdb"} == 0
        for: 2m
        labels:
          severity: critical
          service: esg-internal-api
        annotations:
          summary: "GraphDB connection lost"
          description: "No active connections to GraphDB"
      
      # 缓存命中率告警
      - alert: LowCacheHitRate
        expr: |
          (
            sum(rate(esg_cache_operations_total{result="hit"}[10m])) /
            sum(rate(esg_cache_operations_total{operation="get"}[10m]))
          ) < 0.7
        for: 15m
        labels:
          severity: warning
          service: esg-internal-api
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }}"
```

这个可观测性文档为Go Internal API提供了全面的监控、日志和追踪策略，遵循Go语言的最佳实践和现代可观测性标准。