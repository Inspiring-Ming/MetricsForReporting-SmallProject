import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { DIContainer } from './interfaces/http/container/di-container';
import { createApiRoutes, createOpenApiRoute } from './interfaces/http/routes';
import { errorHandler } from './interfaces/http/middleware';
import { setupInfrastructure } from './infrastructure';
export function createApp(appConfig) {
    const app = express();
    app.set('config', appConfig);
    const infrastructure = setupInfrastructure(appConfig);
    app.set('infrastructure', infrastructure);
    const containerConfig = {
        database: {
            url: 'mock://localhost',
            options: {}
        },
        cache: {
            url: appConfig.redis.url,
            ttl: 3600
        },
        knowledgeGraph: {
            endpoint: appConfig.graphdb.endpoint,
            credentials: {
                username: 'mock',
                password: 'mock'
            }
        }
    };
    const container = new DIContainer(containerConfig);
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"]
            }
        }
    }));
    app.use(compression());
    app.use(express.json({
        limit: '10mb',
        strict: true
    }));
    app.use(express.urlencoded({
        extended: true,
        limit: '10mb'
    }));
    app.set('trust proxy', true);
    app.disable('x-powered-by');
    app.use('/api', createApiRoutes(container));
    app.use('/api/v1', createOpenApiRoute());
    app.get('/', (_req, res) => {
        res.redirect('/api/docs');
    });
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
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map