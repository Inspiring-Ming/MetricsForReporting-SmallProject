import { Router } from 'express';
import { createMetricRoutes } from './metric.routes';
import { createComputationRoutes } from './computation.routes';
import { createKnowledgeGraphRoutes } from './knowledge-graph.routes';
import { requestLogger, performanceMonitor, securityHeaders, corsHandler, idempotencyHandler, noAuthRequired } from '../middleware';
export function createApiRoutes(container) {
    const router = Router();
    router.use(requestLogger);
    router.use(performanceMonitor);
    router.use(securityHeaders);
    router.use(corsHandler);
    router.use(idempotencyHandler);
    router.get('/health', noAuthRequired(), (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: req.app.get('config')?.nodeEnv || 'development'
        });
    });
    router.get('/docs', noAuthRequired(), (_req, res) => {
        res.json({
            title: 'ESG Platform Public API',
            description: 'REST API for ESG metric ingestion and validation',
            version: 'v1',
            documentation: '/api/v1/openapi.json',
            endpoints: {
                metrics: '/api/v1/metrics',
                computations: '/api/v1/computations',
                knowledgeGraph: '/api/v1/knowledge-graph'
            }
        });
    });
    const v1Router = Router();
    v1Router.use('/metrics', createMetricRoutes(container.getMetricController()));
    v1Router.use('/computations', createComputationRoutes(container.getComputationController()));
    v1Router.use('/knowledge-graph', createKnowledgeGraphRoutes(container.getKnowledgeGraphController()));
    router.use('/v1', v1Router);
    router.get('/', noAuthRequired(), (_req, res) => {
        res.json({
            name: 'ESG Platform Public API',
            description: 'REST API for ESG metric ingestion and validation',
            version: 'v1',
            documentation: '/api/docs',
            health: '/api/health',
            endpoints: {
                v1: '/api/v1'
            }
        });
    });
    return router;
}
export function createOpenApiRoute() {
    const router = Router();
    router.get('/openapi.json', noAuthRequired(), (_req, res) => {
        const openApiSpec = {
            openapi: '3.0.3',
            info: {
                title: 'ESG Platform Public API',
                description: 'REST API for ESG metric ingestion, computation, and knowledge graph queries',
                version: '1.0.0',
                contact: {
                    name: 'ESG Platform Team'
                },
                license: {
                    name: 'MIT'
                }
            },
            servers: [
                {
                    url: '/api/v1',
                    description: 'Version 1 API'
                }
            ],
            paths: {
                '/metrics': {
                    get: {
                        summary: 'Query metrics',
                        tags: ['Metrics'],
                        parameters: [
                            {
                                name: 'framework',
                                in: 'query',
                                schema: { type: 'string', enum: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'] }
                            },
                            {
                                name: 'industry',
                                in: 'query',
                                schema: { type: 'string' }
                            },
                            {
                                name: 'page',
                                in: 'query',
                                schema: { type: 'integer', minimum: 1 }
                            },
                            {
                                name: 'size',
                                in: 'query',
                                schema: { type: 'integer', minimum: 1, maximum: 1000 }
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'Metrics retrieved successfully',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Metric' }
                                                },
                                                pagination: { $ref: '#/components/schemas/Pagination' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    post: {
                        summary: 'Create metric',
                        tags: ['Metrics'],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CreateMetricRequest' }
                                }
                            }
                        },
                        responses: {
                            '201': {
                                description: 'Metric created successfully'
                            }
                        }
                    }
                },
                '/computations/execute': {
                    post: {
                        summary: 'Execute computation',
                        tags: ['Computations'],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ComputationRequest' }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'Computation executed successfully'
                            }
                        }
                    }
                },
                '/knowledge-graph/query': {
                    post: {
                        summary: 'Execute SPARQL query',
                        tags: ['Knowledge Graph'],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            query: { type: 'string' },
                                            format: { type: 'string', enum: ['json', 'turtle', 'xml'] }
                                        },
                                        required: ['query']
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'Query executed successfully'
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    Metric: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            framework: { type: 'string', enum: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'] },
                            industry: { type: 'string' },
                            code: { type: 'string' },
                            entityId: { type: 'string' },
                            value: { type: 'number' },
                            unitIri: { type: 'string' },
                            asOf: { type: 'string', format: 'date-time' },
                            source: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    },
                    CreateMetricRequest: {
                        type: 'object',
                        properties: {
                            framework: { type: 'string', enum: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'] },
                            industry: { type: 'string' },
                            code: { type: 'string' },
                            entityId: { type: 'string' },
                            value: { type: 'number' },
                            unitIri: { type: 'string' },
                            asOf: { type: 'string', format: 'date-time' },
                            source: { type: 'string' },
                            idempotencyKey: { type: 'string', format: 'uuid' }
                        },
                        required: ['framework', 'industry', 'code', 'entityId', 'value', 'unitIri', 'asOf', 'source']
                    },
                    ComputationRequest: {
                        type: 'object',
                        properties: {
                            formula: { type: 'string' },
                            inputs: { type: 'object' },
                            framework: { type: 'string', enum: ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY', 'CSRD'] },
                            industry: { type: 'string' },
                            entityId: { type: 'string' },
                            asOf: { type: 'string', format: 'date-time' }
                        },
                        required: ['formula', 'inputs', 'framework', 'industry', 'entityId', 'asOf']
                    },
                    Pagination: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer' },
                            size: { type: 'integer' },
                            total: { type: 'integer' },
                            hasNext: { type: 'boolean' }
                        }
                    },
                    Error: {
                        type: 'object',
                        properties: {
                            type: { type: 'string' },
                            title: { type: 'string' },
                            status: { type: 'integer' },
                            detail: { type: 'string' },
                            instance: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' },
                            errors: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        field: { type: 'string' },
                                        code: { type: 'string' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                },
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            security: [
                {
                    BearerAuth: []
                }
            ]
        };
        res.json(openApiSpec);
    });
    return router;
}
//# sourceMappingURL=index.js.map