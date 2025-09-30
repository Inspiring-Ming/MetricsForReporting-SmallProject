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
export declare function createLogger(config?: Partial<LoggerConfig>, defaultMeta?: any): Logger;
export declare function createLoggerFromConfig(envConfig: {
    logLevel?: string;
    logFormat?: string;
    logTimestamp?: string;
    logColors?: string;
    nodeEnv?: string;
}, defaultMeta?: any): Logger;
export declare function createContextLoggerFactory(baseLogger: Logger): (context: string) => Logger;
export declare function createCommonLoggers(baseLogger: Logger): {
    app: Logger;
    graphdb: Logger;
    redis: Logger;
    shacl: Logger;
    http: Logger;
    metrics: Logger;
    validation: Logger;
};
//# sourceMappingURL=logger.d.ts.map