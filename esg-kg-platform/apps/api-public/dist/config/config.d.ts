export interface AppConfig {
    port: number;
    host: string;
    apiPrefix: string;
    trustProxy: boolean;
    corsEnabled: boolean;
    compressionEnabled: boolean;
    nodeEnv: 'development' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logFormat: 'json' | 'pretty';
    jwtSecret: string | undefined;
    jwtExpiresIn: string | undefined;
    corsOrigins: string[];
    rateLimitMax: number;
    rateLimitWindowMs: number;
    computationTimeoutMs: number;
    graphdb: {
        endpoint: string;
        repository: string;
        timeout: number;
        maxRetries: number;
    };
    redis: {
        url: string;
        password?: string;
        db: number;
        keyPrefix: string;
    };
    shacl: {
        shapesDirectory: string;
        defaultShapeFormat: string;
        strictMode: boolean;
    };
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
}
export declare const config: AppConfig;
export default config;
//# sourceMappingURL=config.d.ts.map