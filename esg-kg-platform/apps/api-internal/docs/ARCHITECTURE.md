# ESG Platform Internal API 架构设计

> Go语言高性能读取服务：查询、聚合、缓存的分层架构设计

## 架构概览

### 六边形架构 + 清洁架构
```
┌─────────────────────────────────────────────────────────┐
│                   External Clients                      │
│            (Frontend, Analytics, Reports)               │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/JSON
┌─────────────────────▼───────────────────────────────────┐
│                 Interfaces Layer                        │
│   Router (/internal/v1/*)  │  Middleware (Auth+CORS+Log) │
│   Handlers (metrics, sparql, health)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ DTOs
┌─────────────────────▼───────────────────────────────────┐
│                Application Layer                         │
│  MetricService   │  ReportService   │  QueryService     │
│       ↕              ↕                   ↕              │
│   Port Interfaces (GraphReader, Cache, RdbReader)       │
└─────────────────────┬───────────────────────────────────┘
                      │ Technical Protocols
┌─────────────────────▼───────────────────────────────────┐
│              Infrastructure Layer                       │
│ GraphDB Adapter │  Redis Cache  │  Postgres (Optional) │
│  (RDF4J Client) │  (Distributed) │    (Metadata)       │
└─────────────────────────────────────────────────────────┘
```

## 分层职责详述

### 1. Interfaces Layer (`interfaces/http/`)

#### 1.1 Router (`router.go`)
```go
// Router配置: 前缀 /internal/v1/*
func SetupRouter() *chi.Mux {
    r := chi.NewRouter()
    
    // 中间件栈
    r.Use(middleware.AuthMiddleware)      // JWT验证
    r.Use(middleware.LoggingMiddleware)   // 结构化日志
    r.Use(middleware.PanicRecovery)      // Panic恢复→RFC7807
    r.Use(middleware.CORS)               // CORS (可选)
    r.Use(middleware.RateLimiter)        // 限流保护
    
    // 路由组 (基于现有backend API设计)
    r.Route("/internal/v1", func(r chi.Router) {
        // 知识图谱导航端点
        r.Get("/frameworks", handlers.GetFrameworks)          // 获取行业报告框架
        r.Get("/categories", handlers.GetCategories)          // 获取框架下的分类  
        r.Get("/metrics", handlers.GetMetrics)               // 获取分类下的指标
        
    // 计算相关端点 (仅元数据查询，非执行)
    r.Get("/computation-methods", handlers.ListComputationMethods)        // 列出计算方法元数据
    r.Get("/computation-methods/{code}", handlers.GetComputationMethod)   // 获取单个计算方法元数据
        
        // 高级查询端点  
        r.Post("/sparql", handlers.ExecuteSparql)            // SPARQL直接查询
        
        // 系统端点
        r.Get("/health", handlers.HealthCheck)               // 健康检查
    })
    
    return r
}
```

#### 1.2 Middleware (`middleware/`)

##### 认证中间件 (`auth.go`)
```go
type AuthConfig struct {
    JWTSecret     []byte
    RequiredAud   string // "teammate-api"
    RequiredScope string // "esg.read"
}

func (m *AuthMiddleware) Handler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := extractBearerToken(r.Header.Get("Authorization"))
        if token == "" {
            errorhandler.WriteError(w, r, 
                domainerrors.NewAuthenticationError("Authorization header required", "MISSING_TOKEN"), 
                m.logger)
            return
        }
        
        claims, err := m.validateJWT(token)
        if err != nil {
            errorhandler.WriteError(w, r, 
                domainerrors.NewAuthenticationError(err.Error(), "INVALID_TOKEN"), 
                m.logger)
            return
        }
        
        // 验证aud和scope
        if claims.Audience != m.config.RequiredAud {
            errorhandler.WriteError(w, r, 
                domainerrors.NewAuthorizationError("Wrong token audience", "INVALID_AUDIENCE"), 
                m.logger)
            return
        }
        
        if !hasScope(claims.Scope, m.config.RequiredScope) {
            errorhandler.WriteError(w, r, 
                domainerrors.NewAuthorizationError("Missing esg.read scope", "INSUFFICIENT_SCOPE"), 
                m.logger)
            return
        }
        
        // 将用户信息注入上下文
        ctx := context.WithValue(r.Context(), "user", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

##### 日志中间件 (`logging.go`)
```go
type LoggingMiddleware struct {
    logger *slog.Logger
}

func (m *LoggingMiddleware) Handler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = generateRequestID()
        }
        
        // 请求开始日志
        m.logger.Info("Request started",
            slog.String("requestId", requestID),
            slog.String("method", r.Method),
            slog.String("path", r.URL.Path),
            slog.String("userAgent", r.UserAgent()),
            slog.String("remoteAddr", r.RemoteAddr),
        )
        
        wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
        next.ServeHTTP(wrapped, r)
        
        duration := time.Since(start)
        
        // 请求完成日志
        m.logger.Info("Request completed",
            slog.String("requestId", requestID),
            slog.Int("statusCode", wrapped.statusCode),
            slog.Duration("duration", duration),
            slog.Int64("responseSize", wrapped.bytesWritten),
        )
    })
}
```

##### Panic恢复中间件 (`recovery.go`)
```go
// RFC 7807 Problem Details 结构体
type ProblemDetails struct {
    Type      string `json:"type"`
    Title     string `json:"title"`
    Status    int    `json:"status"`
    Detail    string `json:"detail"`
    Instance  string `json:"instance,omitempty"`
    Code      string `json:"code,omitempty"`
    Timestamp string `json:"timestamp,omitempty"`
}

func PanicRecovery(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                // 记录panic堆栈
                stack := debug.Stack()
                logger.Error("Panic recovered",
                    slog.Any("error", err),
                    slog.String("stack", string(stack)),
                    slog.String("path", r.URL.Path),
                )
                
                // 返回RFC7807错误响应
                problem := ProblemDetails{
                    Type:      "https://esg.platform/problems/internal-error",
                    Title:     "Internal Server Error", 
                    Status:    http.StatusInternalServerError,
                    Detail:    "An unexpected error occurred",
                    Instance:  r.URL.Path,
                    Code:      "PANIC_RECOVERED",
                    Timestamp: time.Now().UTC().Format(time.RFC3339),
                }
                
                w.Header().Set("Content-Type", "application/problem+json")
                w.WriteHeader(http.StatusInternalServerError)
                json.NewEncoder(w).Encode(problem)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

#### 1.3 Handlers (`handlers/`)

##### Framework处理器 (`framework.go`)
```go
import (
    "net/http"
    "log/slog"
    
    "internal/application"
    "internal/domain/errors" 
    "internal/interfaces/http/errors" 
    domainerrors "internal/domain/errors"
)

type FrameworkHandler struct {
    metricService *application.MetricService
    validator     *validator.Validate
    logger        *slog.Logger
}

func (h *FrameworkHandler) GetFrameworks(w http.ResponseWriter, r *http.Request) {
    industry := r.URL.Query().Get("industry")
    if industry == "" {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError("industry parameter is required", "MISSING_INDUSTRY"), 
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

func (h *FrameworkHandler) GetCategories(w http.ResponseWriter, r *http.Request) {
    industry := r.URL.Query().Get("industry")
    framework := r.URL.Query().Get("framework")
    
    if industry == "" || framework == "" {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError("industry and framework parameters are required", "MISSING_PARAMETERS"), 
            h.logger)
        return
    }
    
    result, err := h.metricService.GetCategories(r.Context(), industry, framework)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}
```

##### Health处理器 (`health.go`)
```go
type HealthHandler struct {
    graphReader ports.GraphReader
    cache      ports.Cache
}

func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
    status := map[string]interface{}{
        "status": "healthy",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
        "version": "1.0.0",
    }
    
    unhealthyCount := 0
    totalChecks := 2
    
    // 检查GraphDB连接
    if err := h.graphReader.HealthCheck(r.Context()); err != nil {
        status["graphdb"] = "unhealthy"
        status["graphdb_error"] = err.Error()
        unhealthyCount++
    } else {
        status["graphdb"] = "healthy"
    }
    
    // 检查Redis缓存
    if err := h.cache.HealthCheck(r.Context()); err != nil {
        status["redis"] = "unhealthy" 
        status["redis_error"] = err.Error()
        unhealthyCount++
    } else {
        status["redis"] = "healthy"
    }
    
    // 根据失败的检查数量确定整体状态
    if unhealthyCount == totalChecks {
        status["status"] = "unhealthy"  // 全部依赖都不可用
    } else if unhealthyCount > 0 {
        status["status"] = "degraded"   // 部分依赖不可用，服务降级
    }
    
    statusCode := http.StatusOK
    if status["status"] == "unhealthy" {
        statusCode = http.StatusServiceUnavailable
    }
    // healthy和degraded状态都返回200 OK，因为服务仍然可用
    
    writeJSON(w, statusCode, status)
}
```

##### Metrics处理器 (`metrics.go`)
```go
type MetricsHandler struct {
    metricService *application.MetricService
    validator     *validator.Validate
}

func (h *MetricsHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
    // 解析查询参数
    params, err := h.parseMetricsQuery(r)
    if err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError(err.Error(), "INVALID_PARAMETERS"), 
            h.logger)
        return
    }
    
    // 调用应用服务
    result, err := h.metricService.GetMetrics(r.Context(), params)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}

func (h *MetricsHandler) GetTimeSeries(w http.ResponseWriter, r *http.Request) {
    code := chi.URLParam(r, "code")
    if code == "" {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError("Code parameter is required", "MISSING_CODE"), 
            h.logger)
        return
    }
    
    // 解析时间序列查询参数
    params, err := h.parseTimeSeriesQuery(r, code)
    if err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError(err.Error(), "INVALID_PARAMETERS"), 
            h.logger)
        return
    }
    
    result, err := h.metricService.GetTimeSeries(r.Context(), params)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}
```

##### SPARQL处理器 (`sparql.go`)
```go
type SparqlHandler struct {
    queryService *application.QueryService
    validator    *sparql.QueryValidator
}

func (h *SparqlHandler) ExecuteSparql(w http.ResponseWriter, r *http.Request) {
    // 解析SPARQL查询
    query, err := h.parseSparqlRequest(r)
    if err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError(err.Error(), "INVALID_REQUEST"), 
            h.logger)
        return
    }
    
    // 安全预检: 仅允许SELECT查询
    if err := h.validator.ValidateReadOnly(query.Query); err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError("Only SELECT queries are allowed: " + err.Error(), "FORBIDDEN_OPERATION"), 
            h.logger)
        return
    }
    
    // 执行查询
    result, err := h.queryService.ExecuteSparql(r.Context(), query)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            errorhandler.WriteError(w, r, 
                domainerrors.NewTimeoutError("Query execution timed out", "QUERY_TIMEOUT"), 
                h.logger)
        } else {
            errorhandler.WriteError(w, r, err, h.logger)
        }
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}

##### 计算处理器 (`computation.go`)
```go
type ComputationHandler struct {
    computationService *application.ComputationService
    validator          *validator.Validate
}

func (h *ComputationHandler) GetComputationMethods(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Code string `json:"code" validate:"required"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError(err.Error(), "INVALID_JSON"), 
            h.logger)
        return
    }
    
    if err := h.validator.Struct(&req); err != nil {
        errorhandler.WriteError(w, r, 
            domainerrors.NewValidationError(err.Error(), "VALIDATION_FAILED"), 
            h.logger)
        return
    }
    
    result, err := h.computationService.GetComputationMethod(r.Context(), req.Code)
    if err != nil {
        errorhandler.WriteError(w, r, err, h.logger)
        return
    }
    
    writeJSON(w, http.StatusOK, result)
}
```

### 2. Application Layer (`application/`)

#### 2.1 Services (`services/`)

##### MetricService (`metric_service.go`)
```go
type MetricService struct {
    graphReader ports.GraphReader
    cache      ports.Cache
    logger     *slog.Logger
}

// GetMetrics 获取指标列表，支持多维度过滤
func (s *MetricService) GetMetrics(ctx context.Context, params *dto.MetricQueryParams) (*dto.MetricResult, error) {
    // 生成缓存键
    cacheKey := s.generateCacheKey("metrics", params)
    
    // 尝试从缓存获取
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        s.logger.Debug("Cache hit", slog.String("key", cacheKey))
        return cached.(*dto.MetricResult), nil
    }
    
    // 缓存未命中，查询GraphDB
    s.logger.Debug("Cache miss, querying GraphDB", slog.String("key", cacheKey))
    
    // 构造SPARQL查询
    sparqlQuery := s.buildMetricQuery(params)
    
    // 执行查询
    result, err := s.graphReader.QueryMetrics(ctx, sparqlQuery)
    if err != nil {
        return nil, fmt.Errorf("failed to query metrics: %w", err)
    }
    
    // 转换为DTO格式
    dto_result := s.convertToMetricResult(result)
    
    // 写入缓存
    ttl := s.calculateTTL(params)
    if err := s.cache.Set(ctx, cacheKey, dto_result, ttl); err != nil {
        s.logger.Warn("Failed to cache result", slog.String("error", err.Error()))
    }
    
    return dto_result, nil
}

// GetTimeSeries 获取时间序列数据，用于趋势分析
func (s *MetricService) GetTimeSeries(ctx context.Context, params *dto.TimeSeriesParams) (*dto.TimeSeriesResult, error) {
    cacheKey := s.generateCacheKey("timeseries", params)
    
    // 分布式锁防止缓存击穿
    lockKey := cacheKey + ":lock"
    if acquired, err := s.cache.TryLock(ctx, lockKey, 30*time.Second); err == nil && acquired {
        defer s.cache.Unlock(ctx, lockKey)
        
        // 双重检查
        if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
            return cached.(*dto.TimeSeriesResult), nil
        }
        
        // 查询并聚合数据
        result, err := s.queryAndAggregateTimeSeries(ctx, params)
        if err != nil {
            return nil, err
        }
        
        // 缓存结果
        s.cache.Set(ctx, cacheKey, result, 30*time.Minute)
        return result, nil
    }
    
    // 获取锁失败，直接查询
    return s.queryAndAggregateTimeSeries(ctx, params)
}

// GetFrameworks 获取行业适用的报告框架列表
func (s *MetricService) GetFrameworks(ctx context.Context, industry string) (*dto.FrameworkResult, error) {
    cacheKey := fmt.Sprintf("frameworks:industry:%s", industry)
    
    // 尝试从缓存获取
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        return cached.(*dto.FrameworkResult), nil
    }
    
    // 查询GraphDB
    sparqlQuery := fmt.Sprintf(`
        PREFIX esg: <https://esg.platform/ontology/>
        SELECT DISTINCT ?framework WHERE {
            ?metric esg:industry "%s" ;
                   esg:framework ?framework .
        }
        ORDER BY ?framework
    `, industry)
    
    result, err := s.graphReader.QueryFrameworks(ctx, sparqlQuery)
    if err != nil {
        return nil, fmt.Errorf("failed to query frameworks: %w", err)
    }
    
    dto_result := &dto.FrameworkResult{Frameworks: result}
    
    // 缓存结果 (框架信息相对稳定，可以缓存较长时间)
    s.cache.Set(ctx, cacheKey, dto_result, 24*time.Hour)
    
    return dto_result, nil
}

// GetCategories 获取框架下的分类列表  
func (s *MetricService) GetCategories(ctx context.Context, industry, framework string) (*dto.CategoryResult, error) {
    cacheKey := fmt.Sprintf("categories:industry:%s:framework:%s", industry, framework)
    
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        return cached.(*dto.CategoryResult), nil
    }
    
    sparqlQuery := fmt.Sprintf(`
        PREFIX esg: <https://esg.platform/ontology/>
        SELECT DISTINCT ?category ?categoryLabel WHERE {
            ?metric esg:industry "%s" ;
                   esg:framework "%s" ;
                   esg:category ?category ;
                   esg:categoryLabel ?categoryLabel .
        }
        ORDER BY ?categoryLabel
    `, industry, framework)
    
    result, err := s.graphReader.QueryCategories(ctx, sparqlQuery)
    if err != nil {
        return nil, fmt.Errorf("failed to query categories: %w", err)
    }
    
    dto_result := &dto.CategoryResult{Categories: result}
    s.cache.Set(ctx, cacheKey, dto_result, 12*time.Hour)
    
    return dto_result, nil
}

// buildMetricQuery 构建SPARQL查询，支持动态过滤条件
func (s *MetricService) buildMetricQuery(params *dto.MetricQueryParams) string {
    var conditions []string
    
    query := `
    PREFIX esg: <https://esg.platform/ontology/>
    PREFIX qudt: <http://qudt.org/vocab/unit/>
    
    SELECT ?iri ?entityId ?framework ?industry ?code ?value ?unitIri ?asOf ?source ?batchId
    WHERE {
        ?iri a esg:Metric ;
             esg:entityId ?entityId ;
             esg:framework ?framework ;
             esg:industry ?industry ;
             esg:code ?code ;
             esg:value ?value ;
             esg:unitIri ?unitIri ;
             esg:asOf ?asOf ;
             esg:source ?source ;
             esg:batchId ?batchId .
    `
    
    if params.Framework != "" {
        conditions = append(conditions, fmt.Sprintf(`FILTER(?framework = "%s")`, params.Framework))
    }
    
    if params.Industry != "" {
        conditions = append(conditions, fmt.Sprintf(`FILTER(?industry = "%s")`, params.Industry))
    }
    
    if params.Code != "" {
        conditions = append(conditions, fmt.Sprintf(`FILTER(?code = "%s")`, params.Code))
    }
    
    if params.EntityId != "" {
        conditions = append(conditions, fmt.Sprintf(`FILTER(?entityId = "%s")`, params.EntityId))
    }
    
    if len(conditions) > 0 {
        query += "\n" + strings.Join(conditions, "\n")
    }
    
    query += `
    }
    ORDER BY ?asOf DESC ?entityId
    `
    
    if params.Limit > 0 {
        query += fmt.Sprintf("LIMIT %d", params.Limit)
    }
    
    if params.Offset > 0 {
        query += fmt.Sprintf(" OFFSET %d", params.Offset)
    }
    
    return query
}
```

##### ComputationService (`computation_service.go`)
```go
type ComputationService struct {
    modelRegistry  ports.ModelRegistry
    logger         *slog.Logger
}

// GetComputationMethod 获取运算代码对应的计算方法 (只读查询)
func (s *ComputationService) GetComputationMethod(ctx context.Context, code string) (*dto.ComputationMethodResponse, error) {
    if code == "" {
        return nil, errors.New("code parameter is required")
    }
    
    // 从模型注册表获取计算方法定义
    method, err := s.modelRegistry.GetComputationMethod(ctx, code)
    if err != nil {
        s.logger.Error("Failed to get computation method", 
            slog.String("code", code),
            slog.Any("error", err),
        )
        return nil, fmt.Errorf("computation method not found for code: %s", code)
    }
    
    return method, nil
}
```

##### ReportService (`report_service.go`)
```go
type ReportService struct {
    metricService *MetricService
    graphReader   ports.GraphReader
    rdbReader     ports.RdbReader // 可选的关系型数据库
    cache        ports.Cache
}

// GenerateFrameworkReport 生成框架级报告，跨源聚合
func (s *ReportService) GenerateFrameworkReport(ctx context.Context, framework string) (*dto.FrameworkReport, error) {
    // 并发查询多个数据源
    var wg sync.WaitGroup
    var metrics *dto.MetricResult
    var metadata *dto.FrameworkMetadata
    var entities *dto.EntityList
    
    errCh := make(chan error, 3)
    
    // 查询指标数据
    wg.Add(1)
    go func() {
        defer wg.Done()
        var err error
        metrics, err = s.metricService.GetMetrics(ctx, &dto.MetricQueryParams{
            Framework: framework,
            Limit:     1000,
        })
        if err != nil {
            errCh <- fmt.Errorf("failed to get metrics: %w", err)
        }
    }()
    
    // 查询框架元数据（可能来自关系型数据库）
    wg.Add(1)  
    go func() {
        defer wg.Done()
        var err error
        if s.rdbReader != nil {
            metadata, err = s.rdbReader.GetFrameworkMetadata(ctx, framework)
        } else {
            metadata, err = s.getFrameworkMetadataFromGraph(ctx, framework)
        }
        if err != nil {
            errCh <- fmt.Errorf("failed to get framework metadata: %w", err)
        }
    }()
    
    // 查询实体列表
    wg.Add(1)
    go func() {
        defer wg.Done()
        var err error
        entities, err = s.getEntitiesByFramework(ctx, framework)
        if err != nil {
            errCh <- fmt.Errorf("failed to get entities: %w", err)
        }
    }()
    
    wg.Wait()
    close(errCh)
    
    // 检查错误
    for err := range errCh {
        if err != nil {
            return nil, err
        }
    }
    
    // 聚合生成报告
    report := &dto.FrameworkReport{
        Framework:    framework,
        Metadata:     metadata,
        Metrics:      metrics.Metrics,
        Entities:     entities.Entities,
        GeneratedAt:  time.Now(),
        Summary:      s.calculateSummary(metrics.Metrics),
    }
    
    return report, nil
}
```

#### 2.2 Ports (`ports/`)

##### GraphReader接口 (`graph_reader.go`)
```go
type GraphReader interface {
    // QueryMetrics 执行指标查询
    QueryMetrics(ctx context.Context, sparql string) (*GraphQueryResult, error)
    
    // QueryTimeSeries 查询时间序列数据
    QueryTimeSeries(ctx context.Context, params *TimeSeriesQueryParams) (*TimeSeriesData, error)
    
    // ExecuteSparql 执行通用SPARQL查询
    ExecuteSparql(ctx context.Context, query string) (*SparqlResult, error)
    
    // QueryFrameworks 查询框架列表
    QueryFrameworks(ctx context.Context, sparql string) ([]*Framework, error)
    
    // QueryCategories 查询分类列表  
    QueryCategories(ctx context.Context, sparql string) ([]*Category, error)
    
    // HealthCheck 健康检查
    HealthCheck(ctx context.Context) error
}
```

##### Cache接口 (`cache.go`)
```go
type Cache interface {
    // Get 获取缓存值
    Get(ctx context.Context, key string) (interface{}, error)
    
    // Set 设置缓存值
    Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
    
    // Delete 删除缓存
    Delete(ctx context.Context, key string) error
    
    // GetExpired 获取已过期的缓存（降级使用）
    GetExpired(ctx context.Context, key string) (interface{}, error)
    
    // TryLock 尝试获取分布式锁
    TryLock(ctx context.Context, key string, ttl time.Duration) (bool, error)
    
    // Unlock 释放分布式锁
    Unlock(ctx context.Context, key string) error
    
    // Flush 清空缓存
    Flush(ctx context.Context) error
}
```

##### ModelRegistry接口 (`model_registry.go`)
```go
type ModelRegistry interface {
    // GetComputationMethod 获取运算代码对应的计算方法元数据
    GetComputationMethod(ctx context.Context, code string) (*ComputationMethodResponse, error)
}

type ComputationMethodResponse struct {
    Code              string      `json:"code"`
    ComputationMethod string      `json:"computationMethod"`
    Parameters        []Parameter `json:"parameters"`
}

type Parameter struct {
    Name        string `json:"name"`
    Description string `json:"description"`
    Type        string `json:"type,omitempty"`
    Required    bool   `json:"required,omitempty"`
}


```

### 3. Infrastructure Layer (`infrastructure/`)

#### 3.1 GraphDB适配器 (`graph/graphdb_client.go`)
```go
type GraphDBClient struct {
    endpoint string
    client   *http.Client
    pool     *connectionPool
    logger   *slog.Logger
}

func (c *GraphDBClient) QueryMetrics(ctx context.Context, sparql string) (*GraphQueryResult, error) {
    // 获取连接
    conn, err := c.pool.Get()
    if err != nil {
        return nil, fmt.Errorf("failed to get connection: %w", err)
    }
    defer c.pool.Put(conn)
    
    // 构建查询请求
    req, err := http.NewRequestWithContext(ctx, "POST", c.endpoint+"/repositories/esg-repo", strings.NewReader(sparql))
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Accept", "application/sparql-results+json")
    req.Header.Set("Content-Type", "application/sparql-query")
    
    // 执行查询
    start := time.Now()
    resp, err := c.client.Do(req)
    duration := time.Since(start)
    
    // 记录性能指标
    c.recordMetrics("query_metrics", duration, err)
    
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("query failed with status %d: %s", resp.StatusCode, string(body))
    }
    
    // 解析结果
    var result GraphQueryResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }
    
    return &result, nil
}

// ExecuteSparql 执行通用SPARQL查询，支持超时和限制
func (c *GraphDBClient) ExecuteSparql(ctx context.Context, query string) (*SparqlResult, error) {
    // 预检查查询安全性
    if err := c.validateQuery(query); err != nil {
        return nil, fmt.Errorf("invalid query: %w", err)
    }
    
    // 设置查询超时
    queryCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    
    // 执行查询
    return c.doSparqlQuery(queryCtx, query)
}

// validateQuery 验证查询安全性，仅允许SELECT
func (c *GraphDBClient) validateQuery(query string) error {
    query = strings.TrimSpace(strings.ToUpper(query))
    
    // 禁止的操作
    forbidden := []string{"UPDATE", "DELETE", "INSERT", "DROP", "CREATE", "CLEAR", "LOAD"}
    for _, op := range forbidden {
        if strings.Contains(query, op) {
            return fmt.Errorf("operation %s is not allowed", op)
        }
    }
    
    // 必须以SELECT开始
    if !strings.HasPrefix(query, "SELECT") && !strings.HasPrefix(query, "PREFIX") {
        return fmt.Errorf("only SELECT queries are allowed")
    }
    
    return nil
}
```

#### 3.2 Redis缓存适配器 (`cache/redis_client.go`)
```go
type RedisClient struct {
    client      redis.Cmdable
    keyPrefix   string
    defaultTTL  time.Duration
    serializer  Serializer
    logger      *slog.Logger
}

func (c *RedisClient) Get(ctx context.Context, key string) (interface{}, error) {
    fullKey := c.keyPrefix + key
    
    data, err := c.client.Get(ctx, fullKey).Bytes()
    if err != nil {
        if err == redis.Nil {
            return nil, ErrCacheKeyNotFound
        }
        return nil, fmt.Errorf("failed to get cache key %s: %w", key, err)
    }
    
    // 反序列化
    value, err := c.serializer.Deserialize(data)
    if err != nil {
        c.logger.Warn("Failed to deserialize cache value", 
            slog.String("key", key),
            slog.String("error", err.Error()))
        return nil, ErrCacheDeserializationFailed
    }
    
    return value, nil
}

func (c *RedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
    fullKey := c.keyPrefix + key
    
    // 序列化
    data, err := c.serializer.Serialize(value)
    if err != nil {
        return fmt.Errorf("failed to serialize value: %w", err)
    }
    
    // 使用默认TTL
    if ttl == 0 {
        ttl = c.defaultTTL
    }
    
    err = c.client.Set(ctx, fullKey, data, ttl).Err()
    if err != nil {
        return fmt.Errorf("failed to set cache key %s: %w", key, err)
    }
    
    return nil
}

// TryLock 实现分布式锁
func (c *RedisClient) TryLock(ctx context.Context, key string, ttl time.Duration) (bool, error) {
    lockKey := c.keyPrefix + "lock:" + key
    lockValue := generateLockValue()
    
    // 使用SET NX EX实现分布式锁
    result, err := c.client.SetNX(ctx, lockKey, lockValue, ttl).Result()
    if err != nil {
        return false, fmt.Errorf("failed to acquire lock %s: %w", key, err)
    }
    
    return result, nil
}

// GetExpired 获取已过期的缓存值（用于降级）
func (c *RedisClient) GetExpired(ctx context.Context, key string) (interface{}, error) {
    expiredKey := c.keyPrefix + "expired:" + key
    
    data, err := c.client.Get(ctx, expiredKey).Bytes()
    if err != nil {
        return nil, ErrCacheKeyNotFound
    }
    
    value, err := c.serializer.Deserialize(data)
    if err != nil {
        return nil, err
    }
    
    return value, nil
}
```

## 性能优化策略

### 1. 连接池管理
```go
type ConnectionPool struct {
    connections chan *http.Client
    factory     func() *http.Client
    maxSize     int
    currentSize int64
    mutex       sync.Mutex
}

func (p *ConnectionPool) Get() (*http.Client, error) {
    select {
    case client := <-p.connections:
        return client, nil
    default:
        // 池为空，创建新连接
        if atomic.LoadInt64(&p.currentSize) < int64(p.maxSize) {
            client := p.factory()
            atomic.AddInt64(&p.currentSize, 1)
            return client, nil
        }
        // 池已满，等待可用连接
        return <-p.connections, nil
    }
}
```

### 2. 查询优化
```go
func (s *MetricService) optimizeQuery(sparql string) string {
    // 添加适当的LIMIT
    if !strings.Contains(strings.ToUpper(sparql), "LIMIT") {
        sparql += " LIMIT 1000"
    }
    
    // 优化ORDER BY
    if strings.Contains(strings.ToUpper(sparql), "ORDER BY") && 
       !strings.Contains(strings.ToUpper(sparql), "INDEX") {
        // 建议使用索引字段排序
        sparql = strings.ReplaceAll(sparql, "ORDER BY ?asOf", "ORDER BY ?asOf # Use index on asOf")
    }
    
    return sparql
}
```

### 3. 并发控制
```go
type ConcurrencyLimiter struct {
    semaphore chan struct{}
}

func NewConcurrencyLimiter(maxConcurrent int) *ConcurrencyLimiter {
    return &ConcurrencyLimiter{
        semaphore: make(chan struct{}, maxConcurrent),
    }
}

func (c *ConcurrencyLimiter) Execute(ctx context.Context, fn func() error) error {
    select {
    case c.semaphore <- struct{}{}:
        defer func() { <-c.semaphore }()
        return fn()
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

## 监控与可观测性

### Prometheus指标定义
```go
var (
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "esg_internal_api_request_duration_seconds",
            Help: "HTTP request duration in seconds",
        },
        []string{"method", "endpoint", "status_code"},
    )
    
    cacheOperations = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_cache_operations_total",
            Help: "Total cache operations",
        },
        []string{"operation", "status"},
    )
    
    graphdbQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "esg_graphdb_query_duration_seconds",
            Help: "GraphDB query execution time",
        },
        []string{"query_type"},
    )
)
```

这套架构确保了Internal API的**高性能、高可用、强安全**，为ESG数据的查询和分析提供了坚实的技术基础。