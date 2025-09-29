# ESG Platform Internal API 输入输出清单

> Go服务专用：查询、聚合、只读操作的完整契约定义

## 🔄 迁移说明

**当前状态**: 基于现有backend/code实现的API规范更新  
**兼容性**: 完全兼容现有TypeScript后端的API接口和响应格式  
**架构升级**: 从内存RDF (Comunica + N3) → GraphDB + Redis 缓存

## 架构职责分工

### 🔴 Public API (TypeScript) - 写入服务
- 数据验证和写入
- SHACL验证
- JSON到RDF转换
- 事务处理

### 🔵 Internal API (Go) - 读取服务
- 高性能查询
- 数据聚合
- 报告生成
- 缓存管理
- 只读安全边界

## 通用请求头说明

所有API端点支持以下标准请求头：

- **Authorization**: `Bearer <JWT_TOKEN>` - JWT认证令牌（必需）
  - `aud`: `teammate-api` - 内部团队API访问
  - `scope`: `esg.read` - ESG数据读取权限
- **Accept**: `application/json` - 响应格式（默认）
- **X-Request-ID**: 可选的请求追踪ID，用于日志关联

## 只读安全边界

### 📋 安全约束
- **严格只读**: 所有端点仅支持SELECT查询，拒绝UPDATE/DELETE/INSERT
- **SPARQL预检**: POST /internal/v1/sparql端点会预检语句，拒绝非SELECT操作
- **访问控制**: 基于JWT scope进行细粒度权限控制
- **查询限制**: 实施查询复杂度限制和超时保护

## 1. HTTP Routes 输入输出规范

### 1.1 GET /internal/v1/frameworks

> **对应现有API**: `GET /SAGE/KG/retrieve/framework`  
> **功能**: 获取特定行业适用的所有报告框架

#### 输入 (Input)
**查询参数**:
- `industry`: 行业名称 (必需) - 例如: "Commercial Banks"

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Accept: application/json
X-Request-ID: optional-request-id
```

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "result": [
    "SASB", 
    "GRI",
    "TCFD"
  ]
}
```

### 1.2 GET /internal/v1/categories

> **对应现有API**: `GET /SAGE/KG/retrieve/categories`  
> **功能**: 获取特定行业和报告框架下的所有分类

#### 输入 (Input)
**查询参数**:
- `industry`: 行业名称 (必需)
- `framework`: 报告框架 (必需) - 如 "SASB", "GRI"

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "result": [
    "Data Security",
    "Access & Affordability", 
    "Product Quality & Safety",
    "Customer Privacy",
    "Selling Practices & Product Labeling"
  ]
}
```

### 1.3 GET /internal/v1/metrics

> **对应现有API**: `GET /SAGE/KG/retrieve/category/metrics`  
> **功能**: 获取特定分类下的所有指标

#### 输入 (Input)
**查询参数**:
- `industry`: 行业名称 (必需)
- `category_label`: 分类标签 (必需)
- `framework`: 报告框架 (必需)

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "result": [
    "Total amount of monetary losses as a result of legal proceedings associated with customer privacy",
    "Description of policies and practices relating to behavioral advertising and customer privacy",
    "Number of customers whose information is used for secondary purposes"
  ]
}
```

### 1.4 POST /internal/v1/computation-methods

> **对应现有API**: `POST /SAGE/MC/getComputationMethod`  
> **功能**: 获取运算代码对应的计算方法

#### 输入 (Input)
**请求体**:
```json
{
  "code": "FN-CB-410a.1"
}
```

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "code": "FN-CB-410a.1",
  "computationMethod": "percentage_ratio",
  "parameters": [
    {
      "name": "numerator",
      "description": "Numerator value"
    },
    {
      "name": "denominator", 
      "description": "Denominator value"
    }
  ]
}
```

### 1.5 POST /internal/v1/sparql

> **对应现有功能**: 直接SPARQL查询接口 (基于现有的Comunica/N3实现)  
> **功能**: 执行SPARQL查询获取知识图谱数据，主要用于复杂查询和数据探索

#### 输入 (Input)
**Content-Type**: `application/sparql-query` 或 `application/json`

**SPARQL格式输入**:
```sparql
PREFIX esg: <https://esg.platform/ontology/>
PREFIX qudt: <http://qudt.org/vocab/unit/>

SELECT ?entity ?framework ?value ?unit WHERE {
  ?metric esg:entityId ?entity ;
          esg:framework ?framework ;
          esg:code "FN-CB-410a.1" ;
          esg:value ?value ;
          esg:unitIri ?unit .
} 
LIMIT 100
```

**JSON格式输入**:
```json
{
  "query": "SELECT ?entity ?value WHERE { ?metric esg:entityId ?entity ; esg:value ?value . } LIMIT 100",
  "timeout": 30000,
  "reasoning": false
}
```

#### 安全预检
- **禁止操作**: UPDATE, DELETE, INSERT, DROP, CREATE, CLEAR, LOAD
- **查询复杂度**: 限制嵌套深度和联接数量
- **超时保护**: 默认30秒超时，最大60秒

#### 输出 (Output)

**成功响应 (200 OK)**:
```json
{
  "results": {
    "bindings": [
      {
        "entity": {
          "type": "literal",
          "value": "bank-001"
        },
        "framework": {
          "type": "literal", 
          "value": "SASB"
        },
        "value": {
          "type": "literal",
          "datatype": "http://www.w3.org/2001/XMLSchema#decimal",
          "value": "1250000.00"
        }
      }
    ]
  },
  "metadata": {
    "executionTime": 245,
    "resultCount": 1,
    "cached": false
  }
}
```

### 1.6 GET /internal/v1/health

> **对应现有API**: `GET /health` (健康检查)  
> **功能**: 服务健康状态检查

#### 输出 (Output)

**健康响应 (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-28T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "graphdb": "healthy",
    "computation_engine": "healthy"
  }
}
```

## 2. 统一错误响应格式

遵循RFC 7807 Problem Details标准，所有错误响应统一使用以下格式：

**Content-Type**: `application/problem+json`

```json
{
  "type": "https://esg.platform/problems/missing-parameter",
  "title": "Missing Required Parameter",
  "status": 400,
  "detail": "Framework parameter is required",
  "instance": "/internal/v1/frameworks",
  "code": "MISSING_PARAMETER",
  "requestId": "req-12345",
  "timestamp": "2025-09-28T12:00:00Z"
}
```

### 2.1 标准错误类型

#### 客户端错误 (4xx)
- **400 Bad Request**: 请求参数错误
  ```json
  {
    "type": "https://esg.platform/problems/invalid-parameter",
    "title": "Invalid Parameter",
    "status": 400,
    "detail": "Invalid parameter format",
    "instance": "/internal/v1/metrics",
    "code": "INVALID_PARAMETER"
  }
  ```
  
- **404 Not Found**: 资源不存在
  ```json
  {
    "type": "https://esg.platform/problems/resource-not-found",
    "title": "Resource Not Found",
    "status": 404,
    "detail": "Metric code not found", 
    "instance": "/internal/v1/computation-methods",
    "code": "RESOURCE_NOT_FOUND"
  }
  ```

#### 服务端错误 (5xx)
- **500 Internal Error**: 内部错误
  ```json
  {
    "type": "https://esg.platform/problems/internal-error",
    "title": "Internal Server Error",
    "status": 500,
    "detail": "SPARQL query execution failed",
    "instance": "/internal/v1/sparql",
    "code": "QUERY_ERROR"
  }
  ```

## 3. 缓存策略

### 3.1 缓存分层

#### L1 - 应用内存缓存
- **范围**: 频繁查询的小结果集
- **TTL**: 5分钟
- **容量**: 100MB
- **策略**: LRU淘汰

#### L2 - Redis分布式缓存  
- **范围**: 查询结果、聚合数据
- **TTL**: 根据数据类型动态设置
  - 框架/代码列表: 24小时
  - 指标数据: 1小时
  - 时间序列: 30分钟
- **键策略**: 查询参数哈希

#### 缓存键生成
```go
func generateCacheKey(endpoint string, params map[string]string) string {
    // 排序参数确保一致性
    keys := make([]string, 0, len(params))
    for k := range params {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    
    var builder strings.Builder
    builder.WriteString(endpoint)
    for _, k := range keys {
        builder.WriteString(":")
        builder.WriteString(k)
        builder.WriteString("=")
        builder.WriteString(params[k])
    }
    
    hash := sha256.Sum256([]byte(builder.String()))
    return fmt.Sprintf("esg:query:%x", hash[:8])
}
```

### 3.2 缓存穿透/击穿处理

#### 缓存穿透防护
- **空结果缓存**: 缓存空查询结果，TTL 5分钟
- **布隆过滤器**: 预过滤不存在的查询
- **参数验证**: 严格验证查询参数有效性

#### 缓存击穿防护
- **分布式锁**: Redis分布式锁防止并发重建
- **热点数据预热**: 定期刷新热点查询
- **降级策略**: 缓存失效时返回降级数据

```go
func (s *MetricService) GetMetricsWithCache(params QueryParams) (*MetricResult, error) {
    cacheKey := generateCacheKey("metrics", params.ToMap())
    
    // 尝试从缓存获取
    if cached, err := s.cache.Get(cacheKey); err == nil {
        return cached, nil
    }
    
    // 分布式锁防止缓存击穿
    lockKey := cacheKey + ":lock"
    if acquired, err := s.cache.TryLock(lockKey, 30*time.Second); err == nil && acquired {
        defer s.cache.Unlock(lockKey)
        
        // 再次检查缓存（双重检查）
        if cached, err := s.cache.Get(cacheKey); err == nil {
            return cached, nil
        }
        
        // 查询数据库
        result, err := s.graphReader.QueryMetrics(params)
        if err != nil {
            return nil, err
        }
        
        // 写入缓存
        s.cache.Set(cacheKey, result, s.getTTL(params))
        return result, nil
    }
    
    // 获取锁失败，直接查询
    return s.graphReader.QueryMetrics(params)
}
```

## 4. 失败回退策略

### 4.1 服务降级

#### GraphDB故障处理
```go
type FallbackStrategy struct {
    useCache      bool          // 使用过期缓存
    useBackupDB   bool          // 使用备份数据库
    returnPartial bool          // 返回部分数据
    timeout       time.Duration // 降级超时
}

func (s *MetricService) QueryWithFallback(params QueryParams) (*MetricResult, error) {
    // 主要查询
    result, err := s.graphReader.QueryMetrics(params)
    if err == nil {
        return result, nil
    }
    
    // 降级策略1: 使用过期缓存
    if s.fallback.useCache {
        if cached, err := s.cache.GetExpired(cacheKey); err == nil {
            cached.Metadata.Source = "expired_cache"
            return cached, nil
        }
    }
    
    // 降级策略2: 返回部分数据
    if s.fallback.returnPartial {
        return &MetricResult{
            Metrics: []Metric{},
            Metadata: ResponseMetadata{
                Source: "degraded",
                Warning: "Service degraded, returning empty result"
            }
        }, nil
    }
    
    return nil, err
}
```

### 3.2 熔断机制

#### 熔断器配置
```go
type CircuitBreakerConfig struct {
    FailureThreshold   int           // 失败阈值: 5次
    RecoveryTimeout    time.Duration // 恢复超时: 60秒
    HalfOpenRequests   int           // 半开状态请求数: 3
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    switch cb.state {
    case Closed:
        err := fn()
        if err != nil {
            cb.recordFailure()
            if cb.failures >= cb.config.FailureThreshold {
                cb.state = Open
                cb.openTime = time.Now()
            }
        } else {
            cb.reset()
        }
        return err
        
    case Open:
        if time.Since(cb.openTime) >= cb.config.RecoveryTimeout {
            cb.state = HalfOpen
            cb.halfOpenRequests = 0
        } else {
            return ErrCircuitBreakerOpen
        }
        
    case HalfOpen:
        if cb.halfOpenRequests >= cb.config.HalfOpenRequests {
            return ErrCircuitBreakerOpen
        }
        cb.halfOpenRequests++
        err := fn()
        if err != nil {
            cb.state = Open
            cb.openTime = time.Now()
        } else {
            cb.reset()
            cb.state = Closed
        }
        return err
    }
    return nil
}
```

## 4. 性能监控指标

### 4.1 关键性能指标 (KPI)

#### 响应时间指标
- **P95响应时间**: < 200ms
- **P99响应时间**: < 500ms
- **平均响应时间**: < 100ms

#### 吞吐量指标  
- **QPS峰值**: > 1000 queries/second
- **并发用户**: > 100 concurrent users

#### 可用性指标
- **系统可用性**: > 99.9%
- **缓存命中率**: > 85%
- **错误率**: < 0.1%

### 4.2 监控指标采集

#### Prometheus指标
```go
var (
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "esg_api_request_duration_seconds",
            Help: "HTTP request duration in seconds",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
        },
        []string{"method", "endpoint", "status_code"},
    )
    
    cacheHitRate = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "esg_cache_hits_total",
            Help: "Total cache hits",
        },
        []string{"cache_type", "endpoint"},
    )
    
    graphdbQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "esg_graphdb_query_duration_seconds", 
            Help: "GraphDB query duration in seconds",
        },
        []string{"query_type"},
    )
)
```

#### 健康检查指标
- **GraphDB连接状态**: 连接池大小、活跃连接数
- **Redis连接状态**: 连接延迟、内存使用率  
- **系统资源**: CPU使用率、内存使用量、GC频率

## 5. 分页与游标约定

### 5.1 偏移分页
```json
{
  "limit": 50,
  "offset": 100,
  "total": 1250
}
```

### 5.2 游标分页（推荐）
```json
{
  "limit": 50,
  "cursor": "eyJhc09mIjoiMjAyMy0xMi0zMSIsImlkIjoiYmFuay0wMDEifQ==",
  "hasNext": true,
  "nextCursor": "eyJhc09mIjoiMjAyMy0xMi0zMCIsImlkIjoiYmFuay0wMDIifQ=="
}
```

游标编码结构：
```go
type Cursor struct {
    AsOf string `json:"asOf"`
    ID   string `json:"id"`
}
```

---

这份契约确保了Internal API的**高性能查询、安全只读边界、完善的缓存策略**，为ESG数据的读取和分析提供了强大、可靠的服务保障。