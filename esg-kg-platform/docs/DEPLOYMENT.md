# 部署指南 (Deployment Guide)

## 概述

本文档提供 ESG Knowledge Graph Platform 的生产环境部署指南，包括域名配置、环境变量设置和基础设施要求。

## 🔧 域名配置

### 必须替换的示例域名

文档中的所有 `esg.platform` 都是示例域名，**必须**在部署前替换：

| 示例域名 | 说明 | 替换示例 |
|----------|------|----------|
| `esg.platform` | 主域名 | `your-company.com` |
| `api.esg.platform` | API 子域名 | `api.your-company.com` |

### 环境变量配置

创建 `.env.production` 文件：

```bash
# 基础域名配置
DOMAIN_NAME=your-company.com
API_BASE_URL=https://api.your-company.com

# IRI 生成配置
METRIC_IRI_BASE=https://your-company.com/data/metric
PROBLEM_TYPE_BASE=https://your-company.com/problems
ONTOLOGY_BASE=https://your-company.com/ontology
NAMED_GRAPH_BASE=https://your-company.com/graphs

# API 服务端口
PUBLIC_API_PORT=3001
INTERNAL_API_PORT=3002

# GraphDB 配置
GRAPHDB_URL=http://localhost:7200
GRAPHDB_REPOSITORY=esg-metrics

# 认证配置
JWT_SECRET=your-secret-key-here
JWT_ISSUER=your-company.com
JWT_AUDIENCE=esg-platform-api
```

### 配置更新检查清单

- [ ] **ERROR_CODES.md**: 更新所有 `type` 字段的 URI
- [ ] **API_CONTRACTS.md**: 更新所有示例 IRI 和错误类型
- [ ] **ERROR_HANDLING.md**: 更新代码示例中的错误类型 URI
- [ ] **应用配置**: 更新 IRI 生成服务的基础 URL
- [ ] **SHACL 规则**: 更新 ontology namespace（如适用）

## 🏗️ 基础设施要求

### 最小系统要求

| 组件 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| Public API | 2 核 | 4GB | 20GB | 1Gbps |
| Internal API | 4 核 | 8GB | 50GB | 1Gbps |
| GraphDB | 4 核 | 16GB | 200GB SSD | 1Gbps |
| Redis (缓存) | 2 核 | 4GB | 10GB | 1Gbps |

### 推荐系统要求（生产环境）

| 组件 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| Public API | 4 核 | 8GB | 50GB | 10Gbps |
| Internal API | 8 核 | 16GB | 100GB | 10Gbps |
| GraphDB | 16 核 | 64GB | 1TB NVMe SSD | 10Gbps |
| Redis | 4 核 | 16GB | 50GB | 10Gbps |

## 🔐 SSL/TLS 配置

### 证书获取

**选项 1: Let's Encrypt (推荐)**
```bash
# 使用 Certbot
sudo certbot --nginx -d your-company.com -d api.your-company.com
```

**选项 2: 商业证书**
```bash
# 配置证书路径
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/private.key
SSL_CA_PATH=/path/to/your/ca-bundle.pem
```

### Nginx 配置示例

```nginx
# /etc/nginx/sites-available/esg-platform
server {
    listen 443 ssl http2;
    server_name api.your-company.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Public API (Write Operations)
    location /public/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Internal API (Read Operations) 
    location /internal/ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.your-company.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 监控配置

### Prometheus Metrics

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your-admin-password
```

### 健康检查端点

确保以下端点可访问：
- `GET /public/v1/health` - Public API 健康状态
- `GET /internal/v1/health` - Internal API 健康状态  
- `GET /internal/v1/metrics` - Prometheus 指标

## 🗄️ 数据库配置

### GraphDB 生产配置

```properties
# graphdb.properties
graphdb.home.data=/opt/graphdb/data
graphdb.workbench.cors.enable=false
graphdb.workbench.external-url=https://graphdb.your-company.com

# 性能优化
graphdb.entity.pool.implementation=transactional
graphdb.entity.index.optimization=true
graphdb.query.timeout=30s
```

### Redis 配置

```conf
# redis.conf
bind 127.0.0.1
protected-mode yes
port 6379
maxmemory 8gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🚀 Docker 部署

### 生产环境 Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  public-api:
    build: 
      context: ./apps/api-public
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DOMAIN_NAME=your-company.com
      - GRAPHDB_URL=http://graphdb:7200
    depends_on:
      - graphdb
      - redis
    restart: unless-stopped

  internal-api:
    build:
      context: ./apps/api-internal
      dockerfile: Dockerfile.prod
    environment:
      - GO_ENV=production
      - DOMAIN_NAME=your-company.com
      - GRAPHDB_URL=http://graphdb:7200
    depends_on:
      - graphdb
      - redis
    restart: unless-stopped

  graphdb:
    image: ontotext/graphdb:10.1.1
    environment:
      - GDB_HEAP_SIZE=16g
      - GDB_JAVA_OPTS=-Xms16g -Xmx16g
    volumes:
      - graphdb_data:/opt/graphdb/home
      - ./infra/graphdb/repositories:/root/graphdb-import
    restart: unless-stopped

  redis:
    image: redis:7.0-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  graphdb_data:
  redis_data:
```

## ✅ 部署验证

### 功能测试

```bash
# 1. 健康检查
curl -f https://api.your-company.com/public/v1/health
curl -f https://api.your-company.com/internal/v1/health

# 2. 认证测试
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.your-company.com/public/v1/validate

# 3. 数据写入测试
curl -X POST https://api.your-company.com/public/v1/ingest \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"entityId": "test-001", "framework": "SASB", ...}'

# 4. 数据查询测试
curl https://api.your-company.com/internal/v1/metrics?entityId=test-001
```

### 性能测试

```bash
# 使用 Apache Bench 进行负载测试
ab -n 1000 -c 10 https://api.your-company.com/internal/v1/metrics

# 使用 wrk 进行更详细的测试
wrk -t12 -c400 -d30s https://api.your-company.com/internal/v1/metrics
```

## 🔄 更新和维护

### 滚动更新

```bash
# 1. 备份数据
./scripts/backup-graphdb.sh

# 2. 更新服务
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps public-api
docker-compose -f docker-compose.prod.yml up -d --no-deps internal-api

# 3. 验证更新
curl -f https://api.your-company.com/public/v1/health
```

### 数据备份

```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
./scripts/backup-graphdb.sh /backups/graphdb_backup_$DATE
find /backups -name "graphdb_backup_*" -mtime +30 -delete
```

## 📋 故障排除

### 常见问题

1. **域名解析问题**
   ```bash
   nslookup api.your-company.com
   dig api.your-company.com
   ```

2. **SSL 证书问题**
   ```bash
   openssl s_client -connect api.your-company.com:443
   ```

3. **服务连接问题**
   ```bash
   docker-compose logs public-api
   docker-compose logs internal-api
   docker-compose logs graphdb
   ```

4. **性能问题**
   ```bash
   # 检查资源使用
   docker stats
   
   # 检查 GraphDB 查询性能
   curl http://localhost:7200/rest/monitor/queries
   ```

## 🎯 生产就绪清单

- [ ] 域名 DNS 配置完成
- [ ] SSL 证书安装和配置
- [ ] 环境变量正确设置
- [ ] 数据库连接测试通过
- [ ] 认证服务配置完成
- [ ] 监控和日志收集设置
- [ ] 备份策略实施
- [ ] 负载均衡配置（如需要）
- [ ] 防火墙和安全规则设置
- [ ] 性能测试完成
- [ ] 故障恢复流程测试
- [ ] 文档更新完成

---

> ⚠️ **重要提醒**：生产部署前请务必完成所有安全配置和性能测试！