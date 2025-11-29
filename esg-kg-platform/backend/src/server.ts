/**
 * server.ts — 重构后的 Express 服务器 for ESG KG Wizard → GraphDB (RDF4J)
 * -------------------------------------------------------
 * 
 * 采用分层架构：
 * - Router 层：路由配置
 * - Controller 层：请求处理
 * - Service 层：业务逻辑
 * - Repository 层：数据访问
 * - 统一错误处理
 * 
 * ENV:
 *   PORT=3000
 *   GRAPHDB_URL=http://localhost:7200
 *   GRAPHDB_REPO=esg-repo
 *   DEFAULT_GRAPH=http://example.org/graph/esg   (可选：作为命名图)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

// 配置和路由
import { config, validateConfig } from './config';
import { createApiRoutes } from './routers';

// 中间件
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// 加载环境变量
dotenv.config();

/**
 * 创建 Express 应用实例
 */
const createApp = (): express.Application => {
  const app = express();

  // 验证配置
  validateConfig();

  // 基础中间件
  app.use(helmet()); // 安全头部
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
  }));

  // 请求体解析中间件
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 请求日志中间件（开发环境）
  if (config.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  // Swagger API 文档
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // API 路由
  app.use('/api', createApiRoutes());

  // 根路径健康检查
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'ESG Knowledge Graph Platform API',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api-docs',
      endpoints: {
        health: '/api/health',
        repositories: '/api/repositories',
        sparql: '/api/sparql',
        wizard: {
          preview: '/api/wizard/preview',
          submit: '/api/wizard/submit',
          validateDraft: '/api/wizard/validate-draft'
        },
        upload: '/api/upload-ttl/upload',
        shacl: '/api/shacl/validate-repo',
        kg: {
          frameworks: '/api/kg/frameworks',
          categories: '/api/kg/categories',
          metrics: '/api/kg/metrics',
          implementations: '/api/kg/implementations'
        },
        computation: {
          method: '/api/computation/method',
          implementation: '/api/computation/implementation',
          implementations: '/api/computation/implementations',
          supportedTypes: '/api/computation/supported-types'
        }
      }
    });
  });

  // 404 处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);

  return app;
};

/**
 * 启动服务器
 */
const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    
    const server = app.listen(config.PORT, () => {
      console.log('');
      console.log('🚀 ESG Knowledge Graph Platform Started');
      console.log('=====================================');
      console.log(`📦 Environment: ${config.NODE_ENV}`);
      console.log(`🌐 Server: http://localhost:${config.PORT}`);
      console.log(`📊 GraphDB: ${config.GRAPHDB_URL}`);
      console.log(`🗄️  Repository: ${config.GRAPHDB_REPO}`);
      console.log(`📋 API Docs: http://localhost:${config.PORT}/api-docs`);
      console.log('=====================================');
      console.log('');
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 监听未处理的异常
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // 可以选择是否退出进程
      // process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 启动服务器
if (require.main === module) {
  startServer();
}

export { createApp, startServer };