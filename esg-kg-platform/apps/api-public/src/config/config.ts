/**
 * Application Configuration
 * 
 * Centralizes all configuration management including:
 * - Environment variables loading
 * - Default values
 * - Type-safe configuration access
 */

export interface AppConfig {
  // Server configuration
  port: number;
  host: string;
  apiPrefix: string;
  trustProxy: boolean;
  corsEnabled: boolean;
  compressionEnabled: boolean;
  
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  
  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logFormat: 'json' | 'pretty';
  
  // Authentication & Security
  jwtSecret: string | undefined;
  jwtExpiresIn: string | undefined;
  
  // Application specific
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  computationTimeoutMs: number;
  
  // GraphDB configuration
  graphdb: {
    endpoint: string;
    repository: string;
    timeout: number;
    maxRetries: number;
  };
  
  // Redis configuration
  redis: {
    url: string;
    password?: string;
    db: number;
    keyPrefix: string;
  };
  
  // SHACL configuration
  shacl: {
    shapesDirectory: string;
    defaultShapeFormat: string;
    strictMode: boolean;
  };
  
  // CORS configuration (legacy - use corsOrigins instead)
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  
  // Rate limiting (legacy - use rateLimitMax/rateLimitWindowMs instead)
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): AppConfig {
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || 
    process.env.CORS_ORIGIN?.split(',') || 
    ['http://localhost:3000', 'http://localhost:5173'];

  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100');

  return {
    // Server
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    trustProxy: process.env.TRUST_PROXY === 'true',
    corsEnabled: process.env.CORS_ENABLED !== 'false', // Default enabled
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false', // Default enabled
    
    // Environment
    nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    
    // Logging
    logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
    logFormat: (process.env.LOG_FORMAT as AppConfig['logFormat']) || 'pretty',

    // Authentication & Security
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

    // Application specific (unified interface)
    corsOrigins,
    rateLimitMax,
    rateLimitWindowMs,
    computationTimeoutMs: parseInt(process.env.COMPUTATION_TIMEOUT_MS || '30000'), // 30 seconds
    
    // GraphDB
    graphdb: {
      endpoint: process.env.GRAPHDB_ENDPOINT || 'http://localhost:7200',
      repository: process.env.GRAPHDB_REPOSITORY || 'esg-kg',
      timeout: parseInt(process.env.GRAPHDB_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.GRAPHDB_MAX_RETRIES || '3')
    },
    
    // Redis
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'esg-kg:'
    },
    
    // SHACL
    shacl: {
      shapesDirectory: process.env.SHACL_SHAPES_DIR || './shapes',
      defaultShapeFormat: 'text/turtle',
      strictMode: process.env.SHACL_STRICT_MODE === 'true'
    },
    
    // CORS (legacy compatibility)
    cors: {
      origin: corsOrigins,
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    
    // Rate limiting (legacy compatibility)
    rateLimit: {
      windowMs: rateLimitWindowMs,
      max: rateLimitMax
    }
  };
}

/**
 * Application configuration instance
 */
export const config = loadConfig();

export default config;