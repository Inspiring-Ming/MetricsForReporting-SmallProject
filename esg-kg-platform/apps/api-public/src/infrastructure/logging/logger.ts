/**
 * Logger - Application logging infrastructure
 * 
 * Responsibilities:
 * - Structured logging with levels (error, warn, info, debug)
 * - JSON and pretty-print formatting
 * - Environment-based log level filtering
 * - Consistent timestamp and metadata handling
 */

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'pretty';
  enableTimestamp: boolean;
  enableColors: boolean;
}

export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  child(defaultMeta: any): Logger;
  setConfig(config: Partial<LoggerConfig>): void;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
} as const;

// Simple console-based logger implementation
class SimpleLogger implements Logger {
  private config: LoggerConfig;
  private defaultMeta: any = {};

  constructor(config: LoggerConfig, defaultMeta: any = {}) {
    this.config = config;
    this.defaultMeta = defaultMeta;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const combinedMeta = { ...this.defaultMeta, ...meta };
    
    const logEntry: LogEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(combinedMeta).length > 0 && { meta: combinedMeta })
    };

    if (this.config.format === 'json') {
      return JSON.stringify(logEntry);
    }
    
    // Pretty format with optional colors
    let formatted = '';
    
    if (this.config.enableTimestamp) {
      const timestampStr = this.config.enableColors ? 
        `${colors.gray}${timestamp}${colors.reset}` : timestamp;
      formatted += `${timestampStr} `;
    }
    
    // Level with colors
    const levelStr = `[${level.toUpperCase()}]`;
    if (this.config.enableColors) {
      const levelColor = this.getLevelColor(level);
      formatted += `${levelColor}${levelStr}${colors.reset}: `;
    } else {
      formatted += `${levelStr}: `;
    }
    
    formatted += message;
    
    // Add metadata if present
    if (Object.keys(combinedMeta).length > 0) {
      if (this.config.enableColors) {
        formatted += `\n${colors.gray}${JSON.stringify(combinedMeta, null, 2)}${colors.reset}`;
      } else {
        formatted += `\n${JSON.stringify(combinedMeta, null, 2)}`;
      }
    }
    
    return formatted;
  }

  private getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return colors.red;
      case 'warn': return colors.yellow;
      case 'info': return colors.blue;
      case 'debug': return colors.gray;
      default: return colors.reset;
    }
  }

  error(message: string, meta?: any): void {
    console.error(this.formatMessage('error', message, meta));
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Create a child logger with default metadata
   */
  child(defaultMeta: any): Logger {
    return new SimpleLogger(this.config, { ...this.defaultMeta, ...defaultMeta });
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex <= configLevelIndex;
  }
}

/**
 * Default logger configuration
 */
const defaultLoggerConfig: LoggerConfig = {
  level: 'info',
  format: 'pretty',
  enableTimestamp: true,
  enableColors: true
};

/**
 * Create a new logger instance with configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}, defaultMeta?: any): Logger {
  const fullConfig: LoggerConfig = {
    ...defaultLoggerConfig,
    ...config
  };
  return new SimpleLogger(fullConfig, defaultMeta);
}

/**
 * Create logger from environment and app config
 */
export function createLoggerFromConfig(envConfig: {
  logLevel?: string;
  logFormat?: string;
  logTimestamp?: string;
  logColors?: string;
  nodeEnv?: string;
}, defaultMeta?: any): Logger {
  const config: LoggerConfig = {
    level: (envConfig.logLevel as LoggerConfig['level']) || 'info',
    format: (envConfig.logFormat as LoggerConfig['format']) || 'pretty',
    enableTimestamp: envConfig.logTimestamp !== 'false',
    enableColors: envConfig.logColors !== 'false' && envConfig.nodeEnv !== 'production'
  };
  return createLogger(config, defaultMeta);
}

/**
 * Factory for context-specific loggers
 */
export function createContextLoggerFactory(baseLogger: Logger) {
  return (context: string): Logger => {
    return baseLogger.child({ context });
  };
}

/**
 * Create pre-configured loggers for common use cases
 */
export function createCommonLoggers(baseLogger: Logger) {
  const createContextLogger = createContextLoggerFactory(baseLogger);
  
  return {
    app: baseLogger,
    graphdb: createContextLogger('GraphDB'),
    redis: createContextLogger('Redis'),
    shacl: createContextLogger('SHACL'),
    http: createContextLogger('HTTP'),
    metrics: createContextLogger('Metrics'),
    validation: createContextLogger('Validation')
  };
}


