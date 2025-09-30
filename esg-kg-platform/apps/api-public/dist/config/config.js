function loadConfig() {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') ||
        process.env.CORS_ORIGIN?.split(',') ||
        ['http://localhost:3000', 'http://localhost:5173'];
    const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100');
    return {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
        apiPrefix: process.env.API_PREFIX || '/api/v1',
        trustProxy: process.env.TRUST_PROXY === 'true',
        corsEnabled: process.env.CORS_ENABLED !== 'false',
        compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
        nodeEnv: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
        logFormat: process.env.LOG_FORMAT || 'pretty',
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
        corsOrigins,
        rateLimitMax,
        rateLimitWindowMs,
        computationTimeoutMs: parseInt(process.env.COMPUTATION_TIMEOUT_MS || '30000'),
        graphdb: {
            endpoint: process.env.GRAPHDB_ENDPOINT || 'http://localhost:7200',
            repository: process.env.GRAPHDB_REPOSITORY || 'esg-kg',
            timeout: parseInt(process.env.GRAPHDB_TIMEOUT || '30000'),
            maxRetries: parseInt(process.env.GRAPHDB_MAX_RETRIES || '3')
        },
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
            db: parseInt(process.env.REDIS_DB || '0'),
            keyPrefix: process.env.REDIS_KEY_PREFIX || 'esg-kg:'
        },
        shacl: {
            shapesDirectory: process.env.SHACL_SHAPES_DIR || './shapes',
            defaultShapeFormat: 'text/turtle',
            strictMode: process.env.SHACL_STRICT_MODE === 'true'
        },
        cors: {
            origin: corsOrigins,
            credentials: process.env.CORS_CREDENTIALS === 'true'
        },
        rateLimit: {
            windowMs: rateLimitWindowMs,
            max: rateLimitMax
        }
    };
}
export const config = loadConfig();
export default config;
//# sourceMappingURL=config.js.map