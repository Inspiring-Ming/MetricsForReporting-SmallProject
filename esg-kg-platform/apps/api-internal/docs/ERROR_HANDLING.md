# ESG Platform Internal API 错误处理策略

> Go语言惯用错误处理：错误包装、分层处理、上下文传播和优雅降级

## Go错误处理设计模式

### 1. 分层错误架构

#### 1.1 错误分类层次
```
┌─────────────────────────────────────────────────────┐
│                  HTTP Layer Errors                  │
│              (RFC 7807 Problem Details)             │
├─────────────────────────────────────────────────────┤
│              Application Layer Errors               │
│          (Domain-specific wrapped errors)          │
├─────────────────────────────────────────────────────┤
│             Infrastructure Errors                   │
│    (GraphDB, Redis, Network, File System)          │
├─────────────────────────────────────────────────────┤
│                   Go Built-in                      │
│        (context.DeadlineExceeded, io.EOF)          │
└─────────────────────────────────────────────────────┘
```

#### 1.2 错误类型定义
```go
// internal/domain/errors/types.go
package domainerrors

import (
    "errors"
    "fmt"
)

// 基础错误类型
type ErrorType string

const (
    ErrorTypeValidation   ErrorType = "VALIDATION_ERROR"
    ErrorTypeNotFound     ErrorType = "NOT_FOUND"
    ErrorTypeConflict     ErrorType = "CONFLICT"
    ErrorTypeUnauthorized ErrorType = "UNAUTHORIZED"
    ErrorTypeForbidden    ErrorType = "FORBIDDEN"
    ErrorTypeTimeout      ErrorType = "TIMEOUT"
    ErrorTypeInternal     ErrorType = "INTERNAL_ERROR"
    ErrorTypeUnavailable  ErrorType = "SERVICE_UNAVAILABLE"
)

// 领域错误基础结构
type DomainError struct {
    Type     ErrorType              `json:"type"`
    Message  string                 `json:"message"`
    Code     string                 `json:"code"`
    Details  map[string]interface{} `json:"details,omitempty"`
    Cause    error                  `json:"-"`
}

func (e *DomainError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %s (caused by: %v)", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *DomainError) Unwrap() error {
    return e.Cause
}

// 错误构造函数
func NewValidationError(message, code string) *DomainError {
    return &DomainError{
        Type:    ErrorTypeValidation,
        Message: message,
        Code:    code,
    }
}

func NewNotFoundError(message, code string) *DomainError {
    return &DomainError{
        Type:    ErrorTypeNotFound,
        Message: message,
        Code:    code,
    }
}

func WrapInternalError(err error, message string) *DomainError {
    return &DomainError{
        Type:    ErrorTypeInternal,
        Message: message,
        Code:    "INTERNAL_ERROR",
        Cause:   err,
    }
}
```

#### 1.3 统一错误码清单

以下是ESG平台内部API使用的标准错误码，所有错误码采用`SCREAMING_SNAKE_CASE`格式：

```go
const (
    // 认证相关错误码 (4xx)
    ErrorCodeMissingToken        = "MISSING_TOKEN"         // 缺少认证令牌
    ErrorCodeInvalidToken        = "INVALID_TOKEN"         // 无效认证令牌
    ErrorCodeInvalidAudience     = "INVALID_AUDIENCE"      // 令牌受众不匹配
    ErrorCodeInsufficientScope   = "INSUFFICIENT_SCOPE"    // 权限范围不足
    
    // 参数验证错误码 (4xx)
    ErrorCodeMissingParameter    = "MISSING_PARAMETER"     // 缺少必需参数
    ErrorCodeMissingIndustry     = "MISSING_INDUSTRY"      // 缺少行业参数
    ErrorCodeMissingFramework    = "MISSING_FRAMEWORK"     // 缺少框架参数
    ErrorCodeMissingMetric       = "MISSING_METRIC"        // 缺少指标参数
    ErrorCodeMissingCode         = "MISSING_CODE"          // 缺少代码参数
    ErrorCodeMissingParameters   = "MISSING_PARAMETERS"    // 缺少多个参数
    
    ErrorCodeInvalidParameter    = "INVALID_PARAMETER"     // 参数格式无效
    ErrorCodeInvalidParameters   = "INVALID_PARAMETERS"    // 多个参数无效
    ErrorCodeInvalidJson         = "INVALID_JSON"          // JSON格式无效
    ErrorCodeInvalidRequest      = "INVALID_REQUEST"       // 请求格式无效
    ErrorCodeInvalidSparql       = "INVALID_SPARQL"        // SPARQL查询无效
    ErrorCodeInvalidQueryParams  = "INVALID_QUERY_PARAMS"  // 查询参数无效
    
    // 资源相关错误码 (4xx)
    ErrorCodeResourceNotFound    = "RESOURCE_NOT_FOUND"    // 资源未找到
    ErrorCodeMetricNotFound      = "METRIC_NOT_FOUND"      // 指标未找到
    ErrorCodeFrameworkNotFound   = "FRAMEWORK_NOT_FOUND"   // 框架未找到
    
    // 服务相关错误码 (5xx)  
    ErrorCodeQueryError          = "QUERY_ERROR"           // 查询执行错误
    ErrorCodeServiceUnavailable  = "SERVICE_UNAVAILABLE"   // 服务不可用
    ErrorCodeInternalError       = "INTERNAL_ERROR"        // 内部服务错误
    ErrorCodeGraphdbError        = "GRAPHDB_ERROR"         // 图数据库错误
    ErrorCodeCacheError          = "CACHE_ERROR"           // 缓存服务错误
    ErrorCodeValidationFailed    = "VALIDATION_FAILED"     // 验证失败
)
```

**使用规则：**
1. 所有错误码必须使用`SCREAMING_SNAKE_CASE`格式
2. 认证/授权错误使用`MISSING_*`、`INVALID_*`、`INSUFFICIENT_*`前缀
3. 参数验证错误使用`MISSING_*`、`INVALID_*`前缀  
4. 资源相关错误使用`*_NOT_FOUND`后缀
5. 服务错误使用`*_ERROR`、`*_UNAVAILABLE`后缀

### 2. 应用层错误处理

#### 2.1 服务层错误包装
```go
// internal/application/services/metric_service.go
package services

import (
    "context"
    "fmt"
    
    "github.com/pkg/errors"
    domainerrors "internal/domain/errors"
)

type MetricService struct {
    graphReader GraphReaderPort
    cache       CachePort
    logger      *slog.Logger
}

func (s *MetricService) GetMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    // 参数验证
    if err := s.validateMetricsQuery(query); err != nil {
        return nil, domainerrors.NewValidationError(
            "Invalid query parameters: " + err.Error(),
            "INVALID_QUERY_PARAMS",
        )
    }
    
    // 尝试从缓存获取
    cacheKey := s.buildCacheKey("metrics", query)
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        s.logger.Debug("Cache hit for metrics query",
            slog.String("cacheKey", cacheKey),
            slog.String("industry", query.Industry),
            slog.String("framework", query.Framework),
        )
        return cached.(*MetricsResult), nil
    }
    
    // 查询GraphDB
    result, err := s.graphReader.QueryMetrics(ctx, query)
    if err != nil {
        return nil, s.handleQueryError(err, "Failed to query metrics from GraphDB")
    }
    
    // 异步缓存结果 (不阻塞响应)
    go func() {
        if cacheErr := s.cache.Set(context.Background(), cacheKey, result, 30*time.Minute); cacheErr != nil {
            s.logger.Warn("Failed to cache metrics result",
                slog.String("cacheKey", cacheKey),
                slog.Any("error", cacheErr),
            )
        }
    }()
    
    return result, nil
}

func (s *MetricService) GetMetricCodes(ctx context.Context, req MetricCodesRequest) (*MetricCodesResponse, error) {
    // 验证必需参数
    if req.Industry == "" {
        return nil, domainerrors.NewValidationError(
            "Industry parameter is required",
            "MISSING_INDUSTRY",
        )
    }
    
    if req.Framework == "" {
        return nil, domainerrors.NewValidationError(
            "Framework parameter is required", 
            "MISSING_FRAMEWORK",
        )
    }
    
    if req.Metric == "" {
        return nil, domainerrors.NewValidationError(
            "Metric parameter is required",
            "MISSING_METRIC",
        )
    }
    
    // 查询运算代码 (每个code对应特定的指标计算逻辑)
    code, err := s.graphReader.GetMetricCode(ctx, req)
    if err != nil {
        // 检查是否为"未找到"错误
        if errors.Is(err, ErrMetricCodeNotFound) {
            return nil, domainerrors.NewNotFoundError(
                fmt.Sprintf("No computation code found for metric '%s' in %s/%s", 
                    req.Metric, req.Framework, req.Industry),
                "METRIC_CODE_NOT_FOUND",
            )
        }
        return nil, s.handleQueryError(err, "Failed to retrieve computation code")
    }
    
    return &MetricCodesResponse{Result: code}, nil
}

// 统一的查询错误处理
func (s *MetricService) handleQueryError(err error, message string) error {
    switch {
    case errors.Is(err, context.DeadlineExceeded):
        return domainerrors.NewTimeoutError("Query execution timed out", "QUERY_TIMEOUT")
    case errors.Is(err, context.Canceled):
        return domainerrors.NewValidationError("Query was canceled", "QUERY_CANCELED")
    case isNetworkError(err):
        return domainerrors.NewUnavailableError("GraphDB service unavailable", "GRAPHDB_UNAVAILABLE")
    default:
        s.logger.Error("Unexpected GraphDB error", 
            slog.Any("error", err),
            slog.String("context", message),
        )
        return domainerrors.WrapInternalError(err, message)
    }
}

func isNetworkError(err error) bool {
    // 检查是否为网络连接相关错误
    return strings.Contains(err.Error(), "connection refused") ||
           strings.Contains(err.Error(), "connection timeout") ||
           strings.Contains(err.Error(), "no route to host")
}
```

#### 2.2 计算服务错误处理
```go
// internal/application/services/computation_service.go
package services

type ComputationService struct {
    modelRegistry  ModelRegistryPort
    logger         *slog.Logger
}

func (s *ComputationService) GetComputationMethod(ctx context.Context, code string) (*ComputationMethodResponse, error) {
    if code == "" {
        return nil, domainerrors.NewValidationError(
            "Code parameter is required",
            "MISSING_CODE",
        )
    }
    
    // 查找计算方法
    method, err := s.modelRegistry.GetComputationMethod(ctx, code)
    if err != nil {
        if errors.Is(err, ErrComputationMethodNotFound) {
            return nil, domainerrors.NewNotFoundError(
                fmt.Sprintf("No computation method found for code '%s'", code),
                "COMPUTATION_METHOD_NOT_FOUND",
            )
        }
        return nil, domainerrors.WrapInternalError(err, "Failed to retrieve computation method")
    }
    
    return method, nil
}
```

### 3. HTTP层错误处理

#### 3.1 统一错误响应格式
```go
// internal/interfaces/http/errors/handler.go
package errors

import (
    "encoding/json"
    "net/http"
    "log/slog"
    
    domainerrors "internal/domain/errors"
)

// RFC 7807 Problem Details 结构体 - 统一错误响应格式
type ProblemDetails struct {
    Type     string                 `json:"type"`              // 错误类型URI
    Title    string                 `json:"title"`             // 简短标题
    Status   int                    `json:"status"`            // HTTP状态码
    Detail   string                 `json:"detail"`            // 详细描述
    Instance string                 `json:"instance,omitempty"` // 出错的端点
    
    // 扩展字段
    Code      string                 `json:"code,omitempty"`      // 内部错误代码
    RequestID string                 `json:"requestId,omitempty"` // 请求追踪ID
    Timestamp string                 `json:"timestamp,omitempty"` // 错误时间戳
}

func WriteError(w http.ResponseWriter, r *http.Request, err error, logger *slog.Logger) {
    requestID := r.Header.Get("X-Request-ID")
    
    var domainErr *domainerrors.DomainError
    if errors.As(err, &domainErr) {
        writeKnownError(w, r, domainErr, requestID, logger)
    } else {
        writeUnknownError(w, r, err, requestID, logger)
    }
}

func writeKnownError(w http.ResponseWriter, r *http.Request, domainErr *domainerrors.DomainError, requestID string, logger *slog.Logger) {
    var statusCode int
    
    switch domainErr.Type {
    case domainerrors.ErrorTypeValidation:
        statusCode = http.StatusBadRequest
    case domainerrors.ErrorTypeNotFound:
        statusCode = http.StatusNotFound
    case domainerrors.ErrorTypeConflict:
        statusCode = http.StatusConflict
    case domainerrors.ErrorTypeUnauthorized:
        statusCode = http.StatusUnauthorized
    case domainerrors.ErrorTypeForbidden:
        statusCode = http.StatusForbidden
    case domainerrors.ErrorTypeTimeout:
        statusCode = http.StatusRequestTimeout
    case domainerrors.ErrorTypeUnavailable:
        statusCode = http.StatusServiceUnavailable
    default:
        statusCode = http.StatusInternalServerError
    }
    
    // 记录错误日志
    logger.Warn("Request error",
        slog.String("requestId", requestID),
        slog.String("path", r.URL.Path),
        slog.String("method", r.Method),
        slog.Int("status", statusCode),
        slog.String("errorType", string(domainErr.Type)),
        slog.String("errorCode", domainErr.Code),
        slog.String("message", domainErr.Message),
    )
    
    // 使用RFC 7807 Problem Details格式
    response := ProblemDetails{
        Type:      fmt.Sprintf("https://esg.platform/problems/%s", strings.ToLower(strings.ReplaceAll(string(domainErr.Type), "_", "-"))),
        Title:     formatErrorTitle(domainErr.Type),
        Status:    statusCode,
        Detail:    domainErr.Message,
        Instance:  r.URL.Path,
        Code:      domainErr.Code,
        RequestID: requestID,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
    }
    
    writeProblemDetails(w, statusCode, response)
}

func writeUnknownError(w http.ResponseWriter, r *http.Request, err error, requestID string, logger *slog.Logger) {
    // 记录详细错误信息
    logger.Error("Unhandled error",
        slog.String("requestId", requestID),
        slog.String("path", r.URL.Path),
        slog.String("method", r.Method),
        slog.Any("error", err),
    )
    
    // 返回通用内部错误
    response := ProblemDetails{
        Type:      "https://esg.platform/problems/internal-error",
        Title:     "Internal Server Error",
        Status:    http.StatusInternalServerError,
        Detail:    "An unexpected error occurred",
        Instance:  r.URL.Path,
        Code:      "INTERNAL_ERROR",
        RequestID: requestID,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
    }
    
    writeProblemDetails(w, http.StatusInternalServerError, response)
}

func writeProblemDetails(w http.ResponseWriter, statusCode int, problem ProblemDetails) {
    w.Header().Set("Content-Type", "application/problem+json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(problem)
}

// 辅助函数：格式化错误标题
func formatErrorTitle(errorType domainerrors.ErrorType) string {
    switch errorType {
    case domainerrors.ErrorTypeValidation:
        return "Validation Error"
    case domainerrors.ErrorTypeNotFound:
        return "Resource Not Found"
    case domainerrors.ErrorTypeConflict:
        return "Conflict Error"
    case domainerrors.ErrorTypeUnauthorized:
        return "Unauthorized Access"
    case domainerrors.ErrorTypeForbidden:
        return "Forbidden Access"
    case domainerrors.ErrorTypeTimeout:
        return "Request Timeout"
    case domainerrors.ErrorTypeUnavailable:
        return "Service Unavailable"
    default:
        return "Internal Server Error"
    }
}
```

#### 3.2 Handler层错误处理
```go
// internal/interfaces/http/handlers/metrics.go
package handlers

type MetricsHandler struct {
    metricService *services.MetricService
    logger        *slog.Logger
}

func (h *MetricsHandler) GetFrameworks(w http.ResponseWriter, r *http.Request) {
    industry := r.URL.Query().Get("industry")
    if industry == "" {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError("Industry parameter is required", "MISSING_INDUSTRY"),
            h.logger)
        return
    }
    
    result, err := h.metricService.GetFrameworks(r.Context(), industry)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}

func (h *MetricsHandler) GetMetricCodes(w http.ResponseWriter, r *http.Request) {
    req := MetricCodesRequest{
        Industry:  r.URL.Query().Get("industry"),
        Framework: r.URL.Query().Get("framework"),
        Metric:    r.URL.Query().Get("metric"),
    }
    
    result, err := h.metricService.GetMetricCodes(r.Context(), req)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    if err := json.NewEncoder(w).Encode(data); err != nil {
        // 如果JSON编码失败，记录错误但不再次写响应（避免double write）
        slog.Error("Failed to encode JSON response", slog.Any("error", err))
    }
}
```

### 4. 基础设施层错误处理

#### 4.1 GraphDB适配器错误处理
```go
// internal/infrastructure/graphdb/client.go
package graphdb

import (
    "context"
    "fmt"
    "net/http"
    
    domainerrors "internal/domain/errors"
)

var (
    ErrMetricCodeNotFound        = errors.New("metric code not found")
    ErrComputationMethodNotFound = errors.New("computation method not found")
)

type GraphDBClient struct {
    baseURL    string
    httpClient *http.Client
    logger     *slog.Logger
}

func (c *GraphDBClient) QueryMetrics(ctx context.Context, query MetricsQuery) (*MetricsResult, error) {
    sparql := c.buildMetricsQuery(query)
    
    result, err := c.executeSparqlQuery(ctx, sparql)
    if err != nil {
        return nil, fmt.Errorf("failed to execute metrics query: %w", err)
    }
    
    if len(result.Results.Bindings) == 0 {
        // 空结果不是错误，返回空列表
        return &MetricsResult{
            Result: []string{},
        }, nil
    }
    
    metrics := make([]string, len(result.Results.Bindings))
    for i, binding := range result.Results.Bindings {
        metrics[i] = binding["metric"].Value
    }
    
    return &MetricsResult{Result: metrics}, nil
}

func (c *GraphDBClient) GetMetricCode(ctx context.Context, req MetricCodesRequest) (string, error) {
    sparql := c.buildMetricCodeQuery(req)
    
    result, err := c.executeSparqlQuery(ctx, sparql)
    if err != nil {
        return "", fmt.Errorf("failed to execute metric code query: %w", err)
    }
    
    if len(result.Results.Bindings) == 0 {
        return "", ErrMetricCodeNotFound
    }
    
    return result.Results.Bindings[0]["code"].Value, nil
}

func (c *GraphDBClient) executeSparqlQuery(ctx context.Context, query string) (*SparqlResult, error) {
    req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/repositories/esg-repo", 
        strings.NewReader(query))
    if err != nil {
        return nil, fmt.Errorf("failed to create HTTP request: %w", err)
    }
    
    req.Header.Set("Content-Type", "application/sparql-query")
    req.Header.Set("Accept", "application/sparql-results+json")
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("GraphDB request failed: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("GraphDB returned status %d: %s", resp.StatusCode, string(body))
    }
    
    var result SparqlResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode SPARQL result: %w", err)
    }
    
    return &result, nil
}
```

#### 4.2 缓存适配器错误处理
```go
// internal/infrastructure/cache/redis_client.go
package cache

type RedisClient struct {
    client *redis.Client
    logger *slog.Logger
}

func (c *RedisClient) Get(ctx context.Context, key string) (interface{}, error) {
    val, err := c.client.Get(ctx, key).Result()
    if err != nil {
        if errors.Is(err, redis.Nil) {
            return nil, ErrCacheMiss
        }
        c.logger.Warn("Redis GET failed",
            slog.String("key", key),
            slog.Any("error", err),
        )
        return nil, fmt.Errorf("cache get failed: %w", err)
    }
    
    var result interface{}
    if err := json.Unmarshal([]byte(val), &result); err != nil {
        return nil, fmt.Errorf("cache value unmarshal failed: %w", err)
    }
    
    return result, nil
}

func (c *RedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
    data, err := json.Marshal(value)
    if err != nil {
        return fmt.Errorf("cache value marshal failed: %w", err)
    }
    
    if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
        c.logger.Warn("Redis SET failed",
            slog.String("key", key),
            slog.Duration("ttl", ttl),
            slog.Any("error", err),
        )
        return fmt.Errorf("cache set failed: %w", err)
    }
    
    return nil
}
```

### 5. 并发安全与上下文传播

#### 5.1 上下文超时处理
```go
// internal/application/services/query_service.go
package services

type QueryService struct {
    graphReader GraphReaderPort
    validator   *SparqlValidator
    logger      *slog.Logger
}

func (s *QueryService) ExecuteSparql(ctx context.Context, req SparqlRequest) (*SparqlResponse, error) {
    // 设置查询超时
    queryCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    
    // SPARQL查询验证
    if err := s.validator.ValidateReadOnly(req.Query); err != nil {
        return nil, domainerrors.NewValidationError(
            "Invalid SPARQL query: " + err.Error(),
            "INVALID_SPARQL",
        )
    }
    
    // 执行查询，传播取消信号
    result, err := s.graphReader.ExecuteSparql(queryCtx, req.Query)
    if err != nil {
        switch {
        case errors.Is(err, context.DeadlineExceeded):
            return nil, domainerrors.NewTimeoutError("SPARQL query timed out", "QUERY_TIMEOUT")
        case errors.Is(err, context.Canceled):
            return nil, domainerrors.NewValidationError("SPARQL query was canceled", "QUERY_CANCELED")
        default:
            return nil, domainerrors.WrapInternalError(err, "SPARQL execution failed")
        }
    }
    
    return result, nil
}
```

#### 5.2 优雅关闭处理
```go
// cmd/internal-api/main.go
package main

func main() {
    // 应用初始化...
    
    // 启动HTTP服务器
    server := &http.Server{
        Addr:    ":8080",
        Handler: router,
    }
    
    // 优雅关闭处理
    go func() {
        sigChan := make(chan os.Signal, 1)
        signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
        <-sigChan
        
        logger.Info("Shutting down server...")
        
        // 30秒优雅关闭超时
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        if err := server.Shutdown(shutdownCtx); err != nil {
            logger.Error("Server shutdown failed", slog.Any("error", err))
            os.Exit(1)
        }
        
        logger.Info("Server shutdown completed")
    }()
    
    logger.Info("Starting server on :8080")
    if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        logger.Error("Server failed to start", slog.Any("error", err))
        os.Exit(1)
    }
}
```

### 6. 错误监控与告警

#### 6.1 错误指标收集
```go
// internal/interfaces/http/middleware/metrics.go
package middleware

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_internal_api_requests_total",
            Help: "Total HTTP requests by method, endpoint, and status code",
        },
        []string{"method", "endpoint", "status"},
    )
    
    errorsByType = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_internal_api_errors_total",
            Help: "Total errors by type and endpoint",
        },
        []string{"error_type", "endpoint"},
    )
)

func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(wrapped, r)
        
        status := fmt.Sprintf("%d", wrapped.statusCode)
        httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
        
        // 记录错误指标
        if wrapped.statusCode >= 400 {
            errorType := categorizeHTTPError(wrapped.statusCode)
            errorsByType.WithLabelValues(errorType, r.URL.Path).Inc()
        }
    })
}

func categorizeHTTPError(statusCode int) string {
    switch {
    case statusCode >= 400 && statusCode < 500:
        return "client_error"
    case statusCode >= 500:
        return "server_error"
    default:
        return "unknown"
    }
}
```

这个错误处理文档遵循Go语言的惯用模式，包括错误包装、分层处理、上下文传播等核心概念，同时与现有的架构设计保持一致。
