/**
 * Express Application Configuration
 * Main application setup with middleware, routes, and error handling
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { DIContainer } from './interfaces/http/container/di-container';
import { createApiRoutes, createOpenApiRoute } from './interfaces/http/routes';
import { errorHandler } from './interfaces/http/middleware';
import { AppConfig } from './config/config';
import { setupInfrastructure } from './infrastructure';

/**
 * Create and configure Express application
 */
export function createApp(appConfig: AppConfig): express.Application {
  const app = express();

  // Store config in app for middleware access
  app.set('config', appConfig);

  // Setup infrastructure with config injection
  const infrastructure = setupInfrastructure(appConfig);
  
  // Store infrastructure in app for component access
  app.set('infrastructure', infrastructure);

  // Create container configuration from unified config
  const containerConfig = {
    database: {
      url: 'mock://localhost', // Use mock for now
      options: {}
    },
    cache: {
      url: appConfig.redis.url,
      ttl: 3600
    },
    knowledgeGraph: {
      endpoint: appConfig.graphdb.endpoint,
      // Use mock credentials for now
      credentials: {
        username: 'mock',
        password: 'mock'
      }
    }
  };

  // Initialize dependency injection container
  const container = new DIContainer(containerConfig);

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Allow iframe embedding for Swagger UI
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    strict: true
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Trust proxy for proper IP detection behind load balancers
  app.set('trust proxy', true);

  // Disable X-Powered-By header for security
  app.disable('x-powered-by');

  // API routes
  app.use('/api', createApiRoutes(container));
  app.use('/api/v1', createOpenApiRoute());

  // Root redirect to API docs
  app.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource was not found',
      instance: _req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}