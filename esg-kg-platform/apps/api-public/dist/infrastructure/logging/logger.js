const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};
class SimpleLogger {
    config;
    defaultMeta = {};
    constructor(config, defaultMeta = {}) {
        this.config = config;
        this.defaultMeta = defaultMeta;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const combinedMeta = { ...this.defaultMeta, ...meta };
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(Object.keys(combinedMeta).length > 0 && { meta: combinedMeta })
        };
        if (this.config.format === 'json') {
            return JSON.stringify(logEntry);
        }
        let formatted = '';
        if (this.config.enableTimestamp) {
            const timestampStr = this.config.enableColors ?
                `${colors.gray}${timestamp}${colors.reset}` : timestamp;
            formatted += `${timestampStr} `;
        }
        const levelStr = `[${level.toUpperCase()}]`;
        if (this.config.enableColors) {
            const levelColor = this.getLevelColor(level);
            formatted += `${levelColor}${levelStr}${colors.reset}: `;
        }
        else {
            formatted += `${levelStr}: `;
        }
        formatted += message;
        if (Object.keys(combinedMeta).length > 0) {
            if (this.config.enableColors) {
                formatted += `\n${colors.gray}${JSON.stringify(combinedMeta, null, 2)}${colors.reset}`;
            }
            else {
                formatted += `\n${JSON.stringify(combinedMeta, null, 2)}`;
            }
        }
        return formatted;
    }
    getLevelColor(level) {
        switch (level.toLowerCase()) {
            case 'error': return colors.red;
            case 'warn': return colors.yellow;
            case 'info': return colors.blue;
            case 'debug': return colors.gray;
            default: return colors.reset;
        }
    }
    error(message, meta) {
        console.error(this.formatMessage('error', message, meta));
    }
    warn(message, meta) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, meta));
        }
    }
    debug(message, meta) {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
    child(defaultMeta) {
        return new SimpleLogger(this.config, { ...this.defaultMeta, ...defaultMeta });
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        const configLevelIndex = levels.indexOf(this.config.level);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex <= configLevelIndex;
    }
}
const defaultLoggerConfig = {
    level: 'info',
    format: 'pretty',
    enableTimestamp: true,
    enableColors: true
};
export function createLogger(config = {}, defaultMeta) {
    const fullConfig = {
        ...defaultLoggerConfig,
        ...config
    };
    return new SimpleLogger(fullConfig, defaultMeta);
}
export function createLoggerFromConfig(envConfig, defaultMeta) {
    const config = {
        level: envConfig.logLevel || 'info',
        format: envConfig.logFormat || 'pretty',
        enableTimestamp: envConfig.logTimestamp !== 'false',
        enableColors: envConfig.logColors !== 'false' && envConfig.nodeEnv !== 'production'
    };
    return createLogger(config, defaultMeta);
}
export function createContextLoggerFactory(baseLogger) {
    return (context) => {
        return baseLogger.child({ context });
    };
}
export function createCommonLoggers(baseLogger) {
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
//# sourceMappingURL=logger.js.map